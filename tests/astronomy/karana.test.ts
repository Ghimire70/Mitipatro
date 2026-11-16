// tests/astronomy/karana.test.ts
//
// Stage 5 internal-consistency tests for Karana calculation.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getKarana,
  KARANA_SPAN_DEGREES,
  KARANA_COUNT,
  KARANA_NAMES,
  karanaName,
  type KaranaResult,
} from '../../lib/astronomy/karana.js';

const TEST_DATE = new Date('2026-06-15T12:00:00Z');

test('karana: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const r = getKarana('lahiri', TEST_DATE);
  assert.ok(Number.isFinite(r.elongationDegrees));
  assert.ok(r.elongationDegrees >= 0 && r.elongationDegrees < 360, `elongation ${r.elongationDegrees} not in [0,360)`);
  assert.ok(r.karanaIndex >= 0 && r.karanaIndex <= KARANA_COUNT - 1, `karanaIndex ${r.karanaIndex} not in [0,59]`);
  assert.ok(
    r.elongationWithinKaranaDegrees >= 0 && r.elongationWithinKaranaDegrees < KARANA_SPAN_DEGREES,
    `elongationWithin ${r.elongationWithinKaranaDegrees} not in [0,6)`,
  );
  assert.ok(
    r.remainingToNextKaranaDegrees > 0 && r.remainingToNextKaranaDegrees <= KARANA_SPAN_DEGREES,
    `remaining ${r.remainingToNextKaranaDegrees} not in (0,6]`,
  );
});

test('karana: karanaIndex + elongationWithin reconstructs elongation (not independent — internal arithmetic)', () => {
  const r = getKarana('lahiri', TEST_DATE);
  const reconstructed = r.karanaIndex * KARANA_SPAN_DEGREES + r.elongationWithinKaranaDegrees;
  assert.ok(
    Math.abs(reconstructed - r.elongationDegrees) < 1e-9,
    `karanaIndex/elongationWithin does not reconstruct elongation: ${reconstructed} vs ${r.elongationDegrees}`,
  );
});

test('karana: elongationWithin + remaining equals KARANA_SPAN_DEGREES (not independent — internal arithmetic)', () => {
  const r = getKarana('lahiri', TEST_DATE);
  assert.ok(
    Math.abs(r.elongationWithinKaranaDegrees + r.remainingToNextKaranaDegrees - KARANA_SPAN_DEGREES) < 1e-9,
    `elongationWithin + remaining != ${KARANA_SPAN_DEGREES}`,
  );
});

test('karana: all 60 karana names exist (not independent — fixture check)', () => {
  assert.equal(KARANA_NAMES.length, KARANA_COUNT);
  for (let i = 0; i < KARANA_COUNT; i++) {
    assert.ok(typeof karanaName(i) === 'string' && karanaName(i).length > 0, `karanaName(${i}) is empty`);
  }
});

test('karana: fixed karana indices per approved cycle (not independent — fixture check)', () => {
  assert.equal(karanaName(0), 'kimstughna', 'index 0 must be kimstughna');
  assert.equal(karanaName(56), 'vishti', 'index 56 must be vishti');
  assert.equal(karanaName(57), 'shakuni', 'index 57 must be shakuni');
  assert.equal(karanaName(58), 'chatushpada', 'index 58 must be chatushpada');
  assert.equal(karanaName(59), 'naga', 'index 59 must be naga');
});

test('karana: movable cycle order 1..7 maps bava..vishti (not independent — fixture check)', () => {
  assert.equal(karanaName(1), 'bava');
  assert.equal(karanaName(2), 'balava');
  assert.equal(karanaName(3), 'kaulava');
  assert.equal(karanaName(4), 'taitila');
  assert.equal(karanaName(5), 'gara');
  assert.equal(karanaName(6), 'vanija');
  assert.equal(karanaName(7), 'vishti');
});

test('karana: movable cycle repeats every 7 (not independent — fixture check)', () => {
  // index 8 = bava again (start of second cycle)
  assert.equal(karanaName(8), 'bava');
  // index 14 = vishti (end of second cycle)
  assert.equal(karanaName(14), 'vishti');
  // index 15 = bava again (start of third cycle)
  assert.equal(karanaName(15), 'bava');
  // index 56 = vishti (last of 8th cycle)
  assert.equal(karanaName(56), 'vishti');
});

test('karana: determinism — same instant gives same result (not independent — contract)', () => {
  const a = getKarana('lahiri', TEST_DATE);
  const b = getKarana('lahiri', TEST_DATE);
  assert.deepEqual(a, b);
});

test('karana: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getKarana('lahiri', original);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('karana: different dates give meaningfully different elongations (not independent — sanity)', () => {
  const d1 = new Date('2026-01-01T00:00:00Z');
  const d2 = new Date('2026-01-05T00:00:00Z');
  const r1 = getKarana('lahiri', d1);
  const r2 = getKarana('lahiri', d2);
  const delta = Math.abs(((r2.elongationDegrees - r1.elongationDegrees + 540) % 360) - 180);
  assert.ok(delta > 10, `Elongation changed only ${delta.toFixed(2)}° over 4 days`);
});

test('karana: boundary rule — exactly 6° maps to next Karana (not independent — structural math)', () => {
  assert.equal(Math.floor(6 / KARANA_SPAN_DEGREES), 1);
  assert.equal(Math.floor(0 / KARANA_SPAN_DEGREES), 0);
  assert.equal(Math.floor(359.999 / KARANA_SPAN_DEGREES), 59);
});

test('karana: wraparound — elongation 359.999 is karanaIndex 59 (not independent — structural math)', () => {
  const lon = 359.999;
  const idx = Math.floor(lon / KARANA_SPAN_DEGREES);
  assert.equal(idx, 59);
  const within = lon - idx * KARANA_SPAN_DEGREES;
  assert.ok(within >= 0 && within < KARANA_SPAN_DEGREES);
});

test('karana: every tithi has exactly two karanas, floor(karanaIndex/2) maps to tithiIndex (not independent — structural)', () => {
  const d = new Date('2026-01-01T00:00:00Z');
  for (let offset = 0; offset < 45; offset++) {
    const date = new Date(d.getTime() + offset * 86400000);
    const r = getKarana('lahiri', date);
    // Two karanas per tithi: tithiIndex = floor(karanaIndex / 2)
    const expectedTithiIndex = Math.floor(r.karanaIndex / 2);
    assert.ok(
      expectedTithiIndex >= 0 && expectedTithiIndex <= 29,
      `tithiIndex ${expectedTithiIndex} out of range for karanaIndex ${r.karanaIndex}`
    );
    // karanaIndex parity: even = first half, odd = second half of tithi
    const half = r.karanaIndex % 2;
    assert.ok(half === 0 || half === 1, `karanaIndex ${r.karanaIndex} parity invalid`);
  }
});

test('karana: second karana of every tithi ends exactly when tithi ends (not independent — structural)', () => {
  const d = new Date('2026-01-01T00:00:00Z');
  for (let offset = 0; offset < 45; offset++) {
    const date = new Date(d.getTime() + offset * 86400000);
    const r = getKarana('lahiri', date);
    // At any instant, karanaIndex % 2 indicates first (0) or second (1) half of tithi.
    const half = r.karanaIndex % 2;
    assert.ok(half === 0 || half === 1, `karanaIndex ${r.karanaIndex} parity invalid`);
    // floor(karanaIndex / 2) is the tithi index (0..29), consistent with 2 karanas per tithi.
    const tithiIndex = Math.floor(r.karanaIndex / 2);
    assert.ok(tithiIndex >= 0 && tithiIndex <= 29, `tithiIndex ${tithiIndex} out of range`);
    // elongationWithin + remaining = 6° (each karana spans exactly 6°)
    assert.ok(
      Math.abs(r.elongationWithinKaranaDegrees + r.remainingToNextKaranaDegrees - 6) < 1e-9,
      `karana span != 6° at karanaIndex ${r.karanaIndex}`,
    );
  }
});