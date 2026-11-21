'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {EventSettings:M,BatchEngine:E}=require('../scripts/validate_config.cjs');
const seed=()=>M.migrate(require('../config/published.json'));
const raw=(revision=1,settings=seed())=>({schemaVersion:2,revision,updatedAt:{toDate:()=>new Date('2026-11-21T00:00:00Z')},settings});
const clone=x=>JSON.parse(JSON.stringify(x));
test('migration preserves public event, seven-theme selection and approved 44/13/10 rules',()=>{
 const old=require('../config/published.json'),s=M.migrate(old,{schemaVersion:1,themeId:'lotus',updatedAt:{}});
 assert.equal(s.event.appearance.themeId,'lotus');assert.deepEqual(clone(s.event.content),old.event.content);assert.deepEqual(clone(s.draw),clone(E.migrateDraw(old.draw)));assert.equal(s.audio.celebrationEnabled,true);assert.equal(seed().event.appearance.themeId,'quyet-thang-corporate');
});
test('public schema refuses private/unknown fields and unsupported structure or duration',()=>{
 for(const mutate of [s=>s.people=[],s=>s.event.cccd='SYNTHETIC',s=>s.draw.durationMs=5000,s=>s.draw.prizes[0].batchSize=0,s=>s.audio.token='secret',s=>s.event.details.date='2026-02-30',s=>s.event.appearance.logo={kind:'url',url:'javascript:alert(1)'}]){const s=clone(seed());mutate(s);assert.throws(()=>M.validate(s));}
});
test('names, amounts, public information, theme, solid background and audio survive validation/reload',()=>{
 const s=clone(seed());s.draw.prizes[0].name='Giải tri ân';s.draw.prizes[0].amount=250000;s.event.details.organization='Đơn vị thử nghiệm';s.event.appearance.background={kind:'solid',color:'#123456'};s.audio.musicEnabled=true;s.audio.celebrationEnabled=false;
 const d=M.document(raw(2,s));assert.deepEqual(clone(M.document(clone(d),{cached:true})),clone(d));assert.equal(M.legacy(s).draw.prizes[0].name,'Giải tri ân');
});
test('remote updates preserve unsaved edits and reject stale revisions or same-version mutations',()=>{
 const e=new M.Editor(seed());e.receive(raw());const s=clone(e.draft);s.event.content.title='Bản sửa trên máy';e.edit(s);e.receive(raw(2));assert.equal(e.draft.event.content.title,'Bản sửa trên máy');assert.equal(e.baseRevision,1);assert.equal(e.conflicted,true);
 e.acceptLatest();assert.equal(e.dirty,false);assert.equal(e.baseRevision,2);assert.throws(()=>e.receive(raw(1)));const altered=clone(seed());altered.event.content.title='Different';assert.throws(()=>e.receive(raw(2,altered)));
});
test('offline local draft restores without overwriting remote settings',()=>{
 const e=new M.Editor(seed());e.receive(raw());const s=clone(seed());s.event.content.title='Sửa khi offline';e.edit(s);const saved={baseRevision:e.baseRevision,settings:e.draft};const reopened=new M.Editor(seed());reopened.restoreDraft(clone(saved));reopened.receive(raw(2));assert.equal(reopened.draft.event.content.title,'Sửa khi offline');assert.equal(reopened.conflicted,true);
});
function api({admin=true,current=raw(),fail=false}={}){let stored=current,writes=0;return{currentUser:()=>({uid:'test'}),isAdmin:async()=>admin,serverTimestamp:()=>({toDate:()=>new Date('2026-11-21T00:00:00Z')}),transaction:async fn=>{if(fail)throw Error('offline');return fn({read:async()=>stored,write:d=>{stored=d;writes++}})},readServer:async()=>stored,get writes(){return writes}};}
test('save checks authorization, optimistic revision and waits for server confirmation',async()=>{
 const a=api();const r=await M.publish(a,seed(),1);assert.equal(r.confirmed.revision,2);assert.equal(r.superseded,false);assert.equal(a.writes,1);
 for(const a of [api({admin:false}),api({current:raw(2)}),api({fail:true})]){await assert.rejects(()=>M.publish(a,seed(),1));assert.equal(a.writes,0);}
 const guest=api();guest.currentUser=()=>null;await assert.rejects(()=>M.publish(guest,seed(),1));assert.equal(guest.writes,0);
});
test('save never acknowledges an unconfirmed document and reports a concurrent subsequent publication',async()=>{
 const a=api();a.readServer=async()=>raw(1);await assert.rejects(()=>M.publish(a,seed(),1));const b=api();const newer=clone(seed());newer.event.content.title='Admin khác';b.readServer=async()=>raw(3,newer);assert.equal((await M.publish(b,seed(),1)).superseded,true);
});
