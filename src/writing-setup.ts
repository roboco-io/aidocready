import {readFile} from 'node:fs/promises';
import {AidocreadyError} from './errors.js';

export async function writingSetup(target:string) {
 if(target!=='chatgpt'&&target!=='claude')throw new AidocreadyError('INVALID_ARGUMENT','target은 chatgpt 또는 claude이어야 합니다.');
 const instructions=(await readFile(new URL('../templates/REPORT-WRITING.md',import.meta.url),'utf8')).trim();
 const setupSteps=target==='chatgpt' ? [
  'ChatGPT 웹의 설정 > 개인 설정 > 맞춤 지침에 아래 작성 지침을 기존 지침과 합쳐 붙여 넣고 저장하세요. 앱은 사용 가능한 개인 설정 항목을 확인하세요.',
  '보고서 전용 프로젝트에는 프로젝트 지침에 같은 작성 지침을 붙여 넣고 저장하세요. 프로젝트 지침의 적용 범위를 확인하세요.'
 ] : [
  'Claude 설정의 Instructions for Claude(개인 지침)에 아래 작성 지침을 기존 지침과 합쳐 붙여 넣고 저장하세요.',
  '보고서 전용 프로젝트에서는 Set project instructions(프로젝트 지침 설정)에 같은 작성 지침을 붙여 넣고 Save instructions로 저장하세요.'
 ];
 return {schemaVersion:1,target,automaticSetup:false,setupSteps,instructions,sources:target==='chatgpt'
  ? ['https://learn.chatgpt.com/docs/personalize','https://learn.chatgpt.com/docs/projects']
  : ['https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features','https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects']};
}
