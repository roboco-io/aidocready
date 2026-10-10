import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planUpdate, validateChanges, parsePiSummary} from '../.github/scripts/upstream-lib.mjs';
const pkg={name:'aidocready',engines:{node:'>=20'},scripts:{test:'node --test'},dependencies:{kordoc:'4.21.9',unified:'11.0.5'}};
test('new stable upstream produces an update plan',()=>assert.deepEqual(planUpdate('4.21.9','4.22.0',false),{current:'4.21.9',target:'4.22.0',changed:true,runAgent:true,auditOnly:false}));
test('same version avoids paid agent call',()=>assert.equal(planUpdate('4.21.9','4.21.9',false).runAgent,false));
test('manual audit calls agent without creating an update',()=>{const p=planUpdate('4.21.9','4.21.9',true);assert.equal(p.runAgent,true);assert.equal(p.changed,false);assert.equal(p.auditOnly,true);});
test('registry rollback never downgrades installed dependency',()=>assert.equal(planUpdate('4.22.0','4.21.9',false).changed,false));
test('rejects prereleases and command injection in registry input',()=>{for(const v of ['4.22.0-beta.1','4.22.0;echo secret','latest','v4.22.0'])assert.throws(()=>planUpdate('4.21.9',v,false));});
test('allows upstream dependency plus adapter and test changes',()=>assert.doesNotThrow(()=>validateChanges(['package.json','package-lock.json','src/input.ts','tests/rules.test.ts'],pkg,{...pkg,dependencies:{...pkg.dependencies,kordoc:'4.22.0'}},'4.22.0',false)));
test('blocks changes to workflows or runtime floor',()=>{assert.throws(()=>validateChanges(['.github/workflows/ci.yml'],pkg,pkg,'4.21.9',false));assert.throws(()=>validateChanges(['package.json'],pkg,{...pkg,engines:{node:'>=24'}},'4.21.9',false));});
test('blocks test command weakening and unrelated dependencies',()=>{assert.throws(()=>validateChanges(['package.json'],pkg,{...pkg,scripts:{test:'true'}},'4.21.9',false));assert.throws(()=>validateChanges(['package.json'],pkg,{...pkg,dependencies:{...pkg.dependencies,unified:'12.0.0'}},'4.21.9',false));});
test('audit mode cannot change repository files',()=>assert.throws(()=>validateChanges(['src/input.ts'],pkg,pkg,'4.21.9',true)));

test('pi final response is returned without tool event noise',()=>assert.equal(parsePiSummary([{type:'tool_execution_end',result:{}},{type:'message_end',message:{role:'assistant',stopReason:'stop',content:[{type:'thinking',thinking:'private reasoning'},{type:'text',text:'Compatibility verified.'}]}}]),'Compatibility verified.'));
test('pi incomplete or failed runs cannot create a verified patch',()=>{for(const events of [[],[{type:'message_end',message:{role:'assistant',stopReason:'error',content:[]}}],[{type:'message_end',message:{role:'assistant',stopReason:'length',content:[{type:'text',text:'partial'}]}}]])assert.throws(()=>parsePiSummary(events));});
test('pi summary redacts the API credential before artifact upload',()=>assert.equal(parsePiSummary([{type:'message_end',message:{role:'assistant',stopReason:'stop',content:[{type:'text',text:'key: fake-test-key'}]}}],'fake-test-key'),'key: [REDACTED]'));
