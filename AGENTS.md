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
- Stages 1 to 7 are committed.
- Stage 8 modules (planetaryTransitions, retrograde, lunarNodes) are committed on branch stage8-salvage (commit e7b45f5) with internal tests only, not validated against any external source, and are not accepted.
- The round-botany worktree is retired; a backup zip is on the Desktop.
- Open items:
  - Stage 7 element assertions — DONE: tithi, nakshatra, yoga, karana asserted at sunrise (name, paksha/pada, end within 3 min) against vedicmarga.com reference rows in tests/astronomy/panchanga.reference.test.ts (6 rows, all pass). Stale test.todo stub removed from tests/astronomy/planetaryTransitions.test.ts (file restored to its committed planetary-transition tests).
  - Stage 8 independent references — DONE against vedicmarga.com (Kathmandu, NPT, Lahiri ayanamsa, day-granularity dates; site says "computed to the minute" but publishes dates only):
      * Saturn retrograde 2026: Jul 27 – Dec 11 in Pisces (tests/astronomy/retrograde.reference.test.ts, 3 rows pass).
      * Planet ingress dates: Saturn→Pisces 29 Mar 2025, Jupiter→Leo 31 Oct 2026, Venus→Virgo 6 Nov 2026, Mars→Leo 12 Nov 2026, Mercury→Libra 26 Sep 2026, Sun→Scorpio 16 Nov 2026, Moon→Pisces 20 Nov 2026 (tests/astronomy/planetaryTransitions.reference.test.ts, 7 ingress rows pass).
      * Rahu sign & entry date: Rahu Aquarius→Capricorn and Ketu Leo→Cancer on 5 Dec 2026 (tests/astronomy/lunarNodes.reference.test.ts).
      * Mean-node source: mean-node Rahu straddles the 300° Aquarius|Capricorn boundary on 5 Dec 2026 and stays in Aquarius through 20 Nov 2026, matching vedicmarga.com's "by mean node reckoning" (tests/astronomy/lunarNodes.reference.test.ts).
  - 8 todo rows (2 yoga, 3 karana, 2 panchang placeholders, 1 nakshatra): left as test.todo with documented reasons; not tuned, awaiting independent external data.
  - Printed-patro checkpoint: printed Nepali patro for 2025-07-23 not yet available; element end times after sunrise cannot be verified against the published source.
- All reference data comes from one website (vedicmarga.com, Kathmandu, NPT, 3-minute tolerance).