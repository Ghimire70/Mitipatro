// lib/astronomy/sidereal.ts
//
// Stage 2 sidereal layer — NEW FILE (Stage 1 files are untouched).
//
// Computes sidereal longitude from Stage 1's true apparent ecliptic-of-date
// longitude minus the true Lahiri ayanamsha.
//
// CONSTANTS AND SOURCES:
//   None of its own — it re-uses LAHIRI_VALUE_AT_EPOCH_ARCSEC and the IAU 1976
//   precession from ayanamsha.ts (each constant there carries its source).
//
// CONVENTION (approved Stage 2):
//   sidereal = wrap360( true_apparent_longitude - true_Lahiri_ayanamsha )
// Because Stage 1 longitude already includes nutation (true equinox of date)
// and we subtract the TRUE ayanamsha (mean + dpsi), the nutation term cancels
// and the sidereal longitude is nutation-independent (see JME §1.1).

import { getPlanetaryPositions } from './planetaryPositions.js';
import type { BodyId, EclipticCoord, PlanetarySnapshot } from './types.js';
import { getAyanamsha, type AyanamshaMode } from './ayanamsha.js';

/** Result of a sidereal-position computation. Angles in degrees. */
export interface SiderealPosition {
  body: BodyId;
  /** Stage 1 true apparent ecliptic-of-date longitude [0, 360). */
  tropicalLongitudeDegrees: number;
  /** True Lahiri ayanamsha at the instant (mean + dpsi/3600), degrees. */
  ayanamshaDegrees: number;
  /** Sidereal longitude [0, 360) = wrap360(tropical - ayanamsha). */
  siderealLongitudeDegrees: number;
  /** Mean ayanamsha component, degrees. */
  meanDegrees: number;
  /** Nutation in longitude used, arcseconds. */
  dpsiArcsec: number;
}

/** Normalize an angle to [0, 360). */
export function wrap360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Compute the sidereal position of a body at a UTC instant.
 *
 * sidereal = wrap360( true_apparent_longitude - true_Lahiri_ayanamsha )
 *
 * @param mode  ayanamsha mode (parameterized; swappable).
 * @param instant  UTC Date (never mutated).
 * @param body  BodyId (default 'Moon').
 * @returns SiderealPosition
 * @throws if instant invalid, mode unsupported, or body unsupported.
 */
export function getSiderealPosition(
  mode: AyanamshaMode,
  instant: Date,
  body: BodyId = 'Moon',
): SiderealPosition {
  const snap = getPlanetaryPositions(instant);
  const lon = snap.positions[body].longitude;
  const aya = getAyanamsha(mode, instant);
  const sidereal = wrap360(lon - aya.trueDegrees);
  return {
    body,
    tropicalLongitudeDegrees: lon,
    ayanamshaDegrees: aya.trueDegrees,
    siderealLongitudeDegrees: sidereal,
    meanDegrees: aya.meanDegrees,
    dpsiArcsec: aya.dpsiArcsec,
  };
}
