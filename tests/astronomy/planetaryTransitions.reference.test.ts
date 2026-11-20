// tests/astronomy/planetaryTransitions.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 8 Planetary Transitions
//
// SOURCE: values copied from vedicmarga.com Kathmandu panchang pages.
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.
//
// NOTE: The planet ingress date references below are NOT YET independently
// validated against an external ephemeris (AGENTS.md open item: planet
// ingress dates). They are retained as test.todo; only internal-consistency
// checks against the Stage 8 API are asserted here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findPlanetaryTransition } from '../../lib/astronomy/planetaryTransitions.js';
import { getSiderealPosition } from '../../lib/astronomy/sidereal.js';
import type { BodyId } from '../../lib/astronomy/types.js';

const MODE = 'lahiri' as const;

const ROWS = [
  { label: '2024-03-26 Jupiter rashi check', date: '2024-03-26', timeNpt: '06:00', planet: 'Jupiter' as BodyId },
  { label: '2024-07-01 Jupiter rashi check', date: '2024-07-01', timeNpt: '05:11', planet: 'Jupiter' as BodyId },
  { label: '2025-04-08 Jupiter rashi check', date: '2025-04-08', timeNpt: '05:46', planet: 'Jupiter' as BodyId },
  { label: '2025-06-16 Jupiter rashi check', date: '2025-06-16', timeNpt: '05:07', planet: 'Jupiter' as BodyId },
  { label: '2025-07-23 Jupiter rashi check', date: '2025-07-23', timeNpt: '05:21', planet: 'Jupiter' as BodyId },
  { label: '2026-09-28 Jupiter rashi check', date: '2026-09-28', timeNpt: '05:54', planet: 'Jupiter' as BodyId },
];

for (const row of ROWS) {
  test(`planetaryTransitions reference: ${row.label} (internal consistency)`, () => {
    const instant = new Date(`${row.date}T${row.timeNpt}:00+05:45`);
    const pos = getSiderealPosition(MODE, instant, row.planet);
    const rashiIndex = Math.floor(pos.siderealLongitudeDegrees / 30);
    assert.ok(
      rashiIndex >= 0 && rashiIndex <= 11,
      `${row.label}: rashiIndex ${rashiIndex} out of range`,
    );
    assert.ok(
      Number.isFinite(pos.siderealLongitudeDegrees),
      `${row.label}: sidereal longitude not finite`,
    );
  });
}

test(
  'planetaryTransitions reference: findPlanetaryTransition returns valid results for all 7 planets (not independent — coverage)',
  () => {
    const bodies: readonly BodyId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    const testDate = new Date('2026-06-15T06:00:00Z');
    for (const body of bodies) {
      const result = findPlanetaryTransition(MODE, testDate, body);
      assert.ok(
        result.nextRashiIndex >= 0 && result.nextRashiIndex <= 11,
        `${body}: nextRashiIndex ${result.nextRashiIndex} out of range`,
      );
      assert.ok(
        result.fromRashiIndex >= 0 && result.fromRashiIndex <= 11,
        `${body}: fromRashiIndex ${result.fromRashiIndex} out of range`,
      );
      assert.ok(result.direction === 'prograde' || result.direction === 'retrograde', `${body}: invalid direction`);
    }
  },
);

test.todo(
  'Independent reference not yet available: planet ingress dates (e.g., Jupiter enters Cancer on claimed dates). '
  + 'Need external ephemeris source; vedicmarga.com claims are not independently validated.',
);
