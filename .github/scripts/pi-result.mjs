import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {parsePiSummary} from './upstream-lib.mjs';
const events=(await readFile(`${process.env.RUNNER_TEMP}/pi-events.jsonl`,'utf8')).split('\n').filter(Boolean).map(line=>JSON.parse(line));
const summary=parsePiSummary(events,process.env.DEEPSEEK_API_KEY);
await writeFile(`${process.env.RUNNER_TEMP}/pi-summary.md`,summary);
await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n## pi / DeepSeek Flash\n'+summary+'\n');
console.log('pi completed with a final summary.');
