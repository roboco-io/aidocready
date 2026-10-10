import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectAuth,probeEnvironment,parseAuthStatus} from '../evals/format-selection/auth.mjs';
const none={subscription:false,storedApiKey:false};
for(const provider of ['codex','claude']){
 test(`${provider} subscription takes priority and removes API credentials without mutating parent`,async()=>{
  const env={OPENAI_API_KEY:'openai-fixture',CODEX_API_KEY:'codex-fixture',ANTHROPIC_API_KEY:'anthropic-fixture',ANTHROPIC_AUTH_TOKEN:'gateway-fixture',PATH:'/bin'};
  const auth=await selectAuth(provider,{env,probe:async(_p,e)=>{assert.equal(e.OPENAI_API_KEY,undefined);assert.equal(e.ANTHROPIC_API_KEY,undefined);return {subscription:true,storedApiKey:true};}});
  assert.equal(auth.method,'subscription');assert.equal(auth.env.OPENAI_API_KEY,undefined);assert.equal(auth.env.CODEX_API_KEY,undefined);assert.equal(auth.env.ANTHROPIC_API_KEY,undefined);assert.equal(auth.env.ANTHROPIC_AUTH_TOKEN,undefined);assert.equal(env.ANTHROPIC_API_KEY,'anthropic-fixture');assert.equal(auth.apiKey,undefined);
 });
 test(`${provider} uses environment API key only when subscription is absent`,async()=>{
  const auth=await selectAuth(provider,{env:{OPENAI_API_KEY:'openai-fixture',ANTHROPIC_API_KEY:'anthropic-fixture',CLAUDE_CODE_OAUTH_TOKEN:'oauth-fixture'},probe:async()=>none});
  assert.equal(auth.method,'api-key');if(provider==='codex')assert.equal(auth.apiKey,'openai-fixture');else{assert.equal(auth.env.ANTHROPIC_API_KEY,'anthropic-fixture');assert.equal(auth.env.CLAUDE_CODE_OAUTH_TOKEN,undefined);}
 });
 test(`${provider} accepts a CLI-reported stored API key`,async()=>assert.equal((await selectAuth(provider,{env:{},probe:async()=>({...none,storedApiKey:true})})).method,'api-key'));
 test(`${provider} fails when both subscription and key are absent`,async()=>await assert.rejects(selectAuth(provider,{env:{},probe:async()=>none}),{code:'AUTH_MISSING'}));
 test(`${provider} never silently charges API when subscription detection failed`,async()=>await assert.rejects(selectAuth(provider,{env:{OPENAI_API_KEY:'fixture',ANTHROPIC_API_KEY:'fixture'},probe:async()=>{throw new Error('probe failed');}}),{code:'AUTH_PROBE_FAILED'}));
}
test('Codex key precedence is explicit and whitespace keys are missing',async()=>{
 assert.equal((await selectAuth('codex',{env:{CODEX_API_KEY:'codex-fixture',OPENAI_API_KEY:'openai-fixture'},probe:async()=>none})).apiKey,'codex-fixture');
 await assert.rejects(selectAuth('codex',{env:{OPENAI_API_KEY:'  '},probe:async()=>none}),{code:'AUTH_MISSING'});
});
test('auth probe recognizes subscription, API login, signed-out and malformed status',()=>{
 assert.equal(parseAuthStatus('codex',{code:0,stdout:'',stderr:'Logged in using ChatGPT'}).subscription,true);
 assert.equal(parseAuthStatus('codex',{code:0,stdout:'Logged in using an API key',stderr:''}).storedApiKey,true);
 assert.deepEqual(parseAuthStatus('codex',{code:1,stdout:'',stderr:'Not logged in'}),none);
 assert.equal(parseAuthStatus('claude',{code:0,stdout:JSON.stringify({loggedIn:true,authMethod:'claude.ai',apiProvider:'firstParty'}),stderr:''}).subscription,true);
 assert.deepEqual(parseAuthStatus('claude',{code:1,stdout:JSON.stringify({loggedIn:false}),stderr:''}),none);
 assert.throws(()=>parseAuthStatus('claude',{code:0,stdout:'unexpected',stderr:''}));
});
test('probe retains subscription token and normal environment but removes competing routes',()=>{
 const e=probeEnvironment({PATH:'/bin',CLAUDE_CODE_OAUTH_TOKEN:'oauth-fixture',ANTHROPIC_API_KEY:'key-fixture',CLAUDE_CODE_USE_BEDROCK:'1',ANTHROPIC_BASE_URL:'https://invalid.example'});
 assert.equal(e.CLAUDE_CODE_OAUTH_TOKEN,'oauth-fixture');assert.equal(e.PATH,'/bin');assert.equal(e.CLAUDE_CODE_USE_BEDROCK,undefined);assert.equal(e.ANTHROPIC_BASE_URL,undefined);
});
test('preflight rejects the whole selected provider set before any model dispatch',async()=>{
 const {preflightAuth}=await import('../evals/format-selection/auth.mjs');let dispatched=0;
 await assert.rejects(async()=>{await preflightAuth(['codex','claude'],{env:{},resolveRuntime:()=>({}),probe:async(p)=>p==='codex'?{subscription:true,storedApiKey:false}:none});dispatched++;},{code:'AUTH_MISSING',provider:'claude'});
 assert.equal(dispatched,0);
});
test('public auth metadata and errors never reveal input keys',async()=>{
 const {publicAuth,redactAuthError}=await import('../evals/format-selection/auth.mjs');
 const env={OPENAI_API_KEY:'key-fixture-not-for-network'};const plan=await selectAuth('codex',{env,probe:async()=>none});
 assert.deepEqual(publicAuth(plan),{method:'api-key',source:'OPENAI_API_KEY'});
 assert.doesNotMatch(JSON.stringify(publicAuth(plan)),/key-fixture/);
 assert.equal(redactAuthError(new Error('bad key-fixture-not-for-network'),env),'bad [REDACTED]');
});
test('Codex routing follows the selected auth instead of inherited provider config',async()=>{
 const {codexRoutingFor}=await import('../evals/format-selection/auth.mjs');
 assert.deepEqual(codexRoutingFor('subscription'),{model_provider:'openai',openai_base_url:'https://chatgpt.com/backend-api/codex'});
 assert.deepEqual(codexRoutingFor('api-key'),{model_provider:'openai',openai_base_url:'https://api.openai.com/v1'});
});
test('Windows mixed-case API variables cannot override subscription or disappear from fallback lookup',async()=>{
 const env={Path:'C:\\bin',OpenAI_Api_Key:'openai-fixture',Anthropic_Api_Key:'anthropic-fixture',Claude_Code_OAuth_Token:'oauth-fixture'};
 for(const provider of ['codex','claude']){
  const sub=await selectAuth(provider,{env,platform:'win32',probe:async(_p,e)=>{assert.equal(e.OpenAI_Api_Key,undefined);assert.equal(e.Anthropic_Api_Key,undefined);return {subscription:true,storedApiKey:false};}});
  assert.equal(sub.method,'subscription');
  const api=await selectAuth(provider,{env,platform:'win32',probe:async()=>none});
  assert.equal(api.method,'api-key');assert.equal(api.env.Claude_Code_OAuth_Token,undefined);
  if(provider==='codex')assert.equal(api.apiKey,'openai-fixture');else assert.equal(api.env.ANTHROPIC_API_KEY,'anthropic-fixture');
 }
 assert.equal(env.OpenAI_Api_Key,'openai-fixture');
});
test('unrecognized cloud routing and mixed-case secret errors stay closed',async()=>{
 const {redactAuthError}=await import('../evals/format-selection/auth.mjs');
 assert.throws(()=>parseAuthStatus('claude',{code:0,stdout:JSON.stringify({loggedIn:false,apiProvider:'bedrock'}),stderr:''}));
 assert.equal(redactAuthError(new Error('failed private-fixture'),{Anthropic_Api_Key:' private-fixture '}),'failed [REDACTED]');
});
