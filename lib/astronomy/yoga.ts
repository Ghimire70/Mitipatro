// lib/astronomy/yoga.ts
//
// Stage 4 sidereal layer — NEW FILE (Stage 1, 2, 3 files are untouched).
//
// Computes geocentric sidereal Yoga from the SUM of Sun and Moon sidereal longitudes.
//
// CONVENTION:
//   yoga_longitude = wrap360(sun_sidereal_lon + moon_sidereal_lon)
//   yoga_index  = floor(yoga_longitude / YOGA_SPAN_DEGREES)  // 0..26
//   Each Yoga spans exactly 360/27 = 13°20' = 13.333... degrees.
//   Half-open intervals [start, start+span): exactly 13°20' belongs to the next Yoga.
//
// IMPORTANT: Yoga uses the SUM of sidereal longitudes (Sun + Moon).
// Do not confuse with Tithi which uses the DIFFERENCE (Moon - Sun).
// The ayanamsha does NOT cancel in this sum; we must use sidereal longitudes
// consistently with the Stage 2 pipeline.

import { getSiderealPosition, wrap360, type SiderealPosition } from './sidereal.js';
import type { BodyId } from './types.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** 1 Yoga = 360/27 = 13°20' = 13.333... degrees. Definitional. */
export const YOGA_SPAN_DEGREES = 360 / 27;

/** Number of Yogas in a cycle. Definitional: 27 × (360/27) = 360°. */
export const YOGA_COUNT = 27;

/** Full result of Yoga calculation. Angles in degrees. */
export interface YogaResult {
  /** Yoga longitude = Sun + Moon, sidereal, [0, 360). */
  yogaLongitudeDegrees: number;
  /** Yoga index 0..26. */
  yogaIndex: number;
  /** Yoga longitude within the current Yoga, [0, YOGA_SPAN_DEGREES). */
  longitudeWithinYogaDegrees: number;
  /** Remaining angular distance to next Yoga boundary, (0, YOGA_SPAN_DEGREES]. */
  remainingToNextYogaDegrees: number;
  /** Sun sidereal position used. */
  sun: SiderealPosition;
  /** Moon sidereal position used. */
  moon: SiderealPosition;
}

/** Sanskrit Yoga names in traditional order (index 0..26). */
export const YOGA_NAMES: readonly string[] = [
  'vishkambha',   // 1
  'priti',        // 2
  'ayushman',     // 3
  'saubhagya',    // 4
  'shobhana',     // 5
  'atiganda',     // 6
  'sukarma',      // 7
  'dhriti',       // 8
  'shula',        // 9
  'ganda',        // 10
  'vriddhi',      // 11
  'dhruva',       // 12
  'vyaghata',     // 13
  'harshana',     // 14
  'vajra',        // 15
  'siddhi',       // 16
  'vyatipata',    // 17
  'variyana',     // 18
  'parigha',      // 19
  'shiva',        // 20
  'siddha',       // 21
  'sadhya',       // 22
  'shubha',       // 23
  'shukla',       // 24
  'brahma',       // 25
  'indra',        // 26
  'vaidhriti',    // 27
] as const;

/**
 * Compute the Yoga for a UTC instant.
 *
 * @param mode   ayanamsha mode (parameterized; swappable).
 * @param instant UTC Date (never mutated).
 * @returns YogaResult
 */
export function getYoga(
  mode: AyanamshaMode,
  instant: Date,
): YogaResult {
  const sun = getSiderealPosition(mode, instant, 'Sun');
  const moon = getSiderealPosition(mode, instant, 'Moon');
  const yogaLongitude = wrap360(sun.siderealLongitudeDegrees + moon.siderealLongitudeDegrees);

  const yogaIndex = Math.floor(yogaLongitude / YOGA_SPAN_DEGREES);
  const longitudeWithin = yogaLongitude - yogaIndex * YOGA_SPAN_DEGREES;
  const remaining = YOGA_SPAN_DEGREES - longitudeWithin;

  return {
    yogaLongitudeDegrees: yogaLongitude,
    yogaIndex,
    longitudeWithinYogaDegrees: longitudeWithin,
    remainingToNextYogaDegrees: remaining,
    sun,
    moon,
  };
}

export function yogaName(index: number): string {
  return YOGA_NAMES[index];
}