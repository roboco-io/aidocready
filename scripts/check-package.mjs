import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=dirname(dirname(fileURLToPath(import.meta.url)));const scratch=await mkdtemp(join(tmpdir(),'aidocready-consumer-'));
const npm=process.platform==='win32'?'npm.cmd':'npm';
try {
 const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 const pack=JSON.parse(execFileSync(npm,['pack','--json','--ignore-scripts','--pack-destination',scratch],{cwd:root,encoding:'utf8',timeout:120000}))[0];
 await writeFile(join(scratch,'package.json'),JSON.stringify({name:'aidocready-consumer',private:true,type:'module'}));
 execFileSync(npm,['install','--ignore-scripts','--omit=optional','--omit=dev','--no-audit','--no-fund',join(scratch,pack.filename)],{cwd:scratch,stdio:'pipe',timeout:180000});
 const binary=join(scratch,'node_modules/aidocready/dist/cli.js');
 assert.equal(execFileSync(process.execPath,[binary,'--version'],{encoding:'utf8'}).trim(),pkg.version);
 for(const format of ['md','hwpx']){
  const result=JSON.parse(execFileSync(process.execPath,[binary,'lint',join(root,`examples/report.${format}`),'--format','json'],{encoding:'utf8'}));assert.deepEqual(result.findings,[]);
 }
 await writeFile(join(scratch,'consume.mjs'),`import assert from 'node:assert/strict';\nimport {lintFile,lintMarkdown,loadProfile,VERSION} from 'aidocready';\nassert.equal(VERSION,${JSON.stringify(pkg.version)});\nassert.equal(typeof loadProfile,'function');\nassert.equal(lintMarkdown('본문이다.').findings.length,0);\nassert.equal((await lintFile(${JSON.stringify(join(root,'examples/report.hwpx'))})).findings.length,0);\n`);
 execFileSync(process.execPath,['consume.mjs'],{cwd:scratch,stdio:'pipe',timeout:30000});
 for(const path of ['profiles/mois-core.json','profiles/recommended.json','skills/aidocready/SKILL.md','templates/AGENTS.md','templates/CLAUDE.md'])assert.ok((await readFile(join(scratch,'node_modules/aidocready',path),'utf8')).length>0);
 console.log('Clean npm tarball install: CLI, public API, HWPX without optional dependencies, and skill assets passed.');
} finally {await rm(scratch,{recursive:true,force:true});}
