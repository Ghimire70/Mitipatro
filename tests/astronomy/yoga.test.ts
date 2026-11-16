// tests/astronomy/yoga.test.ts
//
// Stage 4 internal-consistency tests for Yoga calculation.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getYoga,
  YOGA_SPAN_DEGREES,
  YOGA_COUNT,
  YOGA_NAMES,
  yogaName,
  type YogaResult,
} from '../../lib/astronomy/yoga.js';

const TEST_DATE = new Date('2026-06-15T12:00:00Z');

test('yoga: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const r = getYoga('lahiri', TEST_DATE);
  assert.ok(Number.isFinite(r.yogaLongitudeDegrees));
  assert.ok(r.yogaLongitudeDegrees >= 0 && r.yogaLongitudeDegrees < 360, `yogaLongitude ${r.yogaLongitudeDegrees} not in [0,360)`);
  assert.ok(r.yogaIndex >= 0 && r.yogaIndex <= YOGA_COUNT - 1, `yogaIndex ${r.yogaIndex} not in [0,26]`);
  assert.ok(
    r.longitudeWithinYogaDegrees >= 0 && r.longitudeWithinYogaDegrees < YOGA_SPAN_DEGREES,
    `longitudeWithin ${r.longitudeWithinYogaDegrees} not in [0,${YOGA_SPAN_DEGREES})`,
  );
  assert.ok(
    r.remainingToNextYogaDegrees > 0 && r.remainingToNextYogaDegrees <= YOGA_SPAN_DEGREES,
    `remaining ${r.remainingToNextYogaDegrees} not in (0,${YOGA_SPAN_DEGREES}]`,
  );
  assert.ok(Number.isFinite(r.sun.siderealLongitudeDegrees));
  assert.ok(Number.isFinite(r.moon.siderealLongitudeDegrees));
});

test('yoga: yogaIndex + longitudeWithin reconstructs yogaLongitude (not independent — internal arithmetic)', () => {
  const r = getYoga('lahiri', TEST_DATE);
  const reconstructed = r.yogaIndex * YOGA_SPAN_DEGREES + r.longitudeWithinYogaDegrees;
  assert.ok(
    Math.abs(reconstructed - r.yogaLongitudeDegrees) < 1e-9,
    `yogaIndex/longitudeWithin does not reconstruct yogaLongitude: ${reconstructed} vs ${r.yogaLongitudeDegrees}`,
  );
});

test('yoga: longitudeWithin + remaining equals YOGA_SPAN_DEGREES (not independent — internal arithmetic)', () => {
  const r = getYoga('lahiri', TEST_DATE);
  assert.ok(
    Math.abs(r.longitudeWithinYogaDegrees + r.remainingToNextYogaDegrees - YOGA_SPAN_DEGREES) < 1e-9,
    `longitudeWithin + remaining != ${YOGA_SPAN_DEGREES}`,
  );
});

test('yoga: all 27 yoga names exist (not independent — fixture check)', () => {
  assert.equal(YOGA_NAMES.length, YOGA_COUNT);
  for (let i = 0; i < YOGA_COUNT; i++) {
    assert.ok(typeof yogaName(i) === 'string' && yogaName(i).length > 0, `yogaName(${i}) is empty`);
  }
});

test('yoga: specific yoga names for known indices (not independent — fixture check)', () => {
  assert.equal(yogaName(0), 'vishkambha');
  assert.equal(yogaName(1), 'priti');
  assert.equal(yogaName(2), 'ayushman');
  assert.equal(yogaName(12), 'vyaghata');
  assert.equal(yogaName(25), 'indra');
  assert.equal(yogaName(26), 'vaidhriti');
});

test('yoga: determinism — same instant gives same result (not independent — contract)', () => {
  const a = getYoga('lahiri', TEST_DATE);
  const b = getYoga('lahiri', TEST_DATE);
  assert.deepEqual(a, b);
});

test('yoga: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getYoga('lahiri', original);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('yoga: different dates give meaningfully different yoga longitudes (not independent — sanity)', () => {
  const d1 = new Date('2026-01-01T00:00:00Z');
  const d2 = new Date('2026-01-05T00:00:00Z');
  const r1 = getYoga('lahiri', d1);
  const r2 = getYoga('lahiri', d2);
  const delta = Math.abs(((r2.yogaLongitudeDegrees - r1.yogaLongitudeDegrees + 540) % 360) - 180);
  assert.ok(delta > 10, `Yoga longitude changed only ${delta.toFixed(2)}° over 4 days`);
});

test('yoga: boundary rule — exactly 13°20′ maps to next Yoga (not independent — structural math)', () => {
  const span = YOGA_SPAN_DEGREES; // 13.333...
  assert.equal(Math.floor(span / YOGA_SPAN_DEGREES), 1);
  assert.equal(Math.floor(0 / YOGA_SPAN_DEGREES), 0);
  assert.equal(Math.floor(359.999 / YOGA_SPAN_DEGREES), 26);
});

test('yoga: wraparound — yoga longitude 359.999 is yogaIndex 26 (not independent — structural math)', () => {
  const lon = 359.999;
  const idx = Math.floor(lon / YOGA_SPAN_DEGREES);
  assert.equal(idx, 26);
  const within = lon - idx * YOGA_SPAN_DEGREES;
  assert.ok(within >= 0 && within < YOGA_SPAN_DEGREES);
});

test('yoga: uses SUM of sidereal longitudes, not difference (not independent — formula check)', () => {
  const r = getYoga('lahiri', TEST_DATE);
  const sum = wrap360(r.sun.siderealLongitudeDegrees + r.moon.siderealLongitudeDegrees);
  assert.ok(
    Math.abs(sum - r.yogaLongitudeDegrees) < 1e-9,
    `Yoga longitude is not sum of Sun+Moon sidereal: ${sum} vs ${r.yogaLongitudeDegrees}`,
  );
});

function wrap360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}