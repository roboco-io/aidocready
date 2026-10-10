import type { Block, Finding, LintResult, Profile, CheckStatus, RuleCheck } from './model.js';
import { rules } from './rules.js';
import { resolveProfile,type ProfileInput } from './profiles.js';
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
 if(m)return {number:m[1]?Number(m[1]):undefined};
 const framed=text.trim().match(/^(?:<|〈|【|\[)\s*(.+?)\s*(?:>|〉|】|\])$/);
 return framed?.[1].trim()?{}:undefined;
}
export function lintBlocks(blocks:Block[],profileName:ProfileInput='recommended',limitations:string[]=[]):LintResult {
 const selected=resolveProfile(profileName);const profile=selected.id;const enabled=new Set(selected.severities.keys());const findings:Finding[]=[];
 const checks:RuleCheck[]=rules.map(r=>({ruleId:r.id,status:enabled.has(r.id)?'not-applicable':'disabled',reasons:[]}));
 const rank:Record<CheckStatus,number>={'disabled':-1,'not-applicable':0,'checked':1,'manual-review':2,'unsupported':3};
 function mark(id:string,status:CheckStatus='checked',reason?:string){const c=checks.find(c=>c.ruleId===id);if(!c||c.status==='disabled')return;if(rank[status]>rank[c.status])c.status=status;if(reason&&!c.reasons.includes(reason))c.reasons.push(reason);}
 function add(ruleId:string,message:string,b:Block,path:string) {
  if(!enabled.has(ruleId))return;
  const r=rules.find(r=>r.id===ruleId)!;mark(ruleId,selected.severities.get(ruleId)==='Suggestion'?'manual-review':'checked');
  const excerpt=(b.sourceText??b.text??b.table?.cells.flat().map(c=>c.text).join(' | ')??'').slice(0,160);
  findings.push({ruleId,origin:r.origin,severity:selected.severities.get(ruleId)!,message,excerpt,helpUrl:`https://github.com/roboco-io/aidocready/blob/main/docs/rules.md#${ruleId.toLowerCase()}`,location:{path,...(b.table?.sourceId?{sourceId:b.table.sourceId}:{}),...(b.sourceLine?{line:b.sourceLine}:{}),...(b.pageNumber?{page:b.pageNumber}:{})},...(r.source?{source:r.source}:{})});
 }
 const captionNumbers=new Map<string,number>();
 function walk(list:Block[],prefix:string,nested=false) {
  let headingLevel=0; let previousMarker:number|undefined; const counters=new Map<number,number>();
  list.forEach((b,i)=>{
   const path=`${prefix}[${i}]`;const text=b.text??'';
   if(b.type==='heading') {
    mark('ADR-HEADING-LEVEL');
    if(headingLevel&&b.level!>headingLevel+1)add('ADR-HEADING-LEVEL','제목 단계가 건너뛰었습니다.',b,path);
    headingLevel=b.level??headingLevel;
   }
   if(!nested&&(b.type==='paragraph'||b.type==='heading'||b.type==='list')) {
    const m=marker(b.sourceText??text);
    if(m) {
     mark('MOIS-NUMBERING');mark('ADR-NUMBER-SEQUENCE');
     if(previousMarker!==undefined&&m.level>previousMarker+1)add('MOIS-NUMBERING','항목 표시 단계가 건너뛰었습니다. 표준 항목 순서를 검토하세요.',b,path);
     const last=counters.get(m.level);
     if(last!==undefined&&m.number!==last+1)add('ADR-NUMBER-SEQUENCE','같은 단계의 번호가 연속되지 않습니다.',b,path);
     counters.set(m.level,m.number);for(const k of counters.keys())if(k>m.level)counters.delete(k);
     previousMarker=m.level;
    }
   }
   if(b.type==='table'||b.type==='image') {
    const kind=b.type==='table'?'표':'그림';const prev=list[i-1];
    mark(b.type==='table'?'MOIS-TABLE-CAPTION':'MOIS-FIGURE-CAPTION');
    const isAbove=prev&&(prev.sourceLine===undefined||b.sourceLine===undefined||prev.sourceLine<b.sourceLine);
    const upper=isAbove&&(prev.type==='paragraph'||prev.type==='heading')?caption(prev.text??'',kind):undefined;
    const embedded=b.table?.caption?caption(b.table.caption,kind):undefined;
    const c=upper??embedded;
    if(!c)add(b.type==='table'?'MOIS-TABLE-CAPTION':'MOIS-FIGURE-CAPTION',`${kind} 바로 위에 제목을 표기하세요. 캡션 인식 문법은 규칙 문서를 확인하세요.`,b,path);
    else {
     if(!upper&&embedded)add('ADR-CAPTION-POSITION','내장 표 캡션의 상단 배치 여부를 사람이 확인하세요.',b,path);
     mark('MOIS-CAPTION-NUMBER');
     if(!c.number){mark('MOIS-CAPTION-NUMBER','manual-review','번호 외 순서 표시를 사람이 확인해야 합니다.');add('MOIS-CAPTION-NUMBER',`${kind} 제목에 번호 등으로 순서를 표시하세요. 다른 순서 표시는 수동 확인합니다.`,b,path);}
     else if(!nested) {
      mark('ADR-CAPTION-SEQUENCE');const last=captionNumbers.get(kind);if(last!==undefined&&c.number!==last+1)add('ADR-CAPTION-SEQUENCE',`${kind} 번호가 연속되지 않습니다.`,b,path);
      captionNumbers.set(kind,c.number);
     }
    }
   }
   if(b.table) {
    mark('MOIS-NESTED-TABLE');mark('MOIS-MERGE-REVIEW');
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
 mark('ADR-INPUT-COVERAGE');
 if(limitations.length)for(const r of rules)mark(r.id,'unsupported','입력 일부 구조가 미지원입니다. coverage.limitations를 확인하세요.');
 if(limitations.length)add('ADR-INPUT-COVERAGE','입력의 일부 구조를 검사하지 못했습니다. coverage.limitations를 확인하세요.',blocks[0]??{type:'paragraph'},'document');
 const summary={Error:0,Warning:0,Suggestion:0};for(const f of findings)summary[f.severity]++;
 return {schemaVersion:1,profile,profileOrigin:selected.custom?'aidocready':'builtin',findings,summary,checks,coverage:{complete:limitations.length===0,limitations,manualReview:['문장 명확성 및 서술식 작성','불필요한 시각적 꾸미기','단순 병합 여부의 최종 판단','원문 사실·수치·의미 보존','캡션 위치 및 비표준 순서 표시']},parserWarnings:[]};
}
