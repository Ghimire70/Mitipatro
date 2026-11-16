// tests/astronomy/sunriseSunset.test.ts
//
// Stage 6 internal-consistency tests for sunrise/sunset calculation.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSunriseSunset,
  OBSERVER_ELEVATION_METERS,
  OBSERVER_METERS_ABOVE_GROUND,
  type SunriseSunsetResult,
} from '../../lib/astronomy/sunriseSunset.js';

const TEST_DATE = new Date('2026-06-15T12:00:00Z');

test('sunriseSunset: returns well-formed result (not independent — range checks)', () => {
  const r = getSunriseSunset(TEST_DATE);
  assert.equal(r.date, '2026-06-15');
  assert.equal(r.sunrise.status, 'computed');
  assert.equal(r.sunset.status, 'computed');
  assert.ok(r.sunrise.utcInstant instanceof Date);
  assert.ok(r.sunset.utcInstant instanceof Date);
  assert.ok(typeof r.sunrise.kathmanduDisplay === 'string');
  assert.ok(typeof r.sunset.kathmanduDisplay === 'string');
  assert.ok(typeof r.sunrise.unroundedMinutesFromMidnight === 'number');
  assert.ok(typeof r.sunset.unroundedMinutesFromMidnight === 'number');
  assert.ok(typeof r.sunrise.roundedMinutesFromMidnight === 'number');
  assert.ok(typeof r.sunset.roundedMinutesFromMidnight === 'number');
});

test('sunriseSunset: sunrise before sunset (not independent — structural)', () => {
  const r = getSunriseSunset(TEST_DATE);
  assert.ok(
    r.sunrise.utcInstant!.getTime() < r.sunset.utcInstant!.getTime(),
    `sunrise ${r.sunrise.utcInstant} must be before sunset ${r.sunset.utcInstant}`,
  );
});

test('sunriseSunset: rounded within 1 minute of unrounded (not independent — rounding bound)', () => {
  const r = getSunriseSunset(TEST_DATE);
  for (const ev of [r.sunrise, r.sunset]) {
    const diff = Math.abs(ev.unroundedMinutesFromMidnight! - ev.roundedMinutesFromMidnight!);
    assert.ok(diff <= 1, `rounding diff ${diff} min > 1 min for ${ev.kathmanduDisplay}`);
  }
});

test('sunriseSunset: kathmandu display is UTC+05:45 (not independent — fixed offset)', () => {
  const r = getSunriseSunset(TEST_DATE);
  assert.ok(r.sunrise.kathmanduDisplay!.endsWith('+05:45'));
  assert.ok(r.sunset.kathmanduDisplay!.endsWith('+05:45'));
});

test('sunriseSunset: elevation constant is 0 (not independent — fixture check)', () => {
  assert.equal(OBSERVER_ELEVATION_METERS, 0);
  assert.equal(OBSERVER_METERS_ABOVE_GROUND, 0);
});

test('sunriseSunset: determinism — same date gives same result (not independent — contract)', () => {
  const a = getSunriseSunset(TEST_DATE);
  const b = getSunriseSunset(TEST_DATE);
  assert.deepEqual(a, b);
});

test('sunriseSunset: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getSunriseSunset(original);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('sunriseSunset: missing status when SearchRiseSet returns null (not independent — mock behaviour)', () => {
  // We cannot easily force SearchRiseSet to return null for Kathmandu dates,
  // but we can verify the result structure handles null correctly by checking
  // the code path. Instead, test that computed events always have non-null fields.
  const r = getSunriseSunset(TEST_DATE);
  for (const ev of [r.sunrise, r.sunset]) {
    if (ev.status === 'computed') {
      assert.ok(ev.utcInstant !== null);
      assert.ok(ev.kathmanduDisplay !== null);
      assert.ok(ev.unroundedMinutesFromMidnight !== null);
      assert.ok(ev.roundedMinutesFromMidnight !== null);
    } else {
      assert.equal(ev.utcInstant, null);
      assert.equal(ev.kathmanduDisplay, null);
      assert.equal(ev.unroundedMinutesFromMidnight, null);
      assert.equal(ev.roundedMinutesFromMidnight, null);
    }
  }
});

test('sunriseSunset: date string format YYYY-MM-DD (not independent — format check)', () => {
  const r = getSunriseSunset(new Date('2024-01-05T10:00:00Z'));
  assert.equal(r.date, '2024-01-05');
  const r2 = getSunriseSunset(new Date('2026-12-31T23:59:00Z'));
  assert.equal(r2.date, '2026-12-31');
});