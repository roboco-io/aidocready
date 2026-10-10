import { markdownBlocks } from './markdown.js';
import { lintBlocks } from './engine.js';
export { lintBlocks } from './engine.js';
export { rules, profiles } from './rules.js';
export type { Block, Finding, LintResult, Profile, Rule, Severity } from './model.js';
export function lintMarkdown(text:string,profile='recommended') {
 const parsed=markdownBlocks(text);return lintBlocks(parsed.blocks,profile,parsed.limitations);
}
