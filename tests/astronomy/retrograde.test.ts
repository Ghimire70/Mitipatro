// tests/astronomy/retrograde.test.ts
//
// Stage 8 internal-consistency tests for retrograde detection.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external source.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRetrogradeStatus,
  getAllRetrogradeStatus,
  PROBE_INTERVAL_HOURS,
  STATIONARY_THRESHOLD_DEG,
  type MotionDirection,
} from '../../lib/astronomy/retrograde.js';
import type { BodyId } from '../../lib/astronomy/types.js';

const TEST_DATE = new Date('2026-06-15T06:00:00Z');

test('retrograde: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const r = getRetrogradeStatus('lahiri', TEST_DATE, 'Mars');
  assert.ok(r.direction === 'direct' || r.direction === 'retrograde' || r.direction === 'stationary');
  assert.ok(Number.isFinite(r.longitudeAtStart));
  assert.ok(r.longitudeAtStart >= 0 && r.longitudeAtStart < 360);
  assert.ok(Number.isFinite(r.longitudeAtProbe));
  assert.ok(r.longitudeAtProbe >= 0 && r.longitudeAtProbe < 360);
  assert.ok(Number.isFinite(r.deltaDegrees));
  assert.ok(Number.isFinite(r.rateDegPerHour));
  assert.equal(r.probeIntervalHours, PROBE_INTERVAL_HOURS);
});

test('retrograde: delta is signed correctly (not independent — arithmetic)', () => {
  const r = getRetrogradeStatus('lahiri', TEST_DATE, 'Mars');
  // delta should be in (-180, 180]
  assert.ok(r.deltaDegrees > -180 && r.deltaDegrees <= 180);
});

test('retrograde: Sun is always direct (not independent — physical fact)', () => {
  const r = getRetrogradeStatus('lahiri', TEST_DATE, 'Sun');
  assert.equal(r.direction, 'direct');
});

test('retrograde: Moon is always direct (not independent — physical fact)', () => {
  const r = getRetrogradeStatus('lahiri', TEST_DATE, 'Moon');
  assert.equal(r.direction, 'direct');
});

test('retrograde: all 7 planets can be checked (not independent — coverage)', () => {
  const bodies: readonly BodyId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  for (const body of bodies) {
    const r = getRetrogradeStatus('lahiri', TEST_DATE, body);
    assert.ok(
      r.direction === 'direct' || r.direction === 'retrograde' || r.direction === 'stationary',
      `${body}: invalid direction ${r.direction}`
    );
  }
});

test('retrograde: getAllRetrogradeStatus returns all bodies (not independent — coverage)', () => {
  const results = getAllRetrogradeStatus('lahiri', TEST_DATE);
  assert.equal(Object.keys(results).length, 7);
});

test('retrograde: determinism — same inputs give same result (not independent — contract)', () => {
  const a = getRetrogradeStatus('lahiri', TEST_DATE, 'Mercury');
  const b = getRetrogradeStatus('lahiri', TEST_DATE, 'Mercury');
  assert.equal(a.direction, b.direction);
  assert.equal(a.longitudeAtStart, b.longitudeAtStart);
});

test('retrograde: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getRetrogradeStatus('lahiri', original, 'Mars');
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('retrograde: rate is consistent with delta (not independent — arithmetic)', () => {
  const r = getRetrogradeStatus('lahiri', TEST_DATE, 'Jupiter');
  const expectedRate = r.deltaDegrees / PROBE_INTERVAL_HOURS;
  assert.ok(
    Math.abs(r.rateDegPerHour - expectedRate) < 1e-9,
    `rate ${r.rateDegPerHour} != expected ${expectedRate}`
  );
});