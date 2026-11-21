'use strict';
const {test,before,after,beforeEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc:nativeSetDoc,getDoc,getDocFromServer,getDocs,collection,deleteDoc,updateDoc,serverTimestamp,Timestamp,runTransaction,onSnapshot,disableNetwork,enableNetwork,waitForPendingWrites}=require('firebase/firestore');
const {EventSettings:M}=require('../scripts/validate_config.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));const seed=()=>clone(M.migrate(require('../config/published.json')));let env;
const cfg=db=>doc(db,'sharedEvent/live'),user=uid=>env.authenticatedContext(uid,{auth_time:100}).firestore(),guest=()=>user('operator'),anon=()=>env.unauthenticatedContext().firestore();
const value=(revision=1,settings=seed())=>({schemaVersion:3,revision,updatedAt:serverTimestamp(),settings});
async function stage(db,data){
 const generation='g-'+require('node:crypto').randomUUID(),s=data.settings,d=s.draw,prizes=d.prizes;
 await nativeSetDoc(doc(db,'sharedEvent/live/prizeVersions/'+generation+'/metadata/event'),{revision:data.revision,createdAt:serverTimestamp(),event:s.event,audio:s.audio});
 for(let i=0;i<prizes.length;i+=4){const p=prizes.slice(i,i+4);await nativeSetDoc(doc(db,'sharedEvent/live/prizeVersions/'+generation+'/blocks/'+i/4),{schemaVersion:1,revision:data.revision,createdAt:serverTimestamp(),prizes:p,prizeIds:p.map(p=>p.key),slots:p.reduce((n,p)=>n+p.count,0)});}
 const {prizes:ignored,...rest}=d;return {...data,settings:{...s,draw:{...rest,totalSlots:prizes.reduce((n,p)=>n+p.count,0),generation}}};
}
async function setDoc(ref,data){if(ref.path==='sharedEvent/live'&&data.settings?.draw?.prizes)return nativeSetDoc(ref,await stage(ref.firestore,data));return nativeSetDoc(ref,data);}
async function full(db){const snap=await getDoc(cfg(db)),raw=snap.data(),blocks=await Promise.all(Array.from({length:M.blockCount(raw)},(_,i)=>getDoc(doc(db,'sharedEvent/live/prizeVersions/'+raw.settings.draw.generation+'/blocks/'+i)).then(s=>s.data())));return M.assemble(raw,blocks);}
before(async()=>{if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator required');const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');env=await initializeTestEnvironment({projectId:'demo-lucky-settings-security',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});});
after(async()=>{if(env)await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'admins/admin'),{enabled:true});await setDoc(doc(c.firestore(),'operators/operator'),{enabled:true});});});
test('approved Operator can read exact config; anonymous/unknown users and unauthorized writes denied',async()=>{
 await assertFails(getDoc(cfg(anon())));await assertFails(getDoc(cfg(user('unknown'))));await assertSucceeds(getDoc(cfg(guest())));await assertFails(getDocs(collection(guest(),'sharedEvent')));await assertFails(getDoc(doc(guest(),'admins/admin')));
 await assertFails(setDoc(cfg(anon()),value()));await assertFails(setDoc(cfg(guest()),value()));await assertFails(setDoc(cfg(user('member')),value()));await assertFails(setDoc(doc(user('member'),'admins/member'),{enabled:true}));
});
test('authorized save then reload retains all settings and strict server timestamp',async()=>{
 const s=seed();s.event.content.title='Chương trình thử nghiệm';s.draw.prizes[0].name='Giải tri ân';s.draw.prizes[0].amount=250000;s.audio.celebrationEnabled=false;
 await assertSucceeds(setDoc(cfg(user('admin')),value(1,s)));const d=await full(guest());assert.equal(d.revision,1);assert.equal(d.settings.draw.prizes[0].name,'Giải tri ân');assert.ok(d.updatedAt.toDate());assert.deepEqual(Object.keys(d).sort(),['revision','schemaVersion','settings','updatedAt']);
});
test('create requires revision 1; update increments exactly one; delete forbidden',async()=>{
 const ref=cfg(user('admin'));await assertFails(setDoc(ref,value(2)));await setDoc(ref,value());await assertFails(setDoc(ref,value(1)));await assertFails(setDoc(ref,value(3)));await assertSucceeds(setDoc(ref,value(2)));await assertFails(deleteDoc(ref));
});
test('both create and update reject private fields, malformed nested data and altered draw rules',async()=>{
 for(const mutate of [d=>d.people=[],d=>d.settings.event.employees=[],d=>d.settings.draw.prizes[0].cccd='SYNTHETIC',d=>d.settings.draw.durationMs=9000,d=>d.settings.draw.prizes[0].count=0,d=>d.settings.draw.prizes[0].batchSize=0,d=>d.settings.audio.music={kind:'url',url:'https://example.org/private'},d=>d.settings.event.details.date='2026-02-30',d=>d.settings.event.appearance.logo={kind:'url',url:'javascript:alert(1)'},d=>d.settings.event.content.title='123456789012',d=>d.updatedAt=Timestamp.fromMillis(0)]){
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
 async function save(title){const db=user('admin');const s=seed();s.event.content.title=title;const staged=await stage(db,value(2,s));return runTransaction(db,async tx=>{const snap=await tx.get(cfg(db));if(snap.data().revision!==1)throw Error('revision conflict');if(++entered===2)barrierResolve();await barrier;tx.set(cfg(db),staged);});}
 const outcomes=await Promise.allSettled([save('Admin A'),save('Admin B')]);assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);assert.equal((await getDoc(cfg(guest()))).data().revision,2);
});
test('two independent device subscriptions receive the full Admin configuration realtime',async()=>{
 await setDoc(cfg(user('admin')),value());const listeners=[guest(),guest()].map(db=>new Promise((resolve,reject)=>{let stop;const timer=setTimeout(()=>{stop?.();reject(Error('timeout'))},10000);stop=onSnapshot(cfg(db),s=>{if(s.data()?.revision===2){clearTimeout(timer);stop();resolve(full(db))}},reject);}));
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

test('Operator roles cannot be self-provisioned or granted by a browser Admin',async()=>{
 for(const uid of ['admin','operator','unknown']){
  const db=user(uid);await assertFails(setDoc(doc(db,'operators',uid),{enabled:true}));await assertFails(setDoc(doc(db,'operators','another'),{enabled:true}));await assertFails(deleteDoc(doc(db,'operators/operator')));
 }
 await assertFails(getDocs(collection(user('admin'),'operators')));await assertFails(getDoc(doc(user('admin'),'operators/operator')));
});
test('session cutoff revokes direct reads/writes until a newer authenticated session',async()=>{
 await setDoc(cfg(user('admin')),value());
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins/admin'),{enabled:true,validAfter:100}));
 await assertFails(getDoc(cfg(user('admin'))));await assertFails(setDoc(cfg(user('admin')),value(2)));
 const newer=env.authenticatedContext('admin',{auth_time:101}).firestore();await assertSucceeds(getDoc(cfg(newer)));await assertSucceeds(setDoc(cfg(newer),value(2)));
});
test('disabled Operator, malformed role and forged profile never grant app access',async()=>{
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'operators/disabled'),{enabled:false});await setDoc(doc(c.firestore(),'operators/bad'),{enabled:true,validAfter:'0'});await setDoc(doc(c.firestore(),'users/forged'),{role:'admin'});});
 for(const uid of ['disabled','bad','forged'])await assertFails(getDoc(cfg(user(uid))));
});

test('dynamic maximum, immutable staging, missing blocks and revision mismatch are enforced by real rules',async()=>{
 const db=user('admin'),settings=seed(),{BatchEngine:E}=require('../scripts/validate_config.cjs');
 settings.draw=clone(E.fromPrizes(Array.from({length:24},(_,i)=>({key:'tier-'+i,name:'Giải '+i,count:1000,batchSize:100,amount:100000000000,durationMs:300000}))));
 const pending=await stage(db,value(1,settings)),gen=pending.settings.draw.generation,path='sharedEvent/live/prizeVersions/'+gen+'/blocks/0';
 await assertFails(getDoc(doc(guest(),path)));await assertFails(getDoc(doc(anon(),path)));await assertFails(updateDoc(doc(db,path),{slots:1}));await assertFails(deleteDoc(doc(db,path)));
 await assertFails(nativeSetDoc(cfg(db),{...pending,settings:{...pending.settings,draw:{...pending.settings.draw,generation:'g-does-not-exist-abcdefgh'}}}));
 await assertSucceeds(nativeSetDoc(cfg(db),pending));await assertSucceeds(getDoc(doc(guest(),path)));assert.equal((await full(guest())).settings.draw.prizes.length,24);
 const next=await stage(db,value(2,seed()));await assertFails(nativeSetDoc(cfg(db),{...next,settings:{...next.settings,draw:{...next.settings.draw,totalSlots:45}}}));assert.equal((await getDoc(cfg(db))).data().revision,1);
 await assertFails(nativeSetDoc(doc(db,'sharedEvent/live/prizeVersions/g-forged-abcdefgh/blocks/0'),{schemaVersion:1,revision:2,createdAt:serverTimestamp(),slots:1,prizeIds:['x'],prizes:[{key:'x',name:'Giải',count:1,batchSize:1,amount:0,durationMs:1000,winners:[]}]}));
 await assertFails(nativeSetDoc(doc(guest(),'sharedEvent/live/prizeVersions/g-forged-abcdefgh/blocks/0'),{schemaVersion:1,revision:2,createdAt:serverTimestamp(),slots:1,prizeIds:['x'],prizes:[{key:'x',name:'Giải',count:1,batchSize:1,amount:0,durationMs:1000}]}));
 await assertSucceeds(nativeSetDoc(cfg(db),next));assert.equal((await full(guest())).settings.draw.prizes.length,5);
});
