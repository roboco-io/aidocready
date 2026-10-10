import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {grade,promptFor} from './lib.mjs';
import {lintMarkdown,VERSION} from '../../dist/index.js';
const here=dirname(fileURLToPath(import.meta.url));const root=resolve(here,'../..');
const [sourceArg,destinationArg]=process.argv.slice(2);if(!sourceArg||!destinationArg)throw new Error('Usage: node rescore.mjs SOURCE_DIRECTORY NEW_DIRECTORY');
const source=resolve(sourceArg),destination=resolve(destinationArg);if(source===destination)throw new Error('Never overwrite original results');
await mkdir(destination,{recursive:true});if((await readdir(destination)).length)throw new Error('Destination must be empty');
const original=JSON.parse(await readFile(join(source,'summary.json'),'utf8'));
const cases=JSON.parse(await readFile(join(here,'cases.json'),'utf8'));
const skill=await readFile(join(root,'skills/aidocready/SKILL.md'),'utf8');const policy=await readFile(join(root,'docs/format-policy.md'),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
if(original.skillSha256!==sha(skill)||original.policySha256!==sha(policy)||original.engineVersion!==VERSION)throw new Error('Prompt policy or engine changed: rerun live SDKs');
const rows=[];let choices=0,choicePass=0;
for(const row of original.results){
 const test=cases.find(c=>c.id===row.caseId);if(!test||!['codex','claude'].includes(row.provider)||!Number.isInteger(row.iteration)||row.iteration<1)throw new Error('Invalid source run row');
 const file=`${row.provider}-${row.caseId}-${row.iteration}.json`;
 const record=JSON.parse(await readFile(join(source,file),'utf8'));
 if(record.promptSha256!==sha(promptFor(test,skill,policy)))throw new Error('Prompt changed; cannot rescore '+file);
 const updated=record.error?record.grade:grade(test,record.response,{lintMarkdown,toolCalls:record.toolCalls});
 for(const section of updated.sections){choices++;if(!section.issues.some(i=>['format_choice','declared_format_mismatch','list_ordering_kind','paragraph_count'].includes(i)||i.startsWith('distinct_list_item:')))choicePass++;}
 await writeFile(join(destination,file),JSON.stringify({...record,originalGrade:record.grade,grade:updated},null,2)+'\n');
 rows.push({provider:record.provider,caseId:record.caseId,iteration:record.iteration,passed:updated.passed,issues:[...updated.issues,...updated.sections.flatMap(s=>s.issues.map(i=>s.id+':'+i))]});
}
const summary={...original,rescoreOnly:true,rescoredAt:new Date().toISOString(),sourceDirectory:source,gradingChanges:['Accept explicit equivalent uncertainty wording.','Require list facts inside distinct items and enforce requested paragraph count.'],graderSha256:sha(await readFile(join(here,'lib.mjs'))),oracleSha256:sha(JSON.stringify(cases)),passedRuns:rows.filter(r=>r.passed).length,failedRuns:rows.filter(r=>!r.passed).length,sectionFormatChecks:{passed:choicePass,total:choices},providers:original.providers.map(p=>({...p,passed:rows.filter(r=>r.provider===p.provider&&r.passed).length})),results:rows};
await writeFile(join(destination,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const report=`# SDK 형식 선택 평가 결과\n\n원래 SDK 실행: ${original.startedAt} ~ ${original.finishedAt} (UTC)\n\n8개 사례 × 2회 × 2 SDK = ${rows.length}회. 원래 응답을 보존하고 채점기의 동등 표현·목록 항목·문단 수 검사를 보완해 재채점했습니다. 모델을 다시 호출한 실행으로 계산하지 않습니다.\n\n형식 검사 ${choicePass}/${choices}, 통합 검사 ${summary.passedRuns}/${rows.length}.\n\n| SDK | 모델 | 실행 | 통합 통과 |\n| --- | --- | --- | --- |\n${summary.providers.map(p=>`| ${p.provider} | ${p.models.join(', ')} | ${p.runs} | ${p.passed} |`).join('\n')}\n\n| SDK | 사례 | 반복 | 통과 | 진단 |\n| --- | --- | --- | --- | --- |\n${rows.map(r=>`| ${r.provider} | ${r.caseId} | ${r.iteration} | ${r.passed?'PASS':'FAIL'} | ${r.issues.join(', ')} |`).join('\n')}\n\n선택 근거와 조건·의미 보존은 별도 수동 검토가 필요합니다. 모델 순위나 정책 효과의 인과 실험이 아닙니다.\n`;
await writeFile(join(destination,'report.md'),report);console.log(JSON.stringify({destination,passed:summary.passedRuns,failed:summary.failedRuns,formatChecks:summary.sectionFormatChecks,failures:rows.filter(r=>!r.passed)}));
if(summary.failedRuns||summary.unexecutedRuns)process.exitCode=1;
