import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {checkSiteImpact} from './site-policy-lib.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const baseIndex=process.argv.indexOf('--base');let base=baseIndex>=0?process.argv[baseIndex+1]:process.env.SITE_SYNC_BASE;
if(!base||/^0+$/.test(base))base=git('rev-parse','HEAD^');
if(!/^[a-f0-9]{40}$/.test(base))throw new Error('Site synchronization base must be a full commit SHA');
const paths=[...new Set([...git('diff','--name-only','-z',base,'--').split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean))];
let before;try{before=JSON.parse(git('show',`${base}:package.json`));}catch{before={};}
const after=JSON.parse(await readFile('package.json','utf8'));const product=JSON.parse(await readFile('site/product.json','utf8'));
let review;try{review=JSON.parse(await readFile('docs/site-impact.json','utf8'));}catch{}
const result=checkSiteImpact({paths,before,after,review,publicVersion:product.version});
if(result.status==='pending-release'){const draft=await readFile(review.draftPath,'utf8');if(!draft.trim())throw new Error('Website draft must have substantive content');}
console.log(JSON.stringify({base,...result},null,2));
