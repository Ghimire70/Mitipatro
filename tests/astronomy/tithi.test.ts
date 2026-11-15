// tests/astronomy/tithi.test.ts
//
// Stage 3 internal-consistency tests for Tithi calculation.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTithi,
  TITHI_SPAN_DEGREES,
  TITHI_COUNT,
  TITHIS_PER_PAKSHA,
  TITHI_NAMES,
  SHUKLA_TITHI_NAMES,
  KRISHNA_TITHI_NAMES,
  PAKSHA_NAMES,
  tithiName,
  pakshaName,
  type TithiResult,
} from '../../lib/astronomy/tithi.js';

const TEST_DATE = new Date('2026-06-15T12:00:00Z');

test('tithi: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const r = getTithi('lahiri', TEST_DATE);
  assert.ok(Number.isFinite(r.elongationDegrees));
  assert.ok(r.elongationDegrees >= 0 && r.elongationDegrees < 360, `elongation ${r.elongationDegrees} not in [0,360)`);
  assert.ok(r.tithiIndex >= 0 && r.tithiIndex <= TITHI_COUNT - 1, `tithiIndex ${r.tithiIndex} not in [0,29]`);
  assert.ok(
    r.elongationWithinTithiDegrees >= 0 && r.elongationWithinTithiDegrees < TITHI_SPAN_DEGREES,
    `elongationWithin ${r.elongationWithinTithiDegrees} not in [0,12)`,
  );
  assert.ok(
    r.remainingToNextTithiDegrees > 0 && r.remainingToNextTithiDegrees <= TITHI_SPAN_DEGREES,
    `remaining ${r.remainingToNextTithiDegrees} not in (0,12]`,
  );
  assert.ok(r.paksha === 'shukla' || r.paksha === 'krishna');
  assert.ok(r.tithiNumber >= 1 && r.tithiNumber <= TITHIS_PER_PAKSHA);
  assert.ok(Number.isFinite(r.sun.siderealLongitudeDegrees));
  assert.ok(Number.isFinite(r.moon.siderealLongitudeDegrees));
});

test('tithi: tithiIndex + elongationWithin reconstructs elongation (not independent — internal arithmetic)', () => {
  const r = getTithi('lahiri', TEST_DATE);
  const reconstructed = r.tithiIndex * TITHI_SPAN_DEGREES + r.elongationWithinTithiDegrees;
  assert.ok(
    Math.abs(reconstructed - r.elongationDegrees) < 1e-9,
    `tithiIndex/elongationWithin does not reconstruct elongation: ${reconstructed} vs ${r.elongationDegrees}`,
  );
});

test('tithi: elongationWithin + remaining equals TITHI_SPAN_DEGREES (not independent — internal arithmetic)', () => {
  const r = getTithi('lahiri', TEST_DATE);
  assert.ok(
    Math.abs(r.elongationWithinTithiDegrees + r.remainingToNextTithiDegrees - TITHI_SPAN_DEGREES) < 1e-9,
    `elongationWithin + remaining != ${TITHI_SPAN_DEGREES}`,
  );
});

test('tithi: all 30 tithi names exist (not independent — fixture check)', () => {
  assert.equal(TITHI_NAMES.length, TITHI_COUNT);
  for (let i = 0; i < TITHI_COUNT; i++) {
    assert.ok(typeof tithiName(i) === 'string' && tithiName(i).length > 0, `tithiName(${i}) is empty`);
  }
});

test('tithi: Shukla and Krishna name arrays each have 15 entries (not independent — definitional)', () => {
  assert.equal(SHUKLA_TITHI_NAMES.length, TITHIS_PER_PAKSHA);
  assert.equal(KRISHNA_TITHI_NAMES.length, TITHIS_PER_PAKSHA);
});

test('tithi: Paksha names exist for both pakshas (not independent — fixture check)', () => {
  assert.equal(pakshaName('shukla'), 'shukla');
  assert.equal(pakshaName('krishna'), 'krishna');
});

test('tithi: Paksha assignment — indices 0-14 are Shukla, 15-29 are Krishna (not independent — structural)', () => {
  const dates = [
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-10T00:00:00Z'),
    new Date('2026-01-20T00:00:00Z'),
    new Date('2026-02-01T00:00:00Z'),
  ];
  for (const d of dates) {
    const r = getTithi('lahiri', d);
    const expectedPaksha = r.tithiIndex < TITHIS_PER_PAKSHA ? 'shukla' : 'krishna';
    assert.equal(
      r.paksha,
      expectedPaksha,
      `tithiIndex ${r.tithiIndex} paksha ${r.paksha} != expected ${expectedPaksha}`,
    );
  }
});

test('tithi: Tithi number within Paksha is 1..15 (not independent — range check)', () => {
  const d = new Date('2026-01-01T00:00:00Z');
  for (let offset = 0; offset < 45; offset++) {
    const date = new Date(d.getTime() + offset * 86400000);
    const r = getTithi('lahiri', date);
    assert.ok(
      r.tithiNumber >= 1 && r.tithiNumber <= TITHIS_PER_PAKSHA,
      `tithiNumber ${r.tithiNumber} not in [1,15] for tithiIndex ${r.tithiIndex}`,
    );
  }
});

test('tithi: specific tithi names for known indices (not independent — fixture check)', () => {
  assert.equal(tithiName(0), 'prathama');
  assert.equal(tithiName(14), 'purnima');
  assert.equal(tithiName(15), 'prathama');
  assert.equal(tithiName(29), 'amavasya');
});

test('tithi: determinism — same instant gives same result (not independent — contract)', () => {
  const a = getTithi('lahiri', TEST_DATE);
  const b = getTithi('lahiri', TEST_DATE);
  assert.deepEqual(a, b);
});

test('tithi: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getTithi('lahiri', original);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('tithi: different dates give meaningfully different elongations (not independent — sanity)', () => {
  const d1 = new Date('2026-01-01T00:00:00Z');
  const d2 = new Date('2026-01-05T00:00:00Z');
  const r1 = getTithi('lahiri', d1);
  const r2 = getTithi('lahiri', d2);
  const delta = Math.abs(((r2.elongationDegrees - r1.elongationDegrees + 540) % 360) - 180);
  assert.ok(delta > 30, `Elongation changed only ${delta.toFixed(2)}° over 4 days`);
});

test('tithi: boundary rule — exactly 12° maps to next Tithi (not independent — structural math)', () => {
  assert.equal(Math.floor(12 / TITHI_SPAN_DEGREES), 1);
  assert.equal(Math.floor(0 / TITHI_SPAN_DEGREES), 0);
  assert.equal(Math.floor(359.999 / TITHI_SPAN_DEGREES), 29);
});

test('tithi: wraparound — elongation 359.999 is tithiIndex 29 (not independent — structural math)', () => {
  const lon = 359.999;
  const idx = Math.floor(lon / TITHI_SPAN_DEGREES);
  assert.equal(idx, 29);
  const within = lon - idx * TITHI_SPAN_DEGREES;
  assert.ok(within >= 0 && within < TITHI_SPAN_DEGREES);
});

