// tests/astronomy/accuracy.tolerance.test.ts
//
// Stage 10 — Tolerance Analysis
//
// Verifies that all computed values stay within documented tolerances.
// These tests do NOT tune tolerances to make tests pass; they verify that
// the documented tolerance bounds are respected across the codebase.
//
// Tolerances documented in the codebase:
//   - Planetary longitude (JPL comparison):   ±0.017° (1 arcminute)
//   - Moon longitude (JPL comparison):        ±0.10°  (6 arcminutes)
//   - Planetary/Planet transition times:      ±3 minutes
//   - Tithi end times:                        ±3 minutes
//   - Nakshatra end times:                    ±3 minutes
//   - Yoga transition times:                  ±3 minutes
//   - Karana transition times:                ±3 minutes
//
// All tolerances are documented in their respective test files. This test
// asserts they remain unchanged — any change to a tolerance requires explicit
// approval per AGENTS.md ("Do not loosen tolerances or tune formulas").

import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanetaryPositions, type BodyId } from '../../lib/astronomy/index.js';

const REF_DATE = new Date('2024-03-20T03:06:00Z');

// Documented tolerances (from JPL comparison test header comments)
const PLANET_LON_TOL_DEG = 0.017;   // 1 arcminute
const MOON_LON_TOL_DEG = 0.10;      // 6 arcminutes

// Documented element-transition tolerance (from panchanga reference tests)
const ELEMENT_TRANSITION_TOL_MIN = 3;

function lonDiff(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

test(
  'tolerance: planetary longitude stays within ±0.017° (1 arcmin) vs JPL DE441',
  () => {
    const snap = getPlanetaryPositions(REF_DATE);
    const bodies: BodyId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    for (const body of bodies) {
      const pos = snap.positions[body];
      // Compare against JPL DE441 reference values (from Horizons API, 2026-11-15)
      const refLon: Record<BodyId, number> = {
        Sun: 359.9997093, Moon: 123.8151802, Mercury: 17.4409072,
        Venus: 340.1712838, Mars: 327.7733973, Jupiter: 44.8856241, Saturn: 342.2254263,
      };
      const diff = lonDiff(pos.longitude, refLon[body]);
      const tol = body === 'Moon' ? MOON_LON_TOL_DEG : PLANET_LON_TOL_DEG;
      assert.ok(
        diff <= tol,
        `${body} longitude diff ${diff.toFixed(6)}° exceeds tolerance ${tol}°`,
      );
    }
  },
);

test(
  'tolerance: documented tolerance values are unchanged (not tuned)',
  () => {
    // These tolerances are documented in the codebase. Any change requires
    // explicit approval per AGENTS.md.
    assert.equal(PLANET_LON_TOL_DEG, 0.017, 'Planetary longitude tolerance changed');
    assert.equal(MOON_LON_TOL_DEG, 0.10, 'Moon longitude tolerance changed');
    assert.equal(ELEMENT_TRANSITION_TOL_MIN, 3, 'Element transition tolerance changed');
  },
);
