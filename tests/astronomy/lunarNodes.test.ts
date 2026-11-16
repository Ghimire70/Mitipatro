// tests/astronomy/lunarNodes.test.ts
//
// Stage 8 internal-consistency tests for Rahu/Ketu (lunar nodes).
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external source.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLunarNodes,
  getKetu,
  MEAN_NODE_J2000_DEG,
  MEAN_NODE_RATE_DEG_PER_CENTURY,
  type LunarNodeResult,
} from '../../lib/astronomy/lunarNodes.js';

const TEST_DATE = new Date('2026-06-15T06:00:00Z');

test('lunarNodes: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const r = getLunarNodes('lahiri', TEST_DATE);
  assert.equal(r.node, 'rahu');
  assert.ok(r.rahuTropicalDegrees >= 0 && r.rahuTropicalDegrees < 360);
  assert.ok(r.rahuSiderealDegrees >= 0 && r.rahuSiderealDegrees < 360);
  assert.ok(r.ketuSiderealDegrees >= 0 && r.ketuSiderealDegrees < 360);
  assert.ok(r.siderealLongitudeDegrees >= 0 && r.siderealLongitudeDegrees < 360);
  assert.ok(r.rashiIndex >= 0 && r.rashiIndex <= 11);
  assert.ok(typeof r.rashiName === 'string' && r.rashiName.length > 0);
});

test('lunarNodes: Ketu is exactly 180° opposite Rahu (not independent — definitional)', () => {
  const r = getLunarNodes('lahiri', TEST_DATE);
  const ketuExpected = ((r.rahuSiderealDegrees + 180) % 360 + 360) % 360;
  assert.ok(
    Math.abs(r.ketuSiderealDegrees - ketuExpected) < 1e-9,
    `ketuSidereal ${r.ketuSiderealDegrees} != rahuSidereal + 180 (${ketuExpected})`
  );
});

test('lunarNodes: getKetu returns correct node type and opposite longitude (not independent — consistency)', () => {
  const rahu = getLunarNodes('lahiri', TEST_DATE);
  const ketu = getKetu('lahiri', TEST_DATE);
  assert.equal(ketu.node, 'ketu');
  assert.ok(
    Math.abs(ketu.siderealLongitudeDegrees - rahu.ketuSiderealDegrees) < 1e-9,
    `getKetu longitude ${ketu.siderealLongitudeDegrees} != rahu.ketuSiderealDegrees ${rahu.ketuSiderealDegrees}`
  );
});

test('lunarNodes: sidereal = tropical - ayanamsha (not independent — formula check)', () => {
  const r = getLunarNodes('lahiri', TEST_DATE);
  // sidereal = wrap360(tropical - ayanamsha)
  const expectedSidereal = ((r.rahuTropicalDegrees - r.ayanamshaDegrees) % 360 + 360) % 360;
  assert.ok(
    Math.abs(r.rahuSiderealDegrees - expectedSidereal) < 1e-9,
    `rahuSidereal ${r.rahuSiderealDegrees} != expected ${expectedSidereal}`
  );
});

test('lunarNodes: rashiIndex is consistent with longitude (not independent — internal consistency)', () => {
  const r = getLunarNodes('lahiri', TEST_DATE);
  const expectedIndex = Math.floor(r.rahuSiderealDegrees / 30);
  assert.equal(r.rashiIndex, expectedIndex);
});

test('lunarNodes: determinism — same instant gives same result (not independent — contract)', () => {
  const a = getLunarNodes('lahiri', TEST_DATE);
  const b = getLunarNodes('lahiri', TEST_DATE);
  assert.equal(a.rahuSiderealDegrees, b.rahuSiderealDegrees);
  assert.equal(a.ketuSiderealDegrees, b.ketuSiderealDegrees);
});

test('lunarNodes: does not mutate the supplied Date (not independent — contract)', () => {
  const original = new Date(TEST_DATE.getTime());
  const ms = original.getTime();
  getLunarNodes('lahiri', original);
  assert.equal(original.getTime(), ms, 'Caller Date was mutated');
});

test('lunarNodes: node moves slowly (~19.3° per year) (not independent — physical sanity)', () => {
  // Mean node completes a full 360° in ~18.6 years, so ~19.3°/year.
  // Over 1 day, the node moves about 19.3/365.25 ≈ 0.053°.
  const d1 = new Date('2026-01-01T00:00:00Z');
  const d2 = new Date('2026-01-02T00:00:00Z');
  const r1 = getLunarNodes('lahiri', d1);
  const r2 = getLunarNodes('lahiri', d2);
  // The node should move slightly (retrograde).
  const delta = ((r2.rahuSiderealDegrees - r1.rahuSiderealDegrees + 540) % 360) - 180;
  assert.ok(delta < 0, `Node should move retrograde, got delta=${delta}`);
  assert.ok(delta > -0.1, `Node moves too fast: ${delta}° per day`);
});