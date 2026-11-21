'use strict';
const {test,before,after,beforeEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocFromServer,getDocs,collection,deleteDoc,updateDoc,serverTimestamp,Timestamp,runTransaction,onSnapshot,disableNetwork,enableNetwork,waitForPendingWrites}=require('firebase/firestore');
const {EventSettings:M}=require('../scripts/validate_config.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));const seed=()=>clone(M.migrate(require('../config/published.json')));let env;
const cfg=db=>doc(db,'sharedEvent/live'),user=uid=>env.authenticatedContext(uid).firestore(),guest=()=>env.unauthenticatedContext().firestore();
const value=(revision=1,settings=seed())=>({schemaVersion:2,revision,updatedAt:serverTimestamp(),settings});
before(async()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');env=await initializeTestEnvironment({projectId:'demo-lucky-settings-security',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});});
after(async()=>{if(env)await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins/admin'),{enabled:true}));});
test('public exact document read needs no login; list/private reads and unauthorized writes denied',async()=>{
 await assertSucceeds(getDoc(cfg(guest())));await assertFails(getDocs(collection(guest(),'sharedEvent')));await assertFails(getDoc(doc(guest(),'admins/admin')));
 await assertFails(setDoc(cfg(guest()),value()));await assertFails(setDoc(cfg(user('member')),value()));await assertFails(setDoc(doc(user('member'),'admins/member'),{enabled:true}));
});
test('authorized save then reload retains all settings and strict server timestamp',async()=>{
 const s=seed();s.event.content.title='Chương trình thử nghiệm';s.draw.prizes[0].name='Giải tri ân';s.draw.prizes[0].amount=250000;s.audio.celebrationEnabled=false;
 await assertSucceeds(setDoc(cfg(user('admin')),value(1,s)));const d=(await getDoc(cfg(guest()))).data();assert.equal(d.revision,1);assert.equal(d.settings.draw.prizes[0].name,'Giải tri ân');assert.ok(d.updatedAt.toDate());assert.deepEqual(Object.keys(d).sort(),['revision','schemaVersion','settings','updatedAt']);
});
test('create requires revision 1; update increments exactly one; delete forbidden',async()=>{
 const ref=cfg(user('admin'));await assertFails(setDoc(ref,value(2)));await setDoc(ref,value());await assertFails(setDoc(ref,value(1)));await assertFails(setDoc(ref,value(3)));await assertSucceeds(setDoc(ref,value(2)));await assertFails(deleteDoc(ref));
});
test('both create and update reject private fields, malformed nested data and altered draw rules',async()=>{
 for(const mutate of [d=>d.people=[],d=>d.settings.event.employees=[],d=>d.settings.draw.prizes[0].cccd='SYNTHETIC',d=>d.settings.draw.durationMs=9000,d=>d.settings.draw.prizes[0].count=31,d=>d.settings.draw.prizes[0].batchSize=5,d=>d.settings.audio.music={kind:'url',url:'https://example.org/private'},d=>d.settings.event.details.date='2026-02-30',d=>d.settings.event.appearance.logo={kind:'url',url:'javascript:alert(1)'},d=>d.settings.event.content.title='123456789012',d=>d.updatedAt=Timestamp.fromMillis(0)]){
  const invalid=value();mutate(invalid);await assertFails(setDoc(cfg(user('admin')),invalid));
 }
 await setDoc(cfg(user('admin')),value());await assertFails(updateDoc(cfg(user('admin')),{'settings.audio.extra':'SYNTHETIC',revision:2,updatedAt:serverTimestamp()}));
});
test('legacy theme remains available before migration and becomes read-only at atomic cutover',async()=>{
 const db=user('admin'),old=doc(db,'sharedTheme/live');await assertSucceeds(setDoc(old,{schemaVersion:1,themeId:'lotus',updatedAt:serverTimestamp()}));
 await setDoc(cfg(db),value());await assertFails(setDoc(old,{schemaVersion:1,themeId:'ocean',updatedAt:serverTimestamp()}));await assertSucceeds(getDoc(doc(guest(),'sharedTheme/live')));
});
test('concurrent administrators cannot silently overwrite the same base revision',async()=>{
 await setDoc(cfg(user('admin')),value());let barrierResolve;const barrier=new Promise(r=>barrierResolve=r);let entered=0;
 async function save(title){const db=user('admin');return runTransaction(db,async tx=>{const snap=await tx.get(cfg(db));if(snap.data().revision!==1)throw Error('revision conflict');if(++entered===2)barrierResolve();await barrier;const s=seed();s.event.content.title=title;tx.set(cfg(db),value(2,s));});}
 const outcomes=await Promise.allSettled([save('Admin A'),save('Admin B')]);assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);assert.equal((await getDoc(cfg(guest()))).data().revision,2);
});
test('two independent device subscriptions receive the full Admin configuration realtime',async()=>{
 await setDoc(cfg(user('admin')),value());const listeners=[guest(),guest()].map(db=>new Promise((resolve,reject)=>{let stop;const timer=setTimeout(()=>{stop?.();reject(Error('timeout'))},10000);stop=onSnapshot(cfg(db),s=>{if(s.data()?.revision===2){clearTimeout(timer);stop();resolve(s.data())}},reject);}));
 const s=seed();s.event.appearance.themeId='emerald';s.event.content.title='Cùng một chương trình';await setDoc(cfg(user('admin')),value(2,s));for(const d of await Promise.all(listeners)){assert.equal(d.settings.event.content.title,'Cùng một chương trình');assert.equal(d.settings.event.appearance.themeId,'emerald');}
});
test('offline public cache remains readable; reconnect loads the latest published configuration',async()=>{
 await setDoc(cfg(user('admin')),value());const db=guest();await getDoc(cfg(db));await disableNetwork(db);
 const cached=await getDoc(cfg(db));assert.equal(cached.data().revision,1);assert.equal(cached.metadata.fromCache,true);
 await setDoc(cfg(user('admin')),value(2));await enableNetwork(db);assert.equal((await getDocFromServer(cfg(db))).data().revision,2);
});
test('custom HTTPS logo, solid background and all public content fields fit rules on create and update',async()=>{
 const s=seed();s.event.appearance.logo={kind:'url',url:'https://example.org/brand.png'};s.event.appearance.background={kind:'solid',color:'#123456'};
 s.event.content.completedMessage='Cảm ơn các bạn đã tham gia';s.event.details.date='2028-02-29';s.audio.musicEnabled=true;
 await assertSucceeds(setDoc(cfg(user('admin')),value(1,s)));s.event.content.title='Sự kiện mới';await assertSucceeds(setDoc(cfg(user('admin')),value(2,s)));
});
test('every preset and bounded public fields remain writable; missing required nested fields are denied',async()=>{
 const db=user('admin');let revision=0;
 for(const preset of ['teachers-day','year-end','custom']){
  const settings=seed();settings.event.presetId=preset;
  settings.event.content.title='A'.repeat(110);settings.event.content.completedMessage='B'.repeat(240);
  settings.event.details.organization='C'.repeat(140);settings.draw.prizes[0].name='D'.repeat(80);
  await assertSucceeds(setDoc(cfg(db),value(++revision,settings)));
 }
 for(const mutate of [d=>delete d.settings.event.details.date,d=>delete d.settings.audio.celebrationEnabled,d=>delete d.settings.draw.prizes[0].name,d=>d.settings.event.appearance.logo={kind:'url',url:'https://bad host.org/logo.png'},d=>d.settings.event.content.title='A'.repeat(111)]){
  const invalid=value(revision+1);mutate(invalid);await assertFails(setDoc(cfg(db),invalid));
 }
});
test('role revocation prevents further writes even with a previously authenticated client',async()=>{
 const db=user('admin');await setDoc(cfg(db),value());await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins/admin'),{enabled:false}));await assertFails(setDoc(cfg(db),value(2)));
});
