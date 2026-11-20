const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
for(const file of ['cloud-theme-sync.js','cloud-theme-config.js']){
  cp.execFileSync(process.execPath,['--check',file]);
}
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('cloud-theme-sync.js','utf8');
const rules=fs.readFileSync('firestore.rules','utf8');
const config=fs.readFileSync('cloud-theme-config.js','utf8');
for(const file of ['cloud-theme-config.js','cloud-theme-sync.js','cloud-theme.css']){
  assert(html.includes('./'+file),file+' not integrated');
}
assert(html.includes("LUCKYDRAW_SHARED_THEME_OVERRIDE||activeEvent.appearance.themeId"));
assert(html.includes("lucky-draw-theme-override',()=>renderTheme()"));
assert(js.includes("getDoc(fs.doc(db,'admins',user.uid))"));
assert(js.includes("doc(db,'sharedTheme','live')"));
assert(js.includes("onSnapshot("));
assert(js.includes("setPersistence(auth,authMod.browserSessionPersistence)"));
assert(js.includes("fs.serverTimestamp()"));
assert(!js.includes('sessionStorage.setItem'));
assert(!js.includes('Math.random()'));
assert(rules.includes('allow get: if true;'));
assert(rules.includes('allow list: if false;'));
assert(rules.includes('allow create, update: if isAdmin()'));
assert(rules.includes('request.resource.data.keys().hasOnly'));
assert(rules.includes('request.resource.data.updatedAt == request.time'));
assert(rules.includes('allow list, create, update, delete: if false;'));
assert(config.includes('apiKey: ""'));
console.log('PASS shared-theme integration static contract (seven-theme EventPlatform, Firestore admin-only publish, read-only public listeners)');
