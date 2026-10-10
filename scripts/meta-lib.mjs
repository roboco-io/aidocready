import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
export async function syncArtifacts(root,artifacts,check=false) {
 const changed=[];
 for(const [path,content] of Object.entries(artifacts)){
  const target=join(root,path);let existing;try{existing=await readFile(target,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(existing===content)continue;changed.push(path);
  if(!check){await mkdir(dirname(target),{recursive:true});await writeFile(target,content);}
 }
 if(check&&changed.length)throw new Error('Metadata drift: '+changed.join(', '));
 return changed;
}
