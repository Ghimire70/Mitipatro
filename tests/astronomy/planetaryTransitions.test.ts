// tests/astronomy/planetaryTransitions.test.ts
//
// Stage 8 internal-consistency tests for planetary rashi ingress/egress finder.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test or from encoded constants, NOT from an external panchang.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findPlanetaryTransition,
  ROOT_TOLERANCE_DEGREES,
  MAX_ITERATIONS,
} from '../../lib/astronomy/planetaryTransitions.js';

const TEST_DATE = new Date('2026-06-15T06:00:00Z');

test('planetaryTransitions: returns well-formed result with correct ranges (not independent — range checks)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Mars');
  assert.ok(Number.isFinite(t.targetRashiBoundaryDegrees));
  assert.ok(t.targetRashiBoundaryDegrees >= 0 && t.targetRashiBoundaryDegrees < 360);
  assert.ok(t.nextRashiIndex >= 0 && t.nextRashiIndex <= 11);
  assert.ok(t.fromRashiIndex >= 0 && t.fromRashiIndex <= 11);
  assert.ok(t.direction === 'prograde' || t.direction === 'retrograde');
  assert.ok(t.utcInstant > TEST_DATE);
  assert.ok(t.kathmanduDisplay.endsWith('+05:45'));
  assert.ok(t.iterations >= 1 && t.iterations <= MAX_ITERATIONS);
});

test('planetaryTransitions: boundary is a multiple of 30° (not independent — definitional)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Mars');
  assert.ok(
    Math.abs(t.targetRashiBoundaryDegrees % 30) < 1e-9,
    `boundary ${t.targetRashiBoundaryDegrees} is not a multiple of 30`
  );
});

test('planetaryTransitions: nextRashiIndex is consistent with target boundary (not independent — internal consistency)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Mars');
  const expectedIndex = Math.floor(t.targetRashiBoundaryDegrees / 30);
  assert.equal(t.nextRashiIndex, expectedIndex);
});

test('planetaryTransitions: kathmandu display is UTC+05:45 (not independent — fixed offset)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Jupiter');
  assert.ok(t.kathmanduDisplay.endsWith('+05:45'));
});

test('planetaryTransitions: residual is within tolerance (not independent — convergence)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Saturn');
  assert.ok(
    Math.abs(t.residualDegrees) <= ROOT_TOLERANCE_DEGREES,
    `residual ${t.residualDegrees}° > tolerance ${ROOT_TOLERANCE_DEGREES}°`
  );
});

test('planetaryTransitions: all 7 planets can be searched (not independent — coverage)', () => {
  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
  for (const body of bodies) {
    const t = findPlanetaryTransition('lahiri', TEST_DATE, body);
    assert.ok(t.nextRashiIndex >= 0 && t.nextRashiIndex <= 11, `${body}: invalid nextRashiIndex`);
    assert.ok(t.fromRashiIndex >= 0 && t.fromRashiIndex <= 11, `${body}: invalid fromRashiIndex`);
  }
});

test('planetaryTransitions: determinism — same inputs give same instant (not independent — contract)', () => {
  const a = findPlanetaryTransition('lahiri', TEST_DATE, 'Venus');
  const b = findPlanetaryTransition('lahiri', TEST_DATE, 'Venus');
  assert.equal(a.utcInstant.getTime(), b.utcInstant.getTime());
});

test('planetaryTransitions: Sun is always prograde (not independent — physical fact)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Sun');
  assert.equal(t.direction, 'prograde');
});

test('planetaryTransitions: Moon is always prograde (not independent — physical fact)', () => {
  const t = findPlanetaryTransition('lahiri', TEST_DATE, 'Moon');
  assert.equal(t.direction, 'prograde');
});