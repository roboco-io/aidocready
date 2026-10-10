# aidocready MVP implementation plan

Goal: reproducible local Markdown/HWPX lint using Kordoc as an unmodified library.
Architecture: input adapters → common blocks → rules/profiles → CLI text/JSON.
Constraints: Node.js 20+, no remote publication, no document modification or invented facts.

- [x] Adapter tests first: Markdown code exclusion, source lines, HWPX real roundtrip and merged/nested cells.
- [x] Rule tests first: upper captions, numbering, merging, nested tables, heading jumps.
- [x] Implement rule metadata distinguishing official principles from project interpretations.
- [x] CLI tests: JSON, exit codes, invalid options, malformed files.
- [x] Add portable agent templates and author→lint→revise workflow.
- [x] Run build/typecheck/full suite and packed CLI smoke tests.

Review focus: parser loss, caption ambiguity, valid simple merges, code examples, missing/invalid files.
