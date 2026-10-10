import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkSiteImpact,validatePublishedRelease} from '../scripts/site-policy-lib.mjs';
const pkg={version:'0.2.0',engines:{node:'>=20'},dependencies:{kordoc:'4.21.9'},scripts:{test:'test'}};
const base={before:pkg,after:pkg,publicVersion:'0.2.0'};
const review={status:'updated',publicVersion:'0.2.0',areas:['manual'],summary:'Command behavior changed and the manual was revised.'};
test('CLI behavior changes require an updated website impact record',()=>assert.throws(()=>checkSiteImpact({...base,paths:['src/cli.ts'],review}),/impact/));
test('updating a matching manual satisfies website synchronization',()=>assert.doesNotThrow(()=>checkSiteImpact({...base,paths:['src/cli.ts','docs/site-impact.json','site/manual.html'],review})));
test('an update claim without matching web content fails',()=>assert.throws(()=>checkSiteImpact({...base,paths:['src/cli.ts','docs/site-impact.json'],review}),/manual/));
test('unreleased changes require a changed document draft',()=>{const pending={...review,status:'pending-release',draftPath:'docs/site-drafts/next-cli.md'};assert.throws(()=>checkSiteImpact({...base,paths:['src/cli.ts','docs/site-impact.json'],review:pending}),/draft/);assert.doesNotThrow(()=>checkSiteImpact({...base,paths:['src/cli.ts','docs/site-impact.json',pending.draftPath],review:pending}));});
test('explicit no-public-impact rationale is accepted for compatibility-only changes',()=>assert.doesNotThrow(()=>checkSiteImpact({...base,paths:['src/input.ts','docs/site-impact.json'],review:{status:'no-public-impact',publicVersion:'0.2.0',areas:[],summary:'Internal parser adaptation preserves public CLI behavior.'}})));
test('test-only and package-script-only changes do not force marketing edits',()=>{assert.equal(checkSiteImpact({...base,paths:['tests/rules.test.ts']}).required,false);assert.equal(checkSiteImpact({...base,after:{...pkg,scripts:{test:'new-test'}},paths:['package.json']}).required,false);});
test('package release and dependency changes trigger review',()=>{for(const after of [{...pkg,version:'0.3.0'},{...pkg,dependencies:{kordoc:'4.22.0'}}])assert.throws(()=>checkSiteImpact({...base,after,paths:['package.json']}),/impact/);});
test('website cannot advertise an unavailable release or unpublished git revision',()=>{const p={package:'aidocready',version:'0.2.0',releaseRef:'a'.repeat(40)};assert.throws(()=>validatePublishedRelease(p,{name:'aidocready',version:'0.3.0',gitHead:p.releaseRef}),/version/);assert.throws(()=>validatePublishedRelease(p,{name:'aidocready',version:p.version,gitHead:'b'.repeat(40)}),/reference/);assert.doesNotThrow(()=>validatePublishedRelease(p,{name:'aidocready',version:p.version,gitHead:p.releaseRef}));});
test('a newly published latest version cannot leave the website on an older release',()=>{const p={package:'aidocready',version:'0.2.0',releaseRef:'a'.repeat(40)};assert.throws(()=>validatePublishedRelease(p,{name:'aidocready',version:p.version,gitHead:p.releaseRef},'0.3.0'),/latest/);});

test('pending-release changes cannot alter live website content',()=>assert.throws(()=>checkSiteImpact({...base,paths:['src/cli.ts','docs/site-impact.json','docs/site-drafts/next-cli.md','site/manual.html'],review:{...review,status:'pending-release',draftPath:'docs/site-drafts/next-cli.md'}}),/public website/));
