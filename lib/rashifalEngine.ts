// lib/rashifalEngine.ts
//
// Rashifal engine — pure computation layer. Reads only from lib/astronomy
// (getSiderealPosition, findMoonTransition, getSunriseSunset) and lib/bsConverter
// (bsToAd, getTodayNepal). Never reads from lib/rashifalReadings.ts (content is
// supplied separately by the editor).
//
// METHOD:
//   - Moon's sidereal rashi at sunrise (Kathmandu, NPT, Lahiri ayanamsha).
//   - Moon's rashi change time (next sign boundary, NPT).
//   - Position index = (moonRashiIndex - readerRashiIndex + 12) % 12 + 1,
//     i.e. position 1 = Moon in reader's own sign, position 12 = previous sign.
//
// SOURCES:
//   - Astronomy Engine (VSOP87/ELP2000-82B pipeline) via lib/astronomy.
//   - Lahiri ayanamsha via lib/astronomy/ayanamsha.ts.
//
// IMPORTANT — NO READING TEXT HERE. Content lives only in
// lib/rashifalReadings.ts (supplied by the editor). This file computes facts
// only.

import {
  getSiderealPosition,
  wrap360,
} from './astronomy/sidereal.js';
import { findMoonTransition } from './astronomy/moonTransitions.js';
import { getSunriseSunset } from './astronomy/sunriseSunset.js';
import type { AyanamshaMode } from './astronomy/ayanamsha.js';
import { bsToAd, getTodayNepal } from './bsConverter.js';

const MODE: AyanamshaMode = 'lahiri';

const RASHI_NAMES: readonly string[] = [
  'mesha', 'vrisha', 'mithun', 'karkat', 'simha', 'kanya',
  'tula', 'vrischik', 'dhanu', 'makar', 'kumbha', 'meen',
];

export { RASHI_NAMES };

const RASHI_SPAN = 30;

/** Kathmandu, Nepal: UTC+05:45, no DST. */
const KATHMANDU_OFFSET_SECONDS = 5 * 3600 + 45 * 60;

function sunriseUtcForAdDate(year: number, month: number, day: number): Date {
  const adDate = new Date(Date.UTC(year, month - 1, day));
  const result = getSunriseSunset(adDate);
  if (result.sunrise.status === 'computed' && result.sunrise.utcInstant) {
    return result.sunrise.utcInstant;
  }
  // Fallback: 00:00 NPT on the date.
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - KATHMANDU_OFFSET_SECONDS * 1000);
}

function moonRashiIndexAt(utcInstant: Date): number {
  const lon = wrap360(getSiderealPosition(MODE, utcInstant, 'Moon').siderealLongitudeDegrees);
  return Math.floor(lon / RASHI_SPAN);
}

/** Moon's sidereal rashi at sunrise on a BS date (index 0..11). */
export function moonRashiAtSunrise(bsYear: number, bsMonth: number, bsDay: number): number {
  const ad = bsDateToAd(bsYear, bsMonth, bsDay);
  const sunrise = sunriseUtcForAdDate(ad.year, ad.month, ad.day);
  return moonRashiIndexAt(sunrise);
}

/** Moon's sidereal rashi index at a UTC instant (internal, exported for tests). */
export { moonRashiIndexAt };

/** Next rashi-change instant after a UTC instant. */
export function moonNextRashiChange(utcInstant: Date): Date | null {
  try {
    const t = findMoonTransition(MODE, utcInstant, 'rashi');
    return t.utcInstant;
  } catch {
    return null;
  }
}

/**
 * Position of the Moon counted from a reader's rashi (1..12).
 * Position 1 = Moon in reader's own sign; position 12 = previous sign.
 */
export function moonPositionFromSign(readerRashiIndex: number, moonRashiIndex: number): number {
  return ((moonRashiIndex - readerRashiIndex + 12) % 12) + 1;
}

/** Convert a BS date to its AD equivalent. */
export function bsDateToAd(bsYear: number, bsMonth: number, bsDay: number): { year: number; month: number; day: number } {
  const ad = bsToAd(bsYear, bsMonth, bsDay);
  return { year: ad.year, month: ad.month, day: ad.day };
}

/** Today's Nepali date (BS). */
export function todayNepal(nowMs?: number): { year: number; month: number; day: number } {
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  return { year: today.bs.year, month: today.bs.month, day: today.bs.day };
}

/** RashifalEngine result for a given date and reader sign. */
export interface RashifalEngineResult {
  /** BS date being queried. */
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  /** AD equivalent. */
  adYear: number;
  adMonth: number;
  adDay: number;
  /** Moon's sidereal rashi at sunrise (index 0..11). */
  moonRashiIndex: number;
  moonRashiName: string;
  /** Next rashi-change instant (UTC), if any today. */
  nextChangeUtc: Date | null;
  nextChangeKathmandu: string | null;
  /** Whether the Moon changes sign today (after sunrise, same calendar date). */
  changesSignToday: boolean;
}

/** Full engine result for a date + reader sign. */
export function computeRashifalEngine(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
  readerRashiId: string,
): RashifalEngineResult {
  const readerRashiIndex = RASHI_NAMES.indexOf(readerRashiId);
  if (readerRashiIndex < 0) {
    throw new Error(`Unknown rashiId: ${readerRashiId}`);
  }

  const ad = bsDateToAd(bsYear, bsMonth, bsDay);
  const sunrise = sunriseUtcForAdDate(ad.year, ad.month, ad.day);
  const moonRashiIndex = moonRashiIndexAt(sunrise);
  const nextChange = moonNextRashiChange(sunrise);

  // Determine if the next change falls on the same calendar date (after sunrise).
  let changesSignToday = false;
  let nextChangeKathmandu: string | null = null;
  if (nextChange) {
    const nptMs = nextChange.getTime() + KATHMANDU_OFFSET_SECONDS * 1000;
    const nptDate = new Date(nptMs);
    const nptYear = nptDate.getUTCFullYear();
    const nptMonth = nptDate.getUTCMonth() + 1;
    const nptDay = nptDate.getUTCDate();
    changesSignToday =
      nptYear === ad.year && nptMonth === ad.month && nptDay === ad.day;
    nextChangeKathmandu = new Date(nptMs).toISOString().replace(/(\d{2}:\d{2}:\d{2})/, '$1+05:45');
  }

  return {
    bsYear,
    bsMonth,
    bsDay,
    adYear: ad.year,
    adMonth: ad.month,
    adDay: ad.day,
    moonRashiIndex,
    moonRashiName: RASHI_NAMES[moonRashiIndex],
    nextChangeUtc: nextChange,
    nextChangeKathmandu,
    changesSignToday,
  };
}
