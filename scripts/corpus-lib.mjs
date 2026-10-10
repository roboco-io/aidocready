export function compareFindings(expected,actual) {
 const remaining=actual.map(f=>({ruleId:f.ruleId,path:f.location.path}));const missing=[];
 for(const item of expected){const index=remaining.findIndex(f=>f.ruleId===item.ruleId&&f.path===item.path);if(index<0)missing.push(item);else remaining.splice(index,1);}
 return {passed:missing.length===0&&remaining.length===0,missing,unexpected:remaining};
}
