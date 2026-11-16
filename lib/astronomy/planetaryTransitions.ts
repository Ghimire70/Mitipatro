// lib/astronomy/planetaryTransitions.ts
//
// Stage 8 sidereal layer — NEW FILE.
//
// Finds the instant a planet's sidereal longitude crosses a Rashi (sign)
// boundary — i.e. when the planet enters (ingresses) a new Rashi or exits
// (egresses) its current one.
//
// Reuses existing Stage 1–2 modules: getSiderealPosition (sidereal.ts) and
// RASHI_SPAN_DEGREES (nakshatra.ts). Does NOT duplicate the sidereal or rashi
// formulas.
//
// Unlike the Moon (which is always prograde), planets can be retrograde, so
// the direction of motion is detected from the longitude derivative rather
// than assumed.
//
// CONVENTIONS:
//   Rashi boundary = multiple of 30° in sidereal longitude.
//   Prograde:  longitude increases → next boundary is (floor(lon/30)+1)*30.
//   Retrograde: longitude decreases → next boundary is ceil(lon/30)*30.
//   At exactly a boundary: prograde targets the NEXT boundary; retrograde
//   targets the PREVIOUS boundary.
//   Half-open intervals [start, start+30): exactly 30° belongs to the next
//   Rashi (prograde case).
//
// Sources for formulas:
//   - Sidereal longitude: existing getSiderealPosition (Stage 2, Lahiri ayanamsha).
//   - Rashi span: 30° (definitional: 12 rashis × 30° = 360°).
//   - Bisection: same architecture as moonTransitions.ts (Stage 2).

import { getSiderealPosition, wrap360 } from './sidereal.js';
import { RASHI_SPAN_DEGREES } from './nakshatra.js';
import { rashiName } from './nakshatra.js';
import type { BodyId } from './types.js';
import type { AyanamshaMode } from './ayanamsha.js';
import { toKathmanduString } from './moonTransitions.js';

/** Angular tolerance for the root finder: 1 arcsecond. */
export const ROOT_TOLERANCE_DEGREES = 1 / 3600;

/** Maximum bisection iterations. */
export const MAX_ITERATIONS = 400;

/**
 * Initial bracket step in hours.
 *
 * Outer planets (Jupiter ~12 yr, Saturn ~29 yr) take months to years to
 * cross a single 30° Rashi. A 6-hour step would require thousands of
 * iterations to reach the boundary. A 72-hour (3-day) step is large enough
 * to reach outer-planet boundaries within the iteration budget, but small
 * enough that fast planets (Moon, ~2.3 days per Rashi) do not skip two
 * boundaries in a single step.
 */
export const BRACKET_STEP_HOURS = 72;

/** Short probe interval (hours) used to determine direction of motion. */
const DIRECTION_PROBE_HOURS = 2;

/** Result of a planetary rashi ingress/egress root-find. */
export interface PlanetaryTransition {
  /** Planet identifier. */
  body: BodyId;
  /** Target boundary sidereal longitude (degrees), [0, 360). */
  targetRashiBoundaryDegrees: number;
  /** Rashi index that the planet enters after this boundary (0..11). */
  nextRashiIndex: number;
  /** Rashi name entered after this boundary. */
  nextRashiName: string;
  /** Rashi index the planet was in before the boundary (0..11). */
  fromRashiIndex: number;
  /** Rashi name before the boundary. */
  fromRashiName: string;
  /** Direction of motion: 'prograde' (lon increasing) or 'retrograde' (lon decreasing). */
  direction: 'prograde' | 'retrograde';
  /** UTC instant when the boundary is crossed. */
  utcInstant: Date;
  /** Asia/Kathmandu display string. */
  kathmanduDisplay: string;
  /** Sidereal longitude at the root. */
  siderealLongitudeDegrees: number;
  /** Angular residual (degrees). */
  residualDegrees: number;
  /** Bisection iterations used. */
  iterations: number;
}

/** Planet's sidereal longitude at a UTC instant [0, 360). */
function planetSiderealLon(mode: AyanamshaMode, instant: Date, body: BodyId): number {
  return getSiderealPosition(mode, instant, body).siderealLongitudeDegrees;
}

/** Signed angular difference (a - b) in (-180, 180]. */
function signedDelta(a: number, b: number): number {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Determine the direction of motion for a planet at a given instant.
 *
 * Probes the longitude at t0 and t0 + DIRECTION_PROBE_HOURS and returns
 * 'prograde' or 'retrograde'.
 *
 * For Sun and Moon (which always move prograde), this always returns
 * 'prograde'.
 *
 * @param mode  ayanamsha mode.
 * @param t0    starting UTC instant.
 * @param body  planet identifier.
 */
function detectDirection(
  mode: AyanamshaMode,
  t0: Date,
  body: BodyId,
): 'prograde' | 'retrograde' {
  const probe = new Date(t0.getTime() + DIRECTION_PROBE_HOURS * 3600 * 1000);
  const lon0 = planetSiderealLon(mode, t0, body);
  const lon1 = planetSiderealLon(mode, probe, body);
  const delta = signedDelta(lon1, lon0);
  return delta >= 0 ? 'prograde' : 'retrograde';
}

/**
 * Find the next Rashi boundary crossing for a planet after t0.
 *
 * Detects direction of motion (prograde/retrograde) and finds the boundary
 * in the appropriate direction. Returns UTC instant plus Asia/Kathmandu
 * display.
 *
 * @param mode  ayanamsha mode.
 * @param t0    starting UTC instant.
 * @param body  planet identifier.
 * @returns PlanetaryTransition
 * @throws if the crossing cannot be bracketed within MAX_ITERATIONS steps.
 */
export function findPlanetaryTransition(
  mode: AyanamshaMode,
  t0: Date,
  body: BodyId,
): PlanetaryTransition {
  const lon0 = wrap360(planetSiderealLon(mode, t0, body));
  const direction = detectDirection(mode, t0, body);

  // Determine target boundary and target value of f.
  // f(t) = unwrapped longitude change since t0 − targetDelta.
  // Root when f == 0.
  let targetBoundary: number;
  let targetDelta: number;
  let fromRashiIndex: number;

  if (direction === 'prograde') {
    // Next boundary in increasing direction.
    targetBoundary = (Math.floor(lon0 / RASHI_SPAN_DEGREES) + 1) * RASHI_SPAN_DEGREES;
    targetDelta = wrap360(targetBoundary) - lon0;
    if (targetDelta <= 0) targetDelta += 360; // ensure positive
    fromRashiIndex = Math.floor(lon0 / RASHI_SPAN_DEGREES);
  } else {
    // Next boundary in decreasing direction (retrograde).
    // If exactly on a boundary, target the previous one.
    const currentBoundary = Math.floor(lon0 / RASHI_SPAN_DEGREES) * RASHI_SPAN_DEGREES;
    if (Math.abs(lon0 - currentBoundary) < 1e-9) {
      // Exactly on a boundary; go to previous.
      targetBoundary = currentBoundary - RASHI_SPAN_DEGREES;
      fromRashiIndex = Math.floor(lon0 / RASHI_SPAN_DEGREES);
    } else {
      targetBoundary = currentBoundary;
      fromRashiIndex = Math.floor(lon0 / RASHI_SPAN_DEGREES);
    }
    // For retrograde, we want to go backwards (decreasing longitude).
    // targetDelta should be negative.
    targetDelta = wrap360(targetBoundary) - lon0;
    if (targetDelta > 0) targetDelta -= 360; // make negative
  }

  const f = (t: Date): number => {
    const lon = wrap360(planetSiderealLon(mode, t, body));
    let delta = lon - lon0;
    if (delta < -180) delta += 360;
    if (delta > 180) delta -= 360;
    return delta - targetDelta;
  };

  // ---- Bracket: step forward until f changes sign (f(t0) = -targetDelta) ----
  const stepMs = BRACKET_STEP_HOURS * 3600 * 1000;
  let tLow = new Date(t0.getTime());
  let fLow = f(tLow);
  let tHigh: Date | null = null;
  let fHigh: number | null = null;
  let probe = new Date(t0.getTime() + stepMs);
  let steps = 0;
  while (steps < MAX_ITERATIONS) {
    const ft = f(probe);
    // For prograde (targetDelta > 0), f goes from negative to positive.
    // For retrograde (targetDelta < 0), f goes from positive to negative.
    const crossed = direction === 'prograde' ? ft > 0 : ft < 0;
    if (crossed) {
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
      `Could not bracket ${body} ${direction} rashi transition after ${MAX_ITERATIONS} steps`,
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
    // Determine which side the root is on based on direction.
    const rootIsBeforeMid = direction === 'prograde' ? fMid > 0 : fMid < 0;
    if (rootIsBeforeMid) {
      tHigh = tMid;
      fHigh = fMid;
    } else {
      tLow = tMid;
      fLow = fMid;
    }
    iterations++;
    if (Math.abs(fLow) <= ROOT_TOLERANCE_DEGREES) break;
  }

  const root = new Date(tLow.getTime());
  const rootLon = wrap360(planetSiderealLon(mode, root, body));
  const residual = f(root);

  // The Rashi the planet enters after the boundary.
  const targetLon = wrap360(targetBoundary);
  let nextRashiIndex: number;
  if (direction === 'prograde') {
    nextRashiIndex = Math.floor(targetLon / RASHI_SPAN_DEGREES) % 12;
  } else {
    // Retrograde: the target boundary is the START of the Rashi we're leaving.
    // The planet enters the PREVIOUS rashi (targetBoundary - 30).
    nextRashiIndex = Math.floor(wrap360(targetBoundary - RASHI_SPAN_DEGREES) / RASHI_SPAN_DEGREES) % 12;
  }

  return {
    body,
    targetRashiBoundaryDegrees: targetLon,
    nextRashiIndex,
    nextRashiName: rashiName(nextRashiIndex),
    fromRashiIndex,
    fromRashiName: rashiName(fromRashiIndex),
    direction,
    utcInstant: root,
    kathmanduDisplay: toKathmanduString(root),
    siderealLongitudeDegrees: rootLon,
    residualDegrees: residual,
    iterations,
  };
}