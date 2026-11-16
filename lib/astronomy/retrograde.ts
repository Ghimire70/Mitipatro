// lib/astronomy/retrograde.ts
//
// Stage 8 sidereal layer — NEW FILE.
//
// Detects whether a planet is in retrograde (appearing to move backwards in
// the zodiac) or direct (prograde) motion at a given UTC instant.
//
// METHOD:
//   Compute the geocentric apparent ecliptic longitude at two nearby
//   instants (t and t + probeInterval). The signed difference (in (-180, 180])
//   determines the direction:
//     delta > 0  → direct (prograde)
//     delta < 0  → retrograde
//     delta ≈ 0  → stationary (rare; reported separately)
//
//   The probe interval is chosen to be large enough to smooth out
//   sub-hourly noise but small enough that the planet does not complete a
//   full retrograde loop within it.
//
//   Sun and Moon are always direct: their geocentric longitude always
//   increases (Earth's orbit and the Moon's orbit are prograde).
//
// CONVENTIONS:
//   - Sidereal longitudes are used (Lahiri ayanamsha), consistent with the
//     rest of the engine. The direction of motion is the same whether we use
//     tropical or sidereal coordinates (ayanamsha changes slowly).
//   - Retrograde is NOT inferred from Rashi changes.
//
// NUMERICAL LIMITATIONS:
//   - Near stationary points, the longitude change over the probe interval
//     can be very small and susceptible to floating-point noise. We use a
//     threshold (STATIONARY_THRESHOLD_DEG) below which the planet is
//     reported as 'stationary' rather than prograde/retrograde.
//   - The probe interval should not be too long, or a fast planet could
//     change direction within it.
//   - For Mars, which can be retrograde for ~2 months, a 2-hour probe is
//     safe. For Mercury/Venus (short retrograde periods ~3 weeks), 2 hours
//     is also safe.

import { getSiderealPosition, wrap360 } from './sidereal.js';
import type { BodyId } from './types.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** Probe interval in hours for retrograde detection. */
export const PROBE_INTERVAL_HOURS = 2;

/**
 * Threshold (degrees) below which the longitude change is considered
 * 'stationary'. At the Sun's ~1°/day rate, 2 hours ≈ 0.083°. For planets,
 * the threshold is chosen to detect genuine stationary points (where
 * daily motion approaches zero).
 */
export const STATIONARY_THRESHOLD_DEG = 0.001;

/** Direction of motion. */
export type MotionDirection = 'direct' | 'retrograde' | 'stationary';

/** Result of retrograde detection. */
export interface RetrogradeResult {
  /** Planet identifier. */
  body: BodyId;
  /** Detected direction at the given instant. */
  direction: MotionDirection;
  /** Longitude at t0 (sidereal, [0, 360)). */
  longitudeAtStart: number;
  /** Longitude at t0 + probeInterval (sidereal, [0, 360)). */
  longitudeAtProbe: number;
  /** Signed angular change over the probe interval (degrees, in (-180, 180]). */
  deltaDegrees: number;
  /** Rate of change in degrees per hour. */
  rateDegPerHour: number;
  /** Probe interval used (hours). */
  probeIntervalHours: number;
  /** UTC instant of the initial observation. */
  instant: Date;
}

/** Signed angular difference (a - b) in (-180, 180]. */
function signedDelta(a: number, b: number): number {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Determine whether a planet is direct, retrograde, or stationary at a
 * given UTC instant.
 *
 * Sun and Moon always return 'direct'.
 *
 * @param mode   ayanamsha mode.
 * @param instant UTC instant of observation (never mutated).
 * @param body   planet identifier.
 * @returns RetrogradeResult
 */
export function getRetrogradeStatus(
  mode: AyanamshaMode,
  instant: Date,
  body: BodyId,
): RetrogradeResult {
  const probe = new Date(instant.getTime() + PROBE_INTERVAL_HOURS * 3600 * 1000);

  const lonStart = wrap360(
    getSiderealPosition(mode, instant, body).siderealLongitudeDegrees,
  );
  const lonProbe = wrap360(
    getSiderealPosition(mode, probe, body).siderealLongitudeDegrees,
  );

  const delta = signedDelta(lonProbe, lonStart);
  const rate = delta / PROBE_INTERVAL_HOURS;

  // Sun and Moon are always direct.
  if (body === 'Sun' || body === 'Moon') {
    return {
      body,
      direction: 'direct',
      longitudeAtStart: lonStart,
      longitudeAtProbe: lonProbe,
      deltaDegrees: delta,
      rateDegPerHour: rate,
      probeIntervalHours: PROBE_INTERVAL_HOURS,
      instant: new Date(instant.getTime()),
    };
  }

  // Determine direction.
  let direction: MotionDirection;
  if (Math.abs(delta) < STATIONARY_THRESHOLD_DEG) {
    direction = 'stationary';
  } else if (delta > 0) {
    direction = 'direct';
  } else {
    direction = 'retrograde';
  }

  return {
    body,
    direction,
    longitudeAtStart: lonStart,
    longitudeAtProbe: lonProbe,
    deltaDegrees: delta,
    rateDegPerHour: rate,
    probeIntervalHours: PROBE_INTERVAL_HOURS,
    instant: new Date(instant.getTime()),
  };
}

/**
 * Get retrograde status for all supported planets at once.
 *
 * @param mode    ayanamsha mode.
 * @param instant  UTC instant of observation.
 * @param bodies   array of planet identifiers (default: all 7).
 * @returns Record mapping each body to its RetrogradeResult.
 */
export function getAllRetrogradeStatus(
  mode: AyanamshaMode,
  instant: Date,
  bodies: readonly BodyId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
): Record<BodyId, RetrogradeResult> {
  const result = {} as Record<BodyId, RetrogradeResult>;
  for (const body of bodies) {
    result[body] = getRetrogradeStatus(mode, instant, body);
  }
  return result;
}