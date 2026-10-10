import {VERSION,rules,profiles} from '../dist/index.js';
import {fileURLToPath} from 'node:url';
import {syncArtifacts} from './meta-lib.mjs';
const artifacts={};
for(const [id,ids] of Object.entries(profiles))artifacts[`profiles/${id}.json`]=JSON.stringify({id,version:VERSION,officialSchema:false,rules:rules.filter(r=>ids.includes(r.id))},null,2)+'\n';
artifacts['docs/rules.md']=`# AI Doc Ready 규칙\n\n버전: ${VERSION}. 이 규칙 ID·검사 문법·심각도는 프로젝트의 운영 방식이며 공식 인증 기준이 아닙니다.\n\n`+rules.map(r=>`## ${r.id}\n\n- 근거 구분: ${r.origin}\n- 기본 심각도: ${r.severity}\n- 원칙: ${r.principle}\n- 검사 해석: ${r.implementation}\n${r.source?`- 공식 자료: [행정안전부 보도자료](${r.source})\n`:''}`).join('\n');
await syncArtifacts(fileURLToPath(new URL('..',import.meta.url)),artifacts,process.argv.includes('--check'));
console.log(process.argv.includes('--check')?'Metadata matches canonical rules.':'Metadata generated.');
