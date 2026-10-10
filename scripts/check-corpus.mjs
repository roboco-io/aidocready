import {readFile,writeFile} from 'node:fs/promises';
import {lintMarkdown,lintBlocks,VERSION} from '../dist/index.js';
import {compareFindings} from './corpus-lib.mjs';
const root=new URL('../tests/corpus/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const results=[];
for(const c of manifest.cases){
 const input=await readFile(new URL(c.file,root),'utf8');
 const result=c.file.endsWith('.json')?lintBlocks(JSON.parse(input)):lintMarkdown(input);
 const diff=compareFindings(c.expected,result.findings);
 results.push({id:c.id,kind:c.kind,...diff,coverageMatch:result.coverage.complete===c.complete});
}
const report={schemaVersion:1,datasetVersion:manifest.datasetVersion,engineVersion:VERSION,cases:results,passed:results.every(r=>r.passed&&r.coverageMatch)};
const outputIndex=process.argv.indexOf('--output');if(outputIndex>=0){const path=process.argv[outputIndex+1];if(!path)throw new Error('Missing --output path');await writeFile(path,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
