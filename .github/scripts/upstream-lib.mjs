import assert from 'node:assert/strict';
export function stableVersion(value) {
 if(typeof value!=='string'||! /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))throw new Error('Expected exact stable semver');
 return value;
}
export function planUpdate(current,target,auditOnly=false) {
 stableVersion(current);stableVersion(target);
 const a=current.split('.').map(Number),b=target.split('.').map(Number);
 let changed=false;for(let i=0;i<3;i++){if(a[i]!==b[i]){changed=b[i]>a[i];break;}}
 return {current,target:auditOnly||!changed?current:target,changed:changed&&!auditOnly,runAgent:changed||auditOnly,auditOnly};
}
export function validateChanges(paths,before,after,target,auditOnly=false) {
 stableVersion(target);
 if(auditOnly&&paths.length)throw new Error('Audit must not modify repository files');
 for(const path of paths)if(! /^(?:src\/|tests\/|docs\/|profiles\/|README\.md$|package(?:-lock)?\.json$)/.test(path)||path.includes('..'))throw new Error(`Unexpected changed path: ${path}`);
 const expected=structuredClone(before);expected.dependencies.kordoc=target;
 assert.deepEqual(after,expected,'Only the kordoc package.json dependency may change');
}
export function parsePiSummary(events,secret='') {
 const messages=events.filter(e=>e.type==='message_end'&&e.message?.role==='assistant').map(e=>e.message);
 const last=messages.at(-1);
 if(!last||last.stopReason!=='stop')throw new Error('pi did not complete successfully');
 let summary=(last.content??[]).filter(c=>c.type==='text').map(c=>c.text).join('\n');
 if(!summary.trim())throw new Error('pi returned no final summary');
 if(secret)summary=summary.split(secret).join('[REDACTED]');
 return summary;
}
