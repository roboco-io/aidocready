import {lstat,readdir,realpath,stat} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import {AidocreadyError} from './errors.js';
const supported=new Set(['.md','.markdown','.hwpx']);
export async function collectInputs(inputs:string[]) {
 const found=new Map<string,string>();const failures:Array<{file:string;error:AidocreadyError}>=[];let directory=false;
 function failed(path:string,e:unknown){const code=(e as NodeJS.ErrnoException).code;failures.push({file:path,error:new AidocreadyError(code==='ENOENT'?'FILE_NOT_FOUND':'FILE_READ_FAILED',`입력 경로를 읽을 수 없습니다: ${path}`,code)});}
 async function visit(path:string,explicit=false):Promise<void>{
  let info;try{info=await lstat(path);}catch(e){failed(path,e);return;}
  if(info.isDirectory()){
   if(explicit)directory=true;let entries;try{entries=await readdir(path,{withFileTypes:true});}catch(e){failed(path,e);return;}
   for(const entry of entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0))if(!entry.isSymbolicLink())await visit(join(path,entry.name));
  }else if(explicit||supported.has(extname(path).toLowerCase()))found.set(resolve(path),path);
 }
 for(const input of inputs)await visit(input,true);
 const paths=[...found.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,path])=>path);
 if(!paths.length&&!failures.length)throw new AidocreadyError('INVALID_ARGUMENT','검사할 Markdown/HWPX 파일이 없습니다.');
 return {paths,failures,batch:inputs.length>1||directory};
}
export async function protectInputs(output:string,inputs:string[]):Promise<void>{
 const canonical=async(path:string)=>{try{return await realpath(path);}catch{return resolve(path);}};
 const identity=async(path:string)=>{try{return await stat(path);}catch{return undefined;}};
 const target=await canonical(output);const outputInfo=await identity(output);
 for(const input of inputs){const inputInfo=await identity(input);if(target===await canonical(input)||(outputInfo&&inputInfo&&outputInfo.dev===inputInfo.dev&&outputInfo.ino===inputInfo.ino))throw new AidocreadyError('INVALID_ARGUMENT','결과 파일은 원본 문서나 설정 파일을 덮어쓸 수 없습니다.');}
}
