// tests/astronomy/festivals.reference.test.ts
//
// Stage 9 — Nepali calendar festivals reference tests
//
// Compares computed festival dates (from tithi-at-sunrise rule) against
// Ministry of Home Affairs gazette notice dates for 2082 and 2083 BS.
//
// SOURCES:
//   - Nepal Panchanga Nirnayak Bikash Samiti notice:
//     https://www.nepalpanchanga.com/notice/publication/15
//     Purnimanta convention: month starts at Shukla Pratipada,
//     ends at Krishna Amavasya.
//   - Ministry of Home Affairs gazette notices:
//     2082 BS: ref 25873, https://rajpatra.dop.gov.np
//     2083 BS: ref 26242, https://rajpatra.dop.gov.np
//
// All values are computed independently. Mismatches are reported, never
// tuned away. Nothing replaces or edits lib/holidays.ts.
//
// SCOPE:
//   'in-scope' rules: assert match (dayDifference === 0)
//   'unsourced' rules: report only, no assertion (single-day conflicts or
//     missing printed patro confirmation)

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAllFestivals, type FestivalResult } from '../../lib/astronomy/festivals.js';

const RESULTS: FestivalResult[] = computeAllFestivals();

for (const r of RESULTS) {
  test(
    `festivals: ${r.label} (${r.bsYear} BS) — listed ${r.listedDate}, computed ${r.computedDate ?? 'not found'}`,
    () => {
      // Always report the comparison
      console.log(
        `[${r.label}] bsYear=${r.bsYear} listed=${r.listedDate} ` +
        `computed=${r.computedDate ?? '—'} ` +
        `computedTithi=${r.computedTithi ?? '—'} expectedTithi=${r.expectedTithi} ` +
        `dayDiff=${r.dayDifference ?? '—'} scope=${r.scope} source=${r.source}`,
      );

      // In-scope rules: computed date must match listed date
      if (r.scope === 'in-scope') {
        assert.ok(
          r.computedDate !== null,
          `${r.label}: no date found in search range for ${r.expectedTithi}`,
        );
        assert.equal(
          r.dayDifference,
          0,
          `${r.label}: listed ${r.listedDate}, computed ${r.computedDate}, ` +
            `day difference ${r.dayDifference} days, expected tithi ${r.expectedTithi} ` +
            `got ${r.computedTithi ?? '—'}`,
        );
        assert.equal(
          r.match,
          true,
          `${r.label}: computed date ${r.computedDate} does not match listed ${r.listedDate}`,
        );
      }

      // Unsourced rules: report only, no assertion
      if (r.scope === 'unsourced') {
        // Intentionally no assertion — flagged for printed patro review
      }
    },
  );
}

// Summary test: count in-scope matches and mismatches
test('festivals: in-scope summary', () => {
  const inScope = RESULTS.filter((r) => r.scope === 'in-scope');
  const matches = inScope.filter((r) => r.match);
  const mismatches = inScope.filter((r) => !r.match);

  console.log(
    `[festivals summary] in-scope=${inScope.length} ` +
      `matches=${matches.length} mismatches=${mismatches.length}`,
  );

  for (const m of mismatches) {
    console.log(
      `[festivals mismatch] ${m.label} (${m.bsYear} BS): listed ${m.listedDate}, ` +
        `computed ${m.computedDate ?? '—'}, dayDiff ${m.dayDifference ?? '—'}`, 
    );
  }

  // All in-scope rules should match
  assert.equal(
    mismatches.length,
    0,
    `${mismatches.length} in-scope festival mismatch(es) — see output above`,
  );
});
