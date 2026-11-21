'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
async function boot({configured=true,protocol='https:'}={}){
 const elements=new Map(),events=[],writes=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,disabled:false,listeners:{},addEventListener(n,fn){this.listeners[n]=fn},replaceChildren(...children){this.children=children},insertAdjacentHTML(){}});return elements.get(id)};
 let snapshot,error,authChange;const auth={currentUser:null};let role=true;
 const firestore={getFirestore:()=>({}),doc:(_db,...parts)=>parts.join('/'),getDoc:async()=>({exists:()=>true,data:()=>({enabled:role})}),serverTimestamp:()=>({serverTimestamp:true}),onSnapshot:(_ref,_options,cb,err)=>{snapshot=cb;error=err;return()=>{}},setDoc:async(ref,data)=>writes.push({ref,data})};
 const authLib={getAuth:()=>auth,browserSessionPersistence:'tab-only',setPersistence:async()=>{},onAuthStateChanged:(_a,cb)=>{authChange=cb},signInWithEmailAndPassword:async()=>{auth.currentUser={uid:'admin',email:'synthetic@example.invalid'};await authChange(auth.currentUser)},signOut:async()=>{auth.currentUser=null;await authChange(null)}};
 const context={console,location:{protocol},Intl,Option:class{constructor(name,id){this.text=name;this.value=id}},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},document:{querySelector:()=>el('anchor'),getElementById:el},dispatchEvent:e=>events.push(e),LUCKYDRAW_CLOUD_CONFIG:configured?{apiKey:'public-test',authDomain:'public.example.invalid',projectId:'demo-lucky-theme',appId:'public-test'}:{},loadSdk:async name=>name==='app'?{initializeApp:()=>({})}:name==='firestore'?firestore:authLib};context.window=context;
 vm.createContext(context);
 const html=fs.readFileSync('index.html','utf8');vm.runInContext(html.match(/<script id="event-platform">([\s\S]*?)<\/script>/)[1],context);
 const source=fs.readFileSync('cloud-theme-sync.js','utf8').replace("import(url+'firebase-app.js')","loadSdk('app')").replace("import(url+'firebase-firestore.js')","loadSdk('firestore')").replace("import(url+'firebase-auth.js')","loadSdk('auth')");
 await vm.runInContext(source,context);
 return {el,events,writes,context,auth,async login(enabled=true){role=enabled;auth.currentUser={uid:'admin',email:'synthetic@example.invalid'};await authChange(auth.currentUser)},async logout(){auth.currentUser=null;await authChange(null)},snapshot(data,{cache=false,pending=false}={}){snapshot({metadata:{hasPendingWrites:pending,fromCache:cache},exists:()=>data!==null,data:()=>data})},error(e){error(e)},async fire(id,type){return el(id).listeners[type]?.({preventDefault(){}})}};
}
const remote=id=>({schemaVersion:1,themeId:id,updatedAt:{toDate:()=>new Date('2026-11-21T00:00:00Z')}});
test('missing config and offline file keep the existing raffle operational without cloud saving',async()=>{
 for(const options of [{configured:false},{protocol:'file:'}]){const f=await boot(options);assert.equal(f.el('cloudThemeSave').disabled,true);assert.equal(f.events.length,0)}
});
test('all seven themes are selectable; missing shared document uses corporate default',async()=>{
 const f=await boot();assert.equal(f.el('cloudThemeSelect').children.length,7);f.snapshot(null);assert.equal(f.events.at(-1).detail.themeId,'quyet-thang-corporate');
});
test('public realtime update changes the theme only and never writes',async()=>{
 const f=await boot();f.snapshot(remote('ocean'));assert.equal(f.events.at(-1).detail.themeId,'ocean');assert.equal(f.writes.length,0);assert.equal(f.el('cloudThemeSave').disabled,true);
});
test('preview remains local until an authorized admin explicitly clicks apply',async()=>{
 const f=await boot();f.snapshot(remote('quyet-thang-corporate'));f.el('cloudThemeSelect').value='lotus';await f.fire('cloudThemeSelect','change');assert.equal(f.writes.length,0);
 await f.login();await f.fire('cloudThemeSave','click');assert.equal(f.writes.length,1);assert.equal(f.writes[0].ref,'sharedTheme/live');assert.deepEqual(Object.keys(f.writes[0].data).sort(),['schemaVersion','themeId','updatedAt']);assert.equal(f.writes[0].data.themeId,'lotus');
});
test('non-admin and logged-out users cannot invoke the controller save path',async()=>{
 const f=await boot();f.snapshot(remote('ocean'));f.el('cloudThemeSelect').value='lotus';await f.login(false);await f.fire('cloudThemeSave','click');await f.logout();await f.fire('cloudThemeSave','click');assert.equal(f.writes.length,0);
});
test('cached/pending snapshots never confirm a public save; invalid remote data fails closed',async()=>{
 const f=await boot();f.snapshot(remote('lotus'),{cache:true});assert.equal(f.events.length,0);assert.equal(f.el('cloudThemeSave').disabled,true);
 f.snapshot(remote('lotus'),{pending:true});assert.equal(f.events.length,0);
 f.snapshot(remote('unknown'));assert.equal(f.events.length,0);assert.equal(f.el('cloudThemeSave').disabled,true);
});
test('listener failures disable publication and preserve the last received theme',async()=>{
 const f=await boot();f.snapshot(remote('emerald'));f.error({code:'permission-denied'});assert.equal(f.events.at(-1).detail.themeId,'emerald');assert.equal(f.el('cloudThemeSave').disabled,true);
});

test('extra fields or missing server timestamps are refused before displaying cloud data',async()=>{
 for(const data of [{...remote('lotus'),employees:['SYNTHETIC']},{schemaVersion:1,themeId:'lotus'}, {...remote('lotus'),updatedAt:{toDate:()=>new Date('invalid')}}]){const f=await boot();f.snapshot(data);assert.equal(f.events.length,0);assert.equal(f.el('cloudThemeSave').disabled,true)}
});
