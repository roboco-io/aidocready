import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProseExample} from '../scripts/prose-example-lib.mjs';
const base=new URL('../site/assets/prose/',import.meta.url);
const read=(name:string)=>readFileSync(new URL(name,base),'utf8');
const original=readFileSync(new URL('../site/assets/conversion/converted.md',import.meta.url),'utf8');
test('table prose preserves each field relationship and the extension conditions',()=>{
 const before=read('table-before.md'),after=read('table-after.md');
 assert.doesNotThrow(()=>validateProseExample({id:'table'},before,after,original));
 assert.throws(()=>validateProseExample({id:'table'},before,after.replace('1명','2명'),original),/fact/);
 assert.throws(()=>validateProseExample({id:'table'},before,after.replace('행정안전부 협의 및 관련 법령',''),original),/condition/);
});
test('duty prose retains all source duties and names the responsible role',()=>{
 const before=read('list-before.md'),after=read('list-after.md');
 assert.doesNotThrow(()=>validateProseExample({id:'list'},before,after,original));
 assert.throws(()=>validateProseExample({id:'list'},before,after.replace('정책 아이디어',''),original),/duty/);
 assert.throws(()=>validateProseExample({id:'list'},before,after.replace('전문임기제 가급',''),original),/subject/);
});
