import {readFile} from 'node:fs/promises';
import {validatePublishedRelease} from './site-policy-lib.mjs';
const product=JSON.parse(await readFile('site/product.json','utf8'));
if(product.package!=='aidocready'||!/^\d+\.\d+\.\d+$/.test(product.version))throw new Error('Invalid website release configuration');
const response=await fetch(`https://registry.npmjs.org/${product.package}/latest`,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`Website release is not publicly available in npm: HTTP ${response.status}`);
const release=await response.json();
validatePublishedRelease(product,release,release.version);
console.log(`Public website release verified: ${product.package}@${product.version}`);
