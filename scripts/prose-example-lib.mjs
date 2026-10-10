export function validateProseExample(example,before,after,original){
 if(example.id==='table'){
  const fields=['종무(불교)','종무(천주교)','종무(개신교)'];
  for(const field of fields){
   const paragraph=after.split(/\n\s*\n/).find(p=>p.startsWith(field+' 분야'));
   for(const fact of [field,'전문임기제 가급','1명','임용일 ~ ‘26.3.31.','문화체육관광부 종무실','세종시'])if(!paragraph?.includes(fact))throw new Error(`Missing table fact: ${field} / ${fact}`);
  }
  for(const fact of ['3개 직위, 총 3명','근무실적 등이 우수한 경우','행정안전부 협의 및 관련 법령'])if(!after.includes(fact))throw new Error(`Missing table condition: ${fact}`);
  if(before!==original.split('\n').slice(7,17).join('\n')+'\n')throw new Error('Table source excerpt differs');
 }else if(example.id==='list'){
  for(const fact of ['불교 관련 종무업무','불교 현안','자료','불교 관련 통계자료','연구과제','정책 아이디어','불교계','유기적인 네트워크','불교에 관한 국내외 사례']){
   if(!before.includes(fact)||!after.includes(fact))throw new Error(`Missing duty: ${fact}`);
  }
  if(!after.includes('전문임기제 가급'))throw new Error('Missing duty subject');
 }else throw new Error('Unknown prose example');
}
