import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parse } from 'kordoc';
import { lintMarkdown } from './index.js';
import { lintBlocks } from './engine.js';
export async function lintFile(path:string,profile='recommended') {
 const ext=extname(path).toLowerCase();
 if(!['.md','.markdown','.hwpx'].includes(ext))throw new Error('지원 형식: Markdown (.md, .markdown), HWPX (.hwpx)');
 const bytes=await readFile(path);
 if(ext!=='.hwpx')return {...lintMarkdown(new TextDecoder('utf-8',{fatal:true}).decode(bytes),profile),file:path,inputFormat:'markdown'};
 const parsed=await parse(bytes,{layoutTables:'keep',keepTrailingEmptyCols:true,ocr:false});
 if(!parsed.success)throw new Error(`Kordoc 파싱 실패: ${JSON.stringify(parsed)}`);
 if(parsed.fileType!=='hwpx')throw new Error('파일 내용이 HWPX 형식과 일치하지 않습니다.');
 const warnings=parsed.warnings??[];
 const result=lintBlocks(parsed.blocks,profile,warnings.length?['Kordoc 파서 경고가 있습니다. parserWarnings를 확인하세요.']:[]);
 result.parserWarnings=warnings;
 return {...result,file:path,inputFormat:'hwpx'};
}
