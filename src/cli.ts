#!/usr/bin/env node
import { VERSION } from './version.js';
import { lintFile } from './input.js';
import { profiles, requireProfile, rules } from './rules.js';
import type { Severity } from './model.js';
const args=process.argv.slice(2);
const wantsJson=args.some((arg,i)=>arg==='--format'&&args[i+1]==='json');
const usage='aidocready lint <report.md|report.hwpx> [--format text|json] [--profile recommended|mois-core] [--fail-on Error|Warning|Suggestion]\naidocready rules [--format text|json]';
try {
 if(args.length===0||args[0]==='--help'||args[0]==='-h') {console.log(usage);}
 else if(args[0]==='--version')console.log(VERSION);
 else {
  const command=args.shift();if(command!=='lint'&&command!=='rules')throw new Error(`알 수 없는 명령: ${command}`);
  let file:string|undefined;let format='text';let profile='recommended';let failOn:Severity='Error';
  while(args.length) {
   const arg=args.shift()!;
   if(arg.startsWith('-')) {
    if(!['--format','--profile','--fail-on'].includes(arg))throw new Error(`알 수 없는 옵션: ${arg}`);
    const value=args.shift();if(!value||value.startsWith('-'))throw new Error(`${arg} 값이 필요합니다.`);
    if(arg==='--format'){if(!['text','json'].includes(value))throw new Error('format은 text 또는 json이어야 합니다.');format=value;}
    if(arg==='--profile')profile=requireProfile(value);
    if(arg==='--fail-on'){if(!['Error','Warning','Suggestion'].includes(value))throw new Error('fail-on은 Error, Warning, Suggestion이어야 합니다.');failOn=value as Severity;}
   } else if(file)throw new Error('한 번에 파일 하나를 입력하세요.');else file=arg;
  }
  requireProfile(profile);
  if(command==='rules') {
   if(file)throw new Error('rules 명령에는 파일을 입력하지 않습니다.');
   const selected=rules.filter(r=>profiles[requireProfile(profile)].includes(r.id));
   console.log(format==='json'?JSON.stringify({schemaVersion:1,profile,rules:selected},null,2):selected.map(r=>`${r.id} [${r.origin}] ${r.severity}: ${r.principle}\n  구현: ${r.implementation}`).join('\n'));
  } else {
   if(!file)throw new Error('입력 파일이 필요합니다.');
   const result=await lintFile(file,profile);
   if(format==='json')console.log(JSON.stringify(result,null,2));
   else {
    for(const f of result.findings)console.log(`${f.severity} ${f.ruleId} [${f.origin}] ${f.location.line?`line ${f.location.line}`:f.location.path}: ${f.message}`);
    console.log(`Error ${result.summary.Error} / Warning ${result.summary.Warning} / Suggestion ${result.summary.Suggestion}`);
    console.log('수동 검토: '+result.coverage.manualReview.join(', '));
    if(!result.coverage.complete)console.log('검사 불완전: '+result.coverage.limitations.join('; '));
    if(result.parserWarnings.length)console.log('파서 경고: '+JSON.stringify(result.parserWarnings));
   }
   const levels:Severity[]=['Error','Warning','Suggestion'];
   if(!result.coverage.complete||levels.slice(0,levels.indexOf(failOn)+1).some(s=>result.summary[s]>0))process.exitCode=1;
  }
 }
} catch(error) {
 const message=error instanceof Error?error.message:String(error);
 if(wantsJson)console.log(JSON.stringify({schemaVersion:1,error:{code:'INPUT_ERROR',message}}));else console.error(message+'\n'+usage);
 process.exitCode=2;
}
