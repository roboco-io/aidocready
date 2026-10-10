import type { ProfileInput } from './profiles.js';
import { assertByteLimit } from './limits.js';
import { readFile,stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { parse } from 'kordoc';
import { markdownBlocks } from './markdown.js';
import { AidocreadyError } from './errors.js';
import { lintBlocks } from './engine.js';
export async function lintFile(path:string,profile:ProfileInput='recommended',options:{maxBytes?:number}={}) {
 const ext=extname(path).toLowerCase();
 if(!['.md','.markdown','.hwpx'].includes(ext))throw new AidocreadyError('UNSUPPORTED_FORMAT','지원 형식: Markdown (.md, .markdown), HWPX (.hwpx)');
 let bytes:Buffer;
 try{assertByteLimit((await stat(path)).size,options.maxBytes);bytes=await readFile(path);assertByteLimit(bytes.byteLength,options.maxBytes);}catch(e){if(e instanceof AidocreadyError)throw e;const code=(e as NodeJS.ErrnoException).code;throw new AidocreadyError(code==='ENOENT'?'FILE_NOT_FOUND':'FILE_READ_FAILED',`파일을 읽을 수 없습니다: ${path}`,code);}
 if(ext!=='.hwpx'){
  let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new AidocreadyError('INVALID_ENCODING','Markdown은 UTF-8 형식이어야 합니다.');}
  const p=markdownBlocks(text);return {...lintBlocks(p.blocks,profile,p.limitations),file:path,inputFormat:'markdown'};
 }
 const parsed=await parse(bytes,{layoutTables:'keep',keepTrailingEmptyCols:true,ocr:false});
 if(!parsed.success)throw new AidocreadyError('PARSE_FAILED',`Kordoc 파싱 실패: ${parsed.error}`,parsed.code);
 if(parsed.fileType!=='hwpx')throw new AidocreadyError('UNSUPPORTED_FORMAT','파일 내용이 HWPX 형식과 일치하지 않습니다.');
 const warnings=parsed.warnings??[];
 const incomplete=warnings.some(w=>!['PAGE_BOUNDARY_APPROXIMATE','HIDDEN_TEXT_FILTERED','OCR_APPLIED'].includes(w.code));
 const result=lintBlocks(parsed.blocks,profile,incomplete?['Kordoc 파서 경고가 있습니다. parserWarnings를 확인하세요.']:[]);
 result.parserWarnings=warnings;
 return {...result,file:path,inputFormat:'hwpx'};
}
