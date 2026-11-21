/* One public configuration authority. Runtime people/winners never enter this adapter. */
(async function(){
'use strict';
if(!window.EventSettings||!window.LuckyDrawSettingsBridge||!window.LuckyDrawAccess)return;
const access=window.LuckyDrawAccess;
window.ProgramSettingsActive=true;
const M=EventSettings,bridge=LuckyDrawSettingsBridge,$=id=>document.getElementById(id);
const mount=$('programSettingsMount');if(!mount)return;
mount.innerHTML=`<section class="program-settings side-section" aria-labelledby="settingsHeading">
 <div class="settings-heading"><span class="settings-icon">✦</span><div><h2 id="settingsHeading">Cài đặt chương trình</h2><p id="settingsHelp">Chỉnh sửa · xem trước · lưu chung</p></div></div>
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
  <p class="settings-rule-note">Thứ tự quay từ giải đầu đến giải cuối. Chuẩn bị và bắt đầu từng lượt bằng tay.</p>
  <div id="settingsPrizeCards"></div><button id="settingsAddPrize" type="button">+ Thêm hạng giải</button><p id="settingsSchedule" class="settings-meta"></p>

 </div></details>
 <details class="settings-group"><summary><span>04</span> Âm thanh</summary><div class="settings-fields">
  <label class="settings-toggle"><input id="settingsMusic" type="checkbox"> Nhạc nền tổng hợp</label>
  <label class="settings-toggle"><input id="settingsCountdown" type="checkbox"> Âm đếm ngược</label>
  <label class="settings-toggle"><input id="settingsCelebration" type="checkbox"> Âm thanh và hiệu ứng chúc mừng</label>
  <label for="musicFile" class="settings-local-track">♫ Chọn nhạc riêng trên máy</label><p class="settings-meta">File nhạc riêng chỉ dùng trên máy này, không tải lên Firebase.</p>
 </div></details>
 <div class="settings-savebar"><button id="settingsSave" type="button" disabled>Lưu &amp; áp dụng cho tất cả thiết bị</button><button id="settingsDiscard" type="button" class="settings-link" hidden>Bỏ thay đổi và dùng bản mới nhất</button></div>

</section>`;
$('settingsTheme').replaceChildren(...EventPlatform.THEMES.map(t=>new Option(t.name+(t.id===EventPlatform.DEFAULT_THEME_ID?' · Mặc định':''),t.id)));
let editor=null,live=false,allowed=false,busy=false,error=false,invalid=false,bootstrapping=false;
let auth,fs,ref,db,controllerUid=null,controllerRole=null,generation=0,stopConfig=null,stopLegacy=null,pendingNotice='',legacyJson=null,legacyTheme=null,reloadLegacy=async()=>{};
const fields=()=>[...mount.querySelectorAll('.settings-fields input,.settings-fields textarea,.settings-fields select')];
function storage(){return access.canOperate()?access.localStorage():null}
function saveDraft(){if(!allowed)return;try{if(editor?.dirty)storage()?.setItem(M.DRAFT_KEY,JSON.stringify({baseRevision:editor.baseRevision,settings:editor.draft}));else storage()?.removeItem(M.DRAFT_KEY)}catch{pendingNotice='Không lưu được bản sửa trên máy; giữ trang mở trước khi lưu.'}}
function renderPrizes(draw){
 const host=$('settingsPrizeCards');host.replaceChildren();
 for(const [i,p]of draw.prizes.entries()){
  const card=document.createElement('fieldset');card.className='settings-prize';
  const legend=document.createElement('legend');legend.textContent='Hạng '+(i+1);card.appendChild(legend);
  for(const [prefix,label,value,type,max]of [['Name','Tên giải',p.name,'text',80],['Amount','Tiền mỗi giải (VNĐ)',p.amount,'number',100000000000],['Count','Số lượng',p.count,'number',5000],['Batch','Người/lượt',p.batchSize,'number',100],['Duration','Giây/lượt',p.durationMs/1000,'number',300]]){
   const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.id='settingsPrize'+prefix+'-'+p.key;input.type=type;input.value=value;
   if(type==='number'){input.min=prefix==='Amount'?0:1;input.max=max;input.step=1;}else input.maxLength=max;
   input.dataset.critical=prefix==='Name'||prefix==='Amount'?'false':'true';l.appendChild(input);card.appendChild(l);
  }
  for(const [action,label]of [['up','↑'],['down','↓'],['delete','Xóa hạng giải']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.prizeAction=action;button.dataset.prizeKey=p.key;button.disabled=!allowed||bridge.locked()||action==='up'&&i===0||action==='down'&&i===draw.prizes.length-1||action==='delete'&&draw.prizes.length===1;card.appendChild(button);}
  host.appendChild(card);
 }
 schedule(draw);
}
function schedule(draw){const batches=BatchEngine.schedule(draw);$('settingsSchedule').textContent=BatchEngine.totalSlots(draw)+' người · '+batches.length+' lượt · '+batches.reduce((n,b)=>n+b.durationMs,0)/1000+' giây. '+batches.slice(0,30).map(b=>draw.prizes.find(p=>p.key===b.key)?.name+' '+b.number+': '+b.count+' người').join(' · ')+(batches.length>30?' …':'');}
$('settingsAddPrize').addEventListener('click',()=>{if(!allowed||busy||bridge.locked()||!editor)return;try{editor.edit(read());if(editor.draft.draw.prizes.length>=BatchEngine.LIMITS.tiers)throw Error('Tối đa '+BatchEngine.LIMITS.tiers+' hạng giải.');editor.edit({...editor.draft,draw:BatchEngine.fromPrizes([...editor.draft.draw.prizes,{key:'prize-'+crypto.randomUUID().slice(0,8),name:'Giải mới',count:1,batchSize:1,amount:0,durationMs:10000}])});fill();changed();}catch(e){pendingNotice=e.message;paint();}});
$('settingsPrizeCards').addEventListener('click',event=>{const b=event.target.closest('[data-prize-action]');if(!b||!allowed||busy||bridge.locked())return;try{const c=read(),p=c.draw.prizes,i=p.findIndex(x=>x.key===b.dataset.prizeKey);if(i<0)return;if(b.dataset.prizeAction==='delete'){if(p.length===1)return;p.splice(i,1);}else{const j=i+(b.dataset.prizeAction==='up'?-1:1);if(j<0||j>=p.length)return;[p[i],p[j]]=[p[j],p[i]];}c.draw=BatchEngine.fromPrizes(p);editor.edit(c);fill();changed();}catch(e){pendingNotice=e.message;paint();}});
function fill(){
 if(!editor)return;const c=editor.draft,e=c.event;
 const values={settingsPreset:e.presetId,settingsName:e.content.title,settingsOrganization:e.details.organization,settingsDate:e.details.date,settingsSubtitle:e.content.kicker,settingsOccasion:e.content.occasion,settingsBrandLabel:e.content.brandLabel,settingsLogoMode:e.appearance.logo.kind,settingsLogoUrl:e.appearance.logo.url||'',settingsCompletedTitle:e.content.completedTitle,settingsCompletedMessage:e.content.completedMessage,settingsTheme:e.appearance.themeId,settingsBackground:e.appearance.background.kind,settingsColor:e.appearance.background.color||'#0D1B3D'};
 for(const [id,value]of Object.entries(values))$(id).value=value;
 renderPrizes(c.draw);

 $('settingsMusic').checked=c.audio.musicEnabled;$('settingsCountdown').checked=c.audio.countdownEnabled;$('settingsCelebration').checked=c.audio.celebrationEnabled;
 visual();
}
function read(){
 const c=M.copy(editor.draft),e=c.event;
 Object.assign(e.content,{title:$('settingsName').value.trim(),kicker:$('settingsSubtitle').value.trim(),occasion:$('settingsOccasion').value.trim(),brandLabel:$('settingsBrandLabel').value.trim(),completedTitle:$('settingsCompletedTitle').value.trim(),completedMessage:$('settingsCompletedMessage').value.trim()});
 e.details={organization:$('settingsOrganization').value.trim(),date:$('settingsDate').value};
 e.appearance={themeId:$('settingsTheme').value,background:$('settingsBackground').value==='solid'?{kind:'solid',color:$('settingsColor').value}:{kind:'theme'},logo:$('settingsLogoMode').value==='url'?{kind:'url',url:$('settingsLogoUrl').value.trim()}:{kind:'builtin',id:'quyet-thang-original'}};
 for(const p of c.draw.prizes){p.name=$('settingsPrizeName-'+p.key).value.trim();for(const [field,prefix]of [['amount','Amount'],['count','Count'],['batchSize','Batch'],['durationMs','Duration']]){const value=$('settingsPrize'+prefix+'-'+p.key).value;if(!/^\d+$/.test(value))throw Error('Số lượng, thời gian và tiền giải cần là số nguyên hợp lệ.');p[field]=Number(value)*(field==='durationMs'?1000:1);}}
 c.draw=BatchEngine.fromPrizes(c.draw.prizes);

 c.audio={...c.audio,musicEnabled:$('settingsMusic').checked,countdownEnabled:$('settingsCountdown').checked,celebrationEnabled:$('settingsCelebration').checked};
 if(bridge.locked()){const critical=d=>d.prizes.map(({key,count,batchSize,durationMs})=>({key,count,batchSize,durationMs}));if(M.canonical(critical(c.draw))!==M.canonical(critical(editor.draft.draw)))throw Error('Cơ cấu phiên đang quay đã khóa. Kết thúc hoặc xóa phiên trước khi thay đổi.');}
 return M.validate(c);
}
function visual(){
 const theme=EventPlatform.THEMES.find(t=>t.id===$('settingsTheme').value)||EventPlatform.THEMES[0];
 $('settingsThemeName').textContent=theme.name;const p=$('settingsThemePreview');p.style.setProperty('--preview-primary',theme.primary);p.style.setProperty('--preview-bg',theme.bg);p.style.setProperty('--preview-ink',theme.ink);
 $('settingsLogoUrlLabel').hidden=$('settingsLogoMode').value!=='url';$('settingsColorLabel').hidden=$('settingsBackground').value!=='solid';
}
function paint(){
 const dirty=!!editor?.dirty||invalid;
 $('settingsHelp').textContent=allowed?'Chỉnh sửa · xem trước · lưu chung':'Chỉ xem · vận hành phiên quay';
 $('settingsStatus').textContent=error&&!live?'Không thể lưu — kiểm tra kết nối':busy?'Đang lưu...':error||!live?'Không thể lưu — kiểm tra kết nối':dirty||bootstrapping?'Có thay đổi chưa lưu':'Đã đồng bộ';
 $('settingsDot').dataset.state=busy?'saving':error||!live?'offline':dirty||bootstrapping?'dirty':'synced';
 $('settingsVersion').textContent=editor?.latest?'Phiên bản '+editor.latest.revision+' · '+new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(editor.latest.updatedAt)):bootstrapping?'Giữ nguyên cài đặt hiện tại · chưa chuyển đổi sang Firebase':'';
 const warnings=[];if(editor?.conflicted)warnings.push('Có bản mới từ Admin khác. Bản sửa của bạn được giữ nguyên; hãy xem bản mới trước khi lưu.');if(bridge.locked())warnings.push('Phiên đang mở giữ nguyên người trúng, tiền giải và cơ cấu đã khóa. Cài đặt mới áp dụng cho phiên tiếp theo; chỉ theme được xem trước ngay.');if(pendingNotice)warnings.push(pendingNotice);
 $('settingsNotice').textContent=warnings.join(' ');
 for(const b of mount.querySelectorAll('[data-prize-action]')){const i=editor?.draft.draw.prizes.findIndex(p=>p.key===b.dataset.prizeKey)??-1;b.disabled=!allowed||busy||!editor||bridge.locked()||b.dataset.prizeAction==='up'&&i===0||b.dataset.prizeAction==='down'&&i===editor?.draft.draw.prizes.length-1||b.dataset.prizeAction==='delete'&&editor?.draft.draw.prizes.length===1;}
 $('settingsAddPrize').disabled=!allowed||busy||!editor||bridge.locked();
 $('settingsSave').hidden=!allowed;$('settingsSave').disabled=!editor||!allowed||!live||busy||invalid||editor.conflicted||(!dirty&&!bootstrapping);
 $('settingsDiscard').hidden=!allowed||(!editor?.latest&&!bootstrapping)||(!dirty&&!editor?.conflicted);
 for(const input of fields())if(!input.readOnly)input.disabled=!allowed||busy||!editor||(input.dataset.critical==='true'&&bridge.locked());
}
function apply(preview=false){if(!editor)return;const c=preview?editor.draft:editor.latest?.settings||editor.draft;bridge.apply(c,{preview,revision:editor.latest?.revision||1,updatedAt:editor.latest?.updatedAt});}
function initialize(seed){
 if(editor)return;editor=new M.Editor(seed);
 try{const draft=allowed&&storage()?.getItem(M.DRAFT_KEY);if(draft)editor.restoreDraft(JSON.parse(draft));}catch{pendingNotice='Không đọc được bản sửa cục bộ; chưa ghi đè dữ liệu đã lưu.'}
 fill();
}
function receive(raw,{cached=false}={}){
 const d=M.document(raw,{cached});initialize(d.settings);const adopted=editor.receive(raw,{cached});
 if(!cached){live=true;bootstrapping=false;error=false;try{storage()?.setItem(M.CACHE_KEY,JSON.stringify(d));}catch{}}
 if(adopted){fill();apply(false);}else if(editor.dirty){apply(true);}saveDraft();bridge.ready(!cached);paint();
}
function changed(){
 if(!editor||!allowed||!access.canAdmin()||busy)return;
 try{editor.edit(read());invalid=false;error=false;pendingNotice='';visual();schedule(editor.draft.draw);apply(true);saveDraft();}catch(e){invalid=true;editor.dirty=true;pendingNotice=e.message;}
 paint();
}
for(const type of ['input','change'])mount.addEventListener(type,event=>{if(event.target.id!=='settingsPreset')changed();});
$('settingsPreset').addEventListener('change',()=>{
 if(!editor||!allowed||!access.canAdmin())return;
 const preset=$('settingsPreset').value;
 if(bridge.locked()&&!window.confirm('Đang có phiên quay. Chuyển chương trình chỉ áp dụng cho phiên mới, không xóa hay thay kết quả hiện tại. Tiếp tục chuẩn bị cài đặt mới?')){fill();return;}
 const e=EventPlatform.createEvent(preset,'evt-'+crypto.randomUUID().split('-').map(s=>'e'+s.slice(0,8)).join('-'));
 editor.draft.event={...editor.draft.event,id:e.id,presetId:e.presetId,content:e.content};fill();changed();
});
$('settingsDiscard').addEventListener('click',async()=>{
 if(!access.canAdmin())return;
 if(editor?.dirty&&!window.confirm('Bỏ bản sửa trên máy và xem cấu hình đã đồng bộ mới nhất?'))return;
 if(!editor?.latest){storage()?.removeItem(M.DRAFT_KEY);editor=null;invalid=false;error=false;pendingNotice='';await reloadLegacy();return;}
 editor?.acceptLatest();invalid=false;error=false;pendingNotice='';fill();apply(false);saveDraft();paint();
});
function offline(){live=false;if(busy)error=true;paint();}
window.addEventListener('lucky-draw-session-state',paint);
window.addEventListener('offline',offline);window.addEventListener('online',()=>{pendingNotice='Đang kiểm tra lại kết nối; bản sửa trên máy vẫn được giữ.';paint();});
window.addEventListener('beforeunload',event=>{if(editor?.dirty||invalid){event.preventDefault();event.returnValue='';}});
paint();
function stop(){
 generation++;stopConfig?.();stopConfig=null;stopLegacy?.();stopLegacy=null;
 editor=null;allowed=false;live=false;busy=false;error=false;invalid=false;bootstrapping=false;controllerUid=null;controllerRole=null;
 legacyJson=null;legacyTheme=null;pendingNotice='';
 for(const input of fields()){if(!input.readOnly){input.value='';input.checked=false;input.disabled=true;}}
 $('settingsVersion').textContent='';$('settingsNotice').textContent='';paint();
}
async function confirmedWrite(ref,data){let timer;try{return await Promise.race([fs.setDoc(ref,data),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Hết thời gian chờ máy chủ; cấu hình cũ vẫn được giữ.')),20000)})]);}finally{clearTimeout(timer);}}
async function hydrate(raw){
 if(raw.schemaVersion===2)return raw;
 const draw=raw.settings?.draw,n=M.blockCount(raw);
 const blocks=await Promise.all(Array.from({length:n},async(_,i)=>{const snap=await fs.getDocFromServer(fs.doc(db,'sharedEvent/live/prizeVersions/'+draw.generation+'/blocks/'+i));if(!snap.exists())throw Error('Cấu hình chưa đầy đủ.');return snap.data();}));
 return M.assemble(raw,blocks);
}
async function start(session){
 const ticket=++generation;controllerUid=session.uid;controllerRole=session.role;allowed=session.role==='admin';
 const isCurrent=()=>ticket===generation&&access.canOperate()&&access.snapshot().uid===session.uid;
 try{
  ({fs,db,auth}=access.service());ref=fs.doc(db,...M.PATH.split('/'));
  try{const cached=storage()?.getItem(M.CACHE_KEY);if(cached)receive(JSON.parse(cached),{cached:true});}catch{pendingNotice='Bản lưu trên máy không hợp lệ. Đang chờ cấu hình từ máy chủ.'}
 // Legacy sources are a migration input only. Once sharedEvent/live exists they stop being authorities.
 let loadingLegacy=false;
 async function loadLegacy(){
  if(!isCurrent()||loadingLegacy||editor?.latest)return;stopLegacy?.();stopLegacy=null;loadingLegacy=true;
  try{
   const input=await SharedConfiguration.fetchPublished(fetch,new URL('./config/published.json',location.href).href);
   const snap=await fs.getDocFromServer(fs.doc(db,'sharedTheme','live'));
   if(!isCurrent())return;legacyJson=input;legacyTheme=snap.exists()?snap.data():null;
   const seed=M.migrate(legacyJson,legacyTheme);initialize(seed);if(!editor.dirty){editor.draft=seed;fill();apply(false);}bootstrapping=true;live=true;error=false;
   stopLegacy=fs.onSnapshot(fs.doc(db,'sharedTheme','live'),{includeMetadataChanges:true},s=>{
    if(!isCurrent()||editor?.latest||s.metadata.fromCache||s.metadata.hasPendingWrites)return;
    const incoming=s.exists()?s.data():null;const token=x=>x?JSON.stringify([x.schemaVersion,x.themeId,x.updatedAt?.toDate?.().toISOString()]):'null';if(token(incoming)===token(legacyTheme))return;
    const migrated=M.migrate(legacyJson,incoming);
    if(!editor.dirty){legacyTheme=incoming;editor.draft=migrated;fill();apply(false);}else{editor.conflicted=true;pendingNotice='Theme cũ vừa thay đổi. Tải lại để xem trước khi chuyển đổi lần đầu.';}paint();
   });
  }catch(e){if(isCurrent()){live=false;error=true;pendingNotice=e.message;}}finally{loadingLegacy=false;if(isCurrent())paint();}
 }
 reloadLegacy=loadLegacy;
 let loadTicket=0;
 stopConfig=fs.onSnapshot(ref,{includeMetadataChanges:true},async snap=>{
  const readTicket=++loadTicket;
  if(!isCurrent()||snap.metadata.hasPendingWrites)return;
  if(snap.metadata.fromCache){live=false;bridge.ready(false);paint();return;}
  try{if(snap.exists()){stopLegacy?.();const assembled=snap.data().schemaVersion===2?snap.data():await hydrate(snap.data());if(!isCurrent()||readTicket!==loadTicket)return;receive(assembled);}else if(editor?.latest){throw Error('Thiếu cấu hình đã đồng bộ; không tự quay về nguồn cũ.');}else loadLegacy();}
  catch(e){if(!isCurrent()||readTicket!==loadTicket)return;live=false;bridge.ready(false);error=true;pendingNotice=e.message;paint();}
 },e=>{if(!isCurrent())return;live=false;bridge.ready(false);error=true;pendingNotice='Không tải được cấu hình Firebase: '+(e.code||'lỗi kết nối');paint();});
 }catch(e){if(isCurrent()){live=false;error=true;pendingNotice=e.message;paint();}}
}
$('settingsSave').addEventListener('click',async()=>{
  if(busy||!editor||!access.canAdmin())return;
  const ticket=generation,uid=controllerUid;
  if(!await access.verify()||!access.canAdmin()||ticket!==generation)return;
  if(!live||navigator.onLine===false){error=true;paint();return;}
  if(!allowed||editor.conflicted)return;
  try{
   const proposed=read();busy=true;error=false;pendingNotice='';paint();
   let packed;
   const result=await M.publish({stage:async(settings,revision)=>{const id='g-'+crypto.randomUUID();packed=M.pack(settings,revision,id);await confirmedWrite(fs.doc(db,'sharedEvent/live/prizeVersions/'+id+'/metadata/event'),{revision,createdAt:fs.serverTimestamp(),event:settings.event,audio:settings.audio});for(let i=0;i<packed.blocks.length;i++){if(ticket!==generation||!access.canAdmin())throw Error('Quyền truy cập đã thay đổi.');await confirmedWrite(fs.doc(db,'sharedEvent/live/prizeVersions/'+id+'/blocks/'+i),{...packed.blocks[i],createdAt:fs.serverTimestamp()});}},currentUser:()=>auth.currentUser,isAdmin:async()=>access.canAdmin()&&auth.currentUser?.uid===uid&&await access.verify(),serverTimestamp:fs.serverTimestamp,transaction:fn=>fs.runTransaction(db,async transaction=>fn({read:async()=>{const s=await transaction.get(ref);if(!s.exists()){const old=await transaction.get(fs.doc(db,'sharedTheme','live'));const token=x=>x?JSON.stringify([x.schemaVersion,x.themeId,x.updatedAt?.toDate?.().toISOString()]):'null';if(token(old.exists()?old.data():null)!==token(legacyTheme)){const e=Error('Theme cũ vừa được cập nhật. Xem bản mới trước khi chuyển đổi.');e.code='settings/conflict';throw e;}}return s.exists()?s.data():null;},write:data=>transaction.set(ref,{...data,settings:packed.settings})})),readServer:async()=>{const s=await fs.getDocFromServer(ref);if(!s.exists())throw Error('Chưa xác nhận được cấu hình.');return hydrate(s.data());}},proposed,editor.baseRevision);
   if(ticket!==generation||!access.canAdmin())return;
   editor.confirm(result.confirmed);try{storage()?.setItem(M.CACHE_KEY,JSON.stringify(editor.latest));}catch{}bootstrapping=false;pendingNotice=result.superseded?'Một Admin khác đã lưu bản mới hơn sau lần lưu này; đang hiển thị bản mới nhất.':'';invalid=false;live=true;fill();apply(false);saveDraft();
  }catch(e){if(ticket!==generation)return;error=true;if(e.code==='settings/conflict'){editor.conflicted=true;pendingNotice=e.message;}else pendingNotice='Chưa xác nhận lưu thành công. Bản sửa vẫn ở trên máy. '+e.message;}
  finally{if(ticket===generation){busy=false;paint();}}
 });
access.onChange(session=>{
 if(session.phase!=='authorized'){stop();return;}
 if(controllerUid===session.uid&&controllerRole===session.role){paint();return;}
 stop();void start(session);
});
})();
