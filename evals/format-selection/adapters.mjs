import {codexRoutingFor} from './auth.mjs';
import {Codex} from '@openai/codex-sdk';
import {query} from '@anthropic-ai/claude-agent-sdk';
export async function execute(provider,{prompt,schema,cwd,timeoutMs,model,auth}){
 if(!auth?.env||!['subscription','api-key'].includes(auth.method))throw new Error('Authentication preflight is required');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 const start=Date.now();
 try{
  if(provider==='codex'){
   const client=new Codex({env:auth.env,...(auth.apiKey?{apiKey:auth.apiKey}:{}),config:{...codexRoutingFor(auth.method),features:{shell_tool:false,shell_snapshot:false,multi_agent:false},developer_instructions:'Closed-book document-format evaluation. Use only the supplied policy and facts. Do not call tools, inspect files, execute commands, or request approvals. Return the requested structured result.'},configOverrides:['mcp_servers={}']});
   const thread=client.startThread({workingDirectory:cwd,skipGitRepoCheck:true,sandboxMode:'read-only',approvalPolicy:'never',networkAccessEnabled:false,webSearchMode:'disabled',...(model?{model}:{})});
   const turn=await thread.run(prompt,{outputSchema:schema,signal:controller.signal});
   return {response:JSON.parse(turn.finalResponse),model:model??'configured-default',usage:turn.usage,sessionId:thread.id,durationMs:Date.now()-start,toolCalls:turn.items.filter(i=>['command_execution','file_change','mcp_tool_call','web_search'].includes(i.type)).map(i=>i.type)};
  }
  let output;let modelUsed=model??null;let usage;let cost;let sessionId;const toolCalls=[];
  const stream=query({prompt,options:{cwd,env:auth.env,pathToClaudeCodeExecutable:auth.runtime?.sdkExecutable,tools:[],skills:[],settingSources:[],mcpServers:{},strictMcpConfig:true,persistSession:false,maxTurns:4,maxBudgetUsd:1,abortController:controller,outputFormat:{type:'json_schema',schema},...(model?{model}:{})}});
  for await(const message of stream){
   if(message.type==='system'&&message.subtype==='init'){modelUsed=message.model;sessionId=message.session_id;}
   if(message.type==='assistant')for(const content of message.message.content??[])if(content.type==='tool_use'&&content.name!=='StructuredOutput')toolCalls.push(content.name);
   if(message.type==='result'){
    usage=message.usage;cost=message.total_cost_usd;
    if(message.subtype!=='success'||message.is_error)throw new Error('Claude SDK result: '+message.subtype+' '+(message.errors??[]).join(' '));
    output=message.structured_output;if(!output&&message.result)output=JSON.parse(message.result);
   }
  }
  if(!output)throw new Error('Claude SDK returned no structured output');
  return {response:output,model:modelUsed,usage,costUsd:cost,sessionId,durationMs:Date.now()-start,toolCalls};
 }finally{clearTimeout(timer);}
}
