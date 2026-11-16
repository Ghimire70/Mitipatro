// lib/astronomy/karana.ts
//
// Stage 5 sidereal layer — NEW FILE.
//
// Computes geocentric sidereal Karana (half-tithi) from the Moon–Sun elongation
// computed by Stage 3's getTithi(). Reuses the elongation function; does not
// duplicate it.
//
// CONVENTION:
//   karana_index = floor(elongation / 6)        // 0..59
//   Each Karana spans exactly 6 degrees.
//   Half-open intervals [start, start+6): exactly 6° belongs to the next Karana.
//
// CYCLE (sources: Wikipedia "Karaṇa (pañcāṅga)"; Panchang USA; Bṛhatsaṁhitā Ch. 99;
// DekhoPanchang; KaalPanchang; ePandit):
//   Index 0   = Kimstughna   (fixed, Shukla Pratipada 1st half)
//   Index 1–56 = movable cycle: Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti
//                (index−1) mod 7 → Bava(0) … Vishti(6); repeated 8× = 56 slots
//   Index 57  = Shakuni      (fixed, Krishna Chaturdashi 2nd half)
//   Index 58  = Chatushpada  (fixed, Amavasya 1st half)
//   Index 59  = Naga         (fixed, Amavasya 2nd half)
//   Total: 1 + 56 + 3 = 60.

import { getTithi } from './tithi.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** 1 Karana = 6 degrees. Definitional. */
export const KARANA_SPAN_DEGREES = 6;

/** Number of Karanas in a lunar month. Definitional: 60 × 6° = 360°. */
export const KARANA_COUNT = 60;

/** Karana identifiers (single consistent spelling set). */
export type KaranaId =
  | 'kimstughna'
  | 'bava'
  | 'balava'
  | 'kaulava'
  | 'taitila'
  | 'gara'
  | 'vanija'
  | 'vishti'
  | 'shakuni'
  | 'chatushpada'
  | 'naga';

/** Full result of Karana calculation. Angles in degrees. */
export interface KaranaResult {
  /** Elongation = Moon − Sun, sidereal, [0, 360). Reused from Stage 3. */
  elongationDegrees: number;
  /** Karana index 0..59. */
  karanaIndex: number;
  /** Elongation within the Karana, [0, 6). */
  elongationWithinKaranaDegrees: number;
  /** Remaining angular distance to next Karana boundary, (0, 6]. */
  remainingToNextKaranaDegrees: number;
}

const MOVABLE_KARANAS: readonly KaranaId[] = [
  'bava', 'balava', 'kaulava', 'taitila', 'gara', 'vanija', 'vishti',
] as const;

/** Map karana index (0..59) to name, per the approved cycle. */
export function karanaName(index: number): KaranaId {
  if (index === 0) return 'kimstughna';
  if (index >= 1 && index <= 56) {
    return MOVABLE_KARANAS[(index - 1) % MOVABLE_KARANAS.length];
  }
  if (index === 57) return 'shakuni';
  if (index === 58) return 'chatushpada';
  if (index === 59) return 'naga';
  throw new Error(`Invalid karana index: ${index}`);
}

/** All 60 karana names in index order (0..59). */
export const KARANA_NAMES: readonly KaranaId[] = (() => {
  const out: KaranaId[] = [];
  for (let i = 0; i < KARANA_COUNT; i++) out.push(karanaName(i));
  return out;
})();

/**
 * Compute the Karana for a UTC instant.
 *
 * Reuses Stage 3's getTithi() elongation (Moon − Sun). Does not duplicate the
 * elongation formula.
 *
 * @param mode   ayanamsha mode (parameterized; swappable).
 * @param instant UTC Date (never mutated).
 * @returns KaranaResult
 */
export function getKarana(
  mode: AyanamshaMode,
  instant: Date,
): KaranaResult {
  const { elongationDegrees } = getTithi(mode, instant);
  const karanaIndex = Math.floor(elongationDegrees / KARANA_SPAN_DEGREES);
  const elongationWithin = elongationDegrees - karanaIndex * KARANA_SPAN_DEGREES;
  const remaining = KARANA_SPAN_DEGREES - elongationWithin;

  return {
    elongationDegrees,
    karanaIndex,
    elongationWithinKaranaDegrees: elongationWithin,
    remainingToNextKaranaDegrees: remaining,
  };
}