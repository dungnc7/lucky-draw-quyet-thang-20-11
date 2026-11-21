'use strict';
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc,deleteField,serverTimestamp,Timestamp,onSnapshot,writeBatch}=require('firebase/firestore');
const projectId='demo-lucky-theme-security';
let env;
const themes=['quyet-thang-corporate','lotus','midnight-gold','emerald','royal-purple','ocean','crimson'];
const value=(themeId=themes[0])=>({schemaVersion:1,themeId,updatedAt:serverTimestamp()});
const theme=db=>doc(db,'sharedTheme/live');
const guest=()=>env.unauthenticatedContext().firestore();
const user=uid=>env.authenticatedContext(uid,{auth_time:100}).firestore();
before(async()=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Refuse to run rules tests without Firestore Emulator');
 const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');
 env=await initializeTestEnvironment({projectId,firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
});
after(async()=>{if(env)await env.cleanup()});
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{
  await setDoc(doc(c.firestore(),'admins/admin'),{enabled:true});
  await setDoc(doc(c.firestore(),'operators/operator'),{enabled:true});
  await setDoc(doc(c.firestore(),'admins/disabled'),{enabled:false});
  await setDoc(doc(c.firestore(),'admins/string-role'),{enabled:'true'});
 });
});
test('only approved users may get the exact theme; anonymous and unknown users are denied',async()=>{
 await assertFails(getDoc(theme(guest())));await assertFails(getDoc(theme(user('member'))));
 const db=user('operator');await assertSucceeds(getDoc(theme(db)));
 await assertFails(getDocs(collection(db,'sharedTheme')));await assertFails(getDocs(collection(db,'admins')));
 await assertFails(getDoc(doc(db,'admins/admin')));await assertFails(getDoc(doc(db,'employees/private')));
});
test('unauthenticated create and update are denied',async()=>{
 await assertFails(setDoc(theme(guest()),value()));
 await setDoc(theme(user('admin')),value());await assertFails(updateDoc(theme(guest()),{themeId:'lotus',updatedAt:serverTimestamp()}));
});
test('authenticated non-admin, disabled admin and string role cannot write',async()=>{
 for(const uid of ['member','disabled','string-role'])await assertFails(setDoc(theme(user(uid)),value()));
});
test('admin can create and update each of the seven approved themes',async()=>{
 const ref=theme(user('admin'));
 for(const id of themes){await assertSucceeds(setDoc(ref,value(id)));assert.equal((await getDoc(theme(user('operator')))).data().themeId,id)}
});
test('admin document is readable only by its own authenticated user',async()=>{
 await assertSucceeds(getDoc(doc(user('admin'),'admins/admin')));
 await assertFails(getDoc(doc(user('member'),'admins/admin')));
 await assertSucceeds(getDoc(doc(user('member'),'admins/member')));
});
test('clients cannot self-promote, revoke or grant admins, including in a batch',async()=>{
 for(const uid of ['member','admin']){
  const db=user(uid);await assertFails(setDoc(doc(db,'admins/member'),{enabled:true}));
  await assertFails(updateDoc(doc(db,'admins/admin'),{enabled:false}));await assertFails(deleteDoc(doc(db,'admins/admin')));
 }
 const db=user('member'),b=writeBatch(db);b.set(doc(db,'admins/member'),{enabled:true});b.set(theme(db),value());await assertFails(b.commit());
});
test('schema pollution and private fields are denied on creates and updates',async()=>{
 const ref=theme(user('admin'));
 for(const field of ['employees','cccd','winners','drawSession','password','serviceAccount'])await assertFails(setDoc(ref,{...value(),[field]:'SYNTHETIC PRIVATE FIELD'}));
 await setDoc(ref,value());await assertFails(updateDoc(ref,{winners:['SYNTHETIC'],updatedAt:serverTimestamp()}));
});
test('wrong schema, arbitrary themes, wrong types and large values are rejected',async()=>{
 const ref=theme(user('admin'));
 for(const patch of [{schemaVersion:2},{schemaVersion:'1'},{themeId:'unknown'},{themeId:[]},{themeId:'x'.repeat(10000)},{updatedAt:'now'},{updatedAt:Timestamp.fromMillis(0)}])await assertFails(setDoc(ref,{...value(),...patch}));
});
test('required fields cannot be omitted at creation or removed during update',async()=>{
 const ref=theme(user('admin'));
 for(const key of ['schemaVersion','themeId','updatedAt']){const v=value();delete v[key];await assertFails(setDoc(ref,v))}
 await setDoc(ref,value());for(const key of ['schemaVersion','themeId','updatedAt'])await assertFails(updateDoc(ref,{[key]:deleteField()}));
});
test('admin writes outside sharedTheme/live and all theme deletes are denied',async()=>{
 const db=user('admin');await assertFails(setDoc(doc(db,'sharedTheme/other'),value()));await assertFails(setDoc(doc(db,'employees/synthetic'),{name:'SYNTHETIC'}));
 await setDoc(theme(db),value());await assertFails(deleteDoc(theme(db)));
});
test('revoked admin loses write permission immediately at the server',async()=>{
 const db=user('admin');await setDoc(theme(db),value());
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins/admin'),{enabled:false}));
 await assertFails(setDoc(theme(db),value('lotus')));
});
test('two independently authorized SDK clients receive the admin update in realtime',async()=>{
 await setDoc(theme(user('admin')),value());
 const contexts=[env.authenticatedContext('operator',{auth_time:100}),env.authenticatedContext('operator',{auth_time:100})];
 const received=contexts.map(c=>new Promise((resolve,reject)=>{
  let stop;const timeout=setTimeout(()=>{stop?.();reject(Error('Realtime update timed out'))},10000);
  stop=onSnapshot(theme(c.firestore()),s=>{if(s.data()?.themeId==='ocean'){clearTimeout(timeout);stop();resolve(s.data())}},e=>{clearTimeout(timeout);stop?.();reject(e)});
 }));
 await setDoc(theme(user('admin')),value('ocean'));
 for(const data of await Promise.all(received)){assert.deepEqual(Object.keys(data).sort(),['schemaVersion','themeId','updatedAt']);assert.equal(data.themeId,'ocean')}
});
