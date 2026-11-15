// tests/astronomy/sidereal.test.ts
//
// Stage 2 internal-consistency tests for sidereal longitude.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import { getSiderealPosition, wrap360 } from '../../lib/astronomy/sidereal.js';
import { getAyanamsha } from '../../lib/astronomy/ayanamsha.js';

const TEST_DATE = new Date('2026-06-15T12:00:00Z');

test('sidereal: wrap360 normalizes to [0, 360) (not independent — internal arithmetic)', () => {
  assert.equal(wrap360(0), 0);
  assert.equal(wrap360(30), 30);
  assert.equal(wrap360(359.999), 359.999);
  assert.equal(wrap360(360), 0);
  assert.equal(wrap360(-1), 359);
  assert.equal(wrap360(-30), 330);
  assert.equal(wrap360(720.5), 0.5);
  for (const d of [-1000, -0.5, 0, 0.5, 1000]) {
    const w = wrap360(d);
    assert.ok(w >= 0 && w < 360, `wrap360(${d}) = ${w} not in [0,360)`);
  }
});

test('sidereal: sidereal = wrap360(tropical - ayanamsha) (not independent — internal arithmetic)', () => {
  const pos = getSiderealPosition('lahiri', TEST_DATE, 'Moon');
  const aya = getAyanamsha('lahiri', TEST_DATE);
  const expected = wrap360(pos.tropicalLongitudeDegrees - aya.trueDegrees);
  assert.ok(
    Math.abs(pos.siderealLongitudeDegrees - expected) < 1e-9,
    `sidereal ${pos.siderealLongitudeDegrees} != wrap360(tropical - ayanamsha) ${expected}`,
  );
  assert.equal(pos.ayanamshaDegrees, aya.trueDegrees);
  assert.equal(pos.meanDegrees, aya.meanDegrees);
  assert.equal(pos.dpsiArcsec, aya.dpsiArcsec);
});

test('sidereal: sidereal longitude is in [0, 360) (not independent — range check)', () => {
  for (const body of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const) {
    const pos = getSiderealPosition('lahiri', TEST_DATE, body);
    assert.ok(
      pos.siderealLongitudeDegrees >= 0 && pos.siderealLongitudeDegrees < 360,
      `${body} sidereal lon ${pos.siderealLongitudeDegrees} not in [0,360)`,
    );
    assert.ok(
      pos.tropicalLongitudeDegrees >= 0 && pos.tropicalLongitudeDegrees < 360,
      `${body} tropical lon ${pos.tropicalLongitudeDegrees} not in [0,360)`,
    );
  }
});

test('sidereal: different timestamps yield different Moon sidereal longitudes (not independent — sanity that Moon moves)', () => {
  const d1 = new Date('2026-01-01T00:00:00Z');
  const d2 = new Date('2026-01-02T00:00:00Z');
  const p1 = getSiderealPosition('lahiri', d1, 'Moon');
  const p2 = getSiderealPosition('lahiri', d2, 'Moon');
  // Moon moves ~12–15° per day; require a clearly nonzero change.
  const delta = Math.abs(((p2.siderealLongitudeDegrees - p1.siderealLongitudeDegrees + 540) % 360) - 180);
  assert.ok(delta > 5, `Moon sidereal changed only ${delta.toFixed(3)}° in one day`);
});

test('sidereal: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getSiderealPosition('lahiri', original, 'Moon');
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});
