// tests/astronomy/moonTransitions.test.ts
//
// Stage 2 internal-consistency tests for the Moon transition root finder.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test (e.g. residual must be within tolerance). No external
// panchang reference data has been supplied, so no test validates a published
// sankranti or nakshatra-change time.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findMoonTransition,
  transitionDetail,
  ROOT_TOLERANCE_DEGREES,
  MAX_ITERATIONS,
  KATHMANDU_OFFSET_SECONDS,
  toKathmanduString,
  type MoonTransition,
} from '../../lib/astronomy/moonTransitions.js';

const T0 = new Date('2026-06-15T06:00:00Z');

test('moonTransitions: rashi transition returns a converged root (not independent — tolerance check)', () => {
  const t = findMoonTransition('lahiri', T0, 'rashi');
  assert.ok(t.residualDegrees <= ROOT_TOLERANCE_DEGREES, `rashi residual ${t.residualDegrees}° > tolerance ${ROOT_TOLERANCE_DEGREES}°`);
  assert.ok(t.iterations <= MAX_ITERATIONS);
  assert.ok(t.iterations >= 1);
  assert.ok(t.utcInstant > T0, 'transition instant must be after T0');
  assert.ok(
    t.siderealLongitudeDegrees >= 0 && t.siderealLongitudeDegrees < 360,
  );
  assert.ok(
    t.targetLongitudeDegrees >= 0 && t.targetLongitudeDegrees < 360,
  );
});

test('moonTransitions: nakshatra transition returns a converged root (not independent — tolerance check)', () => {
  const t = findMoonTransition('lahiri', T0, 'nakshatra');
  assert.ok(
    t.residualDegrees <= ROOT_TOLERANCE_DEGREES,
    `nakshatra residual ${t.residualDegrees}° > tolerance ${ROOT_TOLERANCE_DEGREES}°`,
  );
  assert.ok(t.iterations <= MAX_ITERATIONS);
  assert.ok(t.utcInstant > T0);
});

test('moonTransitions: root sidereal longitude equals wrapped target boundary (not independent — internal consistency)', () => {
  for (const kind of ['rashi', 'nakshatra'] as const) {
    const t = findMoonTransition('lahiri', T0, kind);
    const diff = Math.abs(
      ((t.siderealLongitudeDegrees - t.targetLongitudeDegrees + 540) % 360) -
        180,
    );
    // Should be within tolerance (1 arcsecond).
    assert.ok(
      diff <= ROOT_TOLERANCE_DEGREES,
      `${kind}: sidereal lon ${t.siderealLongitudeDegrees.toFixed(6)} vs target ${t.targetLongitudeDegrees.toFixed(6)} diff ${diff.toFixed(6)}°`,
    );
  }
});

test('moonTransitions: kathmandu display is UTC+05:45 (not independent — fixed offset)', () => {
  const t = findMoonTransition('lahiri', T0, 'rashi');
  // The display must encode +05:45 and represent a time 5h45m after the UTC instant.
  const expectedMs = t.utcInstant.getTime() + KATHMANDU_OFFSET_SECONDS * 1000;
  const expected = new Date(expectedMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const expectedStr =
    `${expected.getUTCFullYear()}-${pad(expected.getUTCMonth() + 1)}-${pad(expected.getUTCDate())}T` +
    `${pad(expected.getUTCHours())}:${pad(expected.getUTCMinutes())}:${pad(expected.getUTCSeconds())}.` +
    `${String(expected.getUTCMilliseconds()).padStart(3, '0')}+05:45`;
  assert.equal(t.kathmanduDisplay, expectedStr);
  assert.ok(t.kathmanduDisplay.endsWith('+05:45'));
});

test('moonTransitions: toKathmanduString applies fixed +05:45 with no DST (not independent — fixed offset)', () => {
  const utc = new Date('2026-06-15T18:15:30.123Z'); // northern summer (no DST in Nepal anyway)
  const disp = toKathmanduString(utc);
  assert.equal(disp, '2026-06-16T00:00:30.123+05:45');
  // Winter date too — offset must not change.
  const utc2 = new Date('2026-12-15T18:15:30.123Z');
  assert.equal(toKathmanduString(utc2), '2026-12-16T00:00:30.123+05:45');
});

test('moonTransitions: transitionDetail produces a valid NakshatraResult (not independent — composition check)', () => {
  const t = findMoonTransition('lahiri', T0, 'rashi');
  const detail = transitionDetail('lahiri', t);
  assert.ok(detail.siderealLongitudeDegrees >= 0 && detail.siderealLongitudeDegrees < 360);
  assert.ok(detail.rashiIndex >= 0 && detail.rashiIndex <= 11);
  assert.ok(detail.pada >= 1 && detail.pada <= 4);
});

test('moonTransitions: determinism — same inputs give same instant (not independent — contract)', () => {
  const a = findMoonTransition('lahiri', T0, 'rashi');
  const b = findMoonTransition('lahiri', T0, 'rashi');
  assert.equal(a.utcInstant.getTime(), b.utcInstant.getTime());
  assert.equal(a.iterations, b.iterations);
});
