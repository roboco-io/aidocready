import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join,dirname,relative} from 'node:path';
export async function validateSite(root) {
 root=resolve(root);const pages=[];const errors=[];
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(p.endsWith('.html'))pages.push(p);}}
 await walk(root);
 for(const file of pages){
  const html=await readFile(file,'utf8');const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(`${relative(root,file)}: duplicate id`);
  if(/\{\{[A-Z_]+\}\}/.test(html))errors.push(`${relative(root,file)}: unresolved token`);
  for(const match of html.matchAll(/\b(?:href|src)=["']([^"']*)["']/g)){
   const ref=match[1].replaceAll('&amp;','&');
   if(/^(https?:|mailto:|tel:|data:)/i.test(ref))continue;
   if(!ref||/^javascript:/i.test(ref)){errors.push(`${relative(root,file)}: invalid link ${ref}`);continue;}
   const [pathAndQuery,hash]=ref.split('#');const path=pathAndQuery.split('?')[0];
   const target=path?resolve(dirname(file),decodeURIComponent(path)):file;
   if(relative(root,target).startsWith('..')){errors.push(`${relative(root,file)}: link escapes site ${ref}`);continue;}
   let info;try{info=await stat(target);}catch{errors.push(`${relative(root,file)}: missing target ${ref}`);continue;}
   if(!info.isFile()){errors.push(`${relative(root,file)}: non-file target ${ref}`);continue;}
   if(hash&&target.endsWith('.html')){const content=await readFile(target,'utf8');const anchors=[...content.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);if(!anchors.includes(decodeURIComponent(hash)))errors.push(`${relative(root,file)}: missing anchor ${ref}`);}
  }
 }
 if(errors.length)throw new Error(errors.join('\n'));
 return pages.map(p=>relative(root,p));
}
