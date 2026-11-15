// tests/astronomy/ayanamsha.test.ts
//
// Stage 2 internal-consistency tests for the Lahiri ayanamsha module.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.
// No independent panchang reference data has been supplied, so no test
// validates against the real world.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAyanamsha,
  LAHIRI_EPOCH_JD,
  LAHIRI_VALUE_AT_EPOCH_ARCSEC,
  J2000_JD,
  DAYS_PER_JULIAN_CENTURY,
  ARCSEC_PER_DEGREE,
  PREC_IAU76,
  precessionLongitudeIau76Arcsec,
  type AyanamshaMode,
} from '../../lib/astronomy/ayanamsha.js';

// The 1950.0 reference instant: 1950-01-01T12:00:00Z (JD 2433282.5 TT).
const EPOCH_DATE = new Date('1950-01-01T12:00:00Z');

// A modern instant for the plausibility range test.
const MODERN_DATE = new Date('2026-01-01T00:00:00Z');

test('ayanamsha: returns a well-formed result (not independent)', () => {
  const r = getAyanamsha('lahiri', EPOCH_DATE);
  assert.equal(r.mode, 'lahiri');
  assert.ok(Number.isFinite(r.jdTt));
  assert.ok(Number.isFinite(r.tCenturies));
  assert.ok(Number.isFinite(r.meanDegrees));
  assert.ok(Number.isFinite(r.dpsiArcsec));
  assert.ok(Number.isFinite(r.trueDegrees));
});

test('ayanamsha: mean is at the encoded constant at the 1950.0 epoch (not independent — it is the encoded constant itself)', () => {
  const r = getAyanamsha('lahiri', EPOCH_DATE);
  // Precession over a zero interval is zero, so mean == value at epoch.
  // Tolerance 1 arcsecond: MakeTime's Date interpretation (and ΔT) can shift
  // the instant slightly from true 1950.0 TT; that shift is the same one
  // Stage 1's GeoVector uses (both call MakeTime), so sidereal stays
  // self-consistent. 1 arcsecond is far below any rashi/nakshatra boundary.
  const expected = LAHIRI_VALUE_AT_EPOCH_ARCSEC / ARCSEC_PER_DEGREE; // 23°09'34"
  assert.ok(
    Math.abs(r.meanDegrees - expected) < 1 / ARCSEC_PER_DEGREE,
    `meanDegrees ${r.meanDegrees} not within 1 arcsec of encoded epoch value ${expected}`,
  );
});

test('ayanamsha: true = mean + dpsi/3600 (not independent — internal arithmetic)', () => {
  const r = getAyanamsha('lahiri', EPOCH_DATE);
  const expectedTrue = r.meanDegrees + r.dpsiArcsec / ARCSEC_PER_DEGREE;
  assert.ok(
    Math.abs(r.trueDegrees - expectedTrue) < 1e-12,
    `trueDegrees ${r.trueDegrees} != mean + dpsi/3600 ${expectedTrue}`,
  );
});

test('ayanamsha: dpsi magnitude is within the physically expected range (~±17 arcsec) (not independent — sanity bound)', () => {
  const r = getAyanamsha('lahiri', EPOCH_DATE);
  // Nutation in longitude reaches roughly ±17 arcseconds; allow wide margin.
  assert.ok(
    r.dpsiArcsec >= -20 && r.dpsiArcsec <= 20,
    `dpsi ${r.dpsiArcsec} arcsec outside expected ~±20 arcsec sanity band`,
  );
});

test('ayanamsha: ayanamsha changes slowly and stays in a plausible modern band (not independent — internal consistency only)', () => {
  const r = getAyanamsha('lahiri', MODERN_DATE);
  // Over ~76 years from 1950, IAU 1976 precession adds roughly 1° (5029"/cy),
  // so the mean ayanamsha should be near 23.16° + ~1.06° ≈ 24.2°.
  // dpsi contributes at most ±0.005°. Expect trueDegrees ≈ 24.1–24.4°.
  assert.ok(
    r.meanDegrees >= 24.0 && r.meanDegrees <= 24.5,
    `meanDegrees ${r.meanDegrees} outside the slowly-varying expectation`,
  );
});

test('ayanamsha: precession over zero elapsed interval is zero (not independent — internal arithmetic)', () => {
  const p = precessionLongitudeIau76Arcsec(LAHIRI_EPOCH_JD, LAHIRI_EPOCH_JD);
  assert.equal(p, 0);
});

test('ayanamsha: IAU 1976 coefficients are the cited constants (not independent — they are the encoded constants)', () => {
  assert.equal(PREC_IAU76.c0, 5029.0966);
  assert.equal(PREC_IAU76.c1, 2.22226);
  assert.equal(PREC_IAU76.c2, -0.000042);
  assert.equal(PREC_IAU76.d0, 1.11161);
  assert.equal(PREC_IAU76.d1, -0.000127);
  assert.equal(PREC_IAU76.e0, -0.000113);
});

test('ayanamsha: rejects invalid Date and unsupported mode', () => {
  assert.throws(() => getAyanamsha('lahiri', new Date('not-a-date')), /Invalid Date/);
  assert.throws(
    // @ts-ignore — deliberate misuse for contract test
    () => getAyanamsha('kp' as AyanamshaMode, EPOCH_DATE),
    /Unsupported ayanamsha mode/,
  );
});

// ── PLAUSIBILITY TEST (labelled as a range, not verification) ──────────────
//
// The value below (24.1–24.4°) is a plausibility range supplied for this test,
// NOT an independent panchang reference. It reflects the expected order of
// magnitude of the Lahiri ayanamsha around 2026 under the encoded 1955 epoch
// value + IAU 1976 precession. It does NOT verify correctness against any
// external authority.
test(
  'ayanamsha PLAUSIBILITY (NOT verification): Lahiri in 2026 lies between 24.1 and 24.4 degrees',
  () => {
    const r = getAyanamsha('lahiri', MODERN_DATE);
    assert.ok(
      r.trueDegrees >= 24.1 && r.trueDegrees <= 24.4,
      `Lahiri ayanamsha at 2026-01-01 = ${r.trueDegrees.toFixed(4)}° — ` +
        'outside the plausibility band 24.1–24.4°',
    );
  },
);
