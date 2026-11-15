// lib/astronomy/moonTransitions.ts
//
// Stage 2 sidereal layer — NEW FILE (Stage 1 files are untouched.
//
// Finds the instant the Moon enters the next rashi (sign) or nakshatra by
// bisection root-finding on the Moon's sidereal longitude as a function of
// time. Returns the UTC instant plus an Asia/Kathmandu (UTC+05:45) display
// string. No sunrise-based panchang logic is implemented here.
//
// CONSTANTS AND SOURCES:
//   ROOT_TOLERANCE_DEGREES = 1 arcsecond = 1/3600°   Approved Stage 2 tolerance.
//                                          At the Moon's ~0.5°/hour this is
//                                          ~7 seconds of time.
//   MAX_ITERATIONS   = 100   Internal safety cap.
//   BRACKET_STEP_HOURS = 6   Internal step used to bracket the next crossing.
//   KATHMANDU_OFFSET_SECONDS = 20700 (UTC+05:45)  Source: Asia/Kathmandu is
//                                          UTC+05:45 year-round, no DST
//                                          (copilot-instructions.md §5).
//
// All tolerances/steps are internal choices; UNVERIFIED against any panchang
// maker's published transition times.

import {
  getRashiNakshatraPada,
  type NakshatraResult,
  RASHI_SPAN_DEGREES,
  NAKSHATRA_SPAN_DEGREES,
} from './nakshatra.js';
import { getSiderealPosition, wrap360 } from './sidereal.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** Angular tolerance for the root finder: 1 arcsecond. Approved Stage 2 value. */
export const ROOT_TOLERANCE_DEGREES = 1 / 3600;

/** Maximum bisection iterations (internal safety cap). */
export const MAX_ITERATIONS = 100;

/** Initial bracket step in hours (internal choice). */
export const BRACKET_STEP_HOURS = 6;

/** Asia/Kathmandu offset = UTC+05:45 = 20700 s; no DST. */
export const KATHMANDU_OFFSET_SECONDS = 5 * 3600 + 45 * 60; // 20700

/** Kind of boundary the Moon can cross. */
export type TransitionKind = 'rashi' | 'nakshatra';

/** Result of a Moon transition root-find. */
export interface MoonTransition {
  kind: TransitionKind;
  /** Target boundary longitude (degrees, sidereal), wrapped to [0,360). */
  targetLongitudeDegrees: number;
  /** UTC instant when the Moon reaches the boundary (bisection root). */
  utcInstant: Date;
  /** Asia/Kathmandu (UTC+05:45) display string for the instant. */
  kathmanduDisplay: string;
  /** Sidereal longitude at the root (equals target within tolerance). */
  siderealLongitudeDegrees: number;
  /** Angular residual at the root (degrees; <= tolerance on convergence). */
  residualDegrees: number;
  /** Bisection iterations used. */
  iterations: number;
}

/** Format a UTC Date as an Asia/Kathmandu ISO-like string (fixed +05:45). */
export function toKathmanduString(utcDate: Date): string {
  const ms = utcDate.getTime() + KATHMANDU_OFFSET_SECONDS * 1000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.` +
    `${pad3(d.getUTCMilliseconds())}+05:45`
  );
}

/** Moon's sidereal longitude at a UTC instant [0, 360). */
function moonSiderealLon(mode: AyanamshaMode, instant: Date): number {
  return getSiderealPosition(mode, instant, 'Moon').siderealLongitudeDegrees;
}

/**
 * Find when the Moon enters the next rashi or nakshatra after t0.
 *
 * The Moon is always prograde in geocentric ecliptic longitude (it never
 * retrogrades), so longitude increases monotonically. We unwrap single
 * 360° crossings and bisect to find when unwrapped change reaches the
 * distance to the next boundary.
 *
 * @param mode   ayanamsha mode.
 * @param t0     starting UTC instant.
 * @param kind   'rashi' or 'nakshatra'.
 * @returns MoonTransition
 * @throws if the crossing cannot be bracketed within MAX_ITERATIONS steps.
 */
export function findMoonTransition(
  mode: AyanamshaMode,
  t0: Date,
  kind: TransitionKind,
): MoonTransition {
  const span = kind === 'rashi' ? RASHI_SPAN_DEGREES : NAKSHATRA_SPAN_DEGREES;
  const lon0 = wrap360(moonSiderealLon(mode, t0));

  // Next boundary unwrapped, strictly greater than lon0.
  // Exactly-on-a-boundary (lon0 % span === 0) -> floor gives the current
  // division's start, so +1 span targets the NEXT boundary (consistent with
  // the [start, start+span) boundary rule).
  const nextBoundary = (Math.floor(lon0 / span) + 1) * span;
  const D = nextBoundary - lon0; // > 0, within (0, span]

  // f(t) = unwrapped longitude change since t0 minus D; root when f == 0.
  const f = (t: Date): number => {
    const lon = wrap360(moonSiderealLon(mode, t));
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
    throw new Error(
      `Could not bracket Moon ${kind} transition after ${MAX_ITERATIONS} steps`,
    );
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
  const rootLon = wrap360(moonSiderealLon(mode, root));
  const residual = f(root);

  return {
    kind,
    targetLongitudeDegrees: wrap360(nextBoundary),
    utcInstant: root,
    kathmanduDisplay: toKathmanduString(root),
    siderealLongitudeDegrees: rootLon,
    residualDegrees: residual,
    iterations,
  };
}

/** Convenience: full rashi/nakshatra/pada assignment at the transition instant. */
export function transitionDetail(
  mode: AyanamshaMode,
  transition: MoonTransition,
): NakshatraResult {
  return getRashiNakshatraPada(mode, transition.utcInstant, 'Moon');
}

