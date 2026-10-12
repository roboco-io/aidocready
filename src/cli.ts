#!/usr/bin/env node
import {assertByteLimit} from './limits.js';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {VERSION as KORDOC_VERSION} from 'kordoc';
import {VERSION} from './version.js';
import {AidocreadyError} from './errors.js';
import {lintFile} from './input.js';
import {lintMarkdown} from './index.js';
import {rules} from './rules.js';
import {loadProfile,resolveProfile,type ProfileInput} from './profiles.js';
import {collectInputs,protectInputs} from './files.js';
import {writingSetup} from './writing-setup.js';
import type {LintResult,Severity} from './model.js';
const args=process.argv.slice(2);
const wantsJson=args.some((arg,i)=>arg==='--format'&&args[i+1]==='json');
const usage='aidocready lint <files|directories|-> [--format text|json] [--profile recommended|mois-core | --config profile.json] [--output result.json] [--fail-on Error|Warning|Suggestion]\naidocready rules [rule-id] [--format text|json]\naidocready doctor [--format text|json]\naidocready setup [--target chatgpt|claude] [--format text|json] [--output instructions.txt]';
function operational(error:unknown){return {code:'INPUT_ERROR',reason:error instanceof AidocreadyError?error.code:'INVALID_ARGUMENT',...(error instanceof AidocreadyError&&error.causeCode?{causeCode:error.causeCode}:{}),message:error instanceof Error?error.message:String(error)};}
function textResult(result:LintResult&{file:string}){
 const lines=result.findings.map(f=>`${f.severity} ${f.ruleId} [${f.origin}] ${result.file}:${f.location.line??f.location.path}: ${f.message}`);
 lines.push(`Error ${result.summary.Error} / Warning ${result.summary.Warning} / Suggestion ${result.summary.Suggestion}`,'수동 검토: '+result.coverage.manualReview.join(', '));
 if(!result.coverage.complete)lines.push('검사 불완전: '+result.coverage.limitations.join('; '));
 if(result.parserWarnings.length)lines.push('파서 경고: '+JSON.stringify(result.parserWarnings));return lines.join('\n');
}
try {
 if(!args.length||args[0]==='--help'||args[0]==='-h')console.log(usage);
 else if(args[0]==='--version')console.log(VERSION);
 else {
  const command=args.shift()!;if(!['lint','rules','doctor','setup'].includes(command))throw new AidocreadyError('INVALID_ARGUMENT',`알 수 없는 명령: ${command}`);
  const inputs:string[]=[];let format='text',config:string|undefined,output:string|undefined,target:string|undefined;let profile:ProfileInput='recommended';let specifiedProfile=false;let failOn:Severity='Error';
  while(args.length){
   const arg=args.shift()!;
   if(arg==='--'){inputs.push(...args);break;}
   if(arg.startsWith('-')&&arg!=='-'){
    if(!['--format','--profile','--config','--output','--fail-on','--target'].includes(arg))throw new AidocreadyError('INVALID_ARGUMENT',`알 수 없는 옵션: ${arg}`);
    const value=args.shift();if(!value||value.startsWith('--'))throw new AidocreadyError('INVALID_ARGUMENT',`${arg} 값이 필요합니다.`);
    if(arg==='--format'){if(!['text','json'].includes(value))throw new AidocreadyError('INVALID_ARGUMENT','format은 text 또는 json이어야 합니다.');format=value;}
    if(arg==='--profile'){profile=value;specifiedProfile=true;}
    if(arg==='--config')config=value;
    if(arg==='--output')output=value;
    if(arg==='--target')target=value;
    if(arg==='--fail-on'){if(!['Error','Warning','Suggestion'].includes(value))throw new AidocreadyError('INVALID_ARGUMENT','fail-on은 Error, Warning, Suggestion이어야 합니다.');failOn=value as Severity;}
   }else inputs.push(arg);
  }
  if(config&&specifiedProfile)throw new AidocreadyError('INVALID_ARGUMENT','--config와 --profile 중 하나만 사용하세요.');
  if(target&&command!=='setup')throw new AidocreadyError('INVALID_ARGUMENT','--target은 setup 명령에서만 사용하세요.');
  if(target&&(config||specifiedProfile))throw new AidocreadyError('INVALID_ARGUMENT','작성 지침은 고정 정책입니다. --target과 --config/--profile을 함께 사용할 수 없습니다.');
  if(config)profile=await loadProfile(config);const selected=resolveProfile(profile);
  let content:string;
  if(command==='rules'){
   if(inputs.length>1)throw new AidocreadyError('INVALID_ARGUMENT','규칙 ID는 하나만 입력하세요.');
   const chosen=rules.filter(r=>selected.severities.has(r.id)&&(!inputs.length||r.id===inputs[0])).map(r=>({...r,severity:selected.severities.get(r.id)}));
   if(!chosen.length)throw new AidocreadyError('INVALID_ARGUMENT','선택한 프로파일에 규칙이 없습니다.');
   content=format==='json'?JSON.stringify({schemaVersion:1,profile:selected.id,rules:chosen},null,2):chosen.map(r=>`${r.id} [${r.origin}] ${r.severity}: ${r.principle}\n  구현: ${r.implementation}`).join('\n');
  }else if(command==='doctor'||command==='setup'){
   if(inputs.length)throw new AidocreadyError('INVALID_ARGUMENT','이 명령은 입력 파일을 받지 않습니다.');
   if(target){
    const info=await writingSetup(target);
    content=format==='json'?JSON.stringify(info,null,2):output?info.instructions:`${info.setupSteps.join('\n')}\n\n아래 작성 지침을 붙여 넣기 하세요. 계정 설정은 직접 저장해야 합니다.\n\n${info.instructions}`;
   }else{
   const skillPath=fileURLToPath(new URL('../skills/aidocready/SKILL.md',import.meta.url));
   const info={version:VERSION,nodeVersion:process.versions.node,kordocVersion:KORDOC_VERSION,supportedFormats:['Markdown','HWPX'],offlineCLI:true,skillPath,agents:['Codex','Claude Code','pi'],instructions:'SKILL.md를 에이전트의 설정된 스킬 디렉터리에 복사하세요. AGENTS.md/CLAUDE.md 템플릿은 기존 지침에 필요한 내용만 합치세요. setup은 파일을 변경하지 않습니다.'};
   content=format==='json'?JSON.stringify(info,null,2):`AI Doc Ready ${VERSION}\nNode.js ${info.nodeVersion} / Kordoc ${KORDOC_VERSION}\nSKILL.md: ${skillPath}\n${info.instructions}${command==='setup'?'\nChatGPT·Claude 웹/앱 작성 지침: setup --target chatgpt 또는 setup --target claude':''}`;
   }
  }else {
   if(!inputs.length)throw new AidocreadyError('INVALID_ARGUMENT','입력 파일이 필요합니다.');
   const results:Array<Awaited<ReturnType<typeof lintFile>>>=[];const errors:Array<{file:string;error:ReturnType<typeof operational>}>=[];
   let paths:string[];let batchMode=false;
   if(inputs.includes('-')){
    if(inputs.length!==1)throw new AidocreadyError('INVALID_ARGUMENT','stdin은 다른 입력과 함께 사용할 수 없습니다.');
    const chunks:Buffer[]=[];let bytes=0;for await(const chunk of process.stdin){const buffer=Buffer.from(chunk);bytes+=buffer.length;assertByteLimit(bytes);chunks.push(buffer);}
    let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));}catch{throw new AidocreadyError('INVALID_ENCODING','stdin은 UTF-8 Markdown이어야 합니다.');}
    paths=[];results.push({...lintMarkdown(text,profile),file:'-',inputFormat:'markdown'});
   }else{const collected=await collectInputs(inputs);paths=collected.paths;batchMode=collected.batch;errors.push(...collected.failures.map(f=>({file:f.file,error:operational(f.error)})));for(const path of paths){try{results.push(await lintFile(path,profile));}catch(e){errors.push({file:path,error:operational(e)});}}}
   if(output)await protectInputs(output,[...paths,...(config?[config]:[])]);
   const summary={Error:0,Warning:0,Suggestion:0};for(const result of results)for(const level of ['Error','Warning','Suggestion'] as Severity[])summary[level]+=result.summary[level];
   if(!batchMode&&results.length===0&&errors.length===1)content=format==='json'?JSON.stringify({schemaVersion:1,...errors[0]},null,2):`${errors[0].file}: ${errors[0].error.message}`;
   else if(!batchMode&&results.length===1&&!errors.length)content=format==='json'?JSON.stringify(results[0],null,2):textResult(results[0]);
   else content=format==='json'?JSON.stringify({schemaVersion:1,results,errors,summary},null,2):[...results.map(textResult),...errors.map(e=>`${e.file}: ${e.error.message}`)].join('\n\n');
   const levels:Severity[]=['Error','Warning','Suggestion'];if(errors.length)process.exitCode=2;else if(results.some(r=>!r.coverage.complete)||levels.slice(0,levels.indexOf(failOn)+1).some(s=>summary[s]>0))process.exitCode=1;
  }
  if(output){await protectInputs(output,config?[config]:[]);try{await writeFile(output,content+'\n',target?{flag:'wx'}:undefined);}catch(e){throw new AidocreadyError('FILE_WRITE_FAILED',`결과 파일을 쓸 수 없습니다: ${output}`,(e as NodeJS.ErrnoException).code);}}else console.log(content);
 }
}catch(error){if(wantsJson)console.log(JSON.stringify({schemaVersion:1,error:operational(error)}));else console.error(operational(error).message+'\n'+usage);process.exitCode=2;}
