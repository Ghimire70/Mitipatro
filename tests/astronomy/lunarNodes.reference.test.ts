// tests/astronomy/lunarNodes.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 8 Lunar Nodes (Rahu/Ketu)
//
// SOURCE: values copied from vedicmarga.com Kathmandu panchang pages.
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.
//
// NOTE: The Rahu/Ketu sign-entry date references below are NOT YET
// independently validated against an external ephemeris (AGENTS.md open item:
// Rahu sign and entry date, mean-node source). They are retained as
// test.todo; only internal-consistency checks are asserted here.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLunarNodes,
  getKetu,
  MEAN_NODE_J2000_DEG,
  MEAN_NODE_RATE_DEG_PER_CENTURY,
  type LunarNodeResult,
} from '../../lib/astronomy/lunarNodes.js';

const MODE = 'lahiri' as const;

const ROWS = [
  // CLAIMED ROWS (not independently validated — see test.todo below):
  //   2026-12-05 22:48 NPT: Rahu Aquarius → Capricorn, Ketu Leo → Cancer
  {
    label: '2026-12-05 Rahu rashi check',
    date: '2026-12-05',
    timeNpt: '22:48',
    element: 'rahu' as const,
  },
  {
    label: '2026-12-05 Ketu rashi check',
    date: '2026-12-05',
    timeNpt: '22:48',
    element: 'ketu' as const,
  },
];

for (const row of ROWS) {
  test(`lunarNodes reference: ${row.label} (internal consistency)`, () => {
    const instant = new Date(`${row.date}T${row.timeNpt}:00+05:45`);
    const r = getLunarNodes(MODE, instant);
    const element = row.element === 'rahu' ? r : getKetu(MODE, instant);
    assert.ok(
      element.rashiIndex >= 0 && element.rashiIndex <= 11,
      `${row.label}: rashiIndex ${element.rashiIndex} out of range`,
    );
    assert.ok(
      Number.isFinite(element.siderealLongitudeDegrees),
      `${row.label}: sidereal longitude not finite`,
    );
  });
}

test('lunarNodes reference: Rahu/Ketu are 180° apart (not independent — definitional)', () => {
  const r = getLunarNodes('lahiri', new Date('2026-11-16T06:00:00Z'));
  const ketu = getKetu('lahiri', new Date('2026-11-16T06:00:00Z'));
  const diff = ((r.rahuSiderealDegrees - ketu.ketuSiderealDegrees + 180) % 360) - 180;
  assert.ok(
    Math.abs(Math.abs(diff) - 180) < 1e-6,
    `Rahu/Ketu separation: diff from 180° = ${Math.abs(Math.abs(diff) - 180).toFixed(6)}°`,
  );
});

test('lunarNodes reference: mean node source validation (not independent — formula check)', () => {
  // Verifies the mean node computation against itself (internal consistency).
  // External validation against an ephemeris (e.g., JPL Horizons) is NOT YET DONE.
  const r = getLunarNodes('lahiri', new Date('2026-11-16T06:00:00Z'));
  const expectedRahu = ((MEAN_NODE_J2000_DEG + MEAN_NODE_RATE_DEG_PER_CENTURY * r.tCenturies) % 360 + 360) % 360;
  assert.ok(
    Math.abs(r.rahuTropicalDegrees - expectedRahu) < 1e-6,
    `mean node computation: computed ${r.rahuTropicalDegrees.toFixed(6)}° vs formula ${expectedRahu.toFixed(6)}°`,
  );
});

test.todo(
  'Independent reference not yet available: mean node source validation. Need external ephemeris '
  + '(e.g., JPL Horizons) lunar node longitude to compare against mean node formula '
  + '(Meeus Ch. 47: Ω = 125.04452 − 1934.136261 × T). Difference between mean node and '
  + 'true node can be up to ~1.5°.',
);

test.todo(
  'Independent reference not yet available: Rahu/Ketu sign-entry date (2026-12-05). '
  + 'VedicMarga claims Rahu enters Capricorn and Ketu enters Cancer on this date; '
  + 'not validated against an external ephemeris.',
);
