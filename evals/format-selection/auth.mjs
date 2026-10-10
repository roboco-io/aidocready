import {execFile} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);
const competing=['OPENAI_API_KEY','CODEX_API_KEY','ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','OPENAI_BASE_URL','ANTHROPIC_BASE_URL','ANTHROPIC_PROFILE','ANTHROPIC_FEDERATION_RULE_ID','ANTHROPIC_ORGANIZATION_ID','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY','CLAUDE_CODE_USE_MANTLE'];
export class AuthError extends Error{constructor(provider,code){super(`${provider}: ${code}. Subscription login or an API key is required; no model request was started.`);this.code=code;this.provider=provider;}}
const sameKey=(a,b,platform)=>platform==='win32'?a.toUpperCase()===b:a===b;
const valueOf=(env,name,platform)=>env[name]??Object.entries(env).find(([key])=>sameKey(key,name,platform))?.[1];
function removeKey(env,name,platform){for(const key of Object.keys(env))if(sameKey(key,name,platform))delete env[key];}
export function probeEnvironment(env,{platform=process.platform}={}){const clean={...env};for(const key of competing)removeKey(clean,key,platform);return clean;}
// Native Codex 0.162.1 otherwise lets an inherited provider/base URL override auth-dependent routing.
export function codexRoutingFor(method){if(!['subscription','api-key'].includes(method))throw new AuthError('codex','AUTH_METHOD_INVALID');return {model_provider:'openai',openai_base_url:method==='subscription'?'https://chatgpt.com/backend-api/codex':'https://api.openai.com/v1'};}
export function parseAuthStatus(provider,{code,stdout='',stderr=''}){
 if(provider==='codex'){
  const output=stdout+'\n'+stderr;
  if(code===0&&/Logged in using ChatGPT/i.test(output))return {subscription:true,storedApiKey:false};
  if(code===0&&/Logged in using an API key/i.test(output))return {subscription:false,storedApiKey:true};
  if(code===1&&/Not logged in/i.test(output))return {subscription:false,storedApiKey:false};
 }else{
  let result;try{result=JSON.parse(stdout);}catch{throw new AuthError(provider,'AUTH_PROBE_FAILED');}
  if(result.apiProvider&&result.apiProvider!=='firstParty')throw new AuthError(provider,'AUTH_PROBE_FAILED');
  if(result.loggedIn===false&&[0,1].includes(code))return {subscription:false,storedApiKey:false};
  if(code===0&&result.loggedIn===true&&result.apiProvider==='firstParty'){
   if(['claude.ai','oauth_token'].includes(result.authMethod))return {subscription:true,storedApiKey:false};
   if(result.authMethod==='api_key')return {subscription:false,storedApiKey:true};
  }
 }
 throw new AuthError(provider,'AUTH_PROBE_FAILED');
}
export function runtimeFor(provider){
 try{
  if(provider==='codex')return {command:process.execPath,args:[join(dirname(require.resolve('@openai/codex/package.json')),'bin/codex.js')],sdkExecutable:undefined};
  const sdkRequire=createRequire(require.resolve('@anthropic-ai/claude-agent-sdk'));
  const musl=process.platform==='linux'&&!process.report.getReport().header.glibcVersionRuntime?'-musl':'';
  const pkg=`@anthropic-ai/claude-agent-sdk-${process.platform}-${process.arch}${musl}`;
  const executable=join(dirname(sdkRequire.resolve(pkg+'/package.json')),process.platform==='win32'?'claude.exe':'claude');
  return {command:executable,args:[],sdkExecutable:executable};
 }catch{throw new AuthError(provider,'AUTH_RUNTIME_MISSING');}
}
export async function probeLogin(provider,env,runtime=runtimeFor(provider)){
 const args=provider==='codex'?['login','status']:['--setting-sources','','auth','status','--json'];
 const result=await new Promise((resolve,reject)=>execFile(runtime.command,[...runtime.args,...args],{env,timeout:20000,maxBuffer:128*1024,windowsHide:true},(error,stdout,stderr)=>{
  if(error&&(typeof error.code!=='number'||error.killed))return reject(new AuthError(provider,'AUTH_PROBE_FAILED'));
  resolve({code:error?.code??0,stdout,stderr});
 }));
 return parseAuthStatus(provider,result);
}
export async function selectAuth(provider,{env=process.env,probe=probeLogin,runtime,platform=process.platform}={}){
 if(!['codex','claude'].includes(provider))throw new AuthError(provider,'AUTH_PROVIDER_INVALID');
 const clean=probeEnvironment(env,{platform});let login;
 try{login=await probe(provider,clean,runtime);}catch(error){throw error instanceof AuthError?error:new AuthError(provider,'AUTH_PROBE_FAILED');}
 // The plan is private: only method/source may be serialized. The child env may hold credentials.
 if(login.subscription){if(provider==='codex')removeKey(clean,'CLAUDE_CODE_OAUTH_TOKEN',platform);return {method:'subscription',source:provider==='claude'&&valueOf(env,'CLAUDE_CODE_OAUTH_TOKEN',platform)?'CLAUDE_CODE_OAUTH_TOKEN':'cli-login',env:clean};}
 removeKey(clean,'CLAUDE_CODE_OAUTH_TOKEN',platform);
 const keyNames=provider==='codex'?['CODEX_API_KEY','OPENAI_API_KEY']:['ANTHROPIC_API_KEY'];
 const keyName=keyNames.find(name=>typeof valueOf(env,name,platform)==='string'&&valueOf(env,name,platform).trim());
 if(keyName){
  const key=valueOf(env,keyName,platform).trim();
  if(provider==='claude')clean.ANTHROPIC_API_KEY=key;
  return {method:'api-key',source:keyName,env:clean,...(provider==='codex'?{apiKey:key}:{})};
 }
 if(login.storedApiKey)return {method:'api-key',source:'cli-login',env:clean};
 throw new AuthError(provider,'AUTH_MISSING');
}
export async function preflightAuth(providers,{env=process.env,probe=probeLogin,resolveRuntime=runtimeFor}={}){
 const plans={};
 for(const provider of providers){const runtime=resolveRuntime(provider);plans[provider]={...await selectAuth(provider,{env,probe,runtime}),runtime};}
 return plans;
}
export const publicAuth=plan=>({method:plan.method,source:plan.source});
export function redactAuthError(error,env=process.env){
 let text=String(error?.message??error);
 const sensitive=new Set([...competing,'CLAUDE_CODE_OAUTH_TOKEN','CODEX_ACCESS_TOKEN']);
 for(const [key,value] of Object.entries(env))if(sensitive.has(key.toUpperCase())&&typeof value==='string'&&value.trim().length>3)text=text.replaceAll(value.trim(),'[REDACTED]');
 return text.replace(/Bearer\s+\S+|sk-[A-Za-z0-9_-]+/g,'[REDACTED]').slice(0,2000);
}
