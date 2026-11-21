'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {BatchEngine:E,EventSettings:M,AwardHandover:H}=require('../scripts/validate_config.cjs');
const clone=x=>JSON.parse(JSON.stringify(x)),noop=()=>{};
const roster=n=>Array.from({length:n},(_,i)=>({id:'EMP:'+String(i).padStart(5,'0'),code:String(i).padStart(5,'0'),cccd:'',name:'Nhân viên giả lập '+i,department:'Đơn vị thử nghiệm'}));
const draw=(slots,tiers=3)=>E.fromPrizes(Array.from({length:tiers},(_,i)=>({key:'prize-'+i,name:'Giải thử nghiệm '+i,count:Math.floor(slots/tiers)+(i<slots%tiers?1:0),batchSize:i%2?4:5,durationMs:(i+1)*1000,amount:123456*(i+1)})));
function run(d,n,{limit=Infinity,demo=false}={}){let s=E.create(d),now=1700000000000;s.people=roster(n);s.demo=demo;for(const b of E.schedule(d).slice(0,limit)){assert.ok(E.begin(s,d.prizes[b.tierIndex].amount,noop,now));const frozen=E.snapshot(s),pending=clone(s.pending);s=E.restore(frozen);assert.deepEqual(clone(s.pending),pending);assert.equal(s.roundEndsAt-now,b.durationMs);assert.equal(E.finish(s,noop,s.roundEndsAt-1),false);now=s.roundEndsAt;assert.ok(E.finish(s,noop,now));s=E.restore(E.snapshot(s));assert.equal(E.canStart(s),false);E.next(s,noop);}return s;}
for(const participants of [50,100,500,1000])for(const slots of [10,30,44,80,100].filter(s=>s<=participants))test(`dynamic: ${participants} participants / ${slots} slots`,()=>{const d=draw(slots),s=run(d,participants),won=s.completed.flatMap(r=>r.winners);assert.equal(won.length,slots);assert.equal(new Set(won.map(w=>w.id)).size,slots);assert.equal(s.phase,'COMPLETED');assert.deepEqual(clone(s.drawConfig),clone(d));});
test('schedule clips remainder; different tier counts and resource bounds are validated',()=>{
 const remainder=draw(13,1);assert.deepEqual(clone(E.schedule(remainder).map(b=>b.count)),[5,5,3]);
 for(const n of [1,3,7,24]){const d=draw(100,n);assert.equal(E.schedule(d).reduce((n,b)=>n+b.count,0),100);}
 for(const mutate of [p=>p.count=0,p=>p.batchSize=0,p=>p.amount=-1,p=>p.durationMs=999,p=>p.durationMs=300001,p=>p.name='',p=>p.extra='private']){const d=clone(draw(10));mutate(d.prizes[0]);assert.throws(()=>E.validateDraw(d));}
 const d=clone(draw(10));d.prizes[1].key=d.prizes[0].key;assert.throws(()=>E.validateDraw(d));
 const s=E.create(draw(100));s.people=roster(50);assert.equal(E.begin(s,1,noop),false);
});
test('frozen draw survives changed remote settings; persisted pending and committed results remain exact',()=>{
 const original=draw(30),s=run(original,100,{limit:2}),before=clone(E.snapshot(s));const remote=draw(80,7);assert.notDeepEqual(clone(remote),clone(original));assert.deepEqual(clone(E.restore(before).drawConfig),clone(original));assert.deepEqual(clone(E.restore(before).completed),clone(s.completed));assert.ok(Object.isFrozen(s.drawConfig));assert.throws(()=>{s.drawConfig.prizes[0].count=99});
});
test('legacy version 4 upgrades using its own frozen configuration; unsupported IDs remain rejected',()=>{
 const s=run(E.DEFAULT_DRAW,100,{limit:2}),old=clone(E.snapshot(s));old.version=4;old.configId=E.LEGACY_CONFIG_ID;old.configurationSnapshot={draw:require('../config/published.json').draw};delete old.drawConfig;delete old.demo;old.completed.forEach(r=>{delete r.durationMs;delete r.simulated});const restored=E.restore(old);assert.equal(restored.migratedFromVersion,4);assert.deepEqual(clone(restored.completed.map(r=>r.winners)),clone(s.completed.map(r=>r.winners)));old.configId='unknown';assert.throws(()=>E.restore(old));
});
const event=()=>M.migrate(require('../config/published.json')).event;
test('handover rejects empty and simulated results; excludes uncommitted pending winners',()=>{
 const d=draw(10),empty=E.create(d);empty.people=roster(50);assert.throws(()=>H.build(E.snapshot(empty),event()));assert.throws(()=>H.build(E.snapshot(run(d,50,{demo:true})),event()));
 const s=run(d,50,{limit:1});E.begin(s,1,noop,1700000100000);assert.equal(H.build(E.snapshot(s),event()).count,s.completed[0].winners.length);
});
test('handover handles one/partial/full reports, frozen values, priorities, metadata and text safely',()=>{
 for(const slots of [1,10,30,44,80,100]){const d=draw(slots,slots===1?1:3),s=run(d,Math.max(slots,50)),report=H.build(E.snapshot(s),event(),'2026-11-21T14:00:00Z');assert.equal(report.count,slots);assert.equal(report.complete,true);assert.match(report.filename,/_2026-11-21_Hoan_Tat.xlsx$/);const rows=report.sheets[0].rows.slice(4);assert.equal(rows.length,slots);assert.equal(rows[0][4],d.prizes.at(-1).name);assert.equal(rows[0][5],d.prizes.at(-1).amount);assert.ok(rows.every(r=>typeof r[1]==='string'&&r[7]==='Chưa trao'&&r[8]===''&&r[9]===''));assert.equal(new Set(rows.map(r=>r[1])).size,slots);assert.doesNotMatch(JSON.stringify(report),/CCCD|ngân sách|Tổng tiền|Tổng giá trị/);assert.equal(report.sheets[1].rows[1][1],event().content.title);}
 const s=run(draw(30),50,{limit:1}),r=H.build(E.snapshot(s),event());assert.equal(r.complete,false);assert.match(r.filename,/_Tam_Thoi.xlsx$/);assert.equal(r.sheets[0].rows[0][0],'DANH SÁCH TẠM THỜI');
});
function excel(){const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim()),c=vm.createContext({Blob,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,setTimeout,clearTimeout,console});c.window=c;vm.runInContext(scripts[0],c);vm.runInContext(scripts[1],c);return c;}
test('actual XLSX writer: two sheets, styles, text identities, injection safety, print settings and numeric money',async()=>{
 const s=run(draw(10),50);const w=s.completed[0].winners[0],person=s.people.find(p=>p.id===w.id);person.name='=HYPERLINK("https://example.invalid","Không chạy")';person.department='+SUM(1,2)';const report=H.build(E.snapshot(s),event()),c=excel(),blob=await c.ExcelLocal.makeWorkbook(report.sheets,report.filename,{download:false}),zip=await c.JSZip.loadAsync(await blob.arrayBuffer());
 await assert.rejects(()=>c.ExcelLocal.makeWorkbook(report.sheets,report.filename,{beforeDownload:async()=>false}),/Quyền xuất kết quả đã thay đổi/);
 const workbook=await zip.file('xl/workbook.xml').async('string'),sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');assert.match(workbook,/DANH SÁCH TRAO THƯỞNG/);assert.match(workbook,/TỔNG HỢP GIẢI THƯỞNG/);assert.match(workbook,/_xlnm.Print_Titles/);assert.match(sheet,/orientation="landscape"/);assert.match(sheet,/paperSize="9"/);assert.match(sheet,/<autoFilter /);assert.match(sheet,/state="frozen"/);assert.match(sheet,/t="inlineStr"><is><t xml:space="preserve">0\d{4}/);assert.match(sheet,/=HYPERLINK/);assert.doesNotMatch(sheet,/<f[ >]/);assert.match(sheet,/s="3"><v>\d+<\/v>/);assert.ok(zip.file('xl/styles.xml'));
 if(process.env.HANDOVER_EXAMPLE_PATH){const example=H.build(E.snapshot(run(draw(10),50)),event(),'2026-11-21T14:00:00Z');const file=await c.ExcelLocal.makeWorkbook(example.sheets,example.filename,{download:false});fs.writeFileSync(process.env.HANDOVER_EXAMPLE_PATH,Buffer.from(await file.arrayBuffer()));}
});
test('wire schema assembly is all-or-nothing and preserves event settings during migration',()=>{
 const settings=clone(M.migrate(require('../config/published.json')));settings.draw=draw(100,24);const p=M.pack(settings,1,'g-test-generation-abcdefgh'),stamp={toDate:()=>new Date('2026-11-21T00:00:00Z')},raw={schemaVersion:3,revision:1,updatedAt:stamp,settings:p.settings},blocks=p.blocks.map(b=>({...b,createdAt:stamp}));assert.deepEqual(clone(M.assemble(raw,blocks).settings),clone(settings));assert.throws(()=>M.assemble(raw,blocks.slice(1)));const wrong=clone(p.blocks).map(b=>({...b,createdAt:stamp}));wrong[0].revision=2;assert.throws(()=>M.assemble(raw,wrong));wrong[0].revision=1;wrong[0].prizes[0].count++;assert.throws(()=>M.assemble(raw,wrong));
});
