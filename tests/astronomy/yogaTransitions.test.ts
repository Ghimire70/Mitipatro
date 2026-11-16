// tests/astronomy/yogaTransitions.test.ts
//
// Stage 4 internal-consistency tests for Yoga transition root finding.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test (e.g. residual must be within tolerance). No external
// panchang reference data has been supplied, so no test validates a published
// yoga-change time.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findYogaTransition,
  transitionDetail,
  ROOT_TOLERANCE_DEGREES,
  MAX_ITERATIONS,
} from '../../lib/astronomy/yogaTransitions.js';
import { getYoga, YOGA_SPAN_DEGREES } from '../../lib/astronomy/yoga.js';

const T0 = new Date('2026-06-15T06:00:00Z');

test('yogaTransitions: transition returns a converged root (not independent — tolerance check)', () => {
  const t = findYogaTransition('lahiri', T0);
  assert.ok(
    t.residualDegrees <= ROOT_TOLERANCE_DEGREES,
    `residual ${t.residualDegrees}° > tolerance ${ROOT_TOLERANCE_DEGREES}°`,
  );
  assert.ok(t.iterations <= MAX_ITERATIONS);
  assert.ok(t.iterations >= 1);
  assert.ok(t.utcInstant > T0, 'transition instant must be after T0');
  assert.ok(
    t.yogaLongitudeDegrees >= 0 && t.yogaLongitudeDegrees < 360,
  );
  assert.ok(
    t.targetYogaLongitudeDegrees >= 0 && t.targetYogaLongitudeDegrees < 360,
  );
});

test('yogaTransitions: root yoga longitude equals wrapped target boundary (not independent — internal consistency)', () => {
  const t = findYogaTransition('lahiri', T0);
  const diff = Math.abs(
    ((t.yogaLongitudeDegrees - t.targetYogaLongitudeDegrees + 540) % 360) - 180,
  );
  assert.ok(
    diff <= ROOT_TOLERANCE_DEGREES,
    `yogaLongitude ${t.yogaLongitudeDegrees.toFixed(6)} vs target ${t.targetYogaLongitudeDegrees.toFixed(6)} diff ${diff.toFixed(6)}°`,
  );
});

test('yogaTransitions: target boundary is a multiple of 360/27° (not independent — definitional)', () => {
  const t = findYogaTransition('lahiri', T0);
  assert.ok(
    Math.abs(t.targetYogaLongitudeDegrees % YOGA_SPAN_DEGREES) < 1e-9,
    `target ${t.targetYogaLongitudeDegrees} is not a multiple of ${YOGA_SPAN_DEGREES}`,
  );
});

test('yogaTransitions: nextYogaIndex is consistent with target boundary (not independent — internal consistency)', () => {
  const t = findYogaTransition('lahiri', T0);
  const expectedIndex = Math.floor(t.targetYogaLongitudeDegrees / YOGA_SPAN_DEGREES);
  assert.equal(t.nextYogaIndex, expectedIndex);
});

test('yogaTransitions: kathmandu display is UTC+05:45 (not independent — fixed offset)', () => {
  const t = findYogaTransition('lahiri', T0);
  assert.ok(t.kathmanduDisplay.endsWith('+05:45'));
});

test('yogaTransitions: transitionDetail produces a valid YogaResult at boundary (not independent — composition check)', () => {
  const t = findYogaTransition('lahiri', T0);
  const detail = transitionDetail('lahiri', t);
  assert.ok(detail.yogaLongitudeDegrees >= 0 && detail.yogaLongitudeDegrees < 360);
  assert.ok(detail.yogaIndex >= 0 && detail.yogaIndex <= 26);
});

test('yogaTransitions: determinism — same inputs give same instant (not independent — contract)', () => {
  const a = findYogaTransition('lahiri', T0);
  const b = findYogaTransition('lahiri', T0);
  assert.equal(a.utcInstant.getTime(), b.utcInstant.getTime());
  assert.equal(a.iterations, b.iterations);
});

test('yogaTransitions: yoga longitude increases monotonically across transition (not independent — sanity)', () => {
  const t = findYogaTransition('lahiri', T0);
  const before = getYoga('lahiri', new Date(t.utcInstant.getTime() - 3600000)); // 1 hour before
  const after = getYoga('lahiri', new Date(t.utcInstant.getTime() + 3600000)); // 1 hour after
  // Yoga longitude should have increased across the boundary (accounting for wraparound)
  const delta = ((after.yogaLongitudeDegrees - before.yogaLongitudeDegrees + 540) % 360) - 180;
  assert.ok(delta > 0, `Yoga longitude did not increase across transition: delta ${delta.toFixed(4)}°`);
});