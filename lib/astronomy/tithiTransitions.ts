// lib/astronomy/tithiTransitions.ts
//
// Stage 3 sidereal layer — NEW FILE.
//
// Finds the instant the Moon–Sun elongation reaches the next Tithi boundary
// (multiple of 12°) by bisection root-finding. Returns UTC instant plus
// Asia/Kathmandu display. No sunrise-based logic.

import { getTithi, type TithiResult, TITHI_SPAN_DEGREES } from './tithi.js';
import { wrap360 } from './sidereal.js';
import type { AyanamshaMode } from './ayanamsha.js';
import { KATHMANDU_OFFSET_SECONDS, toKathmanduString } from './moonTransitions.js';

/** Angular tolerance for the root finder: 1 arcsecond. */
export const ROOT_TOLERANCE_DEGREES = 1 / 3600;

/** Maximum bisection iterations. */
export const MAX_ITERATIONS = 100;

/** Initial bracket step in hours. */
export const BRACKET_STEP_HOURS = 6;

/** Result of a Tithi transition root-find. */
export interface TithiTransition {
  /** Target boundary elongation (degrees), wrapped to [0, 360). */
  targetElongationDegrees: number;
  /** Tithi index that starts after this boundary (0..29). */
  nextTithiIndex: number;
  /** UTC instant when elongation reaches the boundary. */
  utcInstant: Date;
  /** Asia/Kathmandu display string. */
  kathmanduDisplay: string;
  /** Elongation at the root. */
  elongationDegrees: number;
  /** Angular residual (degrees). */
  residualDegrees: number;
  /** Bisection iterations used. */
  iterations: number;
}

/** Elongation at a UTC instant [0, 360). */
function elongationAt(mode: AyanamshaMode, instant: Date): number {
  return getTithi(mode, instant).elongationDegrees;
}

/**
 * Find when the elongation reaches the next Tithi boundary after t0.
 *
 * Elongation increases monotonically (Moon moves faster than the Sun
 * geocentrically), so we unwrap single 360° crossings and bisect.
 *
 * @param mode  ayanamsha mode.
 * @param t0    starting UTC instant.
 * @returns TithiTransition
 * @throws if the crossing cannot be bracketed within MAX_ITERATIONS steps.
 */
export function findTithiTransition(
  mode: AyanamshaMode,
  t0: Date,
): TithiTransition {
  const lon0 = wrap360(elongationAt(mode, t0));
  const nextBoundary = (Math.floor(lon0 / TITHI_SPAN_DEGREES) + 1) * TITHI_SPAN_DEGREES;
  const D = nextBoundary - lon0; // > 0, within (0, 12]

  const f = (t: Date): number => {
    const lon = wrap360(elongationAt(mode, t));
    let delta = lon - lon0;
    if (delta < -180) delta += 360; // unwrap a single 360° crossing
    return delta - D;
  };

  // ---- Bracket: step forward until f changes sign (f(t0) = -D < 0) ----
  const stepMs = BRACKET_STEP_HOURS * 3600 * 1000;
  let tLow = new Date(t0.getTime());
  let fLow = f(tLow); // < 0
  let tHigh: Date | null = null;
  let fHigh: number | null = null;
  let probe = new Date(t0.getTime() + stepMs);
  let steps = 0;
  while (steps < MAX_ITERATIONS) {
    const ft = f(probe);
    if (ft > 0) {
      tHigh = probe;
      fHigh = ft;
      break;
    }
    tLow = probe;
    fLow = ft;
    probe = new Date(probe.getTime() + stepMs);
    steps++;
  }
  if (tHigh === null || fHigh === null) {
    throw new Error('Could not bracket Tithi transition after MAX_ITERATIONS steps');
  }

  // ---- Bisection to 1 arcsecond angular tolerance ----
  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    const tMid: Date = new Date((tLow.getTime() + tHigh!.getTime()) / 2);
    const fMid = f(tMid);
    if (Math.abs(fMid) <= ROOT_TOLERANCE_DEGREES) {
      tLow = tMid;
      fLow = fMid;
      break;
    }
    if (fMid < 0) {
      tLow = tMid;
      fLow = fMid;
    } else {
      tHigh = tMid;
      fHigh = fMid;
    }
    iterations++;
    if (Math.abs(fLow) <= ROOT_TOLERANCE_DEGREES) break;
  }

  const root = new Date(tLow.getTime());
  const rootElongation = wrap360(elongationAt(mode, root));
  const residual = f(root);

  return {
    targetElongationDegrees: wrap360(nextBoundary),
    nextTithiIndex: Math.floor(wrap360(nextBoundary) / TITHI_SPAN_DEGREES),
    utcInstant: root,
    kathmanduDisplay: toKathmanduString(root),
    elongationDegrees: rootElongation,
    residualDegrees: residual,
    iterations,
  };
}

/** Full Tithi assignment at the transition instant. */
export function transitionDetail(
  mode: AyanamshaMode,
  transition: TithiTransition,
): TithiResult {
  return getTithi(mode, transition.utcInstant);
}
