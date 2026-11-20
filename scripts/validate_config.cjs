'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const context=vm.createContext({TextEncoder,TextDecoder,Date});context.window=context;
for(const id of ['batch-engine','event-platform','shared-configuration']){
 const script=html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));if(!script)throw Error('Missing bundled '+id);vm.runInContext(script[1],context);
}
module.exports={SharedConfiguration:context.SharedConfiguration,EventPlatform:context.EventPlatform,BatchEngine:context.BatchEngine};
if(require.main===module){
 try{
  const source=process.argv[2];if(fs.statSync(source).size>context.SharedConfiguration.MAX_BYTES)throw Error('Configuration exceeds 32 KiB');
  const text=fs.readFileSync(source,'utf8');
  if(process.argv[3]==='--prepare'){
   const current=fs.readFileSync(process.argv[4],'utf8');
   const prepared=context.SharedConfiguration.preparePublication(text,current,process.argv[5]);process.stdout.write(JSON.stringify(prepared));
  }else{context.SharedConfiguration.validate(text,{publishedOnly:process.argv.includes('--published')});process.stdout.write('Configuration validation PASS\n')}
 }catch(err){process.stderr.write('Configuration validation FAILED: '+err.message+'\n');process.exitCode=1}
}
