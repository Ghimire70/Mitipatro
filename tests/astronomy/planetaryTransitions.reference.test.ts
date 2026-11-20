// tests/astronomy/planetaryTransitions.reference.test.ts
//
// INDEPENDENT REFERENCE TESTS — Stage 8 Planetary Transitions
//
// SOURCE: vedicmarga.com transit pages (/transit/<planet>/2026/ and /transit/).
// Positions are sidereal, Lahiri ayanamsa, Kathmandu (GMT +5:45), computed to
// the minute. Ingress dates on the site are published at day granularity, so
// these assertions match the Kathmandu date of the computed boundary crossing
// (same-day), not a clock-time.
// These are WEBSITE values, NOT Nepal's official patro. Do not interpret a
// pass/fail here as validation against the official Nepali panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findPlanetaryTransition } from '../../lib/astronomy/planetaryTransitions.js';
import { getSiderealPosition } from '../../lib/astronomy/sidereal.js';
import type { BodyId } from '../../lib/astronomy/types.js';

const MODE = 'lahiri';

function nptNoon(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 6, 15)); // 12:00 NPT = 06:15 UTC
}

function kathmanduDate(instant: Date): string {
  const ms = instant.getTime() + 5 * 3600 * 1000 + 45 * 60 * 1000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Internal consistency (not independent — range checks)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Independent: planet ingress dates (vedicmarga.com)
// ---------------------------------------------------------------------------

interface IngressRow {
  label: string;
  t0: string; // day before ingress, in prior sign
  ingressDate: string; // vedicmarga.com published ingress date (Kathmandu)
  planet: BodyId;
  fromRashiIndex: number;
  nextRashiIndex: number;
}

// Verified against vedicmarga.com: each t0 date places the planet in the prior
// sign; each ingressDate matches the site's published ingress date.
const INGRESS_ROWS: IngressRow[] = [
  { label: 'Saturn -> Pisces (Meena)', t0: '2025-03-28', ingressDate: '2025-03-29', planet: 'Saturn', fromRashiIndex: 10, nextRashiIndex: 11 },
  { label: 'Jupiter -> Leo (Simha)', t0: '2026-10-30', ingressDate: '2026-10-31', planet: 'Jupiter', fromRashiIndex: 3, nextRashiIndex: 4 },
  { label: 'Venus -> Virgo (Kanya)', t0: '2026-11-05', ingressDate: '2026-11-06', planet: 'Venus', fromRashiIndex: 6, nextRashiIndex: 5 },
  { label: 'Mars -> Leo (Simha)', t0: '2026-11-11', ingressDate: '2026-11-12', planet: 'Mars', fromRashiIndex: 3, nextRashiIndex: 4 },
  { label: 'Mercury -> Libra (Tula)', t0: '2026-09-25', ingressDate: '2026-09-26', planet: 'Mercury', fromRashiIndex: 5, nextRashiIndex: 6 },
  { label: 'Sun -> Scorpio (Vrishchika)', t0: '2026-11-15', ingressDate: '2026-11-16', planet: 'Sun', fromRashiIndex: 6, nextRashiIndex: 7 },
  { label: 'Moon -> Pisces (Meena)', t0: '2026-11-19', ingressDate: '2026-11-20', planet: 'Moon', fromRashiIndex: 10, nextRashiIndex: 11 },
];

for (const row of INGRESS_ROWS) {
  test(`planetaryTransitions reference: ${row.label} on ${row.ingressDate} (independent: vedicmarga.com)`, () => {
    const t = findPlanetaryTransition(MODE, nptNoon(row.t0), row.planet);
    assert.equal(
      t.fromRashiIndex,
      row.fromRashiIndex,
      `${row.label}: fromRashiIndex ${t.fromRashiIndex} != expected ${row.fromRashiIndex} on ${row.t0}`,
    );
    assert.equal(
      t.nextRashiIndex,
      row.nextRashiIndex,
      `${row.label}: nextRashiIndex ${t.nextRashiIndex} != expected ${row.nextRashiIndex}`,
    );
    assert.equal(
      kathmanduDate(t.utcInstant),
      row.ingressDate,
      `${row.label}: computed ingress on ${kathmanduDate(t.utcInstant)} NPT; vedicmarga.com ${row.ingressDate}`,
    );
  });
}
