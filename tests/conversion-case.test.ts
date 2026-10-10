import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderConversionMarkdown,validateConversionCase} from '../scripts/conversion-case-lib.mjs';
test('conversion view renders tables and line breaks without executing source HTML',()=>{
 const result=renderConversionMarkdown('| 업무 | 상태 |\n| --- | --- |\n| 자료<br>정리 | <script>alert(1)</script> |');
 assert.match(result,/<table>/);assert.match(result,/자료<br>정리/);assert.doesNotMatch(result,/<script>/);assert.match(result,/&lt;script&gt;/);
});
test('conversion artifact validation detects stale release, altered content and false totals',()=>{
 const data={version:'0.2.0',markdownSha256:'x',reportSha256:'y'};
 const report={summary:{Error:0,Warning:1,Suggestion:0},findings:[{severity:'Warning'}]};
 assert.doesNotThrow(()=>validateConversionCase(data,report,'0.2.0','x','y'));
 assert.throws(()=>validateConversionCase(data,report,'0.3.0','x','y'),/release/);
 assert.throws(()=>validateConversionCase(data,report,'0.2.0','z','y'),/hash/);
 assert.throws(()=>validateConversionCase(data,{...report,summary:{Error:0,Warning:2,Suggestion:0}},'0.2.0','x','y'),/summary/);
});
test('selected cases retain exact source lines and exclude unrelated diagnostics',async()=>{
 const {selectConversionExample}=await import('../scripts/conversion-case-lib.mjs');
 const result=selectConversionExample('one\ntwo\nthree\nfour\n',{findings:[{location:{line:1}},{location:{line:2}},{location:{line:4}}],coverage:{limitations:['line 2: unsupported','line 4: unsupported']}},{startLine:2,endLine:3});
 assert.equal(result.markdown,'two\nthree\n');assert.equal(result.findings.length,1);assert.deepEqual(result.limitations,['line 2: unsupported']);
 assert.throws(()=>selectConversionExample('one',{findings:[],coverage:{limitations:[]}},{startLine:1,endLine:2}),/range/);
});
