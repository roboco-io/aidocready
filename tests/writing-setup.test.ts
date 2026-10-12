import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const cli=(...args:string[])=>spawnSync(process.execPath,['--import','tsx','src/cli.ts',...args],{encoding:'utf8'});
for(const target of ['chatgpt','claude'])test(`${target} setup provides pasteable policy and installation guidance`,()=>{
 const result=cli('setup','--target',target,'--format','json');
 assert.equal(result.status,0,result.stderr);
 const data=JSON.parse(result.stdout);
 assert.equal(data.target,target);
 assert.equal(data.automaticSetup,false);
 assert.ok(data.setupSteps.length>=2);
 assert.ok(data.instructions.length<=1500);
 for(const term of ['상단','병합','서술식','항목','꾸미기','원문','공식 인증'])assert.ok(data.instructions.includes(term),term);
 assert.ok(!data.instructions.includes('npx'));
 assert.match(cli('setup','--target',target).stdout,/붙여 넣기/);
});
test('target is validated and restricted to setup',()=>{
 for(const args of [['setup','--target','unknown'],['doctor','--target','chatgpt'],['rules','--target','claude'],['setup','--target','chatgpt','--profile','mois-core']]){
  const result=cli(...args,'--format','json');assert.equal(result.status,2);assert.equal(JSON.parse(result.stdout).error.reason,'INVALID_ARGUMENT');
 }
});
test('setup exports only pasteable policy and preserves existing files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'aidocready-policy-'));
 try{
  const output=join(dir,'instructions.txt');
  const result=cli('setup','--target','chatgpt','--output',output);assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(cli('setup','--target','chatgpt','--format','json').stdout);
  assert.equal(await readFile(output,'utf8'),data.instructions+'\n');
  await writeFile(output,'기존 지침');
  const conflict=cli('setup','--target','claude','--output',output,'--format','json');
  assert.equal(conflict.status,2);assert.equal(JSON.parse(conflict.stdout).error.reason,'FILE_WRITE_FAILED');
  assert.equal(await readFile(output,'utf8'),'기존 지침');
  const jsonPath=join(dir,'instructions.json');
  assert.equal(cli('setup','--target','claude','--format','json','--output',jsonPath).status,0);
  const json=JSON.parse(await readFile(jsonPath,'utf8'));assert.equal(json.target,'claude');assert.equal(json.instructions,data.instructions);
 }finally{await rm(dir,{recursive:true,force:true});}
});
