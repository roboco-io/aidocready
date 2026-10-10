import {lstat,readdir,realpath} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import {AidocreadyError} from './errors.js';
const supported=new Set(['.md','.markdown','.hwpx']);
export async function collectInputs(inputs:string[]):Promise<string[]> {
 const found=new Map<string,string>();
 async function visit(path:string,explicit=false):Promise<void>{
  let info;try{info=await lstat(path);}catch(e){throw new AidocreadyError('FILE_NOT_FOUND',`입력 경로를 찾을 수 없습니다: ${path}`,(e as NodeJS.ErrnoException).code);}
  if(info.isDirectory()){
   for(const entry of (await readdir(path,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0))if(!entry.isSymbolicLink())await visit(join(path,entry.name));
  }else if(explicit||supported.has(extname(path).toLowerCase()))found.set(resolve(path),path);
 }
 for(const input of inputs)await visit(input,true);
 const result=[...found.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,path])=>path);
 if(!result.length)throw new AidocreadyError('INVALID_ARGUMENT','검사할 Markdown/HWPX 파일이 없습니다.');return result;
}
export async function protectInputs(output:string,inputs:string[]):Promise<void>{
 const canonical=async(path:string)=>{try{return await realpath(path);}catch{return resolve(path);}};
 const target=await canonical(output);
 for(const input of inputs)if(target===await canonical(input))throw new AidocreadyError('INVALID_ARGUMENT','결과 파일은 원본 문서나 설정 파일을 덮어쓸 수 없습니다.');
}
