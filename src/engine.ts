import type { Block, Finding, LintResult, Profile } from './model.js';
import { profiles, requireProfile, rules } from './rules.js';
function marker(text:string):{level:number;number:number}|undefined {
 const s=text.trim().replace(/^#{1,6}\s+/, '');
 const romans=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'];
 let m=s.match(/^([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ])\.\s+/); if(m) return {level:0,number:romans.indexOf(m[1])+1};
 m=s.match(/^(\d+)\.\s+/);if(m)return {level:1,number:Number(m[1])};
 const letters='가나다라마바사아자차카타파하';
 m=s.match(/^([가나다라마바사아자차카타파하])\.\s+/);if(m)return {level:2,number:letters.indexOf(m[1])+1};
 m=s.match(/^(\d+)\)\s+/);if(m)return {level:3,number:Number(m[1])};
 m=s.match(/^([가나다라마바사아자차카타파하])\)\s+/);if(m)return {level:4,number:letters.indexOf(m[1])+1};
 return undefined;
}
function caption(text:string,kind:string):{number?:number}|undefined {
 const clean=text.trim().replace(/[<>\[\]〈〉【】]/g,'');
 const m=clean.match(new RegExp(`^${kind}(?:\\s*(\\d+))?(?:[.：:]?\\s+|[.：:])(.+)$`));
 return m ? {number:m[1]?Number(m[1]):undefined} : undefined;
}
export function lintBlocks(blocks:Block[],profileName:string='recommended',limitations:string[]=[]):LintResult {
 const profile:Profile=requireProfile(profileName);const enabled=new Set(profiles[profile]);const findings:Finding[]=[];
 function add(ruleId:string,message:string,b:Block,path:string) {
  if(!enabled.has(ruleId))return;
  const r=rules.find(r=>r.id===ruleId)!;
  findings.push({ruleId,origin:r.origin,severity:r.severity,message,location:{path,...(b.sourceLine?{line:b.sourceLine}:{}),...(b.pageNumber?{page:b.pageNumber}:{})},...(r.source?{source:r.source}:{})});
 }
 let headingLevel=0; let previousMarker:number|undefined;const counters=new Map<number,number>();const captionNumbers=new Map<string,number>();
 function walk(list:Block[],prefix:string,nested=false) {
  list.forEach((b,i)=>{
   const path=`${prefix}[${i}]`;const text=b.text??'';
   if(b.type==='heading') {
    if(headingLevel&&b.level!>headingLevel+1)add('ADR-HEADING-LEVEL','제목 단계가 건너뛰었습니다.',b,path);
    headingLevel=b.level??headingLevel;
   }
   if(!nested&&(b.type==='paragraph'||b.type==='heading'||b.type==='list')) {
    const m=marker(b.sourceText??text);
    if(m) {
     if(previousMarker!==undefined&&m.level>previousMarker+1)add('MOIS-NUMBERING','항목 표시 단계가 건너뛰었습니다. 표준 항목 순서를 검토하세요.',b,path);
     const last=counters.get(m.level);
     if(last!==undefined&&m.number!==last+1)add('ADR-NUMBER-SEQUENCE','같은 단계의 번호가 연속되지 않습니다.',b,path);
     counters.set(m.level,m.number);for(const k of counters.keys())if(k>m.level)counters.delete(k);
     previousMarker=m.level;
    }
   }
   if(b.type==='table'||b.type==='image') {
    const kind=b.type==='table'?'표':'그림';const prev=list[i-1];
    const isAbove=prev&&(prev.sourceLine===undefined||b.sourceLine===undefined||prev.sourceLine<b.sourceLine);
    const upper=isAbove&&(prev.type==='paragraph'||prev.type==='heading')?caption(prev.text??'',kind):undefined;
    const embedded=b.table?.caption?caption(b.table.caption,kind):undefined;
    const c=upper??embedded;
    if(!c)add(b.type==='table'?'MOIS-TABLE-CAPTION':'MOIS-FIGURE-CAPTION',`${kind} 바로 위에 제목을 표기하세요. 캡션 인식 문법은 규칙 문서를 확인하세요.`,b,path);
    else {
     if(!upper&&embedded)add('ADR-CAPTION-POSITION','내장 표 캡션의 상단 배치 여부를 사람이 확인하세요.',b,path);
     if(!c.number)add('MOIS-CAPTION-NUMBER',`${kind} 제목에 번호 등으로 순서를 표시하세요. 다른 순서 표시는 수동 확인합니다.`,b,path);
     else if(!nested) {
      const last=captionNumbers.get(kind);if(last!==undefined&&c.number!==last+1)add('ADR-CAPTION-SEQUENCE',`${kind} 번호가 연속되지 않습니다.`,b,path);
      captionNumbers.set(kind,c.number);
     }
    }
   }
   if(b.table) {
    if(nested)add('MOIS-NESTED-TABLE','표 안의 표를 단순화할 수 있는지 검토하세요.',b,path);
    b.table.cells.forEach((row,r)=>row.forEach((cell,c)=>{
     const cellPath=`${path}.table.cells[${r}][${c}]`;
     if(cell.rowSpan>1&&cell.colSpan>1)add('MOIS-MERGE-REVIEW','행과 열을 함께 병합한 셀입니다. 구조 단순화 가능성을 검토하세요.',b,cellPath);
     if(cell.blocks)walk(cell.blocks,`${cellPath}.blocks`,true);
    }));
    if(b.table.captionBlocks)walk(b.table.captionBlocks,`${path}.table.captionBlocks`,true);
   }
   if(b.children)walk(b.children,`${path}.children`,nested);
  });
 }
 walk(blocks,'blocks');
 if(limitations.length)add('ADR-INPUT-COVERAGE','입력의 일부 구조를 검사하지 못했습니다. coverage.limitations를 확인하세요.',blocks[0]??{type:'paragraph'},'document');
 const summary={Error:0,Warning:0,Suggestion:0};for(const f of findings)summary[f.severity]++;
 return {schemaVersion:1,profile,findings,summary,coverage:{complete:limitations.length===0,limitations,manualReview:['문장 명확성 및 서술식 작성','불필요한 시각적 꾸미기','단순 병합 여부의 최종 판단','원문 사실·수치·의미 보존','캡션 위치 및 비표준 순서 표시']},parserWarnings:[]};
}
