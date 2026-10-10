import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Block } from './model.js';
type Node = {type:string; value?:string; depth?:number; children?:Node[]; position?:{start:{line:number;offset?:number};end:{offset?:number}}};
function plain(n:Node):string { if(n.type==='break')return '\n';return n.value ?? (n.children??[]).map(plain).join(''); }
function descendants(n:Node,type:string):Node[] {return [...(n.type===type?[n]:[]),...(n.children??[]).flatMap(c=>descendants(c,type))];}
export function markdownBlocks(text:string): { blocks:Block[]; limitations:string[] } {
 const ast=unified().use(remarkParse).use(remarkGfm).parse(text) as Node;
 const blocks:Block[]=[]; const limitations:string[]=[];const lines=text.split(/\r?\n/);
 function htmlCoverage(n:Node) {for(const h of descendants(n,'html'))limitations.push(`line ${h.position?.start.line}: HTML 구조는 정적 검사하지 않습니다.`);}
 function imageBlocks(n:Node):Block[] {return [...descendants(n,'image'),...descendants(n,'imageReference')].map(img=>({type:'image',sourceLine:img.position?.start.line}));}
 function visit(n:Node):void {
  const sourceLine=n.position?.start.line;
  const sourceText=sourceLine ? lines[sourceLine-1] : undefined;
  const base={sourceLine,sourceText};
  if(n.type==='code')return;
  if(n.type==='html'){htmlCoverage(n);return;}
  if(n.type==='table') {
   htmlCoverage(n);
   const cells=(n.children??[]).map(row=>(row.children??[]).map(cell=>{
    const images=imageBlocks(cell);
    return {text:plain(cell),colSpan:1,rowSpan:1,...(images.length?{blocks:images}:{})};
   }));
   blocks.push({...base,type:'table',table:{rows:cells.length,cols:cells[0]?.length??0,hasHeader:true,cells}});return;
  }
  if(n.type==='heading'||n.type==='paragraph') {
   htmlCoverage(n);const content=plain(n);const local:Block[]=[];
   content.split('\n').forEach((line,offset)=>{
    if(!line.trim())return;
    const lineNumber=sourceLine===undefined?undefined:sourceLine+offset;
    local.push({type:n.type==='heading'?'heading':'paragraph',text:line,level:n.depth,sourceLine:lineNumber,sourceText:lineNumber?lines[lineNumber-1]:undefined});
   });
   local.push(...imageBlocks(n));local.sort((a,b)=>(a.sourceLine??0)-(b.sourceLine??0));blocks.push(...local);return;
  }
  n.children?.forEach(visit);
 }
 visit(ast);return {blocks,limitations};
}
