import { rules, profiles } from '../dist/index.js';
import { writeFile } from 'node:fs/promises';
for (const [id, ids] of Object.entries(profiles)) {
 await writeFile(new URL(`../profiles/${id}.json`,import.meta.url), JSON.stringify({ id,version:'0.1.0',officialSchema:false,rules:rules.filter(r=>ids.includes(r.id)) }, null, 2)+'\n');
}
