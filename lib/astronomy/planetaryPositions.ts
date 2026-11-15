// lib/astronomy/planetaryPositions.ts

import { GeoVector, Ecliptic } from 'astronomy-engine';
import type { BodyId, EclipticCoord, PlanetarySnapshot } from './types.js';
import { SUPPORTED_BODIES } from './constants.js';
import { toAstronomyBody } from './bodies.js';

const ENGINE_NAME = 'astronomy-engine';
const ENGINE_VERSION = '2.1.19';

/**
 * Compute geocentric tropical ecliptic coordinates for all supported bodies
 * at the supplied UTC instant.
 *
 * Coordinate conventions:
 *   - Frame: geocentric (Earth-centre observer)
 *   - System: true ecliptic of date (tropical) — IAU76/80 precession + nutation
 *   - Aberration: corrected (apparent coordinates)
 *   - Light-time: corrected (back-dated positions)
 *   - Longitude: [0, 360) degrees, measured from vernal equinox, prograde
 *   - Latitude: (−90, +90) degrees, north positive
 *   - Distance: geocentric range in astronomical units (AU)
 *
 * @param instant  A JavaScript Date object representing a UTC instant.
 *                 This object is never mutated.
 * @throws         If the supplied value is not a valid Date.
 */
export function getPlanetaryPositions(instant: Date): PlanetarySnapshot {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new Error('Invalid Date object supplied to getPlanetaryPositions');
  }

  // Work on a snapshot of the timestamp so the caller's Date is never mutated.
  const timestamp = instant.toISOString();
  // astronomy-engine accepts a Date directly and reads it as UTC.
  const workDate = new Date(instant.getTime());

  const positions = {} as Record<BodyId, EclipticCoord>;

  for (const bodyId of SUPPORTED_BODIES) {
    const astroBody = toAstronomyBody(bodyId);

    // GeoVector returns geocentric J2000 equatorial Cartesian vector.
    // aberration=true  → apparent (corrects for stellar aberration + light-time).
    const eqjVec = GeoVector(astroBody, workDate, true);

    // Ecliptic() converts J2000 equatorial → true ecliptic of date (tropical ECT).
    // Returns elon [0,360) and elat in degrees.
    const ecl = Ecliptic(eqjVec);

    // Normalize longitude defensively; Astronomy Engine already returns [0,360)
    // from Ecliptic(), but we apply modular arithmetic to be explicit.
    const longitude = ((ecl.elon % 360) + 360) % 360;

    positions[bodyId] = {
      longitude,
      latitude: ecl.elat,
      // ecl.vec is the rotated Cartesian vector; Length() gives geocentric AU.
      distance: ecl.vec.Length(),
    };
  }

  return {
    timestamp,
    coordinateSystem: 'geocentric-tropical-ecliptic',
    engine: { name: ENGINE_NAME, version: ENGINE_VERSION },
    positions,
  };
}
