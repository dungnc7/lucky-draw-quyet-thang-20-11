'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
for(const f of ['cloud-theme-config.js','cloud-theme-sync.js','auth-guard.js'])cp.execFileSync(process.execPath,['--check',f]);
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('cloud-theme-sync.js','utf8');
assert(html.includes('id="programSettingsMount"'));assert(html.includes('id="event-settings"'));
assert(js.includes('Cài đặt chương trình'));assert(js.includes('Lưu &amp; áp dụng cho tất cả thiết bị'));
for(const label of ['Thông tin','Giao diện','Giải thưởng','Âm thanh'])assert(js.includes(label));
assert(!js.includes('configFileInput'));assert(!js.includes('exportConfiguration'));assert(!js.includes('setDoc(docRef'));
const config={window:{}};vm.runInNewContext(fs.readFileSync('cloud-theme-config.js','utf8'),config);
assert.equal(config.window.LUCKYDRAW_CLOUD_CONFIG.projectId,'lucky-draw-quyet-thang');
console.log('PASS unified settings integration and public Firebase identifiers');

const auth=fs.readFileSync('auth-guard.js','utf8');
assert.match(html,/<div[^>]*id="appShell"[^>]*hidden inert/);assert(html.indexOf('id="authRoot"')<html.indexOf('id="appShell"'));
assert(auth.includes('browserLocalPersistence'));assert(auth.includes('browserSessionPersistence'));assert(auth.includes('sendPasswordResetEmail'));
assert(auth.indexOf('await authMod.setPersistence')<auth.indexOf('await authMod.signInWithEmailAndPassword'));
assert(!auth.includes('createUserWithEmailAndPassword'));assert(!auth.includes('setItem('+'"password'));
assert(auth.includes('autocomplete="username"'));assert(auth.includes('autocomplete="current-password"'));
assert(!/onAuthStateChanged|initializeApp/.test(js),'one Firebase Auth authority');
