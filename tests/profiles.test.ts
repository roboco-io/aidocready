import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseProfile} from '../src/profiles.js';
import {lintMarkdown} from '../src/index.js';
test('custom profile can disable an optional rule and marks the result custom',()=>{const p=parseProfile({id:'team',extends:'recommended',rules:{'ADR-HEADING-LEVEL':'off'}});const r:any=lintMarkdown('# 보고서\n\n### 결과',p);assert.equal(r.findings.length,0);assert.equal(r.profile,'team');assert.equal(r.profileOrigin,'aidocready');assert.equal(r.checks.find((c:any)=>c.ruleId==='ADR-HEADING-LEVEL').status,'disabled');});
test('custom severity does not overwrite official provenance',()=>{const p=parseProfile({id:'team',rules:{'MOIS-TABLE-CAPTION':'Error'}});const r=lintMarkdown('| A | B |\n| --- | --- |\n| C | D |',p);assert.equal(r.findings[0].severity,'Error');assert.equal(r.findings[0].origin,'mois');});
test('unknown rule IDs, severities, bases and official profile impersonation are rejected',()=>{for(const data of [{id:'team',rules:{wrong:'Error'}},{id:'team',rules:{'ADR-HEADING-LEVEL':'fatal'}},{id:'team',extends:'wrong'},{id:'mois-core'},{id:'team',officialSchema:true},{id:'team',rules:{'ADR-HEADING-LEVEL':['Error']}}])assert.throws(()=>parseProfile(data),(e:any)=>e.code==='INVALID_PROFILE');});

test('unknown built-in profile has a stable typed profile reason',()=>assert.throws(()=>lintMarkdown('본문','unknown'),(e:any)=>e.code==='INVALID_PROFILE'));
