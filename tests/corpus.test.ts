import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareFindings} from '../scripts/corpus-lib.mjs';
test('corpus gate catches missed and unexpected diagnoses',()=>{const r=compareFindings([{ruleId:'A',path:'x'}],[{ruleId:'B',location:{path:'x'}}]);assert.equal(r.passed,false);assert.equal(r.missing.length,1);assert.equal(r.unexpected.length,1);});
test('corpus gate counts duplicate diagnostics rather than deduplicating',()=>{const r=compareFindings([{ruleId:'A',path:'x'}],[{ruleId:'A',location:{path:'x'}},{ruleId:'A',location:{path:'x'}}]);assert.equal(r.unexpected.length,1);});
