'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(new URL('../index.html',`file://${__filename}`),'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim());
function fixture(){
 let clock=1700000000000,interval=0;
 const storage=new Map(),els=new Map();
 function element(){const classes=new Set();return {events:{},appendChild(){},value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{setProperty(){}},classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},contains(x){return classes.has(x)},toggle(x,v){if(v??!classes.has(x))classes.add(x);else classes.delete(x)}},getAttribute(k){return this[k]||''},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.events[k]=fn},matches(){return true},click(){},remove(){}}}
 const el=id=>{if(!els.has(id))els.set(id,element());return els.get(id)};
 const context=vm.createContext({console,crypto:webcrypto,Uint32Array,Uint8Array,ArrayBuffer,Blob,TextEncoder,TextDecoder,Date:class extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}},performance:{now:()=>clock},setInterval:()=>++interval,clearInterval(){},setTimeout:(fn,ms,...args)=>setTimeout(fn,0,...args),clearTimeout,URL:class extends URL{static createObjectURL(){return 'blob:test'}static revokeObjectURL(){}},AbortController,sessionStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){storage.set(k,v)},removeItem:k=>storage.delete(k)},document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){},createElement:element,body:{appendChild(){}},documentElement:{}},confirm:()=>true,addEventListener(){}});
 context.window=context;context.globalThis=context;context.LuckyDrawAccess={canOperate:()=>true,canAdmin:()=>true,sessionStorage:()=>context.sessionStorage,localStorage:()=>context.localStorage||context.sessionStorage,snapshot:()=>({uid:'synthetic-owner'}),verify:async()=>true};
 vm.runInContext(scripts[0],context);vm.runInContext(scripts[1],context);vm.runInContext(scripts[2],context);vm.runInContext(scripts[3],context);vm.runInContext(scripts[4],context);
 vm.runInContext(scripts[5],context);
 vm.runInContext(scripts[6].replace(/\nlet runtimeOwner=/,`\nglobalThis.api={state,PRIZES,parseCustomers,parsePrizeAmount,loadCustomers,startRound,finishRound,nextRound,drawTick,restoreSession,persistState,canChangePrizes,changePrizeAmount,renderStage,showReveal,hideReveal,resultRows,auditPayload,bind,canStart,discardDrawSession,initEvents,changeEventTheme,selectPreset,switchEvent,createNewEvent,saveEventTitle,renderEventContent,renderEventControls,getEvent:()=>activeEvent,getCatalog:()=>catalog,configurationForCurrent,initializeSharedConfiguration,refreshPublishedConfiguration,receivePublication,applyPublicConfiguration,useLocalDraft,importConfigurationFile,applyPreviewConfiguration,loadSharedPointer,reset,getSharedState:()=>({mode:sharedMode,ready:configurationReady,applied:appliedConfiguration,latest:latestPublication,frozen:sessionFrozenConfiguration,message:sharedMessage})};\nlet runtimeOwner=`),context);
 el('#eventName').value='TEST — SYNTHETIC ONLY';
 return {context,S:context.SharedConfiguration,P:context.EventPlatform,E:context.BatchEngine,app:context.api,storage,el,advance:ms=>clock+=ms,now:()=>clock};
}
const people=()=>Array.from({length:120},(_,i)=>({id:'EMP:TEST'+i,code:'TEST'+i,cccd:'',name:'Nhân viên giả lập '+i,department:'Test'}));
const plain=x=>JSON.parse(JSON.stringify(x));
function ready(f){const s=f.E.create();s.people=people();return s}
const persist=()=>{};
test('configuration: 13 batches / 44 winners / 130 seconds, correct tier order',()=>{
 const {E}=fixture();assert.equal(E.DRAW_MS,10000);assert.equal(E.BATCHES.length,13);assert.equal(E.BATCHES.reduce((a,b)=>a+b.count,0),44);assert.equal(E.BATCHES.length*E.DRAW_MS,130000);
 assert.deepEqual(plain(E.BATCHES.map(b=>b.count)),[6,6,6,6,6,4,4,1,1,1,1,1,1]);
 assert.deepEqual(plain(E.BATCHES.map(b=>b.key)),[...Array(5).fill('encouragement'),...Array(2).fill('fourth'),...Array(3).fill('third'),...Array(2).fill('second'),'first']);
});
test('all batches: unique eligible employees, exact allocations, no auto-start, double-click guards',()=>{
 const f=fixture(),{E}=f,s=ready(f);let saved;
 for(let i=0;i<13;i++){
  assert.equal(E.begin(s,200000,x=>{saved=E.snapshot(x)},f.now()),true);
  assert.equal(saved.phase,'DRAWING');assert.equal(s.roundEndsAt-f.now(),10000);
  assert.equal(E.begin(s,200000,persist,f.now()),false);assert.equal(E.finish(s,persist,f.now()+9999),false);
  f.advance(10000);assert.equal(E.finish(s,persist,f.now()),true);assert.equal(E.finish(s,persist,f.now()),false);assert.equal(E.canStart(s),false);
  assert.equal(s.completed.at(-1).winners.length,E.BATCHES[i].count);
  E.dismiss(s,persist);assert.equal(s.phase,'WAITING_NEXT_BATCH');assert.equal(E.begin(s,1,persist),false);
  E.next(s,persist);assert.equal(E.next(s,persist),false);assert.equal(s.running,false);
 }
 const winners=s.completed.flatMap(r=>r.winners);assert.equal(winners.length,44);assert.equal(new Set(winners.map(p=>p.code)).size,44);assert.equal(s.phase,'COMPLETED');assert.equal(E.canStart(s),false);
 assert.deepEqual(plain(E.CONFIG.map(p=>winners.filter(w=>s.completed.some(r=>r.tierKey===p.key&&r.winners.includes(w))).length)),[30,8,3,2,1]);
});
test('refresh preserves exact pending winners, deadline, prize amount; expired draw finishes once',()=>{
 const f=fixture(),{E}=f,s=ready(f);let raw;
 E.begin(s,123456,x=>raw=JSON.stringify(E.snapshot(x)),f.now());const before=s.pending.map(p=>p.id);
 f.advance(4000);let restored=E.restore(raw);assert.deepEqual(plain(restored.pending.map(p=>p.id)),plain(before));assert.equal(restored.roundEndsAt-f.now(),6000);assert.equal(E.begin(restored,1,persist),false);
 f.advance(7000);E.finish(restored,x=>raw=JSON.stringify(E.snapshot(x)),f.now());assert.deepEqual(plain(restored.completed[0].winners.map(p=>p.id)),plain(before));assert.equal(restored.completed[0].amount,123456);
 restored=E.restore(raw);assert.equal(restored.phase,'REVEAL');E.dismiss(restored,x=>raw=JSON.stringify(E.snapshot(x)));restored=E.restore(raw);assert.equal(restored.phase,'WAITING_NEXT_BATCH');assert.equal(E.canStart(restored),false);
});
test('fail closed: storage failure cannot start/advance/reveal or select a replacement batch',()=>{
 const f=fixture(),{E}=f,s=ready(f),fail=()=>{throw Error('quota')};
 assert.throws(()=>E.begin(s,1,fail,f.now()),/quota/);assert.equal(s.phase,'READY');assert.equal(s.pending.length,0);
 E.begin(s,1,persist,f.now());const ids=plain(s.pending);f.advance(10000);assert.throws(()=>E.finish(s,fail,f.now()),/quota/);assert.equal(s.phase,'DRAWING');assert.deepEqual(plain(s.pending),ids);
 E.finish(s,persist,f.now());assert.throws(()=>E.next(s,fail),/quota/);assert.equal(s.phase,'REVEAL');assert.equal(s.roundIndex,0);
});
test('invalid recovery rejects duplicates, missing winners, wrong count, wrong duration, out-of-roster IDs',()=>{
 const f=fixture(),{E}=f,s=ready(f);E.begin(s,1,persist,f.now());const raw=plain(E.snapshot(s));
 for(const mutate of [s=>s.pending.pop(),s=>s.pending[1]=s.pending[0],s=>s.pending[0].id='EMP:OUTSIDE',s=>s.roundEndsAt+=1,s=>s.people[1]=s.people[0],s=>s.roundIndex=20,s=>s.version=3]){const bad=plain(raw);mutate(bad);assert.throws(()=>E.restore(bad))}
 f.advance(10000);E.finish(s,persist,f.now());const completed=plain(E.snapshot(s));completed.completed[0].batchNumber=2;assert.throws(()=>E.restore(completed));
});
test('insufficient eligible employees prevent starting; secure RNG required',()=>{
 const f=fixture(),s=ready(f);s.people=s.people.slice(0,43);assert.equal(f.E.canStart(s),false);assert.equal(f.E.begin(s,1,persist),false);
 s.people=people();s.completed=[{winners:s.people.slice(0,118)}];assert.equal(f.E.canStart(s),false);
 f.context.crypto=undefined;assert.throws(()=>f.E.choose(people(),5),/ngẫu nhiên/);
});
test('rejection sampling discards biased tail of uint32 range',()=>{
 const f=fixture();let draws=0;f.context.crypto={getRandomValues(buf){buf[0]=draws++===0?0xffffffff:4;return buf}};assert.equal(f.E.index(5),4);assert.equal(draws,2);
});
test('CSV and employee parser: code/CCCD validation, normalization, deduplication, masked presentation codes',()=>{
 const f=fixture();const rows=f.context.ExcelLocal.parseCsv('\uFEFFMã nhân viên,Họ tên,Phòng ban,Số CCCD\r\nTEST1,"Tên, giả lập",Test,\r\ntest1,Trùng,Test,\r\nBAD!,Sai,Test,\r\nTEST2,Đúng,Test,abc');
 const parsed=f.app.parseCustomers(rows);assert.equal(parsed.people.length,1);assert.equal(parsed.people[0].name,'Tên, giả lập');assert.equal(parsed.duplicate,1);assert.equal(parsed.invalid,2);
 const id='0'.repeat(12);const c=f.app.parseCustomers([['CCCD','Họ tên'],[id,'Giả lập'],[id,'Trùng']]);assert.equal(c.people.length,1);assert.equal(c.duplicate,1);
 assert.throws(()=>f.app.parseCustomers([['Sai cột'],['value']]));
});
test('integrated UI: edits/budget before start, locks once begun, 13 batches, exports batch/amount',async()=>{
 const f=fixture(),{app}=f;await app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC TEST','Test');
 assert.equal(app.canChangePrizes(),true);
 app.changePrizeAmount({matches:()=>true,dataset:{prizeKey:'encouragement'},value:'300.000'});assert.equal(app.PRIZES[0].amount,300000);assert.equal(f.el('#totalPrizeValue').textContent,'');
 for(let i=0;i<13;i++){
  app.startRound();app.startRound();assert.equal(app.canChangePrizes(),false);assert.equal(app.state.pending.length,f.E.BATCHES[i].count);
  app.changePrizeAmount({matches:()=>true,dataset:{prizeKey:'encouragement'},value:'1'});assert.equal(app.PRIZES[0].amount,300000);
  f.advance(9999);app.drawTick();assert.equal(app.state.running,true);f.advance(1);app.drawTick();app.finishRound();
  assert.equal(app.state.completed.length,i+1);assert.equal(app.state.phase,'REVEAL');assert.equal((f.el('#revealGrid').innerHTML.match(/class="reveal-person"/g)||[]).length,f.E.BATCHES[i].count);
  assert.doesNotMatch(f.el('#revealGrid').innerHTML,/department|CCCD/);
  if(i===4){assert.equal(f.el('#revealNext').textContent,'Chuẩn bị quay Giải tư');assert.equal(f.el('#drawBtnText').textContent,'Chuẩn bị quay Giải tư')}
  if(i<5)assert.equal(f.el('#revealBatch').textContent,`LƯỢT ${i+1}/5`);
  app.hideReveal();assert.equal(app.state.phase,'WAITING_NEXT_BATCH');app.nextRound();
 }
 assert.equal(app.state.phase,'COMPLETED');const rows=app.resultRows();assert.equal(rows.length,45);assert.deepEqual(plain(rows[0].slice(0,5)),['STT','Hạng giải','Lượt trong hạng','Lượt toàn chương trình','Giá trị giải (VNĐ)']);assert.equal(rows[1][4],300000);assert.equal(rows.at(-1)[3],13);
 const audit=app.auditPayload();assert.equal(audit.version,'2.6.0');assert.equal(audit.rules.configurationId,'dynamic-v1');assert.equal(audit.rounds.length,13);assert.equal(audit.rounds[0].amountPerWinnerVND,300000);assert.equal(audit.rules.drawDurationSeconds,10);assert.equal(audit.rounds[0].winners[0].prizeAmountVND,300000);assert.equal(audit.rounds[0].winners[0].batchNumber,1);
});
test('integrated refresh in progress/after reveal and old v2.3 protection',async()=>{
 const f=fixture();await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'TEST','Test');f.app.startRound();const pending=plain(f.app.state.pending);const raw=f.storage.get('lucky-draw-quyet-thang-2011-v4-tab-session');
 const g=fixture();g.storage.set('lucky-draw-quyet-thang-2011-v4-tab-session',raw);assert.equal(g.app.restoreSession(),true);assert.deepEqual(plain(g.app.state.pending),pending);g.advance(10000);g.app.drawTick();assert.deepEqual(plain(g.app.state.completed[0].winners),pending);
 const h=fixture();h.storage.set('lucky-draw-quyet-thang-2011-v4-tab-session',g.storage.get('lucky-draw-quyet-thang-2011-v4-tab-session'));assert.equal(h.app.restoreSession(),true);assert.equal(h.app.state.phase,'REVEAL');
 const old=fixture();old.storage.set('lucky-draw-quyet-thang-2011-v3-tab-session','{}');old.app.restoreSession();assert.equal(old.app.state.recoveryBlocked,true);assert.equal(old.app.canStart(),false);
});
test('Excel export produces a real OOXML ZIP with batch/amount columns and literal text cells',async()=>{
 const f=fixture(),rows=[['Hạng giải','Lượt','Giá trị','Mã nhân viên','Họ tên'],['Giải tư',2,500000,'TEST1','=SYNTHETIC()']];
 const blob=await f.context.ExcelLocal.makeXlsx(rows,'synthetic.xlsx','Test');const zip=await f.context.JSZip.loadAsync(await blob.arrayBuffer());const sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');assert.match(sheet,/Lượt/);assert.match(sheet,/<v>500000<\/v>/);assert.match(sheet,/t="inlineStr"><is><t xml:space="preserve">=SYNTHETIC\(\)/);assert.ok(zip.file('[Content_Types].xml'));
});
test('prize amount boundaries reject invalid and unsafe input',()=>{
 const {app}=fixture();for(const value of ['-1','abc','1e3','100000000001',''])assert.equal(app.parsePrizeAmount(value),null);assert.equal(app.parsePrizeAmount('1.500.000'),1500000);assert.equal(app.parsePrizeAmount('0'),0);
});
test('audio controls are independent; countdown voices stop on toggle and completion',async()=>{
 const f=fixture();let stopped=0,oscillators=0;
 f.context.AudioContext=class{constructor(){this.currentTime=0;this.state='running';this.destination={}}createOscillator(){oscillators++;return {frequency:{setValueAtTime(){}},connect(){},start(){},stop(){stopped++}}}createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}},connect(){}}}};
 f.app.bind();await f.el('#musicBtn').events.click({});assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.state.soundEnabled,true);
 await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'TEST','Test');f.app.startRound();assert.ok(oscillators>0);assert.ok(f.app.state.audioNodes.size>0);
 const before=stopped;await f.el('#soundBtn').events.click({});assert.equal(f.app.state.soundEnabled,false);assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.state.audioNodes.size,0);assert.ok(stopped>before);
 await f.el('#musicBtn').events.click({});assert.equal(f.app.state.musicEnabled,false);assert.equal(f.app.state.musicTimer,null);
 await f.el('#soundBtn').events.click({});f.advance(7000);f.app.drawTick();assert.equal(f.app.state.audioNodes.size,2);f.advance(3000);f.app.drawTick();assert.equal(f.app.state.audioNodes.size,0);
});
test('CCCD-only roster never exposes national ID on winner cards',async()=>{
 const f=fixture();const rows=[['CCCD','Họ tên'],...Array.from({length:44},(_,i)=>[String(i).padStart(12,'0'),'Người giả lập '+i])];await f.app.loadCustomers(rows,'TEST','Test');f.app.startRound();f.advance(10000);f.app.drawTick();const cards=f.el('#revealGrid').innerHTML;assert.match(cards,/NV-\d{5}/);assert.doesNotMatch(cards,/\d{12}/);
});
test('an imported list below 44 safely restores but cannot draw',()=>{const f=fixture(),s=ready(f);s.people=s.people.slice(0,20);const r=f.E.restore(f.E.snapshot(s));assert.equal(r.people.length,20);assert.equal(f.E.canStart(r),false)});
test('drag-and-drop import binding accepts a synthetic CSV and validates file size',async()=>{
 const f=fixture();f.app.bind();let prevented=0;const csv=['Mã nhân viên,Họ tên',...people().map(p=>p.code+','+p.name)].join('\n');const file={name:'synthetic.csv',size:csv.length,text:async()=>csv};
 f.el('#dropZone').events.drop({preventDefault(){prevented++},stopPropagation(){},dataTransfer:{files:[file]}});
 await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));assert.equal(prevented,1);assert.equal(f.app.state.people.length,120);
 await assert.rejects(f.context.ExcelLocal.parseFile({name:'large.xlsx',size:16*1024*1024}),/15MB/);
});

test('previous batch configuration is blocked and preserved for local backup',()=>{
 const f=fixture(),s=ready(f);f.E.begin(s,200000,persist,f.now());const old=plain(f.E.snapshot(s));delete old.configId;old.pending=old.pending.slice(0,5);
 assert.throws(()=>f.E.restore(old),/Phiên dùng cơ cấu cũ chưa hỗ trợ/);
 const raw=JSON.stringify(old),key='lucky-draw-quyet-thang-2011-v4-tab-session';f.storage.set(key,raw);assert.equal(f.app.restoreSession(),false);assert.equal(f.app.state.recoveryBlocked,true);assert.equal(f.app.canStart(),false);assert.equal(f.storage.get(key),raw);assert.equal(f.el('#legacySessionBtn').textContent,'↓ Xuất phiên cấu hình cũ');
});
test('new configuration pending six winners restores identically at all 13 batch boundaries',()=>{
 const f=fixture(),{E}=f;let s=ready(f);
 for(let i=0;i<13;i++){
  E.begin(s,100+i,persist,f.now());const pending=plain(s.pending);s=E.restore(E.snapshot(s));assert.deepEqual(plain(s.pending),pending);assert.equal(s.pending.length,E.BATCHES[i].count);
  f.advance(10000);E.finish(s,persist,f.now());s=E.restore(E.snapshot(s));E.next(s,persist);s=E.restore(E.snapshot(s));
 }
 assert.equal(s.completed.length,13);assert.equal(s.completed.flatMap(r=>r.winners).length,44);assert.equal(s.phase,'COMPLETED');
});

// v2.6 event/theme tests use the same real bundled modules/controller as the draw regressions.
test('v2.6: all three presets default to corporate without sharing event content',()=>{
 const {P}=fixture();assert.equal(P.PRESETS.length,3);
 for(const preset of P.PRESETS){const e=P.createEvent(preset.id,'event-'+preset.id);assert.equal(e.appearance.themeId,'quyet-thang-corporate');assert.equal(e.content.title,preset.content.title)}
 const year=P.createEvent('year-end','year');assert.match(year.content.title,/YEAR END PARTY/);assert.doesNotMatch(JSON.stringify(year.content),/20\/11|NHÀ GIÁO|THẦY CÔ|tri thức/i);
 const custom=P.createEvent('custom','custom');assert.doesNotMatch(JSON.stringify(custom.content),/20\/11|NHÀ GIÁO/i);
});
test('v2.6: exactly seven distinct selectable theme IDs and corporate brand palette',()=>{
 const {P}=fixture();assert.equal(P.THEMES.length,7);assert.equal(new Set(P.THEMES.map(t=>t.id)).size,7);assert.ok(P.validTheme('lotus'));
 const corporate=P.THEMES.find(t=>t.id===P.DEFAULT_THEME_ID);assert.equal(corporate.name,'Sắc Màu Quyết Thắng');assert.equal(corporate.primary,'#2E7BC3');assert.equal(corporate.secondary,'#F2363F');assert.equal(corporate.bg,'#0D1B3D');
 for(const t of P.THEMES)for(const k of ['bg','primary','secondary','highlight','ink','muted'])assert.match(t[k],/^#[0-9A-F]{6}$/i);
});
test('v2.6: missing/invalid saved themes normalize to default without dropping fields',()=>{
 const {P}=fixture();
 for(const appearance of [undefined,{}, {themeId:'unknown',fontScale:1.2}]){
  const e=P.normalize({id:'test',presetId:'custom',content:{title:'MY EVENT'},appearance,ownerNote:'preserve'});assert.equal(e.appearance.themeId,P.DEFAULT_THEME_ID);assert.equal(e.content.title,'MY EVENT');assert.equal(e.ownerNote,'preserve');if(appearance?.fontScale)assert.equal(e.appearance.fontScale,1.2);
 }
});
test('v2.6: every valid saved theme including lotus survives normalization, save and reload',()=>{
 const {P,context}=fixture();
 for(const theme of P.THEMES){let catalog=P.initialCatalog();const event=P.createEvent('year-end','test',{appearance:{themeId:theme.id,fontScale:1.1}});catalog=P.addEvent(catalog,event);P.saveCatalog(context.sessionStorage,catalog);const restored=P.loadCatalog(context.sessionStorage);assert.equal(restored.events.at(-1).appearance.themeId,theme.id);assert.equal(restored.events.at(-1).appearance.fontScale,1.1)}
});
test('v2.6: changing preset preserves theme; changing theme preserves complete content',()=>{
 const {P}=fixture();
 for(const theme of P.THEMES)for(const preset of P.PRESETS){let e=P.createEvent('custom','test',{appearance:{themeId:theme.id}});e=P.changePreset(e,preset.id);assert.equal(e.appearance.themeId,theme.id);const before=plain(e.content);e=P.changeTheme(e,'quyet-thang-corporate');assert.deepEqual(plain(e.content),before)}
});
test('v2.6: metadata stays isolated per event and contains no roster/results',()=>{
 const {P,context}=fixture();let catalog=P.addEvent(P.initialCatalog(),P.createEvent('year-end','year'));const old=plain(catalog.events[0]);catalog=P.replaceEvent(catalog,P.changeTheme(catalog.events[1],'lotus'));P.saveCatalog(context.sessionStorage,catalog);const restored=P.loadCatalog(context.sessionStorage);assert.deepEqual(plain(restored.events[0]),old);assert.equal(restored.events[1].appearance.themeId,'lotus');assert.doesNotMatch(JSON.stringify(restored),/"people"|"pending"|"completed"|"cccd"/);
});
test('v2.6: controller selector identifies default separately from active saved theme',()=>{
 const f=fixture();f.app.initEvents();assert.equal(f.el('#themeSelect').value,'quyet-thang-corporate');assert.match(f.el('#themeSelect').innerHTML,/Sắc Màu Quyết Thắng — Mặc định/);assert.equal((f.el('#themeSelect').innerHTML.match(/<option/g)||[]).length,7);
 f.app.changeEventTheme('lotus');assert.equal(f.el('#themeSelect').value,'lotus');assert.match(f.el('#themeSelect').innerHTML,/Sắc Màu Quyết Thắng — Mặc định/);
});
test('v2.6: theme saved even before importing employees and restored on reload',()=>{
 const f=fixture();f.app.initEvents();for(const t of f.P.THEMES){assert.equal(f.app.changeEventTheme(t.id),true);const g=fixture();for(const [k,v] of f.storage)g.storage.set(k,v);g.app.initEvents();assert.equal(g.app.getEvent().appearance.themeId,t.id);assert.equal(g.el('#appShell').dataset.theme,t.id);assert.equal(g.app.state.people.length,0)}
});
test('v2.6: switching themes during a draw leaves selected winners, timer, prices and audio unchanged',async()=>{
 const f=fixture();f.app.initEvents();await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC','Test');f.app.startRound();
 const before=plain(f.E.snapshot(f.app.state)),deadline=f.app.state.deadline,prices=plain(f.app.PRIZES),content=plain(f.app.getEvent().content);f.app.state.musicEnabled=true;f.app.state.soundEnabled=false;
 for(const t of f.P.THEMES){assert.equal(f.app.changeEventTheme(t.id),true);assert.deepEqual(plain(f.E.snapshot(f.app.state)),before);assert.equal(f.app.state.deadline,deadline);assert.deepEqual(plain(f.app.PRIZES),prices);assert.deepEqual(plain(f.app.getEvent().content),content);assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.state.soundEnabled,false)}
 assert.equal(f.app.createNewEvent('custom'),false);assert.equal(f.app.selectPreset('year-end'),false);assert.equal(f.app.switchEvent('legacy-event'),false);
});
test('v2.6: controller new events default to corporate and preserve their individual chosen themes',()=>{
 const f=fixture();f.app.initEvents();f.app.changeEventTheme('lotus');const first=f.app.getEvent().id;
 assert.equal(f.app.createNewEvent('year-end'),true);const second=f.app.getEvent().id;assert.notEqual(first,second);assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate');assert.match(f.el('#eventHeading').textContent,/YEAR END PARTY/);f.app.changeEventTheme('ocean');f.app.selectPreset('teachers-day');assert.equal(f.app.getEvent().appearance.themeId,'ocean');f.app.selectPreset('year-end');
 assert.equal(f.app.switchEvent(first),true);assert.equal(f.app.getEvent().appearance.themeId,'lotus');assert.equal(f.app.switchEvent(second),true);assert.equal(f.app.getEvent().appearance.themeId,'ocean');
 for(const preset of ['teachers-day','custom']){assert.equal(f.app.createNewEvent(preset),true);assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate')}
});
test('v2.6: event-specific runtime and price settings survive switching independently',async()=>{
 const f=fixture();f.app.initEvents();const first=f.app.getEvent().id;await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC','Test');f.app.changePrizeAmount({matches:()=>true,dataset:{prizeKey:'encouragement'},value:'300000'});f.app.startRound();f.advance(10000);f.app.drawTick();const original=plain(f.app.state.completed);
 assert.equal(f.app.createNewEvent('year-end'),true);assert.equal(f.app.state.people.length,0);assert.equal(f.app.PRIZES[0].amount,200000);assert.equal(f.app.switchEvent(first),true);assert.equal(f.app.PRIZES[0].amount,300000);assert.deepEqual(plain(f.app.state.completed),original);assert.equal(f.app.canChangePrizes(),false);
});
test('v2.6: Year End content stays independent in stage, reveal, completion and audit',async()=>{
 const f=fixture();f.app.initEvents();f.app.selectPreset('year-end');
 for(const id of ['eventHeading','eventKicker','eventOccasion','revealOccasion','brandEventType'])assert.doesNotMatch(f.el('#'+id).textContent,/20\/11|NHÀ GIÁO|THẦY CÔ/i);
 await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC','Test');
 for(let i=0;i<13;i++){f.app.startRound();f.advance(10000);f.app.drawTick();f.app.nextRound()}
 assert.doesNotMatch(f.el('#currentPrizeTitle').textContent+' '+f.el('#currentPrizeCount').textContent,/NHÀ GIÁO|THẦY CÔ|tri thức/i);assert.doesNotMatch(f.app.auditPayload().app+f.app.auditPayload().eventName,/20\/11|NHÀ GIÁO/i);assert.equal(f.app.auditPayload().appearance.themeId,'quyet-thang-corporate');assert.equal(f.app.resultRows().length,45);
});
test('v2.6: storage failure rolls theme back without losing draw state',()=>{
 const f=fixture();f.app.initEvents();const old=plain(f.app.getEvent());f.context.sessionStorage.setItem=()=>{throw Error('quota')};assert.equal(f.app.changeEventTheme('lotus'),false);assert.deepEqual(plain(f.app.getEvent()),old);assert.equal(f.el('#themeSelect').value,'quyet-thang-corporate');
});
test('v2.6: corrupted catalog fails closed without overwriting saved data',()=>{
 const f=fixture(),raw='{"version":1,"events":[]}';f.storage.set(f.P.CATALOG_KEY,raw);f.app.initEvents();assert.equal(f.app.state.recoveryBlocked,true);assert.equal(f.app.changeEventTheme('lotus'),false);assert.equal(f.storage.get(f.P.CATALOG_KEY),raw);
});
test('v2.6: concurrent catalog edits are rejected rather than deleting another event',()=>{
 const f=fixture();f.app.initEvents();const external=f.P.addEvent(f.app.getCatalog(),f.P.createEvent('custom','other-tab'));f.storage.set(f.P.CATALOG_KEY,JSON.stringify(external));assert.equal(f.app.changeEventTheme('lotus'),false);assert.equal(JSON.parse(f.storage.get(f.P.CATALOG_KEY)).events.length,2);
});
test('v2.6: new-event preset picker never changes the current event',async()=>{
 const f=fixture();f.app.initEvents();f.app.bind();const before=plain(f.app.getEvent());f.el('#newEventPreset').value='year-end';assert.deepEqual(plain(f.app.getEvent()),before);await f.el('#createEventBtn').events.click({});assert.equal(f.app.getEvent().presetId,'year-end');assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate');assert.deepEqual(plain(f.app.getCatalog().events.find(e=>e.id===before.id)),before);
});
test('v2.6: compatible pre-platform v2.4 pending draw and custom title restore without reselection',()=>{
 const f=fixture(),s=ready(f);f.E.begin(s,250000,persist,f.now());const raw={...plain(f.E.snapshot(s)),eventName:'SỰ KIỆN ĐÃ LƯU'};f.storage.set('lucky-draw-quyet-thang-2011-v4-tab-session',JSON.stringify(raw));f.app.initEvents();assert.equal(f.app.restoreSession(),true);assert.deepEqual(plain(f.app.state.pending),plain(s.pending));assert.equal(f.app.state.roundEndsAt,s.roundEndsAt);assert.equal(f.app.getEvent().content.title,'SỰ KIỆN ĐÃ LƯU');assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate');
});
test('v2.6: changing themes after reveal preserves the exact completed records and Excel rows',async()=>{
 const f=fixture();f.app.initEvents();await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC','Test');f.app.startRound();f.advance(10000);f.app.drawTick();const completed=plain(f.app.state.completed),rows=plain(f.app.resultRows());for(const t of f.P.THEMES){f.app.changeEventTheme(t.id);assert.deepEqual(plain(f.app.state.completed),completed);assert.deepEqual(plain(f.app.resultRows()),rows);assert.equal(f.app.state.phase,'REVEAL')}
});

function publicConfig(f,revision=1,{theme='quyet-thang-corporate',amount=200000,title='PUBLIC TEST EVENT'}={}){
 const draft=f.S.createDraft(f.P.createEvent('custom','shared-test',{content:{title},appearance:{themeId:theme}}),{amounts:{encouragement:amount},baseRevision:revision-1});
 draft.publication={state:'published',revision,baseRevision:revision-1,publishedAt:'2026-11-20T12:00:00.000Z'};return plain(f.S.validate(draft,{publishedOnly:true}));
}
function responseFor(config){return {ok:true,status:200,headers:{get:k=>k==='content-type'?'application/json':null},text:async()=>JSON.stringify(config)}}
async function onlineShared(f,config){f.app.initEvents();f.context.location={href:'https://example.test/app/'};f.context.fetch=async()=>responseFor(config);await f.app.initializeSharedConfiguration()}
async function importPeople(f){await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC','Test')}

test('shared: first online load uses the published configuration rather than local draft settings',async()=>{
 const f=fixture(),config=publicConfig(f,1,{theme:'ocean',amount:350000});await onlineShared(f,config);assert.equal(f.app.getSharedState().mode,'published');assert.equal(f.app.getSharedState().ready,true);assert.equal(f.app.getEvent().appearance.themeId,'ocean');assert.equal(f.app.PRIZES[0].amount,350000);assert.equal(f.app.canChangePrizes(),false);assert.match(f.el('#sharedVersion').textContent,/v1/);assert.match(f.el('#sharedVersion').textContent,/2026-11-20/);
});
test('shared: independent devices load identical public settings but never share employees or winners',async()=>{
 const a=fixture(),b=fixture(),config=publicConfig(a,1,{theme:'lotus'});await onlineShared(a,config);await onlineShared(b,config);assert.deepEqual(plain(a.app.configurationForCurrent()),plain(b.app.configurationForCurrent()));await importPeople(a);a.app.startRound();assert.equal(a.app.state.pending.length,6);assert.equal(b.app.state.people.length,0);assert.equal(b.app.state.pending.length,0);assert.equal(b.app.state.completed.length,0);
});
test('shared: network request is anonymous, cache bypassed and GET-only to same-origin configuration',async()=>{
 const f=fixture(),config=publicConfig(f);f.app.initEvents();let call;f.context.location={href:'https://example.test/project/'};f.context.fetch=async(url,options)=>{call={url,options};return responseFor(config)};await f.app.initializeSharedConfiguration();assert.match(call.url,/^https:\/\/example\.test\/project\/config\/published\.json\?t=/);assert.equal(call.options.credentials,'omit');assert.equal(call.options.cache,'no-store');assert.equal(call.options.redirect,'error');assert.equal(call.options.method,undefined);assert.equal(call.options.body,undefined);
});
test('shared: opening online always checks a newer publication, not the cached local draft',async()=>{
 const a=fixture(),first=publicConfig(a);await onlineShared(a,first);const b=fixture();for(const [k,v] of a.storage)b.storage.set(k,v);const next=publicConfig(b,2,{theme:'crimson',amount:400000});await onlineShared(b,next);assert.equal(b.app.getSharedState().applied.publication.revision,2);assert.equal(b.app.PRIZES[0].amount,400000);assert.equal(b.app.getEvent().appearance.themeId,'crimson');
});
test('shared: pre-start publication update applies consistently without generating winners',async()=>{
 const f=fixture();await onlineShared(f,publicConfig(f));await importPeople(f);f.app.receivePublication(publicConfig(f,2,{amount:300000}));assert.equal(f.app.PRIZES[0].amount,300000);assert.equal(f.app.state.people.length,120);assert.equal(f.app.state.pending.length,0);assert.equal(f.app.state.running,false);
});
test('shared: active-session critical settings stay frozen across remote updates and later batches',async()=>{
 const f=fixture();await onlineShared(f,publicConfig(f));await importPeople(f);f.app.startRound();const ids=plain(f.app.state.pending),deadline=f.app.state.deadline;f.app.receivePublication(publicConfig(f,2,{amount:900000,theme:'lotus'}));assert.equal(f.app.PRIZES[0].amount,200000);assert.deepEqual(plain(f.app.state.pending),ids);assert.equal(f.app.state.deadline,deadline);assert.equal(f.app.getSharedState().frozen.publication.revision,1);assert.equal(f.app.getSharedState().latest.publication.revision,2);assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate');f.advance(10000);f.app.drawTick();f.app.nextRound();f.app.startRound();assert.equal(f.app.state.pendingAmount,200000);assert.equal(f.app.getSharedState().frozen.publication.revision,1);
});
test('shared: page reload resumes identical frozen winners even if published config changes',async()=>{
 const f=fixture();await onlineShared(f,publicConfig(f));await importPeople(f);f.app.startRound();const ids=plain(f.app.state.pending);const g=fixture();for(const [k,v] of f.storage)g.storage.set(k,v);g.app.initEvents();assert.equal(g.app.loadSharedPointer(),true);assert.equal(g.app.restoreSession(),true);g.context.location={href:'https://example.test/'};g.context.fetch=async()=>responseFor(publicConfig(g,2,{amount:999999}));await g.app.initializeSharedConfiguration();assert.deepEqual(plain(g.app.state.pending),ids);assert.equal(g.app.PRIZES[0].amount,200000);assert.equal(g.app.getSharedState().frozen.publication.revision,1);g.advance(10000);g.app.drawTick();assert.deepEqual(plain(g.app.state.completed[0].winners),ids);
});
test('shared: newest publication becomes usable only after explicit session reset',async()=>{
 const f=fixture();await onlineShared(f,publicConfig(f));await importPeople(f);f.app.startRound();f.advance(10000);f.app.drawTick();f.app.receivePublication(publicConfig(f,2,{amount:500000}));f.app.reset();assert.equal(f.app.state.people.length,0);assert.equal(f.app.state.completed.length,0);assert.equal(f.app.getSharedState().frozen,null);assert.equal(f.app.getSharedState().applied.publication.revision,2);assert.equal(f.app.PRIZES[0].amount,500000);
});
test('shared: unavailable network blocks first-time published draws, never silently uses draft/cache',async()=>{
 const f=fixture();f.app.initEvents();await importPeople(f);f.context.location={href:'https://example.test/'};f.context.fetch=async()=>{throw Error('offline')};await f.app.initializeSharedConfiguration();assert.equal(f.app.getSharedState().ready,false);assert.equal(f.app.canStart(),false);assert.equal(f.app.getSharedState().mode,'published');assert.equal(f.app.useLocalDraft(),true);assert.equal(f.app.getSharedState().mode,'draft');
});
test('shared: invalid server JSON and unsupported schema block application safely',async()=>{
 for(const invalid of ['not json',JSON.stringify({...publicConfig(fixture()),schemaVersion:99})]){const f=fixture();f.app.initEvents();f.context.location={href:'https://example.test/'};f.context.fetch=async()=>({ok:true,headers:{get:()=> 'application/json'},text:async()=>invalid});await f.app.initializeSharedConfiguration();assert.equal(f.app.getSharedState().ready,false);assert.equal(f.app.canStart(),false);assert.equal(f.app.state.pending.length,0)}
});
test('shared: explicit downloaded backup is validated, previewed and usable without network',async()=>{
 const f=fixture(),config=publicConfig(f,1,{theme:'emerald'});f.app.initEvents();const raw=JSON.stringify(config);assert.equal(await f.app.importConfigurationFile({size:raw.length,text:async()=>raw}),true);assert.equal(f.app.getSharedState().mode,'draft');assert.equal(f.app.applyPreviewConfiguration(),true);assert.equal(f.app.getSharedState().mode,'offline');assert.equal(f.app.getEvent().appearance.themeId,'emerald');assert.equal(f.app.getSharedState().ready,true);assert.match(f.el('#sharedVersion').textContent,/2026-11-20/);await importPeople(f);assert.equal(f.app.canStart(),true);
});
test('shared: explicit offline backup survives a reload without using an implicit network cache',async()=>{
 const f=fixture(),config=publicConfig(f);f.app.initEvents();f.app.applyPublicConfiguration(config,'offline');await importPeople(f);const g=fixture();for(const [k,v] of f.storage)g.storage.set(k,v);g.app.initEvents();assert.equal(g.app.loadSharedPointer(),true);g.app.restoreSession();g.context.location={href:'file:///offline/index.html'};await g.app.initializeSharedConfiguration();assert.equal(g.app.getSharedState().mode,'offline');assert.equal(g.app.getSharedState().ready,true);assert.equal(g.app.canStart(),true);
});
test('shared: cache alone is never treated as an explicitly imported offline backup',async()=>{
 const f=fixture();f.storage.set('lucky-publication-last-seen-v1',JSON.stringify(publicConfig(f)));f.app.initEvents();f.context.location={href:'https://example.test/'};f.context.fetch=async()=>{throw Error('offline')};await f.app.initializeSharedConfiguration();assert.equal(f.app.getSharedState().ready,false);assert.notEqual(f.app.getSharedState().mode,'offline');
});
test('shared: stale revision and same-version content mismatch are rejected',()=>{
 const f=fixture(),a=publicConfig(f,2),old=publicConfig(f,1),collision=publicConfig(f,2,{theme:'lotus'});assert.throws(()=>f.S.comparePublication(old,a),/cũ hơn/);assert.throws(()=>f.S.comparePublication(collision,a),/cùng số phiên bản/);assert.equal(f.S.comparePublication(a,a),'same');
});
test('shared: strict schema rejects rosters, results, credentials and private identifiers instead of stripping them',()=>{
 const f=fixture(),config=publicConfig(f);
 for(const key of ['people','winners','cccd','sessions','token','password']){const bad=plain(config);bad[key]=[];assert.throws(()=>f.S.validate(bad))}
 const nested=plain(config);nested.event.appearance.winners=[];assert.throws(()=>f.S.validate(nested));
 const id=plain(config);id.event.content.title='SYNTHETIC '+ '0'.repeat(12);assert.throws(()=>f.S.validate(id));
 const hiddenId=plain(config);hiddenId.event.id='0'.repeat(12);assert.throws(()=>f.S.validate(hiddenId));
});
test('shared: approved batch allocation, 10-second duration, logo and media references cannot be overridden',()=>{
 const f=fixture(),config=publicConfig(f);
 for(const mutate of [c=>c.draw.durationMs=5000,c=>c.draw.prizes[0].batchSize=5,c=>c.draw.prizes[1].count=9,c=>c.event.appearance.themeId='unknown',c=>c.event.appearance.logo={kind:'url',id:'https://bad.test/'},c=>c.audio.music={kind:'url',id:'https://bad.test/'},c=>c.event.appearance.background={kind:'image',url:'https://bad.test/'},c=>c.audio.musicEnabled='true']){const bad=plain(config);mutate(bad);assert.throws(()=>f.S.validate(bad))}
});
test('shared: draft creation defaults corporate and exports no session data, even after winners exist',async()=>{
 const f=fixture();f.app.initEvents();await importPeople(f);f.app.startRound();f.advance(10000);f.app.drawTick();const config=f.app.configurationForCurrent();assert.equal(config.event.appearance.themeId,'quyet-thang-corporate');assert.equal(config.publication.state,'draft');assert.doesNotMatch(JSON.stringify(config),/"people"|"winners"|"cccd"|"pending"|Nhân viên giả lập/);assert.equal(config.draw.prizes[0].count,30);
});
test('shared: importing a draft creates a new local event and never publishes or overwrites another draft',async()=>{
 const f=fixture();f.app.initEvents();const old=plain(f.app.getEvent());const draft=f.S.createDraft(f.P.createEvent('year-end','import-proposal',{appearance:{themeId:'lotus',background:{kind:'solid',color:'#112233'}}}),{amounts:{encouragement:450000},audio:{countdownEnabled:false,musicEnabled:true}});const raw=JSON.stringify(draft);await f.app.importConfigurationFile({size:raw.length,text:async()=>raw});assert.equal(f.app.applyPreviewConfiguration(),true);assert.notEqual(f.app.getEvent().id,'import-proposal');assert.deepEqual(plain(f.app.getCatalog().events.find(e=>e.id===old.id)),old);assert.equal(f.app.getSharedState().mode,'draft');assert.equal(f.app.PRIZES[0].amount,450000);assert.equal(f.app.state.soundEnabled,false);assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.getEvent().appearance.background.color,'#112233');
});
test('shared: an active session refuses imported backup/draft and keeps frozen settings',async()=>{
 const f=fixture();await onlineShared(f,publicConfig(f));await importPeople(f);f.app.startRound();const before=plain(f.E.snapshot(f.app.state));const config=publicConfig(f,2,{amount:700000});const raw=JSON.stringify(config);await f.app.importConfigurationFile({size:raw.length,text:async()=>raw});assert.equal(f.app.applyPreviewConfiguration(),false);assert.equal(f.app.useLocalDraft(),false);assert.deepEqual(plain(f.E.snapshot(f.app.state)),before);
});
test('shared: unsupported or oversized backup cannot become active',async()=>{
 const f=fixture();f.app.initEvents();assert.equal(await f.app.importConfigurationFile({size:40000,text:async()=> '{}'}),false);const raw=JSON.stringify({...publicConfig(f),schemaVersion:999});assert.equal(await f.app.importConfigurationFile({size:raw.length,text:async()=>raw}),false);assert.equal(f.app.getSharedState().mode,'draft');
});
test('shared: frozen configuration is immutable and mismatched session amounts fail closed',()=>{
 const f=fixture(),config=publicConfig(f),frozen=f.S.freeze(config);assert.ok(Object.isFrozen(frozen));assert.ok(Object.isFrozen(frozen.draw.prizes[0]));const s=ready(f);f.E.begin(s,200000,()=>{},f.now());const snapshot={...plain(f.E.snapshot(s)),eventId:config.event.id,prizeAmounts:Object.fromEntries(config.draw.prizes.map(p=>[p.key,p.amount]))};assert.equal(f.S.assertSnapshot(snapshot,frozen),true);snapshot.prizeAmounts.encouragement=1;assert.throws(()=>f.S.assertSnapshot(snapshot,frozen));
});
test('shared: public fetch rejects HTTP errors, HTML responses and oversized payloads',async()=>{
 const f=fixture();await assert.rejects(f.S.fetchPublished(async()=>({ok:false,status:404}),'https://example.test/config'),/404/);await assert.rejects(f.S.fetchPublished(async()=>({ok:true,headers:{get:()=> 'text/html'}}),'https://example.test/config'),/JSON/);await assert.rejects(f.S.fetchPublished(async()=>({ok:true,headers:{get:k=>k==='content-type'?'application/json':'40000'}}),'https://example.test/config'),/quá lớn/);
});
test('shared: publication preparation enforces stale-base protection and monotonically increasing versions',()=>{
 const f=fixture(),current=publicConfig(f,3);const draft=f.S.createDraft(current.event,{baseRevision:3});const next=f.S.preparePublication(draft,current,'2026-11-20T13:00:00.000Z');assert.equal(next.publication.revision,4);assert.equal(next.publication.baseRevision,3);assert.equal(next.publication.state,'published');draft.publication.baseRevision=2;assert.throws(()=>f.S.preparePublication(draft,current,'2026-11-20T13:00:00.000Z'));
});
test('shared: switching to local draft while fetch is pending discards late remote response',async()=>{
 const f=fixture();f.app.initEvents();f.context.location={href:'https://example.test/'};let resolve;f.context.fetch=()=>new Promise(r=>{resolve=r});const request=f.app.initializeSharedConfiguration();assert.equal(f.app.useLocalDraft(),true);resolve(responseFor(publicConfig(f,1,{theme:'lotus'})));await request;assert.equal(f.app.getSharedState().mode,'draft');assert.equal(f.app.getEvent().appearance.themeId,'quyet-thang-corporate');
});

test('cloud visual overrides change all seven themes without touching an active draw or its stored snapshot',async()=>{
 const f=fixture();f.app.initEvents();await importPeople(f);f.app.startRound();
 const before=JSON.stringify(f.app.state),storage=JSON.stringify([...f.storage]),prizes=JSON.stringify(f.app.PRIZES),event=JSON.stringify(f.app.getEvent());
 for(const theme of f.P.THEMES){
  f.context.LUCKYDRAW_SHARED_THEME_OVERRIDE=theme.id;f.app.renderEventControls();
  assert.equal(f.el('#appShell').dataset.theme,theme.id);
  assert.equal(JSON.stringify(f.app.state),before);assert.equal(JSON.stringify([...f.storage]),storage);
  assert.equal(JSON.stringify(f.app.PRIZES),prizes);assert.equal(JSON.stringify(f.app.getEvent()),event);
 }
 f.context.LUCKYDRAW_SHARED_THEME_OVERRIDE='invalid';f.app.renderEventControls();assert.equal(f.el('#appShell').dataset.theme,f.app.getEvent().appearance.themeId);
 f.advance(10000);f.app.drawTick();assert.equal(f.app.state.completed[0].winners.length,6);assert.equal(f.app.state.running,false);
});

test('full shared settings defer critical changes during a draw and apply them only after explicit session reset',async()=>{
 const f=fixture();f.app.initEvents();await importPeople(f);f.app.startRound();
 const pending=plain(f.app.state.pending),deadline=f.app.state.roundEndsAt,oldAmounts=plain(f.app.PRIZES.map(p=>p.amount));
 const source=JSON.parse(fs.readFileSync(new URL('../config/published.json',`file://${__filename}`),'utf8'));
 const settings=f.context.EventSettings.migrate(source);settings.event.appearance.themeId='emerald';settings.draw.prizes[0].name='Giải tri ân';settings.draw.prizes[0].amount=333000;
 assert.equal(f.context.LuckyDrawSettingsBridge.apply(settings,{revision:3,updatedAt:'2026-11-21T00:00:00.000Z'}).deferred,true);
 assert.deepEqual(plain(f.app.state.pending),pending);assert.equal(f.app.state.roundEndsAt,deadline);assert.deepEqual(plain(f.app.PRIZES.map(p=>p.amount)),oldAmounts);
 assert.equal(f.el('#appShell').dataset.theme,'emerald');f.advance(10000);f.app.drawTick();assert.deepEqual(plain(f.app.state.completed[0].winners),pending);
 f.context.ProgramSettingsActive=true;f.app.reset();assert.equal(f.app.PRIZES[0].amount,333000);assert.equal(f.app.PRIZES[0].name,'Giải tri ân');assert.equal(f.app.state.people.length,0);
});

test('mandatory guard refuses imports/draws/exports while locked; private state restores only for its UID',async()=>{
 const f=fixture(),M=require('../auth-guard.js');let uid='owner-A',permitted=true;
 f.context.LuckyDrawAccess={canOperate:()=>permitted,canAdmin:()=>permitted,sessionStorage:()=>M.scoped(f.context.sessionStorage,uid),localStorage:()=>M.scoped(f.context.sessionStorage,uid),snapshot:()=>({uid}),verify:async()=>permitted};
 f.context.LuckyDrawRuntime.unlock(uid);
 const source=JSON.parse(fs.readFileSync(new URL('../config/published.json',`file://${__filename}`),'utf8'));
 f.context.LuckyDrawSettingsBridge.apply(f.context.EventSettings.migrate(source),{revision:1,updatedAt:'2026-11-21T00:00:00.000Z'});
 await importPeople(f);f.app.startRound();const pending=plain(f.app.state.pending),deadline=f.app.state.roundEndsAt;assert.equal(pending.length,6);
 f.context.LuckyDrawRuntime.lock();assert.equal(f.app.state.people.length,0);assert.equal(f.el('#resultsPanel').innerHTML,'');
 permitted=false;assert.equal(await f.app.loadCustomers([['code','name']], 'private','private'),false);assert.throws(()=>f.app.resultRows());f.app.startRound();assert.equal(f.app.state.running,false);
 uid='owner-B';permitted=true;f.context.LuckyDrawRuntime.unlock(uid);assert.equal(f.app.state.people.length,0);assert.equal(f.app.state.completed.length,0);f.context.LuckyDrawRuntime.lock();
 uid='owner-A';f.context.LuckyDrawRuntime.unlock(uid);assert.deepEqual(plain(f.app.state.pending),pending);assert.equal(f.app.state.roundEndsAt,deadline);assert.equal(f.app.state.people.length,120);
});

test('integrated dynamic UI runs 13/5 remainder batches, freezes remote changes, restores exact results and exports handover',async()=>{
 const f=fixture();f.app.initEvents();const M=f.context.EventSettings;
 const settings=M.migrate(JSON.parse(fs.readFileSync('config/published.json','utf8')));
 settings.draw=f.E.fromPrizes([{key:'custom-tier',name:'Giải sự kiện riêng',count:13,batchSize:5,amount:765432,durationMs:3000}]);
 f.context.LuckyDrawSettingsBridge.apply(settings,{revision:1,updatedAt:'2026-11-21T00:00:00.000Z'});f.context.LuckyDrawSettingsBridge.ready(true);await importPeople(f);
 assert.equal(f.el('#sidebarAwarded').textContent,'0 / 13');assert.equal(f.el('#estimatedDuration').textContent,'9 giây');assert.equal(f.app.PRIZES.length,1);
 f.app.startRound();assert.equal(f.app.state.roundEndsAt-f.now(),3000);const pending=plain(f.app.state.pending);
 const changed=plain(settings);changed.draw=f.E.fromPrizes([{key:'different',name:'Giải mới',count:80,batchSize:10,amount:1,durationMs:10000}]);changed.event.appearance.themeId='lotus';
 assert.equal(f.context.LuckyDrawSettingsBridge.apply(changed,{revision:2,updatedAt:'2026-11-21T01:00:00.000Z'}).deferred,true);assert.equal(f.app.PRIZES[0].count,13);assert.deepEqual(plain(f.app.state.pending),pending);
 assert.equal(f.app.restoreSession(),true);assert.deepEqual(plain(f.app.state.pending),pending);f.advance(3000);f.app.drawTick();assert.equal(f.app.state.completed.length,1);
 f.app.nextRound();assert.equal(f.app.state.running,false);f.app.startRound();f.advance(3000);f.app.drawTick();f.app.nextRound();f.app.startRound();assert.equal(f.app.state.pending.length,3);f.advance(3000);f.app.drawTick();
 assert.equal(f.app.restoreSession(),true);const won=f.app.state.completed.flatMap(r=>r.winners);assert.equal(won.length,13);assert.equal(new Set(won.map(p=>p.id)).size,13);
 const report=f.context.AwardHandover.build(f.E.snapshot(f.app.state),settings.event);assert.equal(report.count,13);assert.equal(report.complete,true);assert.ok(report.sheets[0].rows.slice(4).every(r=>r[5]===765432));assert.equal(f.el('#totalPrizeValue').textContent,'');
});


test('unsaved dynamic previews cannot start a real session until server-confirmed save or discard',async()=>{
 const f=fixture();f.app.initEvents();const s=f.context.EventSettings.migrate(JSON.parse(fs.readFileSync('config/published.json','utf8')));
 f.context.LuckyDrawSettingsBridge.apply(s);f.context.LuckyDrawSettingsBridge.ready(true);await importPeople(f);assert.equal(f.app.canStart(),true);
 s.draw.prizes[0].count=13;f.context.LuckyDrawSettingsBridge.apply(s,{preview:true});f.context.LuckyDrawSettingsBridge.ready(true);assert.equal(f.app.canStart(),false);f.app.startRound();assert.equal(f.app.state.pending.length,0);
 f.context.LuckyDrawSettingsBridge.apply(s,{preview:false});f.context.LuckyDrawSettingsBridge.ready(true);assert.equal(f.app.canStart(),true);
});
