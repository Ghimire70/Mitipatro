// tests/astronomy/tithiTransitions.test.ts
//
// Stage 3 internal-consistency tests for Tithi transition root finding.
// ALL TESTS HERE ARE "NOT INDEPENDENT": expected values are derived from the
// code under test (e.g. residual must be within tolerance). No external
// panchang reference data has been supplied, so no test validates a published
// tithi-change time.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findTithiTransition,
  transitionDetail,
  ROOT_TOLERANCE_DEGREES,
  MAX_ITERATIONS,
} from '../../lib/astronomy/tithiTransitions.js';
import { getTithi, TITHI_SPAN_DEGREES } from '../../lib/astronomy/tithi.js';

const T0 = new Date('2026-06-15T06:00:00Z');

test('tithiTransitions: transition returns a converged root (not independent — tolerance check)', () => {
  const t = findTithiTransition('lahiri', T0);
  assert.ok(
    t.residualDegrees <= ROOT_TOLERANCE_DEGREES,
    `residual ${t.residualDegrees}° > tolerance ${ROOT_TOLERANCE_DEGREES}°`,
  );
  assert.ok(t.iterations <= MAX_ITERATIONS);
  assert.ok(t.iterations >= 1);
  assert.ok(t.utcInstant > T0, 'transition instant must be after T0');
  assert.ok(
    t.elongationDegrees >= 0 && t.elongationDegrees < 360,
  );
  assert.ok(
    t.targetElongationDegrees >= 0 && t.targetElongationDegrees < 360,
  );
});

test('tithiTransitions: root elongation equals wrapped target boundary (not independent — internal consistency)', () => {
  const t = findTithiTransition('lahiri', T0);
  const diff = Math.abs(
    ((t.elongationDegrees - t.targetElongationDegrees + 540) % 360) - 180,
  );
  assert.ok(
    diff <= ROOT_TOLERANCE_DEGREES,
    `elongation ${t.elongationDegrees.toFixed(6)} vs target ${t.targetElongationDegrees.toFixed(6)} diff ${diff.toFixed(6)}°`,
  );
});

test('tithiTransitions: target boundary is a multiple of 12° (not independent — definitional)', () => {
  const t = findTithiTransition('lahiri', T0);
  assert.ok(
    Math.abs(t.targetElongationDegrees % TITHI_SPAN_DEGREES) < 1e-9,
    `target ${t.targetElongationDegrees} is not a multiple of ${TITHI_SPAN_DEGREES}`,
  );
});

test('tithiTransitions: nextTithiIndex is consistent with target boundary (not independent — internal consistency)', () => {
  const t = findTithiTransition('lahiri', T0);
  const expectedIndex = Math.floor(t.targetElongationDegrees / TITHI_SPAN_DEGREES);
  assert.equal(t.nextTithiIndex, expectedIndex);
});

test('tithiTransitions: kathmandu display is UTC+05:45 (not independent — fixed offset)', () => {
  const t = findTithiTransition('lahiri', T0);
  assert.ok(t.kathmanduDisplay.endsWith('+05:45'));
});

test('tithiTransitions: transitionDetail produces a valid TithiResult at boundary (not independent — composition check)', () => {
  const t = findTithiTransition('lahiri', T0);
  const detail = transitionDetail('lahiri', t);
  assert.ok(detail.elongationDegrees >= 0 && detail.elongationDegrees < 360);
  assert.ok(detail.tithiIndex >= 0 && detail.tithiIndex <= 29);
  assert.ok(detail.tithiNumber >= 1 && detail.tithiNumber <= 15);
});

test('tithiTransitions: determinism — same inputs give same instant (not independent — contract)', () => {
  const a = findTithiTransition('lahiri', T0);
  const b = findTithiTransition('lahiri', T0);
  assert.equal(a.utcInstant.getTime(), b.utcInstant.getTime());
  assert.equal(a.iterations, b.iterations);
});

test('tithiTransitions: elongation increases monotonically across transition (not independent — sanity)', () => {
  const t = findTithiTransition('lahiri', T0);
  const before = getTithi('lahiri', new Date(t.utcInstant.getTime() - 3600000)); // 1 hour before
  const after = getTithi('lahiri', new Date(t.utcInstant.getTime() + 3600000)); // 1 hour after
  // Elongation should have increased across the boundary (accounting for wraparound)
  const delta = ((after.elongationDegrees - before.elongationDegrees + 540) % 360) - 180;
  assert.ok(delta > 0, `Elongation did not increase across transition: delta ${delta.toFixed(4)}°`);
});
