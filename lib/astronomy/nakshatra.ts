// lib/astronomy/nakshatra.ts
//
// Stage 2 sidereal layer — NEW FILE (Stage 1 files are untouched).
//
// Rashi (sign), nakshatra and pada assignment from a sidereal longitude,
// with the boundary rule and an onBoundary flag.
//
// CONSTANTS AND SOURCES:
//   RASHI_SPAN_DEGREES   = 30°   Definitional: 12 rashis × 30° = 360°.
//   NAKSHATRA_SPAN_DEGREES = 13°20′ = 40/3°  Definitional: 27 nakshatras ×
//                                          13°20′ = 360°.
//   PADA_SPAN_DEGREES    = 3°20′ = 10/3°  Definitional: 4 padas per nakshatra.
//   BOUNDARY_EPSILON_DEGREES = 1 arcsecond = 1/3600°  Internal consistency
//                                          choice (matches moonTransitions
//                                          root tolerance); UNVERIFIED against
//                                          any panchang maker's convention.
//
// BOUNDARY RULE (lower-bound-inclusive, upper-bound-exclusive):
//   A division spans [start, start+span). A longitude of exactly
//   30.0000° belongs to the NEXT rashi; exactly 13°20′ belongs to the next
//   nakshatra; exactly 3°20′ belongs to the next pada.
//   Floating-point noise near a cusp can flip a floor() assignment, so any
//   longitude within EPSILON of a boundary is flagged onBoundary with
//   nearBoundaryOf indicating which cusp; callers should review flagged cases.

import type { BodyId } from './types.js';
import { getSiderealPosition, wrap360, type SiderealPosition } from './sidereal.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** 1 rashi = 30 degrees. Definitional. */
export const RASHI_SPAN_DEGREES = 30;

/**
 * 1 nakshatra = 13 deg 20 min = 40/3 degrees.
 * Definitional: 27 nakshatras × 13°20′ = 360°.
 */
export const NAKSHATRA_SPAN_DEGREES = 40 / 3;

/** 1 pada = 3 deg 20 min = 10/3 degrees = nakshatra_span / 4. Definitional. */
export const PADA_SPAN_DEGREES = (40 / 3) / 4; // 10/3

/** Number of nakshatra divisions around the zodiac. Definitional. */
export const NAKSHATRA_COUNT = 27;
/** Number of pada per nakshatra. Definitional. */
export const PADA_PER_NAKSHATRA = 4;

/** Rashi identifiers in traditional Vedic order (index 0 = Mesha ... 11 = Meen). */
export const RASHI_IDS: readonly string[] = [
  'mesha', 'vrisha', 'mithun', 'karkat', 'simha', 'kanya',
  'tula', 'vrischik', 'dhanu', 'makar', 'kumbha', 'meen',
] as const;

/** Nakshatra identifiers (index 0 = Ashwini ... 26 = Revati). */
export const NAKSHATRA_IDS: readonly string[] = [
  'ashwini', 'bharani', 'kritika', 'rohini', 'mrigashirsha', 'ardra',
  'punarvasu', 'pushya', 'ashlesha', 'magha', 'purva-phalguni',
  'uttara-phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha',
  'jyeshtha', 'mula', 'purva-ashadha', 'uttara-ashadha', 'shravana',
  'dhanishtha', 'shatabhisha', 'purva-bhadrapada', 'uttara-bhadrapada',
  'revati',
] as const;

/**
 * Tolerance (degrees) for treating a sidereal longitude as "on a boundary".
 * 1 arcsecond = 1/3600 degree. Chosen to match the root-finding tolerance in
 * moonTransitions.ts.
 *
 * UNVERIFIED: whether panchang makers use a comparable epsilon; this is an
 * internal-consistency choice to avoid misclassification from floating-point
 * noise exactly at a cusp.
 */
export const BOUNDARY_EPSILON_DEGREES = 1 / 3600;

/** Full result of rashi/nakshatra/pada assignment. */
export interface NakshatraResult {
  sidereal: SiderealPosition;
  /** Sidereal longitude [0, 360) used for the assignment. */
  siderealLongitudeDegrees: number;
  /** Rashi index 0..11 (Mesha..Meen). */
  rashiIndex: number;
  /** Longitude within the rashi, [0, 30). */
  rashiLongitudeDegrees: number;
  /** Nakshatra index 0..26 (Ashwini..Revati). */
  nakshatraIndex: number;
  /** Longitude within the nakshatra, [0, 13°20′). */
  nakshatraLongitudeDegrees: number;
  /** Pada 1..4. */
  pada: number;
  /** Longitude within the pada, [0, 3°20′). */
  padaLongitudeDegrees: number;
  /** True if within EPSILON of a rashi/nakshatra/pada boundary. */
  onBoundary: boolean;
  /** Which boundary is near: 'rashi' | 'nakshatra' | 'pada' | null. */
  nearBoundaryOf: 'rashi' | 'nakshatra' | 'pada' | null;
}

/**
 * Floor-based sign/nakshatra/pada assignment with
 * [start, start+span) semantics: exactly 30.0000° -> next rashi, etc.
 *
 * Boundary rule: if within EPSILON of a boundary, onBoundary=true and
 * nearBoundaryOf names the cusp; assignment still uses floor() so an exact
 * boundary maps to the next division. Flagged cases should be reviewed
 * against the reference panchang.
 */
export function getRashiNakshatraPada(
  mode: AyanamshaMode,
  instant: Date,
  body: BodyId = 'Moon',
): NakshatraResult {
  const sidereal = getSiderealPosition(mode, instant, body);
  const lon = wrap360(sidereal.siderealLongitudeDegrees);

  // Rashi: [0,30), [30,60), ... ; exactly 30 -> next rashi (floor handles it).
  const rashiIndex = Math.floor(lon / RASHI_SPAN_DEGREES);
  const rashiLon = lon - rashiIndex * RASHI_SPAN_DEGREES;

  // Nakshatra: [0, 13°20′), ... ; exactly 13°20′ -> next nakshatra.
  const nakIndex = Math.floor(lon / NAKSHATRA_SPAN_DEGREES);
  const nakLon = lon - nakIndex * NAKSHATRA_SPAN_DEGREES;

  // Pada: [0, 3°20′), ... within the nakshatra; exactly 3°20′ -> next pada.
  const padaIndex = Math.floor(nakLon / PADA_SPAN_DEGREES);
  const pada = padaIndex + 1; // 1..4
  const padaLon = nakLon - padaIndex * PADA_SPAN_DEGREES;

  // Boundary detection (lower bound inclusive / upper bound exclusive).
  const eps = BOUNDARY_EPSILON_DEGREES;
  let onBoundary = false;
  let near: 'rashi' | 'nakshatra' | 'pada' | null = null;

  const rashiPosInSign = lon % RASHI_SPAN_DEGREES;
  if (rashiPosInSign < eps || rashiPosInSign > RASHI_SPAN_DEGREES - eps) {
    onBoundary = true;
    near = 'rashi';
  } else {
    if (nakLon < eps || nakLon > NAKSHATRA_SPAN_DEGREES - eps) {
      onBoundary = true;
      near = 'nakshatra';
    } else if (padaLon < eps || padaLon > PADA_SPAN_DEGREES - eps) {
      onBoundary = true;
      near = 'pada';
    }
  }

  return {
    sidereal,
    siderealLongitudeDegrees: lon,
    rashiIndex,
    rashiLongitudeDegrees: rashiLon,
    nakshatraIndex: nakIndex,
    nakshatraLongitudeDegrees: nakLon,
    pada,
    padaLongitudeDegrees: padaLon,
    onBoundary,
    nearBoundaryOf: near,
  };
}

export function rashiName(index: number): string {
  return RASHI_IDS[index];
}

export function nakshatraName(index: number): string {
  return NAKSHATRA_IDS[index];
}

