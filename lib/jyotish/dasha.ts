// lib/jyotish/dasha.ts
//
// Phase 1: Vimshottari Mahadasha & Antardasha calculator.
//
// Based on the Moon's birth nakshatra. The nakshatra lords cycle every 9:
//   Ashwini→Ketu, Bharani→Venus, Kritika→Sun, Rohini→Moon, Mrigashirsha→Mars,
//   Ardra→Rahu, Punarvasu→Jupiter, Pushya→Saturn, Ashlesha→Mercury (repeat).
//
// Mahadasha durations (years, total 120):
//   Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17.
//
// Antardasha within a mahadasha: lords start from the mahadasha lord and cycle.
//   antardasha_years = mahadasha_years × antardasha_lord_years / 120.
//
// Dates computed by adding fractional years (365.25 days/year) to birth instant.
// BS equivalents via adToBs from lib/bsConverter.ts.

import {
  NAKSHATRA_IDS,
  NAKSHATRA_SPAN_DEGREES,
} from '../astronomy/nakshatra.js';
import { adToBs } from '../bsConverter.js';
import type { DashaPeriod, GrahaId, PlanetPosition } from './types.js';

/** Days per year used for dasha date arithmetic (Julian year). */
export const DAYS_PER_YEAR = 365.25;

/** Milliseconds per day. */
export const MS_PER_DAY = 86400_000;

/** Nakshatra lords in cyclic order (index = nakshatraIndex % 9). */
export const NAKSHATRA_LORDS: readonly GrahaId[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;

/** Full Mahadasha durations in years (total 120). Source: Vedic standard. */
export const MAHADASHA_YEARS: Record<GrahaId, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
} as const;

/** Verify the total is 120 years. */
const TOTAL_DASHA_YEARS = Object.values(MAHADASHA_YEARS).reduce(
  (a, b) => a + b,
  0,
);
if (TOTAL_DASHA_YEARS !== 120) {
  throw new Error(
    `Vimshottari dasha years must sum to 120, got ${TOTAL_DASHA_YEARS}.`,
  );
}

/** Order of grahas in the dasha cycle (starting from Ketu). */
export const DASHA_ORDER: readonly GrahaId[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;

/** Index of a graha in the dasha cycle. */
function dashaOrderIndex(graha: GrahaId): number {
  return DASHA_ORDER.indexOf(graha);
}

/** Next graha in the dasha cycle. */
function nextDashaLord(graha: GrahaId): GrahaId {
  const idx = dashaOrderIndex(graha);
  return DASHA_ORDER[(idx + 1) % DASHA_ORDER.length];
}

/** Add fractional years to a Date, returning a new Date. */
function addYears(date: Date, years: number): Date {
  const ms = years * DAYS_PER_YEAR * MS_PER_DAY;
  return new Date(date.getTime() + ms);
}

/** Format a Date as ISO YYYY-MM-DD (UTC parts). */
function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convert AD date to BS YYYY-MM-DD. Throws if outside supported BS range. */
function adToBsIso(
  year: number,
  month: number,
  day: number,
): { bsYear: number; bsMonth: number; bsDay: number } | null {
  try {
    const bs = adToBs({ year, month, day });
    return { bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day };
  } catch {
    return null;
  }
}

/** Format BS date as YYYY-MM-DD. */
function toBsIso(bsYear: number, bsMonth: number, bsDay: number): string {
  return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
}

/**
 * Get the nakshatra lord for a given nakshatra index (0-26).
 */
export function nakshatraLord(nakshatraIndex: number): GrahaId {
  return NAKSHATRA_LORDS[nakshatraIndex % NAKSHATRA_LORDS.length];
}

/**
 * Compute the Vimshottari Mahadasha balance (remaining years) at birth.
 *
 * balance = (nakshatra_span - moon_position_within_nakshatra) / nakshatra_span × lord_years
 *
 * @param moonNakshatraLongitude  Moon's longitude within its nakshatra [0, 13°20′).
 * @param nakshatraIndex          Moon's nakshatra index 0..26.
 * @returns { lord, balanceYears }
 */
export function dashaBalanceAtBirth(
  moonNakshatraLongitude: number,
  nakshatraIndex: number,
): { lord: GrahaId; balanceYears: number } {
  const lord = nakshatraLord(nakshatraIndex);
  const fullYears = MAHADASHA_YEARS[lord];
  const remainingFraction =
    (NAKSHATRA_SPAN_DEGREES - moonNakshatraLongitude) / NAKSHATRA_SPAN_DEGREES;
  const balanceYears = remainingFraction * fullYears;
  return { lord, balanceYears };
}

/**
 * Generate the full 120-year Vimshottari Mahadasha sequence starting from birth.
 *
 * @param birthInstant   Birth instant in UTC.
 * @param startLord      First mahadasha lord (lord of birth nakshatra).
 * @param balanceYears   Remaining years in the first mahadasha at birth.
 * @returns Array of DashaPeriod objects in chronological order.
 */
export function generateMahadasha(
  birthInstant: Date,
  startLord: GrahaId,
  balanceYears: number,
): DashaPeriod[] {
  const periods: DashaPeriod[] = [];
  let currentDate = new Date(birthInstant.getTime());
  let currentLord: GrahaId = startLord;
  let remainingYears = balanceYears;
  let totalYears = 0;

  // Generate up to 120 years (with a small safety margin)
  while (totalYears < 120) {
    const fullYears = MAHADASHA_YEARS[currentLord];
    // Cap the final period so the total never exceeds 120 years.
    const maxRemaining = 120 - totalYears;
    const durationYears = Math.min(remainingYears, fullYears, maxRemaining);
    const endDate = addYears(currentDate, durationYears);

    const startIso = toIsoDate(currentDate);
    const endIso = toIsoDate(endDate);

    const startBs = adToBsIso(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1,
      currentDate.getUTCDate(),
    );
    const endBs = adToBsIso(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      endDate.getUTCDate(),
    );

    periods.push({
      graha: currentLord,
      startDateAd: startIso,
      endDateAd: endIso,
      startDateBs: startBs ? toBsIso(startBs.bsYear, startBs.bsMonth, startBs.bsDay) : '',
      endDateBs: endBs ? toBsIso(endBs.bsYear, endBs.bsMonth, endBs.bsDay) : '',
      durationYears: durationYears,
      isActive: false, // filled by caller
    });

    totalYears += durationYears;
    currentDate = endDate;
    remainingYears = fullYears; // subsequent periods use full duration
    currentLord = nextDashaLord(currentLord);
  }

  return periods;
}

/**
 * Generate Antardasha (Bhukti) periods within a Mahadasha.
 *
 * Antardasha lords cycle starting from the mahadasha lord.
 * Each antardasha duration = mahadasha_years × antardasha_lord_years / 120.
 *
 * @param mahadashaStart   Start date of the mahadasha.
 * @param mahadashaLord    The mahadasha lord.
 * @param mahadashaYears   Duration of the mahadasha in years.
 * @returns Array of DashaPeriod objects (antardasha sub-periods).
 */
export function generateAntardasha(
  mahadashaStart: Date,
  mahadashaLord: GrahaId,
  mahadashaYears: number,
): DashaPeriod[] {
  const periods: DashaPeriod[] = [];
  let currentDate = new Date(mahadashaStart.getTime());
  let currentLord: GrahaId = mahadashaLord;
  let remainingYears = mahadashaYears;

  // Generate antardashas until mahadasha is exhausted
  while (remainingYears > 0.001) {
    const lordYears = MAHADASHA_YEARS[currentLord];
    const durationYears = Math.min(
      (mahadashaYears * lordYears) / 120,
      remainingYears,
    );
    const endDate = addYears(currentDate, durationYears);

    const startIso = toIsoDate(currentDate);
    const endIso = toIsoDate(endDate);

    const startBs = adToBsIso(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1,
      currentDate.getUTCDate(),
    );
    const endBs = adToBsIso(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      endDate.getUTCDate(),
    );

    periods.push({
      graha: currentLord,
      startDateAd: startIso,
      endDateAd: endIso,
      startDateBs: startBs ? toBsIso(startBs.bsYear, startBs.bsMonth, startBs.bsDay) : '',
      endDateBs: endBs ? toBsIso(endBs.bsYear, endBs.bsMonth, endBs.bsDay) : '',
      durationYears: durationYears,
      isActive: false,
    });

    remainingYears -= durationYears;
    currentDate = endDate;
    currentLord = nextDashaLord(currentLord);
  }

  return periods;
}

/**
 * Mark which Mahadasha and Antardasha are active as of the reference date.
 *
 * @param periods     Mahadasha periods (mutated: isActive set).
 * @param referenceNow Reference date/time.
 * @returns The currently active Mahadasha period, or null.
 */
export function setActiveMahadasha(
  periods: DashaPeriod[],
  referenceNow: Date,
): DashaPeriod | null {
  const refMs = referenceNow.getTime();
  let active: DashaPeriod | null = null;

  for (const p of periods) {
    const startMs = new Date(p.startDateAd + 'T00:00:00Z').getTime();
    const endMs = new Date(p.endDateAd + 'T00:00:00Z').getTime();
    p.isActive = refMs >= startMs && refMs < endMs;
    if (p.isActive) active = p;
  }

  return active;
}

/**
 * Find the active Antardasha within a Mahadasha as of the reference date.
 *
 * @param mahadasha   The active Mahadasha period.
 * @param referenceNow Reference date/time.
 * @param generateAntardashaFn  Function to generate antardasha periods.
 * @returns The currently active Antardasha period, or null.
 */
export function findActiveAntardasha(
  mahadasha: DashaPeriod,
  referenceNow: Date,
  generateAntardashaFn: (
    start: Date,
    lord: GrahaId,
    years: number,
  ) => DashaPeriod[],
): DashaPeriod | null {
  const startDate = new Date(mahadasha.startDateAd + 'T00:00:00Z');
  const antardashas = generateAntardashaFn(
    startDate,
    mahadasha.graha,
    mahadasha.durationYears,
  );

  const refMs = referenceNow.getTime();
  for (const a of antardashas) {
    const startMs = new Date(a.startDateAd + 'T00:00:00Z').getTime();
    const endMs = new Date(a.endDateAd + 'T00:00:00Z').getTime();
    a.isActive = refMs >= startMs && refMs < endMs;
    if (a.isActive) return a;
  }

  return null;
}

/**
 * Compute complete Vimshottari Dasha from birth details.
 *
 * @param birthInstant   Birth instant in UTC.
 * @param moonPosition   Moon's PlanetPosition (for nakshatra data).
 * @param referenceNow   Reference date for active dasha detection.
 * @returns { mahadasha, currentMahadasha, currentAntardasha }
 */
export function computeVimshottariDasha(
  birthInstant: Date,
  moonPosition: PlanetPosition,
  referenceNow: Date,
): {
  mahadasha: DashaPeriod[];
  currentMahadasha: DashaPeriod | null;
  currentAntardasha: DashaPeriod | null;
} {
  const { lord: startLord, balanceYears } = dashaBalanceAtBirth(
    moonPosition.nakshatraLongitudeDegrees,
    moonPosition.nakshatraIndex,
  );

  const mahadasha = generateMahadasha(birthInstant, startLord, balanceYears);
  const currentMahadasha = setActiveMahadasha(mahadasha, referenceNow);

  let currentAntardasha: DashaPeriod | null = null;
  if (currentMahadasha) {
    currentAntardasha = findActiveAntardasha(
      currentMahadasha,
      referenceNow,
      generateAntardasha,
    );
  }

  return { mahadasha, currentMahadasha, currentAntardasha };
}
