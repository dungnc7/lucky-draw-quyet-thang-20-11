/* Firebase owns credentials/persistence. This guard never serializes tokens or passwords. */
(function(global){
'use strict';
const LEASE_MS=60_000;
function roleValue(data,authTime){
 return !!data&&Object.keys(data).every(k=>['enabled','validAfter'].includes(k))&&data.enabled===true&&
  (!Object.hasOwn(data,'validAfter')||Number.isSafeInteger(data.validAfter)&&data.validAfter>=0)&&authTime>(data.validAfter??0);
}
function scoped(storage,uid){
 if(!storage||!uid)return null;const prefix='lucky-user:'+encodeURIComponent(uid)+':';
 return Object.freeze({getItem:k=>storage.getItem(prefix+k),setItem:(k,v)=>storage.setItem(prefix+k,v),removeItem:k=>storage.removeItem(prefix+k)});
}
async function bounded(promise,ms=15_000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('verification-timeout')),ms)})])}finally{clearTimeout(timer)}}
function create(api){
 let state={phase:'loading',uid:null,role:null,user:null},epoch=0,verifiedAt=0,task=null,stops=[],roleToken=null;
 const listeners=new Set(),now=api.now||Date.now;
 function notify(){for(const fn of listeners)fn(Object.freeze({...state}));}
 function cleanup(){for(const stop of stops)stop();stops=[];roleToken=null;}
 function lock(phase='loading',user=api.user()){
  verifiedAt=0;api.lock();state={phase,uid:user?.uid||null,role:null,user:user||null};notify();
 }
 function canOperate(){return state.phase==='authorized'&&api.online()&&api.user()?.uid===state.uid&&now()>=verifiedAt&&now()-verifiedAt<LEASE_MS;}
 async function verify(){
  const user=api.user();if(!user){lock('login',null);return false;}
  if(task?.uid===user.uid)return task.promise;
  const generation=epoch,uid=user.uid;
  const promise=Promise.resolve().then(async()=>{
   try{
    if(!api.online())throw Error('offline');
    const {token,roles}=await bounded((async()=>{const token=await api.token(user);return{token,roles:await api.roles(uid)}})(),api.timeoutMs||15_000);
    if(generation!==epoch||api.user()?.uid!==uid)return false;
    const authTime=token.claims.auth_time;
    if(!Number.isSafeInteger(authTime)||!Number.isFinite(Date.parse(token.expirationTime))||Date.parse(token.expirationTime)<=now())throw Object.assign(Error('invalid-session'),{code:'auth/invalid-user-token'});
    const role=roleValue(roles.admin,authTime)?'admin':roleValue(roles.operator,authTime)?'operator':null;
    roleToken=JSON.stringify([roles.admin||null,roles.operator||null]);
    if(!role){lock('denied',user);return false;}
    const changed=state.uid!==uid||state.phase!=='authorized';verifiedAt=now();
    state={phase:'authorized',uid,role,user};if(changed)api.unlock(uid);notify();return true;
   }catch(e){
    if(generation!==epoch)return false;
    if(['auth/user-disabled','auth/user-token-expired','auth/invalid-user-token','auth/id-token-revoked','auth/invalid-credential','auth/invalid-refresh-token','auth/user-not-found'].includes(e.code)){
     lock('login',null);await api.signOut().catch(()=>{});
    }else lock('error',user);
    return false;
   }finally{if(task?.generation===generation)task=null;}
  });task={uid,generation,promise};return promise;
 }
 async function changed(user){
  ++epoch;task=null;cleanup();lock(user?'loading':'login',user);
  if(!user)return;
  const generation=epoch;await verify();if(generation!==epoch||api.user()?.uid!==user.uid)return;
  // Only server snapshots are accepted. A missing role is also a meaningful update.
  stops=api.watchRoles(user.uid,roles=>{
   if(generation!==epoch)return;
   const token=JSON.stringify([roles.admin||null,roles.operator||null]);if(token===roleToken)return;roleToken=token;
   lock('loading',user);void verify();
  },()=>{if(generation===epoch)lock('error',user)});
 }
 async function logout(){
  if(api.active()&&!await api.confirm('Phiên quay sẽ tạm khóa. Kết quả và lượt đã chọn vẫn được giữ riêng cho tài khoản này; đăng nhập lại để khôi phục. Đăng xuất?'))return false;
  ++epoch;task=null;cleanup();lock('loading',null);
  try{await api.signOut();lock('login',null);return true;}catch{lock('error',api.user());return false;}
 }
 return Object.freeze({changed,verify,logout,canOperate,canAdmin:()=>canOperate()&&state.role==='admin',
  snapshot:()=>Object.freeze({...state}),onChange(fn){listeners.add(fn);fn({...state});return()=>listeners.delete(fn)},
  offline(){++epoch;task=null;lock('error',api.user())},destroy(){++epoch;cleanup();listeners.clear();api.lock();}});
}
const model=Object.freeze({LEASE_MS,roleValue,scoped,create});
if(typeof module!=='undefined')module.exports=model;
if(!global.document)return;
const $=id=>document.getElementById(id),root=$('authRoot'),shell=$('appShell');
const logo=document.querySelector('.brand-logo')?.getAttribute('src')||'';
root.innerHTML=`<main class="auth-card" aria-labelledby="authTitle"><div class="auth-brand"><img id="authLogo" alt="Logo Quyết Thắng"><span>QUYẾT THẮNG</span></div><p class="auth-eyebrow">EVENT PLATFORM · V2.6</p><h1 id="authTitle">LUCKY DRAW</h1><p class="auth-subtitle">Hệ thống quay thưởng Quyết Thắng</p>
 <div id="authLoading" role="status" aria-live="polite"><span class="auth-spinner"></span>Đang xác minh đăng nhập…</div>
 <form id="authLogin" hidden><label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="username" required maxlength="254" placeholder="email@congty.vn"><label for="authPassword">Mật khẩu</label><div class="auth-password"><input id="authPassword" type="password" autocomplete="current-password" required><button id="authShow" type="button" aria-label="Hiện mật khẩu" aria-pressed="false">Hiện</button></div><div class="auth-options"><label class="auth-check"><input id="authRemember" type="checkbox">Ghi nhớ đăng nhập</label><button id="authForgot" class="auth-text" type="button">Quên mật khẩu?</button></div><button id="authSubmit" class="auth-primary" type="submit">Đăng nhập</button></form>
 <form id="authReset" hidden><h2>Khôi phục mật khẩu</h2><label for="authResetEmail">Email</label><input id="authResetEmail" type="email" autocomplete="username" required maxlength="254"><button id="authResetSubmit" class="auth-primary" type="submit">Gửi hướng dẫn</button><button id="authBack" class="auth-text" type="button">Quay lại đăng nhập</button></form>
 <div id="authDenied" hidden><h2>Chưa được cấp quyền truy cập</h2><p>Tài khoản này chưa được đơn vị cấp quyền Admin hoặc Nhân viên vận hành. Vui lòng liên hệ quản trị viên.</p><button id="authDeniedLogout" class="auth-primary" type="button">Đăng xuất</button></div>
 <div id="authError" hidden><h2>Chưa xác minh được quyền truy cập</h2><p>Kiểm tra kết nối rồi thử lại. Phiên quay đã lưu được giữ an toàn trên máy.</p><button id="authRetry" class="auth-primary" type="button">Thử lại</button><button id="authErrorLogout" class="auth-text" type="button">Đăng xuất</button></div>
 <p id="authMessage" class="auth-message" role="status" aria-live="polite"></p></main>`;
$('authLogo').src=logo;
const logoutDialog=document.createElement('dialog');logoutDialog.id='logoutDialog';logoutDialog.className='auth-dialog';
logoutDialog.innerHTML='<h2>Đăng xuất khỏi phiên quay?</h2><p id="logoutExplanation"></p><div><button id="logoutCancel" type="button">Ở lại</button><button id="logoutConfirm" type="button">Đăng xuất</button></div>';
document.body.appendChild(logoutDialog);let finishLogout=null;
function confirmLogout(message){return new Promise(resolve=>{finishLogout=resolve;$('logoutExplanation').textContent=message;logoutDialog.showModal();$('logoutCancel').focus()})}
function settleLogout(value){logoutDialog.close();const done=finishLogout;finishLogout=null;done?.(value)}
$('logoutCancel').addEventListener('click',()=>settleLogout(false));$('logoutConfirm').addEventListener('click',()=>settleLogout(true));logoutDialog.addEventListener('cancel',event=>{event.preventDefault();settleLogout(false)});
let service=null,guard=null,submitting=false,resetting=false,resetView=false,interval=null;
const subscribers=new Set();let current={phase:'loading',uid:null,role:null,user:null};
function safeStorage(type){try{return scoped(global[type],current.uid)}catch{return null}}
function paint(s=current){
 if(!s.user&&current.user){$('authEmail').value='';$('authPassword').value='';$('authResetEmail').value='';resetView=false;}
 current=s;const authorized=s.phase==='authorized';shell.hidden=!authorized;shell.inert=!authorized;root.hidden=authorized;if(!authorized)document.title='Lucky Draw Event Platform v2.6';if(!authorized&&logoutDialog.open)settleLogout(false);
 for(const [id,visible]of Object.entries({authLoading:s.phase==='loading',authLogin:s.phase==='login'&&!resetView,authReset:s.phase==='login'&&resetView,authDenied:s.phase==='denied',authError:s.phase==='error'}))$(id).hidden=!visible;
 for(const id of ['authEmail','authPassword','authRemember','authShow','authForgot'])$(id).disabled=submitting;
 $('authSubmit').disabled=submitting;$('authSubmit').textContent=submitting?'Đang đăng nhập…':'Đăng nhập';$('authResetSubmit').disabled=resetting;
 if(authorized){$('accountName').textContent=s.user.displayName||s.user.email||'Tài khoản';$('accountRole').textContent=s.role==='admin'?'Admin':'Nhân viên vận hành';}
 else{$('accountName').textContent='';$('accountRole').textContent='';}
 for(const fn of subscribers)fn(s);
}
const access=Object.freeze({canOperate:()=>!!guard?.canOperate(),canAdmin:()=>!!guard?.canAdmin(),verify:()=>guard?.verify()||Promise.resolve(false),
 snapshot:()=>({...current}),sessionStorage:()=>safeStorage('sessionStorage'),localStorage:()=>safeStorage('localStorage'),
 onChange(fn){subscribers.add(fn);fn({...current});return()=>subscribers.delete(fn)},service:()=>service});
global.LuckyDrawAccess=access;
$('authShow').addEventListener('click',()=>{const show=$('authPassword').type==='password';$('authPassword').type=show?'text':'password';$('authShow').textContent=show?'Ẩn':'Hiện';$('authShow').setAttribute('aria-pressed',String(show));$('authShow').setAttribute('aria-label',show?'Ẩn mật khẩu':'Hiện mật khẩu')});
$('authForgot').addEventListener('click',()=>{resetView=true;$('authResetEmail').value=$('authEmail').value;$('authMessage').textContent='';paint();$('authResetEmail').focus()});
$('authBack').addEventListener('click',()=>{resetView=false;$('authMessage').textContent='';paint();$('authEmail').focus()});
$('authLogin').addEventListener('submit',async e=>{
 e.preventDefault();if(submitting||!service)return;const email=$('authEmail').value.trim(),password=$('authPassword').value,remember=$('authRemember').checked;submitting=true;$('authMessage').textContent='';paint();
 try{const {authMod,auth}=service;await authMod.setPersistence(auth,remember?authMod.browserLocalPersistence:authMod.browserSessionPersistence);await authMod.signInWithEmailAndPassword(auth,email,password);}
 catch{$('authMessage').textContent='Không thể đăng nhập.';}
 finally{$('authPassword').value='';submitting=false;paint();}
});
$('authReset').addEventListener('submit',async e=>{
 e.preventDefault();if(resetting||!service)return;resetting=true;paint();
 try{await service.authMod.sendPasswordResetEmail(service.auth,$('authResetEmail').value.trim());}
 catch(e){if(['auth/network-request-failed','auth/too-many-requests'].includes(e.code)){$('authMessage').textContent='Chưa gửi được yêu cầu. Kiểm tra kết nối hoặc thử lại sau.';return;}}
 finally{resetting=false;paint();}
 resetView=false;$('authMessage').textContent='Nếu email đủ điều kiện, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.';paint();
});
for(const id of ['accountLogout','authDeniedLogout','authErrorLogout'])$(id).addEventListener('click',()=>guard?.logout());
$('authRetry').addEventListener('click',()=>{if(guard)void guard.changed(service.auth.currentUser);else location.reload()});
global.addEventListener('offline',()=>guard?.offline());global.addEventListener('online',()=>guard?.verify());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&guard)void guard.verify()});
(async()=>{
 try{
  const url='https://www.gstatic.com/firebasejs/13.4.0/';
  const [app,fs,authMod]=await bounded(Promise.all([import(url+'firebase-app.js'),import(url+'firebase-firestore.js'),import(url+'firebase-auth.js')]));
  const firebaseApp=app.initializeApp(global.LUCKYDRAW_CLOUD_CONFIG),db=fs.getFirestore(firebaseApp),auth=authMod.getAuth(firebaseApp);auth.languageCode='vi';
  service=Object.freeze({fs,authMod,db,auth});
  guard=create({user:()=>auth.currentUser,online:()=>navigator.onLine!==false,token:user=>authMod.getIdTokenResult(user,true),
   roles:async uid=>{const [a,o]=await Promise.all(['admins','operators'].map(c=>fs.getDocFromServer(fs.doc(db,c,uid))));return{admin:a.exists()?a.data():null,operator:o.exists()?o.data():null}},
   watchRoles:(uid,onChange,onError)=>{const roles={};return ['admins','operators'].map(c=>fs.onSnapshot(fs.doc(db,c,uid),{includeMetadataChanges:true},s=>{if(s.metadata.fromCache||s.metadata.hasPendingWrites)return;roles[c==='admins'?'admin':'operator']=s.exists()?s.data():null;if(Object.keys(roles).length===2)onChange({...roles})},onError))},
   lock:()=>global.LuckyDrawRuntime?.lock(),unlock:uid=>global.LuckyDrawRuntime?.unlock(uid),active:()=>!!global.LuckyDrawRuntime?.active(),confirm:confirmLogout,signOut:()=>authMod.signOut(auth)});
  guard.onChange(paint);authMod.onAuthStateChanged(auth,user=>void guard.changed(user));
  authMod.onIdTokenChanged(auth,user=>{if(!user&&current.uid)void guard.changed(null)});
  interval=setInterval(()=>{if(auth.currentUser)void guard.verify()},30_000);
 }catch{paint({phase:'error',uid:null,role:null,user:null})}
})();
})(typeof window==='undefined'?globalThis:window);
