import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateSite} from '../scripts/site-lib.mjs';
async function fixture(run:(d:string)=>Promise<void>){const d=await mkdtemp(join(tmpdir(),'aidocready-site-'));try{await run(d);}finally{await rm(d,{recursive:true,force:true});}}
test('site gate catches broken internal document links',()=>fixture(async d=>{await writeFile(join(d,'index.html'),'<a href="manual.html#start">Manual</a>');await assert.rejects(validateSite(d),/manual.html/);}));
test('site gate catches missing anchor destinations',()=>fixture(async d=>{await writeFile(join(d,'index.html'),'<a href="manual.html#start">Manual</a>');await writeFile(join(d,'manual.html'),'<h1 id="other">Manual</h1>');await assert.rejects(validateSite(d),/start/);}));
test('site gate accepts working cross-page anchors and external sources',()=>fixture(async d=>{await writeFile(join(d,'index.html'),'<a href="manual.html#start">Manual</a><a href="https://github.com/roboco-io/aidocready">Source</a>');await writeFile(join(d,'manual.html'),'<h1 id="start">Manual</h1>');await assert.doesNotReject(validateSite(d));}));
