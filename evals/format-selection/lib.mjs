import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
export const schema={type:'object',additionalProperties:false,required:['sections','questions'],properties:{sections:{type:'array',items:{type:'object',additionalProperties:false,required:['id','format','reason','markdown'],properties:{id:{type:'string'},format:{type:'string',enum:['prose','list','table']},reason:{type:'string'},markdown:{type:'string'}}}},questions:{type:'array',items:{type:'string'}}}};
export const normalize=s=>String(s).normalize('NFKC').replaceAll(',','').replace(/\s+/g,'').toLowerCase();
const plain=n=>n.value??(n.children??[]).map(plain).join(' ');
const walk=n=>[n,...(n.children??[]).flatMap(walk)];
export function promptFor(test,skill,policy){
 // Expected formats and all grading checks are deliberately kept out of the model prompt.
 const input={caseId:test.id,purpose:test.purpose,sections:test.sections.map(({id,facts})=>({id,facts}))};
 return `다음은 외부 도구 없이 수행하는 문서 작성 평가입니다. 도구 호출·검색·파일 접근·다른 에이전트 호출을 하지 마세요. 평가 입력은 가상 자료입니다. 정책을 적용해 각 section의 형식을 선택하고 해당 section의 모든 사실을 한국어 Markdown으로 작성하세요. 형식은 prose/list/table 중 선택하되, 필요한 경우 section별로 다르게 선택하세요. 사용자에게 보일 짧은 선택 이유를 reason에 적으세요. 내부 사고 과정은 필요하지 않습니다. 질문이 필요하면 questions에 적고, 아는 정보는 작성하세요. 숫자·단위·고유명사는 원문 표기를 유지하고 숫자를 계산해 추가하지 마세요. section id를 그대로 반환하세요. 호스트가 결과에 lint를 수행하므로 여기서는 실행하지 마세요. JSON schema를 따르세요.\n\n<skill>\n${skill}\n</skill>\n<format-policy>\n${policy}\n</format-policy>\n<input>\n${JSON.stringify(input,null,2)}\n</input>`;
}
export function grade(test,response,{lintMarkdown,toolCalls=[]}={}){
 const issues=[];const sectionResults=[];
 if(toolCalls.length)issues.push('unexpected_tool_use');
 if(!response||!Array.isArray(response.sections)||!Array.isArray(response.questions))return {passed:false,issues:[...issues,'invalid_response'],sections:[]};
 if(response.sections.length!==test.sections.length)issues.push('section_count');
 const ids=response.sections.map(s=>s.id);if(new Set(ids).size!==ids.length)issues.push('duplicate_section_id');
 if(ids.some(id=>!test.sections.some(s=>s.id===id)))issues.push('unknown_section_id');
 if(test.needsClarification&&!response.questions.some(q=>typeof q==='string'&&q.trim()))issues.push('missing_clarification');
 for(const spec of test.sections){
  const out=response.sections.find(s=>s.id===spec.id);const failures=[];
  if(!out||typeof out.markdown!=='string'||typeof out.reason!=='string'){sectionResults.push({id:spec.id,passed:false,issues:['missing_or_invalid_section']});continue;}
  const ast=unified().use(remarkParse).use(remarkGfm).parse(out.markdown);const nodes=walk(ast);
  const tables=nodes.filter(n=>n.type==='table');const lists=nodes.filter(n=>n.type==='list');const paragraphs=nodes.filter(n=>n.type==='paragraph');
  if(!spec.expected.includes(out.format))failures.push('format_choice');
  const actual=out.format==='table'?tables.length>0:out.format==='list'?lists.length>0&&tables.length===0:out.format==='prose'?paragraphs.length>0&&tables.length===0&&lists.length===0:false;
  if(!actual)failures.push('declared_format_mismatch');
  if(spec.listKind&&(!lists.length||lists.some(n=>n.ordered!==(spec.listKind==='ordered'))))failures.push('list_ordering_kind');
  if(out.reason.trim().length<12)failures.push('missing_reason');
  const content=normalize(plain(ast));
  const factContent=out.format==='list'?normalize(lists.map(plain).join(' ')):content;
  if(spec.paragraphCount!==undefined&&paragraphs.length!==spec.paragraphCount)failures.push('paragraph_count');
  const items=lists.flatMap(n=>n.children??[]).map(n=>normalize(plain(n)));
  if(spec.itemGroups){
   const used=new Set();let previous=-1;
   for(const group of spec.itemGroups){
    const index=items.findIndex((item,i)=>!used.has(i)&&(spec.listKind!=='ordered'||i>previous)&&group.every(term=>item.includes(normalize(term))));
    if(index<0){failures.push('distinct_list_item:'+group.join('/'));continue;}
    used.add(index);previous=index;
   }
  }
  for(const alternatives of spec.requiredAny??[])if(!alternatives.some(term=>factContent.includes(normalize(term))))failures.push('missing_fact_alternatives:'+alternatives.join('/'));
  for(const term of spec.required??[])if(!factContent.includes(normalize(term)))failures.push('missing_fact:'+term);
  for(const group of spec.associations??[])if(!tables.some(t=>t.children.slice(1).some(row=>group.every(term=>normalize(plain(row)).includes(normalize(term))))))failures.push('row_association:'+group[0]);
  if(spec.order){
   const text=normalize(lists.map(plain).join(' '));let previous=-1;
   for(const term of spec.order){const at=text.indexOf(normalize(term),previous+1);if(at<0){failures.push('step_order:'+term);break;}previous=at;}
  }
  const sourceNumbers=new Set((spec.facts.join(' ').replaceAll(',','').match(/\d+(?:[.:]\d+)*/g)??[]));
  const factText=nodes.filter(n=>n.type==='paragraph'||n.type==='tableCell').map(n=>plain(n).replace(/^표\s*\d+\s*[.:-]?/,'')).join(' ').replaceAll(',','');
  for(const number of new Set(factText.match(/\d+(?:[.:]\d+)*/g)??[]))if(!sourceNumbers.has(number))failures.push('unsupported_number:'+number);
  let lint=null;
  if(lintMarkdown){lint=lintMarkdown(out.markdown);if(lint.summary.Error||lint.summary.Warning)failures.push('lint_findings');if(!lint.coverage.complete)failures.push('incomplete_lint_coverage');}
  sectionResults.push({id:spec.id,chosen:out.format,accepted:spec.expected,passed:failures.length===0,issues:failures,lint});
 }
 return {passed:issues.length===0&&sectionResults.every(s=>s.passed),issues,sections:sectionResults,manualReviewRequired:true};
}
