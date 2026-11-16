// lib/astronomy/lunarNodes.ts
//
// Stage 8 sidereal layer — NEW FILE.
//
// Computes the lunar nodes (Rahu and Ketu) using the MEAN node convention.
//
// METHOD AND CONVENTION:
//   Rahu (ascending node, north node) = mean longitude of the Moon's ascending
//   node on the ecliptic, in tropical coordinates:
//
//     Ω_tropical = 125.04452 − 1934.136261 × T   (degrees)
//
//   where T = Julian centuries (TT) from J2000.0 (JD 2451545.0).
//
//   Ketu (descending node, south node) = Ω_tropical + 180° (exactly opposite).
//
//   Both are then converted to sidereal (Lahiri) coordinates:
//
//     Rahu_sidereal = wrap360(Ω_tropical − Lahiri_ayanamsha)
//     Ketu_sidereal = wrap360(Rahu_sidereal + 180°)
//
// SOURCE:
//   - Mean node formula: Meeus, "Astronomical Algorithms" (2nd ed., 1998),
//     Ch. 47. The mean longitude of the ascending node of the lunar orbit.
//     The linear rate −1934.136261°/century corresponds to the regression
//     of the lunar nodes (18.6-year cycle).
//   - Lahiri ayanamsha: existing ayanamsha.ts (Stage 2).
//
// IMPORTANT — MEAN vs TRUE NODE:
//   This implementation uses the MEAN node. The TRUE node (osculating node)
//   requires perturbation analysis and can differ from the mean node by up
//   to ~1.5° (per Meeus). The mean node is the standard convention used in
//   most Vedic astrology software and is sufficient for most purposes.
//
//   The mean node formula does not include periodic terms; the true node
//   oscillates around the mean with amplitude ~1.5° over a ~173-day period.
//
// KETU = Rahu + 180° is exact by definition.

import { getAyanamsha, J2000_JD, DAYS_PER_JULIAN_CENTURY, type AyanamshaMode } from './ayanamsha.js';
import { wrap360 } from './sidereal.js';

/** Mean node constant: 125.04452° at J2000.0. Source: Meeus, Ch. 47. */
export const MEAN_NODE_J2000_DEG = 125.04452;

/** Mean node regression rate: −1934.136261° per Julian century. Source: Meeus, Ch. 47. */
export const MEAN_NODE_RATE_DEG_PER_CENTURY = -1934.136261;

/** Result of lunar node computation. */
export interface LunarNodeResult {
  /** Node type. */
  node: 'rahu' | 'ketu';
  /** Tropical longitude of the ascending node [0, 360). */
  rahuTropicalDegrees: number;
  /** Sidereal (Lahiri) longitude of Rahu [0, 360). */
  rahuSiderealDegrees: number;
  /** Sidereal (Lahiri) longitude of Ketu [0, 360). */
  ketuSiderealDegrees: number;
  /** Sidereal longitude of this node [0, 360). */
  siderealLongitudeDegrees: number;
  /** Rashi index 0..11 of this node. */
  rashiIndex: number;
  /** Rashi name of this node. */
  rashiName: string;
  /** Ayanamsha used (degrees). */
  ayanamshaDegrees: number;
  /** Julian centuries from J2000.0 (TT). */
  tCenturies: number;
}

function rashiIndexFromLongitude(lon: number): number {
  return Math.floor(wrap360(lon) / 30);
}

/** Rashi names (index 0..11). Defined locally to avoid circular import. */
const RASHI_NAMES: readonly string[] = [
  'mesha', 'vrisha', 'mithun', 'karkat', 'simha', 'kanya',
  'tula', 'vrischik', 'dhanu', 'makar', 'kumbha', 'meen',
];

/**
 * Compute Rahu and Ketu at a UTC instant.
 *
 * Uses the mean node convention (see file header).
 *
 * @param mode    ayanamsha mode.
 * @param instant UTC instant (never mutated).
 * @returns LunarNodeResult for Rahu (ascending node). Ketu is 180° opposite.
 */
export function getLunarNodes(
  mode: AyanamshaMode,
  instant: Date,
): LunarNodeResult {
  // Julian centuries from J2000.0 (TT).
  // We approximate TT ≈ UTC (difference is < 2 minutes, negligible for
  // the mean node which moves ~0.053°/day).
  const utcMs = instant.getTime();
  // Julian Date (UTC approximation).
  const jd = utcMs / 86400000 + 2440587.5;
  const tCenturies = (jd - J2000_JD) / DAYS_PER_JULIAN_CENTURY;

  // Mean ascending node (tropical).
  const rahuTropical = wrap360(
    MEAN_NODE_J2000_DEG + MEAN_NODE_RATE_DEG_PER_CENTURY * tCenturies,
  );

  // Sidereal conversion.
  const aya = getAyanamsha(mode, instant);
  const rahuSidereal = wrap360(rahuTropical - aya.trueDegrees);
  const ketuSidereal = wrap360(rahuSidereal + 180);

  const siderealLon = rahuSidereal;
  const rashiIdx = rashiIndexFromLongitude(siderealLon);

  return {
    node: 'rahu',
    rahuTropicalDegrees: rahuTropical,
    rahuSiderealDegrees: rahuSidereal,
    ketuSiderealDegrees: ketuSidereal,
    siderealLongitudeDegrees: siderealLon,
    rashiIndex: rashiIdx,
    rashiName: RASHI_NAMES[rashiIdx],
    ayanamshaDegrees: aya.trueDegrees,
    tCenturies,
  };
}

/**
 * Compute Ketu (descending node) at a UTC instant.
 *
 * Ketu is exactly 180° opposite Rahu. This function calls getLunarNodes()
 * and returns the Ketu-specific result.
 *
 * @param mode    ayanamsha mode.
 * @param instant UTC instant (never mutated).
 * @returns LunarNodeResult for Ketu (descending node).
 */
export function getKetu(
  mode: AyanamshaMode,
  instant: Date,
): LunarNodeResult {
  const rahu = getLunarNodes(mode, instant);
  const ketuLon = rahu.ketuSiderealDegrees;
  const rashiIdx = rashiIndexFromLongitude(ketuLon);

  return {
    node: 'ketu',
    rahuTropicalDegrees: rahu.rahuTropicalDegrees,
    rahuSiderealDegrees: rahu.rahuSiderealDegrees,
    ketuSiderealDegrees: ketuLon,
    siderealLongitudeDegrees: ketuLon,
    rashiIndex: rashiIdx,
    rashiName: RASHI_NAMES[rashiIdx],
    ayanamshaDegrees: rahu.ayanamshaDegrees,
    tCenturies: rahu.tCenturies,
  };
}