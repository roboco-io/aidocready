import {AidocreadyError} from './errors.js';
export const MAX_INPUT_BYTES=64*1024*1024;
export const MAX_STRUCTURE_DEPTH=64;
export function assertByteLimit(size:number,limit=MAX_INPUT_BYTES){if(!Number.isSafeInteger(limit)||limit<=0)throw new AidocreadyError('INVALID_ARGUMENT','maxBytes는 양의 정수여야 합니다.');if(size>limit)throw new AidocreadyError('INPUT_TOO_LARGE',`입력 크기가 프로젝트 자원 한도(${limit} bytes)를 넘었습니다.`);}
export function assertDepth(depth:number){if(depth>MAX_STRUCTURE_DEPTH)throw new AidocreadyError('INPUT_TOO_LARGE','문서 구조가 프로젝트의 최대 중첩 깊이를 넘었습니다.');}
