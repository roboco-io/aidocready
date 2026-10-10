import {isDeepStrictEqual} from 'node:util';
export const siteAreas=['landing','manual','faq','press'];
const packageFields=['name','description','version','engines','dependencies','optionalDependencies','peerDependencies','bin','exports','main','module','types','files','license','homepage'];
const areaPaths={landing:['site/index.html','site/conversion.html'],manual:['site/manual.html'],faq:['site/faq.html','site/faq.json'],press:['site/press-release.html']};
export function checkSiteImpact({paths,before,after,review,publicVersion}){
 const packageChanged=paths.includes('package.json')&&packageFields.some(key=>!isDeepStrictEqual(before?.[key],after?.[key]));
 const sourceChanged=paths.some(p=>/^(src\/|profiles\/|skills\/|templates\/|examples\/)/.test(p)||['README.md','CHANGELOG.md','docs/rules.md','docs/rule-provenance.md','docs/offline-usage.md'].includes(p));
 const webChanged=paths.some(p=>p.startsWith('site/')&&!p.endsWith('README.md'))||paths.includes('scripts/build-site.mjs');
 const required=packageChanged||sourceChanged||webChanged;
 if(!required)return {required:false,reason:'No public product or website changes.'};
 if(!paths.includes('docs/site-impact.json'))throw new Error('Missing updated website impact record: docs/site-impact.json');
 if(!review||!['updated','pending-release','no-public-impact'].includes(review.status)||typeof review.summary!=='string'||!review.summary.trim())throw new Error('Website impact status and rationale are required');
 if(review.publicVersion!==publicVersion)throw new Error('Website impact publicVersion must match site/product.json');
 if(!Array.isArray(review.areas)||review.areas.some(a=>!siteAreas.includes(a))||new Set(review.areas).size!==review.areas.length)throw new Error('Invalid website impact areas');
 if(review.status==='no-public-impact'){
  if(review.areas.length||webChanged||before?.version!==after?.version)throw new Error('Release or website changes cannot claim no-public-impact');
 }else{
  if(!review.areas.length)throw new Error('Affected website areas are required');
  if(review.status==='updated'){
   const shared=paths.includes('scripts/build-site.mjs')||paths.includes('site/product.json')||paths.some(p=>p.startsWith('site/assets/'));
   for(const area of review.areas)if(!shared&&!areaPaths[area].some(p=>paths.includes(p)))throw new Error(`Missing updated ${area} page`);
  }else if(webChanged)throw new Error('pending-release cannot change the public website; keep changes in a draft');
  else if(typeof review.draftPath!=='string'||!/^docs\/site-drafts\/[a-z0-9-]+\.md$/.test(review.draftPath)||!paths.includes(review.draftPath))throw new Error('Missing changed website draft for pending-release');
 }
 return {required:true,status:review.status,areas:review.areas,summary:review.summary};
}
export function validatePublishedRelease(product,release,latestVersion=product.version){
 if(latestVersion!==product.version)throw new Error('Website is behind npm latest; update the released product pages');
 if(release?.name!==product.package||release?.version!==product.version)throw new Error('Website version does not match the published npm version');
 if(release?.gitHead!==product.releaseRef)throw new Error('Website release reference does not match published npm gitHead');
}
