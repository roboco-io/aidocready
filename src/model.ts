import type { IRBlock } from 'kordoc';
export type Severity = 'Error' | 'Warning' | 'Suggestion';
export type Origin = 'mois' | 'aidocready';
export type Profile = 'mois-core' | 'recommended';
export type Block = IRBlock & { sourceLine?: number; sourceText?: string };
export interface Location { path: string; line?: number; page?: number }
export interface Rule { id: string; origin: Origin; severity: Severity; principle: string; implementation: string; source?: string }
export interface Finding { ruleId: string; origin: Origin; severity: Severity; message: string; location: Location; source?: string }
export interface LintResult { schemaVersion: 1; profile: Profile; findings: Finding[]; summary: Record<Severity,number>; coverage: { complete: boolean; limitations: string[]; manualReview: string[] }; parserWarnings: unknown[] }
