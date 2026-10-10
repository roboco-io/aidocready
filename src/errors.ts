export type ErrorReason='FILE_NOT_FOUND'|'INVALID_ARGUMENT'|'INVALID_PROFILE'|'UNSUPPORTED_FORMAT'|'INVALID_ENCODING'|'INPUT_TOO_LARGE'|'FILE_READ_FAILED'|'FILE_WRITE_FAILED'|'PARSE_FAILED';
export class AidocreadyError extends Error {
 constructor(public readonly code:ErrorReason,message:string,public readonly causeCode?:string){super(message);this.name='AidocreadyError';}
}
