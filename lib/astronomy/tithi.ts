// lib/astronomy/tithi.ts
//
// Stage 3 sidereal layer — NEW FILE (Stage 1 and Stage 2 files are untouched).
//
// Computes geocentric sidereal Tithi (lunar day) from the Moon–Sun elongation.
//
// CONVENTION:
//   elongation = wrap360(moon_sidereal_lon − sun_sidereal_lon)
//   tithi_index  = floor(elongation / 12)        // 0..29
//   Each Tithi spans exactly 12 degrees.
//   Half-open intervals [start, start+12): exactly 12° belongs to the next Tithi.
//   Purnima (Shukla 15) is tithiIndex 14, covering [168°, 180°).
//   At elongation = 180°, floor(180/12) = 15 => Krishna Prathama (next Tithi).
//   Amavasya (Krishna 15) is tithiIndex 29, covering [348°, 360°).
//   At elongation = 360° ≡ 0°, floor(0/12) = 0 => Shukla Prathama.
//
// NOTE: The ayanamsha cancels in the elongation difference, so sidereal
// elongation equals tropical elongation. We compute via sidereal longitudes
// for consistency with the Stage 2 pipeline.

import { getSiderealPosition, wrap360, type SiderealPosition } from './sidereal.js';
import type { BodyId } from './types.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** 1 Tithi = 12 degrees. Definitional. */
export const TITHI_SPAN_DEGREES = 12;

/** Number of Tithis in a lunar month. Definitional: 30 × 12° = 360°. */
export const TITHI_COUNT = 30;

/** Number of Tithis per Paksha. Definitional: 15 per paksha. */
export const TITHIS_PER_PAKSHA = 15;

/** Paksha identifiers. */
export type PakshaId = 'shukla' | 'krishna';

/** Full result of Tithi calculation. Angles in degrees. */
export interface TithiResult {
  /** Elongation = Moon − Sun, sidereal, [0, 360). */
  elongationDegrees: number;
  /** Tithi index 0..29. */
  tithiIndex: number;
  /** Elongation within the Tithi, [0, 12). */
  elongationWithinTithiDegrees: number;
  /** Remaining angular distance to next Tithi boundary, (0, 12]. */
  remainingToNextTithiDegrees: number;
  /** Paksha: 'shukla' or 'krishna'. */
  paksha: PakshaId;
  /** Tithi number within Paksha, 1..15. */
  tithiNumber: number;
  /** Sun sidereal position used. */
  sun: SiderealPosition;
  /** Moon sidereal position used. */
  moon: SiderealPosition;
}

/** Sanskrit Tithi names for Shukla Paksha (tithi_number 1..15). */
export const SHUKLA_TITHI_NAMES: readonly string[] = [
  'prathama', 'dwitiya', 'tritiya', 'chaturthi', 'panchami',
  'shashthi', 'saptami', 'ashtami', 'navami', 'dashami',
  'ekadashi', 'dwadashi', 'trayodashi', 'chaturdashi', 'purnima',
] as const;

/** Sanskrit Tithi names for Krishna Paksha (tithi_number 1..15). */
export const KRISHNA_TITHI_NAMES: readonly string[] = [
  'prathama', 'dwitiya', 'tritiya', 'chaturthi', 'panchami',
  'shashthi', 'saptami', 'ashtami', 'navami', 'dashami',
  'ekadashi', 'dwadashi', 'trayodashi', 'chaturdashi', 'amavasya',
] as const;

/** All 30 Tithi names in order (index 0..29). */
export const TITHI_NAMES: readonly string[] = [
  ...SHUKLA_TITHI_NAMES,
  ...KRISHNA_TITHI_NAMES,
] as const;

/** Paksha display names. */
export const PAKSHA_NAMES: Record<PakshaId, string> = {
  shukla: 'shukla',
  krishna: 'krishna',
};

/**
 * Compute the Tithi for a UTC instant.
 *
 * @param mode   ayanamsha mode (parameterized; swappable).
 * @param instant UTC Date (never mutated).
 * @returns TithiResult
 */
export function getTithi(
  mode: AyanamshaMode,
  instant: Date,
): TithiResult {
  const sun = getSiderealPosition(mode, instant, 'Sun');
  const moon = getSiderealPosition(mode, instant, 'Moon');
  const elongation = wrap360(moon.siderealLongitudeDegrees - sun.siderealLongitudeDegrees);

  const tithiIndex = Math.floor(elongation / TITHI_SPAN_DEGREES);
  const elongationWithin = elongation - tithiIndex * TITHI_SPAN_DEGREES;
  const remaining = TITHI_SPAN_DEGREES - elongationWithin;

  const paksha: PakshaId = tithiIndex < TITHIS_PER_PAKSHA ? 'shukla' : 'krishna';
  const tithiNumber = paksha === 'shukla'
    ? tithiIndex + 1
    : tithiIndex - TITHIS_PER_PAKSHA + 1;

  return {
    elongationDegrees: elongation,
    tithiIndex,
    elongationWithinTithiDegrees: elongationWithin,
    remainingToNextTithiDegrees: remaining,
    paksha,
    tithiNumber,
    sun,
    moon,
  };
}

export function tithiName(index: number): string {
  return TITHI_NAMES[index];
}

export function pakshaName(paksha: PakshaId): string {
  return PAKSHA_NAMES[paksha];
}
