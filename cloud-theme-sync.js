/* One public configuration authority. Runtime people/winners never enter this adapter. */
(async function(){
'use strict';
if(!window.EventSettings||!window.LuckyDrawSettingsBridge)return;
window.ProgramSettingsActive=true;
const M=EventSettings,bridge=LuckyDrawSettingsBridge,$=id=>document.getElementById(id);
const mount=$('programSettingsMount');if(!mount)return;
const prizeKeys=SharedConfiguration.PRIZES.map(p=>p.key);
mount.innerHTML=`<section class="program-settings side-section" aria-labelledby="settingsHeading">
 <div class="settings-heading"><span class="settings-icon">✦</span><div><h2 id="settingsHeading">Cài đặt chương trình</h2><p>Chỉnh sửa · xem trước · lưu chung</p></div></div>
 <div class="settings-state" role="status" aria-live="polite"><i id="settingsDot"></i><strong id="settingsStatus">Đang tải...</strong></div>
 <p id="settingsVersion" class="settings-meta"></p><p id="settingsNotice" class="settings-notice" role="status"></p>
 <details class="settings-group" open><summary><span>01</span> Thông tin</summary><div class="settings-fields">
  <label>Mẫu chương trình<select id="settingsPreset"><option value="teachers-day">Ngày Nhà giáo Việt Nam 20/11</option><option value="year-end">Year End Party</option><option value="custom">Chương trình tùy chỉnh</option></select></label>
  <label>Tên chương trình<input id="settingsName" maxlength="110"></label>
  <label>Đơn vị tổ chức<input id="settingsOrganization" maxlength="140"></label>
  <label>Ngày tổ chức<input id="settingsDate" type="date"></label>
  <label>Phụ đề<input id="settingsSubtitle" maxlength="240"></label>
  <label>Dòng thông điệp trên sân khấu<input id="settingsOccasion" maxlength="240"></label>
  <label>Nhãn sự kiện<input id="settingsBrandLabel" maxlength="240"></label>
  <label>Logo<select id="settingsLogoMode"><option value="builtin">Logo Quyết Thắng gốc</option><option value="url">Logo từ URL HTTPS công khai</option></select></label>
  <label id="settingsLogoUrlLabel" hidden>URL logo<input id="settingsLogoUrl" type="url" maxlength="600" placeholder="https://example.org/logo.png"></label>
  <label>Tiêu đề kết thúc<input id="settingsCompletedTitle" maxlength="240"></label>
  <label>Lời chúc kết thúc<textarea id="settingsCompletedMessage" maxlength="240" rows="2"></textarea></label>
 </div></details>
 <details class="settings-group"><summary><span>02</span> Giao diện</summary><div class="settings-fields">
  <label>Theme<select id="settingsTheme"></select></label><div class="settings-theme-preview" id="settingsThemePreview"><div class="preview-swatch"></div><strong id="settingsThemeName"></strong><span>ABC · 012</span></div>
  <label>Nền<select id="settingsBackground"><option value="theme">Theo theme</option><option value="solid">Màu nền riêng</option></select></label><label id="settingsColorLabel" hidden>Màu nền<input id="settingsColor" type="color" value="#0D1B3D"></label>
 </div></details>
 <details class="settings-group"><summary><span>03</span> Giải thưởng</summary><div class="settings-fields">
  <p class="settings-rule-note">44 người · 13 lượt · 10 giây/lượt. Chuẩn bị và bắt đầu từng lượt bằng tay.</p>
  ${SharedConfiguration.PRIZES.map(p=>`<fieldset class="settings-prize"><legend>${p.name}</legend><label>Tên giải<input id="settingsPrizeName-${p.key}" maxlength="80"></label><label>Tiền mỗi giải (VNĐ)<input id="settingsPrizeAmount-${p.key}" type="number" min="0" max="100000000000" step="1000"></label><div class="settings-fixed"><label>Số lượng<input readonly value="${p.count}"></label><label>Người/lượt<input readonly value="${p.batchSize}"></label><label>Giây/lượt<input readonly value="10"></label></div></fieldset>`).join('')}
 </div></details>
 <details class="settings-group"><summary><span>04</span> Âm thanh</summary><div class="settings-fields">
  <label class="settings-toggle"><input id="settingsMusic" type="checkbox"> Nhạc nền tổng hợp</label>
  <label class="settings-toggle"><input id="settingsCountdown" type="checkbox"> Âm đếm ngược</label>
  <label class="settings-toggle"><input id="settingsCelebration" type="checkbox"> Âm thanh và hiệu ứng chúc mừng</label>
  <label for="musicFile" class="settings-local-track">♫ Chọn nhạc riêng trên máy</label><p class="settings-meta">File nhạc riêng chỉ dùng trên máy này, không tải lên Firebase.</p>
 </div></details>
 <div class="settings-savebar"><button id="settingsSave" type="button" disabled>Lưu &amp; áp dụng cho tất cả thiết bị</button><button id="settingsDiscard" type="button" class="settings-link" hidden>Bỏ thay đổi và dùng bản mới nhất</button></div>
 <details class="settings-auth"><summary>Quản trị viên</summary><form id="settingsLogin"><label>Email<input id="settingsEmail" type="email" autocomplete="username" required></label><label>Mật khẩu<input id="settingsPassword" type="password" autocomplete="current-password" required></label><button class="secondary-btn full" type="submit">Đăng nhập</button></form><button id="settingsLogout" type="button" class="secondary-btn full" hidden>Đăng xuất</button><p id="settingsAuthStatus" class="settings-meta">Khách xem không cần đăng nhập.</p></details>
</section>`;
$('settingsTheme').replaceChildren(...EventPlatform.THEMES.map(t=>new Option(t.name+(t.id===EventPlatform.DEFAULT_THEME_ID?' · Mặc định':''),t.id)));
let editor=null,live=false,allowed=false,busy=false,error=false,invalid=false,bootstrapping=false;
let auth,fs,authMod,ref,db,roleRequest=0,pendingNotice='',legacyJson=null,legacyTheme=null,reloadLegacy=async()=>{};
const fields=[...mount.querySelectorAll('.settings-fields input,.settings-fields textarea,.settings-fields select')];
function storage(){try{return window.localStorage}catch{return null}}
function saveDraft(){try{if(editor?.dirty)storage()?.setItem(M.DRAFT_KEY,JSON.stringify({baseRevision:editor.baseRevision,settings:editor.draft}));else storage()?.removeItem(M.DRAFT_KEY)}catch{pendingNotice='Không lưu được bản sửa trên máy; giữ trang mở trước khi lưu.'}}
function fill(){
 if(!editor)return;const c=editor.draft,e=c.event;
 const values={settingsPreset:e.presetId,settingsName:e.content.title,settingsOrganization:e.details.organization,settingsDate:e.details.date,settingsSubtitle:e.content.kicker,settingsOccasion:e.content.occasion,settingsBrandLabel:e.content.brandLabel,settingsLogoMode:e.appearance.logo.kind,settingsLogoUrl:e.appearance.logo.url||'',settingsCompletedTitle:e.content.completedTitle,settingsCompletedMessage:e.content.completedMessage,settingsTheme:e.appearance.themeId,settingsBackground:e.appearance.background.kind,settingsColor:e.appearance.background.color||'#0D1B3D'};
 for(const [id,value]of Object.entries(values))$(id).value=value;
 for(const p of c.draw.prizes){$('settingsPrizeName-'+p.key).value=p.name;$('settingsPrizeAmount-'+p.key).value=p.amount;}
 $('settingsMusic').checked=c.audio.musicEnabled;$('settingsCountdown').checked=c.audio.countdownEnabled;$('settingsCelebration').checked=c.audio.celebrationEnabled;
 visual();
}
function read(){
 const c=M.copy(editor.draft),e=c.event;
 Object.assign(e.content,{title:$('settingsName').value.trim(),kicker:$('settingsSubtitle').value.trim(),occasion:$('settingsOccasion').value.trim(),brandLabel:$('settingsBrandLabel').value.trim(),completedTitle:$('settingsCompletedTitle').value.trim(),completedMessage:$('settingsCompletedMessage').value.trim()});
 e.details={organization:$('settingsOrganization').value.trim(),date:$('settingsDate').value};
 e.appearance={themeId:$('settingsTheme').value,background:$('settingsBackground').value==='solid'?{kind:'solid',color:$('settingsColor').value}:{kind:'theme'},logo:$('settingsLogoMode').value==='url'?{kind:'url',url:$('settingsLogoUrl').value.trim()}:{kind:'builtin',id:'quyet-thang-original'}};
 for(const p of c.draw.prizes){p.name=$('settingsPrizeName-'+p.key).value.trim();const value=$('settingsPrizeAmount-'+p.key).value;if(!/^\d+$/.test(value))throw Error('Tiền giải cần là số nguyên không âm.');p.amount=Number(value);}
 c.audio={...c.audio,musicEnabled:$('settingsMusic').checked,countdownEnabled:$('settingsCountdown').checked,celebrationEnabled:$('settingsCelebration').checked};
 return M.validate(c);
}
function visual(){
 const theme=EventPlatform.THEMES.find(t=>t.id===$('settingsTheme').value)||EventPlatform.THEMES[0];
 $('settingsThemeName').textContent=theme.name;const p=$('settingsThemePreview');p.style.setProperty('--preview-primary',theme.primary);p.style.setProperty('--preview-bg',theme.bg);p.style.setProperty('--preview-ink',theme.ink);
 $('settingsLogoUrlLabel').hidden=$('settingsLogoMode').value!=='url';$('settingsColorLabel').hidden=$('settingsBackground').value!=='solid';
}
function paint(){
 const dirty=!!editor?.dirty||invalid;
 $('settingsStatus').textContent=error&&!live?'Không thể lưu — kiểm tra kết nối':busy?'Đang lưu...':error||!live?'Không thể lưu — kiểm tra kết nối':dirty||bootstrapping?'Có thay đổi chưa lưu':'Đã đồng bộ';
 $('settingsDot').dataset.state=busy?'saving':error||!live?'offline':dirty||bootstrapping?'dirty':'synced';
 $('settingsVersion').textContent=editor?.latest?'Phiên bản '+editor.latest.revision+' · '+new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(editor.latest.updatedAt)):bootstrapping?'Giữ nguyên cài đặt hiện tại · chưa chuyển đổi sang Firebase':'';
 const warnings=[];if(editor?.conflicted)warnings.push('Có bản mới từ Admin khác. Bản sửa của bạn được giữ nguyên; hãy xem bản mới trước khi lưu.');if(bridge.locked())warnings.push('Phiên đang mở giữ nguyên người trúng, tiền giải và cơ cấu đã khóa. Cài đặt mới áp dụng cho phiên tiếp theo; chỉ theme được xem trước ngay.');if(pendingNotice)warnings.push(pendingNotice);
 $('settingsNotice').textContent=warnings.join(' ');
 $('settingsSave').disabled=!editor||!allowed||!live||busy||invalid||editor.conflicted||(!dirty&&!bootstrapping);
 $('settingsDiscard').hidden=(!editor?.latest&&!bootstrapping)||(!dirty&&!editor?.conflicted);
 for(const input of fields)if(!input.readOnly)input.disabled=!allowed||busy||!editor;
}
function apply(preview=false){if(!editor)return;const c=preview?editor.draft:editor.latest?.settings||editor.draft;bridge.apply(c,{preview,revision:editor.latest?.revision||1,updatedAt:editor.latest?.updatedAt});}
function initialize(seed){
 if(editor)return;editor=new M.Editor(seed);
 try{const draft=storage()?.getItem(M.DRAFT_KEY);if(draft)editor.restoreDraft(JSON.parse(draft));}catch{pendingNotice='Không đọc được bản sửa cục bộ; chưa ghi đè dữ liệu đã lưu.'}
 fill();
}
function receive(raw,{cached=false}={}){
 const d=M.document(raw,{cached});initialize(d.settings);const adopted=editor.receive(raw,{cached});
 if(!cached){live=true;bootstrapping=false;error=false;try{storage()?.setItem(M.CACHE_KEY,JSON.stringify(d));}catch{}}
 if(adopted){fill();apply(false);}else if(editor.dirty){apply(true);}saveDraft();paint();
}
function changed(){
 if(!editor||!allowed||busy)return;
 try{editor.edit(read());invalid=false;error=false;pendingNotice='';visual();apply(true);saveDraft();}catch(e){invalid=true;editor.dirty=true;pendingNotice=e.message;}
 paint();
}
for(const input of fields)if(input.id!=='settingsPreset'&&!input.readOnly)input.addEventListener(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color'?'change':'input',changed);
$('settingsPreset').addEventListener('change',()=>{
 if(!editor||!allowed)return;
 const preset=$('settingsPreset').value;
 if(bridge.locked()&&!window.confirm('Đang có phiên quay. Chuyển chương trình chỉ áp dụng cho phiên mới, không xóa hay thay kết quả hiện tại. Tiếp tục chuẩn bị cài đặt mới?')){fill();return;}
 const e=EventPlatform.createEvent(preset,'evt-'+crypto.randomUUID().split('-').map(s=>'e'+s.slice(0,8)).join('-'));
 editor.draft.event={...editor.draft.event,id:e.id,presetId:e.presetId,content:e.content};fill();changed();
});
$('settingsDiscard').addEventListener('click',async()=>{
 if(editor?.dirty&&!window.confirm('Bỏ bản sửa trên máy và xem cấu hình đã đồng bộ mới nhất?'))return;
 if(!editor?.latest){storage()?.removeItem(M.DRAFT_KEY);editor=null;invalid=false;error=false;pendingNotice='';await reloadLegacy();return;}
 editor?.acceptLatest();invalid=false;error=false;pendingNotice='';fill();apply(false);saveDraft();paint();
});
function offline(){live=false;if(busy)error=true;paint();}
window.addEventListener('offline',offline);window.addEventListener('online',()=>{pendingNotice='Đang kiểm tra lại kết nối; bản sửa trên máy vẫn được giữ.';paint();});
window.addEventListener('beforeunload',event=>{if(editor?.dirty||invalid){event.preventDefault();event.returnValue='';}});
try{const cached=storage()?.getItem(M.CACHE_KEY);if(cached)receive(JSON.parse(cached),{cached:true});}catch{pendingNotice='Bản lưu trên máy không hợp lệ. Đang chờ cấu hình từ máy chủ.'}
paint();
try{
 if(!/^https?:$/.test(location.protocol))throw Error('Mở trang đã tải trước để dùng offline; cần kết nối để lưu chung.');
 const url='https://www.gstatic.com/firebasejs/13.4.0/';
 const [app,firestore,authLibrary]=await Promise.all([import(url+'firebase-app.js'),import(url+'firebase-firestore.js'),import(url+'firebase-auth.js')]);
 fs=firestore;authMod=authLibrary;const firebaseApp=app.initializeApp(window.LUCKYDRAW_CLOUD_CONFIG);db=fs.getFirestore(firebaseApp);auth=authMod.getAuth(firebaseApp);ref=fs.doc(db,...M.PATH.split('/'));
 await authMod.setPersistence(auth,authMod.browserSessionPersistence);
 authMod.onAuthStateChanged(auth,async user=>{
  const request=++roleRequest;allowed=false;$('settingsLogin').hidden=!!user;$('settingsLogout').hidden=!user;paint();
  if(!user){$('settingsAuthStatus').textContent='Khách xem không cần đăng nhập. Đăng nhập Admin để chỉnh sửa.';return;}
  try{const r=await fs.getDocFromServer(fs.doc(db,'admins',user.uid));if(request!==roleRequest||auth.currentUser?.uid!==user.uid)return;allowed=r.exists()&&r.data().enabled===true;$('settingsAuthStatus').textContent=allowed?'Đã xác nhận quyền Admin.':'Tài khoản không có quyền chỉnh sửa.';}
  catch{$('settingsAuthStatus').textContent='Không xác minh được quyền Admin — kiểm tra kết nối.';}
  paint();
 });
 // Legacy sources are a migration input only. Once sharedEvent/live exists they stop being authorities.
 let stopLegacy=null,loadingLegacy=false;
 async function loadLegacy(){
  if(loadingLegacy||editor?.latest)return;stopLegacy?.();stopLegacy=null;loadingLegacy=true;
  try{
   legacyJson=await SharedConfiguration.fetchPublished(fetch,new URL('./config/published.json',location.href).href);
   const snap=await fs.getDocFromServer(fs.doc(db,'sharedTheme','live'));legacyTheme=snap.exists()?snap.data():null;
   const seed=M.migrate(legacyJson,legacyTheme);initialize(seed);if(!editor.dirty){editor.draft=seed;fill();apply(false);}bootstrapping=true;live=true;error=false;
   stopLegacy=fs.onSnapshot(fs.doc(db,'sharedTheme','live'),{includeMetadataChanges:true},s=>{
    if(editor?.latest||s.metadata.fromCache||s.metadata.hasPendingWrites)return;
    const incoming=s.exists()?s.data():null;const token=x=>x?JSON.stringify([x.schemaVersion,x.themeId,x.updatedAt?.toDate?.().toISOString()]):'null';if(token(incoming)===token(legacyTheme))return;
    const migrated=M.migrate(legacyJson,incoming);
    if(!editor.dirty){legacyTheme=incoming;editor.draft=migrated;fill();apply(false);}else{editor.conflicted=true;pendingNotice='Theme cũ vừa thay đổi. Tải lại để xem trước khi chuyển đổi lần đầu.';}paint();
   });
  }catch(e){live=false;error=true;pendingNotice=e.message;}finally{loadingLegacy=false;paint();}
 }
 reloadLegacy=loadLegacy;
 fs.onSnapshot(ref,{includeMetadataChanges:true},snap=>{
  if(snap.metadata.hasPendingWrites)return;
  if(snap.metadata.fromCache){live=false;paint();return;}
  try{if(snap.exists()){stopLegacy?.();receive(snap.data());}else if(editor?.latest){throw Error('Thiếu cấu hình đã đồng bộ; không tự quay về nguồn cũ.');}else loadLegacy();}
  catch(e){live=false;error=true;pendingNotice=e.message;paint();}
 },e=>{live=false;error=true;pendingNotice='Không tải được cấu hình Firebase: '+(e.code||'lỗi kết nối');paint();});
 $('settingsLogin').addEventListener('submit',async e=>{e.preventDefault();try{await authMod.signInWithEmailAndPassword(auth,$('settingsEmail').value.trim(),$('settingsPassword').value);}catch{ $('settingsAuthStatus').textContent='Không đăng nhập được. Kiểm tra tài khoản và kết nối.';}finally{$('settingsPassword').value='';}});
 $('settingsLogout').addEventListener('click',async()=>{allowed=false;paint();await authMod.signOut(auth);});
 $('settingsSave').addEventListener('click',async()=>{
  if(busy||!editor)return;
  if(!live||navigator.onLine===false){error=true;paint();return;}
  if(!allowed||editor.conflicted)return;
  try{
   const proposed=read();busy=true;error=false;pendingNotice='';paint();
   const result=await M.publish({currentUser:()=>auth.currentUser,isAdmin:async()=>{if(!auth.currentUser)return false;const role=await fs.getDocFromServer(fs.doc(db,'admins',auth.currentUser.uid));return role.exists()&&role.data().enabled===true;},serverTimestamp:fs.serverTimestamp,transaction:fn=>fs.runTransaction(db,async transaction=>fn({read:async()=>{const s=await transaction.get(ref);if(!s.exists()){const old=await transaction.get(fs.doc(db,'sharedTheme','live'));const token=x=>x?JSON.stringify([x.schemaVersion,x.themeId,x.updatedAt?.toDate?.().toISOString()]):'null';if(token(old.exists()?old.data():null)!==token(legacyTheme)){const e=Error('Theme cũ vừa được cập nhật. Xem bản mới trước khi chuyển đổi.');e.code='settings/conflict';throw e;}}return s.exists()?s.data():null;},write:data=>transaction.set(ref,data)})),readServer:async()=>{const s=await fs.getDocFromServer(ref);if(!s.exists())throw Error('Chưa xác nhận được cấu hình.');return s.data();}},proposed,editor.baseRevision);
   editor.confirm(result.confirmed);try{storage()?.setItem(M.CACHE_KEY,JSON.stringify(editor.latest));}catch{}bootstrapping=false;pendingNotice=result.superseded?'Một Admin khác đã lưu bản mới hơn sau lần lưu này; đang hiển thị bản mới nhất.':'';invalid=false;live=true;fill();apply(false);saveDraft();
  }catch(e){error=true;if(e.code==='settings/conflict'){editor.conflicted=true;pendingNotice=e.message;}else pendingNotice='Chưa xác nhận lưu thành công. Bản sửa vẫn ở trên máy. '+e.message;}
  finally{busy=false;paint();}
 });
}catch(e){live=false;error=true;pendingNotice=e.message;paint();}
})();
