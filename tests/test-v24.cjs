'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(new URL('../index.html',`file://${__filename}`),'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function fixture(){
 let clock=1700000000000,interval=0;
 const storage=new Map(),els=new Map();
 function element(){const classes=new Set();return {events:{},appendChild(){},value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{setProperty(){}},classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},contains(x){return classes.has(x)},toggle(x,v){if(v??!classes.has(x))classes.add(x);else classes.delete(x)}},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.events[k]=fn},matches(){return true},click(){},remove(){}}}
 const el=id=>{if(!els.has(id))els.set(id,element());return els.get(id)};
 const context=vm.createContext({console,crypto:webcrypto,Uint32Array,Uint8Array,ArrayBuffer,Blob,TextEncoder,TextDecoder,Date:class extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}},performance:{now:()=>clock},setInterval:()=>++interval,clearInterval(){},setTimeout:(fn,ms,...args)=>setTimeout(fn,0,...args),clearTimeout,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){storage.set(k,v)},removeItem:k=>storage.delete(k)},document:{querySelector:el,addEventListener(){},createElement:element,body:{appendChild(){}},documentElement:{}},confirm:()=>true,addEventListener(){}});
 context.window=context;context.globalThis=context;
 vm.runInContext(scripts[0],context);vm.runInContext(scripts[1],context);vm.runInContext(scripts[2],context);
 vm.runInContext(scripts[3].replace(/\ninit\(\);/,`\nglobalThis.api={state,PRIZES,parseCustomers,parsePrizeAmount,loadCustomers,startRound,finishRound,nextRound,drawTick,restoreSession,persistState,canChangePrizes,changePrizeAmount,renderStage,showReveal,hideReveal,resultRows,auditPayload,bind,canStart,discardDrawSession};`),context);
 el('#eventName').value='TEST — SYNTHETIC ONLY';
 return {context,E:context.BatchEngine,app:context.api,storage,el,advance:ms=>clock+=ms,now:()=>clock};
}
const people=()=>Array.from({length:120},(_,i)=>({id:'EMP:TEST'+i,code:'TEST'+i,cccd:'',name:'Nhân viên giả lập '+i,department:'Test'}));
const plain=x=>JSON.parse(JSON.stringify(x));
function ready(f){const s=f.E.create();s.people=people();return s}
const persist=()=>{};
test('configuration: 14 batches / 44 winners / 140 seconds, correct tier order',()=>{
 const {E}=fixture();assert.equal(E.DRAW_MS,10000);assert.equal(E.BATCHES.length,14);assert.equal(E.BATCHES.reduce((a,b)=>a+b.count,0),44);assert.equal(E.BATCHES.length*E.DRAW_MS,140000);
 assert.deepEqual(plain(E.BATCHES.map(b=>b.count)),[5,5,5,5,5,5,4,4,1,1,1,1,1,1]);
 assert.deepEqual(plain(E.BATCHES.map(b=>b.key)),[...Array(6).fill('encouragement'),...Array(2).fill('fourth'),...Array(3).fill('third'),...Array(2).fill('second'),'first']);
});
test('all batches: unique eligible employees, exact allocations, no auto-start, double-click guards',()=>{
 const f=fixture(),{E}=f,s=ready(f);let saved;
 for(let i=0;i<14;i++){
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
test('integrated UI: edits/budget before start, locks once begun, 14 batches, exports batch/amount',async()=>{
 const f=fixture(),{app}=f;await app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'SYNTHETIC TEST','Test');
 assert.equal(app.canChangePrizes(),true);
 app.changePrizeAmount({matches:()=>true,dataset:{prizeKey:'encouragement'},value:'300.000'});assert.equal(app.PRIZES[0].amount,300000);assert.equal(f.el('#totalPrizeValue').textContent,'23.000.000 ₫');
 for(let i=0;i<14;i++){
  app.startRound();app.startRound();assert.equal(app.canChangePrizes(),false);assert.equal(app.state.pending.length,f.E.BATCHES[i].count);
  app.changePrizeAmount({matches:()=>true,dataset:{prizeKey:'encouragement'},value:'1'});assert.equal(app.PRIZES[0].amount,300000);
  f.advance(9999);app.drawTick();assert.equal(app.state.running,true);f.advance(1);app.drawTick();app.finishRound();
  assert.equal(app.state.completed.length,i+1);assert.equal(app.state.phase,'REVEAL');assert.equal((f.el('#revealGrid').innerHTML.match(/class="reveal-person"/g)||[]).length,f.E.BATCHES[i].count);
  assert.doesNotMatch(f.el('#revealGrid').innerHTML,/department|CCCD/);
  app.hideReveal();assert.equal(app.state.phase,'WAITING_NEXT_BATCH');app.nextRound();
 }
 assert.equal(app.state.phase,'COMPLETED');const rows=app.resultRows();assert.equal(rows.length,45);assert.deepEqual(plain(rows[0].slice(0,5)),['STT','Hạng giải','Lượt trong hạng','Lượt toàn chương trình','Giá trị giải (VNĐ)']);assert.equal(rows[1][4],300000);assert.equal(rows.at(-1)[3],14);
 const audit=app.auditPayload();assert.equal(audit.version,'2.4.0');assert.equal(audit.rounds.length,14);assert.equal(audit.rounds[0].amountPerWinnerVND,300000);assert.equal(audit.rules.drawDurationSeconds,10);assert.equal(audit.rounds[0].winners[0].prizeAmountVND,300000);assert.equal(audit.rounds[0].winners[0].batchNumber,1);
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
 f.app.bind();f.el('#musicBtn').events.click();assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.state.soundEnabled,true);
 await f.app.loadCustomers([['Mã nhân viên','Họ tên'],...people().map(p=>[p.code,p.name])],'TEST','Test');f.app.startRound();assert.ok(oscillators>0);assert.ok(f.app.state.audioNodes.size>0);
 const before=stopped;f.el('#soundBtn').events.click();assert.equal(f.app.state.soundEnabled,false);assert.equal(f.app.state.musicEnabled,true);assert.equal(f.app.state.audioNodes.size,0);assert.ok(stopped>before);
 f.el('#musicBtn').events.click();assert.equal(f.app.state.musicEnabled,false);assert.equal(f.app.state.musicTimer,null);
 f.el('#soundBtn').events.click();f.advance(7000);f.app.drawTick();assert.equal(f.app.state.audioNodes.size,2);f.advance(3000);f.app.drawTick();assert.equal(f.app.state.audioNodes.size,0);
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
