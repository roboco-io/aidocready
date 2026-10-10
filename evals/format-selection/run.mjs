import {readFile,writeFile,mkdir,mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {execute} from './adapters.mjs';
import {preflightAuth,publicAuth,redactAuthError} from './auth.mjs';
import {grade,promptFor,schema} from './lib.mjs';
import {lintMarkdown,VERSION} from '../../dist/index.js';
async function main(){
const here=dirname(fileURLToPath(import.meta.url));const root=resolve(here,'../..');
const args=process.argv.slice(2);const options={provider:'both',repeat:1,timeout:180000};
for(let i=0;i<args.length;i++){
 const key=args[i];if(key==='--check-auth'){options.checkAuth=true;continue;}if(!['--provider','--repeat','--case','--out','--timeout'].includes(key)||!args[i+1])throw new Error('Usage: --provider both|codex|claude --repeat 1..5 --case case-id --out path --timeout milliseconds --check-auth');
 options[key.slice(2)]=['--repeat','--timeout'].includes(key)?Number(args[++i]):args[++i];
}
if(!['both','codex','claude'].includes(options.provider)||!Number.isInteger(options.repeat)||options.repeat<1||options.repeat>5||!Number.isFinite(options.timeout)||options.timeout<5000||options.timeout>300000)throw new Error('Invalid evaluation options');
const all=JSON.parse(await readFile(join(here,'cases.json'),'utf8'));const cases=options.case?all.filter(c=>c.id===options.case):all;if(!cases.length)throw new Error('Unknown case');
const skill=await readFile(join(root,'skills/aidocready/SKILL.md'),'utf8');const policy=await readFile(join(root,'docs/format-policy.md'),'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');const startedAt=new Date().toISOString();
const output=resolve(options.out??join(here,'results',startedAt.replaceAll(':','-')));await mkdir(output,{recursive:true});if((await readdir(output)).length)throw new Error('Output directory must be empty; preserve previous runs.');
const codeHashes=Object.fromEntries(await Promise.all(['lib.mjs','adapters.mjs','auth.mjs','run.mjs','package-lock.json'].map(async name=>[name,sha(await readFile(join(here,name)))])));
let commit=null;try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
const sdkVersions=JSON.parse(await readFile(join(here,'package.json'),'utf8')).dependencies;
const providers=options.provider==='both'?['codex','claude']:[options.provider];
let authPlans;
try{authPlans=await preflightAuth(providers);}catch(error){
 const failure={status:'failed',success:false,stage:'authentication',startedAt,finishedAt:new Date().toISOString(),expectedRuns:providers.length*cases.length*options.repeat,completedRuns:0,passedRuns:0,failedRuns:0,unexecutedRuns:providers.length*cases.length*options.repeat,authError:{provider:error.provider??null,code:error.code??'AUTH_PROBE_FAILED',message:redactAuthError(error)},results:[]};
 await writeFile(join(output,'summary.json'),JSON.stringify(failure,null,2)+'\n');
 console.error(JSON.stringify(failure));process.exitCode=1;return;
}
const authentication=Object.fromEntries(providers.map(p=>[p,publicAuth(authPlans[p])]));
console.log(JSON.stringify({stage:'authentication',authentication}));
if(options.checkAuth){await writeFile(join(output,'auth.json'),JSON.stringify({startedAt,authentication},null,2)+'\n');return;}
const results=[];
await Promise.all(providers.map(async provider=>{
 for(let iteration=1;iteration<=options.repeat;iteration++)for(const test of cases){
  const cwd=await mkdtemp(join(tmpdir(),'aidocready-format-eval-'));const prompt=promptFor(test,skill,policy);
  const record={provider,authentication:publicAuth(authPlans[provider]),caseId:test.id,iteration,promptSha256:sha(prompt)};
  try{
   const execution=await execute(provider,{prompt,schema,cwd,timeoutMs:options.timeout,auth:authPlans[provider],model:process.env[provider==='codex'?'ADR_CODEX_MODEL':'ADR_CLAUDE_MODEL']});
   Object.assign(record,execution,{grade:grade(test,execution.response,{lintMarkdown,toolCalls:execution.toolCalls})});
  }catch(error){record.error=redactAuthError(error);record.grade={passed:false,issues:['execution_error'],sections:[]};}
  finally{await rm(cwd,{recursive:true,force:true});}
  results.push(record);await writeFile(join(output,`${provider}-${test.id}-${iteration}.json`),JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify({provider,case:test.id,iteration,model:record.model,passed:record.grade.passed,issues:[...record.grade.issues,...record.grade.sections.flatMap(s=>s.issues.map(i=>s.id+':'+i))],...(record.error?{error:record.error}:{})}));
  if(record.error){console.log(`${provider}: stopped after execution error; remaining cases are not counted as passes.`);return;}
 }
}));
const expected=providers.length*cases.length*options.repeat;
const summary={authentication,nodeVersion:process.version,codeHashes,startedAt,finishedAt:new Date().toISOString(),commit,engineVersion:VERSION,policySha256:sha(policy),skillSha256:sha(skill),datasetSha256:sha(JSON.stringify(all)),sdkVersions,repeats:options.repeat,expectedRuns:expected,completedRuns:results.length,passedRuns:results.filter(r=>r.grade.passed).length,failedRuns:results.filter(r=>!r.grade.passed).length,unexecutedRuns:expected-results.length,providers:providers.map(provider=>({provider,runs:results.filter(r=>r.provider===provider).length,passed:results.filter(r=>r.provider===provider&&r.grade.passed).length,models:[...new Set(results.filter(r=>r.provider===provider&&r.model).map(r=>r.model))]})),limitations:['Small synthetic, policy-conditioned evaluation; not a statistical model ranking.','Literal fact and numeric checks are partial safeguards; manual semantic review is required.','No performance, comprehension or official-compliance claim.'],results:results.map(({provider,caseId,iteration,grade,error})=>({provider,caseId,iteration,passed:grade.passed,issues:[...grade.issues,...grade.sections.flatMap(s=>s.issues.map(i=>s.id+':'+i))],...(error?{error}:{})}))};
await writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const md=`# Format selection SDK evaluation\n\nStarted: ${startedAt}\n\nEngine: ${VERSION}; repetitions: ${options.repeat}; completed: ${results.length}/${expected}; passed: ${summary.passedRuns}; failed: ${summary.failedRuns}.\n\n| Provider | Case | Run | Result | Issues |\n| --- | --- | --- | --- | --- |\n${summary.results.map(r=>`| ${r.provider} | ${r.caseId} | ${r.iteration} | ${r.passed?'PASS':'FAIL'} | ${r.issues.join(', ')} |`).join('\n')}\n\nThese are automated format/markup/partial fact checks. Review the saved outputs for semantic equivalence and rationale. Expected formats are withheld from agents. Live calls are opt-in; normal npm test never calls providers.\n`;
await writeFile(join(output,'report.md'),md);console.log(JSON.stringify({output,...summary,results:undefined}));
if(summary.failedRuns||summary.unexecutedRuns)process.exitCode=1;

}
await main();
