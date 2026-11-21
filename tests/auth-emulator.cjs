'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing'),{initializeApp,deleteApp}=require('firebase/app');
const A=require('firebase/auth'),F=require('firebase/firestore'),M=require('../auth-guard.js');
const projectId='demo-lucky-auth-e2e';let env,app,auth,db,authProject,accounts={};
before(async()=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Both demo emulators required');
 const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');env=await initializeTestEnvironment({projectId,firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();
 app=initializeApp({projectId,apiKey:'emulator-public-key'},'auth-e2e');auth=A.getAuth(app);A.connectAuthEmulator(auth,'http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST,{disableWarnings:true});db=F.getFirestore(app);F.connectFirestoreEmulator(db,host,Number(port));
 for(const role of ['admin','operator','unknown']){const email=role+'-'+crypto.randomBytes(5).toString('hex')+'@example.invalid',password=crypto.randomBytes(18).toString('base64url');const {user}=await A.createUserWithEmailAndPassword(auth,email,password);authProject=(await A.getIdTokenResult(user)).claims.aud;if(!authProject.startsWith('demo-'))throw Error('Refuse non-demo Auth namespace');accounts[role]={email,password,uid:user.uid};if(role!=='unknown')await env.withSecurityRulesDisabled(c=>F.setDoc(F.doc(c.firestore(),role==='admin'?'admins':'operators',user.uid),{enabled:true}));}
 await A.signOut(auth);
});
after(async()=>{if(app)await deleteApp(app);if(env)await env.cleanup()});
function guard(){return M.create({user:()=>auth.currentUser,online:()=>true,token:u=>A.getIdTokenResult(u,true),roles:async uid=>{const [a,o]=await Promise.all(['admins','operators'].map(c=>F.getDocFromServer(F.doc(db,c,uid))));return{admin:a.exists()?a.data():null,operator:o.exists()?o.data():null}},watchRoles:()=>[],lock(){},unlock(){},active:()=>false,confirm:()=>true,signOut:()=>A.signOut(auth)});}
test('real Firebase Auth emulator rejects wrong password and accepts the provisioned account',async()=>{
 const c=accounts.admin;await assert.rejects(()=>A.signInWithEmailAndPassword(auth,c.email,'invalid-test-password'));assert.equal(auth.currentUser,null);await A.signInWithEmailAndPassword(auth,c.email,c.password);const g=guard();await g.changed(auth.currentUser);assert.equal(g.canAdmin(),true);await g.logout();assert.equal(auth.currentUser,null);
});
test('real Auth identities plus server roles admit Operator but deny unapproved account',async()=>{
 for(const role of ['operator','unknown']){const c=accounts[role];await A.signInWithEmailAndPassword(auth,c.email,c.password);const g=guard();await g.changed(auth.currentUser);assert.equal(g.snapshot().phase,role==='operator'?'authorized':'denied');assert.equal(g.canAdmin(),false);await g.logout();}
});
test('Firebase supported reset request produces an emulator password-reset email, without custom tokens',async()=>{
 await A.sendPasswordResetEmail(auth,accounts.admin.email);const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/emulator/v1/projects/'+authProject+'/oobCodes');assert.equal(response.status,200);const data=await response.json();assert.ok(data.oobCodes.some(x=>x.email===accounts.admin.email&&x.requestType==='PASSWORD_RESET'));
});
