import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {syncArtifacts} from '../scripts/meta-lib.mjs';
test('metadata check rejects drift without silently overwriting it',async()=>{const d=await mkdtemp(join(tmpdir(),'aidocready-meta-'));try{await writeFile(join(d,'profile.json'),'stale');await assert.rejects(syncArtifacts(d,{'profile.json':'canonical'},true));assert.equal(await readFile(join(d,'profile.json'),'utf8'),'stale');}finally{await rm(d,{recursive:true,force:true});}});
test('metadata generation creates canonical artifacts',async()=>{const d=await mkdtemp(join(tmpdir(),'aidocready-meta-'));try{await syncArtifacts(d,{'profiles/a.json':'canonical'});assert.equal(await readFile(join(d,'profiles/a.json'),'utf8'),'canonical');assert.deepEqual(await syncArtifacts(d,{'profiles/a.json':'canonical'},true),[]);}finally{await rm(d,{recursive:true,force:true});}});
