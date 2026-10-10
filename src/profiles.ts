import {readFile} from 'node:fs/promises';
import {profiles,rules,requireProfile} from './rules.js';
import {AidocreadyError} from './errors.js';
import type {Profile,Severity} from './model.js';
export interface ProfileDefinition {id:string;extends?:Profile;rules?:Record<string,Severity|'off'>}
export type ProfileInput=string|ProfileDefinition;
export function parseProfile(data:unknown):ProfileDefinition {
 const invalid=(message:string):never=>{throw new AidocreadyError('INVALID_PROFILE',message);};
 if(!data||typeof data!=='object'||Array.isArray(data))return invalid('프로파일은 JSON 객체여야 합니다.');
 const p=data as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['id','extends','rules'].includes(k)))return invalid('허용되지 않은 프로파일 속성입니다.');
 if(typeof p.id!=='string'||! /^[a-z][a-z0-9-]{0,63}$/.test(p.id)||p.id in profiles)return invalid('사용자 프로파일 ID는 기본 프로파일과 구분해야 합니다.');
 const base=p.extends??'recommended';if(base!=='recommended'&&base!=='mois-core')return invalid('extends는 기본 프로파일 ID여야 합니다.');
 const overrides=p.rules??{};
 if(typeof overrides!=='object'||overrides===null||Array.isArray(overrides))return invalid('rules는 규칙 ID별 설정 객체여야 합니다.');
 for(const [id,setting] of Object.entries(overrides))if(!rules.some(r=>r.id===id)||!['off','Error','Warning','Suggestion'].includes(String(setting)))return invalid(`잘못된 규칙 설정: ${id}`);
 return {id:p.id,extends:base,rules:overrides as Record<string,Severity|'off'>};
}
export function resolveProfile(input:ProfileInput) {
 if(typeof input==='string'){const id=requireProfile(input);return {id,custom:false,severities:new Map(rules.filter(r=>profiles[id].includes(r.id)).map(r=>[r.id,r.severity]))};}
 const p=parseProfile(input);const severities=new Map(rules.filter(r=>profiles[p.extends!].includes(r.id)).map(r=>[r.id,r.severity]));
 for(const [id,setting] of Object.entries(p.rules??{})){if(setting==='off')severities.delete(id);else severities.set(id,setting);}
 return {id:p.id,custom:true,severities};
}
export async function loadProfile(path:string):Promise<ProfileDefinition> {
 let data:unknown;try{data=JSON.parse(await readFile(path,'utf8'));}catch{throw new AidocreadyError('INVALID_PROFILE',`프로파일을 읽을 수 없습니다: ${path}`);}
 return parseProfile(data);
}
