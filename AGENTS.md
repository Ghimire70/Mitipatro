# MitiPatro agent rules (read first)

Project: Nepali (Bikram Sambat) calendar site. React 19, TypeScript, Tailwind v4, Vite, Express SSR.

Working rules
- One agent, one folder, one branch. Never use parallel worktrees or the Agent Manager. Work on the current branch only.
- Audit first: report a plan and wait for approval before implementing anything new.
- Create new files only unless told otherwise. Never edit lib/bsData.ts, lib/bsConverter.ts, lib/holidays.ts, lib/rashifal.ts, or any existing lib/astronomy/ file without explicit approval (this includes lib/astronomy/index.ts).
- Do not build stages that were not requested. Do not declare the project or a stage "complete".
- New pages need their own indexing flag, default off (noindex, out of the sitemap, hidden from navigation).
- Never write constants or sources from memory. Name the source or say it is unverified.
- Independent tests must assert against values copied from an external source; never use the code under test or Astronomy Engine to produce expected values. Do not loosen tolerances or tune formulas to make a test pass; report the difference and mark the row test.todo with the reason.
- Report measured errors, not tolerances. List every file created or modified.
- Run npm test, npx tsc --noEmit and npm run build after every change, and show the output.
- Do not commit. Do not claim anything is official or fully validated.

Status (update after each stage)
- Stages 1 to 7 committed. Stage 7 element assertions pending.
- Open todo rows: 2 yoga (2026-11-09, 2026-11-10), 3 karana (2025-07-23, 2025-04-08, 2026-09-28), 2 panchang placeholders, 2026-03-16 nakshatra (informational).
- All reference data comes from one website (vedicmarga.com, Kathmandu, NPT, 3-minute tolerance). A printed Nepali patro check is still needed.
- Stage 8 (transits, retrograde, nodes) not accepted; unaudited work exists in the round-botany worktree and must not be merged.