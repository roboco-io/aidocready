import type { ProfileInput } from './profiles.js';
import { markdownBlocks } from './markdown.js';
import { lintBlocks } from './engine.js';
export { lintBlocks } from './engine.js';
export { rules, profiles } from './rules.js';
export type { Block, Finding, LintResult, Profile, Rule, Severity } from './model.js';
export function lintMarkdown(text:string,profile:ProfileInput='recommended') {
 const parsed=markdownBlocks(text);return lintBlocks(parsed.blocks,profile,parsed.limitations);
}

export { VERSION } from './version.js';
export { lintFile } from './input.js';
export { AidocreadyError } from './errors.js';
export type { ErrorReason } from './errors.js';
export { parseProfile,loadProfile } from './profiles.js';
export type { ProfileDefinition,ProfileInput } from './profiles.js';
