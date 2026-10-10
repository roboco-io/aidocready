import {readFileSync} from 'node:fs';
/** package.json is present at the same relative location in source and npm dist. */
export const VERSION:string=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
