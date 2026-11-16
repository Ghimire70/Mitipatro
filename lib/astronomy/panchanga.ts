// lib/astronomy/panchanga.ts
//
// Stage 7 — NEW FILE (Stage 1 to 6 files are untouched and no formula is changed).
// Builds on Stage 6's getSunriseSunset (sea-level observer, Kathmandu).
//
// Daily Panchanga for one civil date in Asia/Kathmandu: the Tithi, Nakshatra
// (+ pada), Yoga and Karana prevailing at the instant of local sunrise.
//
// ASSUMPTION (not yet confirmed against a printed Nepali patro):
//   "Prevailing at sunrise defines the day" — i.e. the element active at the
//   unrounded sunrise instant is reported as that civil date's element. Nepali
//   practice may differ (tithi ending minutes after sunrise, tithi spanning two
//   sunrises or none, festival-day rules). This convention is a working
//   assumption and must be validated before publication.
//
// CONVENTIONS:
//   - Sunrise: Stage 6 sea-level convention (Observer.height = 0 m),
//     Kathmandu 27.7172 N / 85.3240 E, upper limb, fixed 34 arcmin refraction
//     (all applied by astronomy-engine's SearchRiseSet).
//   - Instant used: exact unrounded sunrise instant (UTC), not rounded.
//   - Near-sunrise window: default 10 minutes (configurable). If any element
//     changes within this window of sunrise (before or after), it is flagged
//     nearSunrise with the change time instead of silently choosing.
//   - Weekday: from the civil date.
//   - Kshaya (skipped tithi): listed with start/end instants, assigned to no
//     date. Vriddhi (repeated tithi): reported on both dates with the same end
//     instant. No formula is changed to manufacture or suppress either.

import { getSunriseSunset } from './sunriseSunset.js';
import { toKathmanduString } from './moonTransitions.js';
import {
  getTithi,
  tithiName,
  type TithiResult,
} from './tithi.js';
import {
  getRashiNakshatraPada,
  nakshatraName,
  NAKSHATRA_COUNT,
  type NakshatraResult,
} from './nakshatra.js';
import { getYoga, yogaName } from './yoga.js';
import { getKarana, karanaName, KARANA_COUNT } from './karana.js';
import { findTithiTransition } from './tithiTransitions.js';
import { findMoonTransition } from './moonTransitions.js';
import { findYogaTransition } from './yogaTransitions.js';
import { findKaranaTransition } from './karanaTransitions.js';
import type { AyanamshaMode } from './ayanamsha.js';

/** Default near-sunrise window, minutes. Configurable per call. */
export const DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES = 10;

/** Day names indexed by getUTCDay() (Sunday = 0). */
export const WEEKDAY_NAMES: readonly string[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

/** Change of an element near sunrise. */
export interface NearSunrise {
  /** The transition instant (UTC). */
  changeUtc: Date;
  /** The transition instant (Asia/Kathmandu display). */
  changeKathmandu: string;
  /** Signed minutes from sunrise (negative = change before sunrise). */
  minutesFromSunrise: number;
  /** True when the change happens before sunrise. */
  beforeSunrise: boolean;
}

/** One panchanga element prevailing at sunrise, with its end and next element. */
export interface PanchangaElement {
  /** Element index. */
  index: number;
  /** Element name. */
  name: string;
  /** Next transition (end of this element) after sunrise, or null. */
  end: { utcInstant: Date; kathmanduDisplay: string } | null;
  /** Index of the element that starts after this one. */
  nextIndex: number;
  /** Name of the element that starts after this one. */
  nextName: string;
  /** Near-sunrise flag, or null when no change is within the window. */
  nearSunrise: NearSunrise | null;
}

/** Full daily panchanga for one Kathmandu civil date. */
export interface DailyPanchanga {
  /** Kathmandu civil date, YYYY-MM-DD. */
  civilDate: string;
  /** Weekday name (from the civil date). */
  weekday: string;
  /** Exact unrounded sunrise instant (UTC) plus Kathmandu display, or null. */
  sunrise: { utcInstant: Date | null; kathmanduDisplay: string | null };
  /** Exact unrounded sunset instant (UTC) plus Kathmandu display, or null. */
  sunset: { utcInstant: Date | null; kathmanduDisplay: string | null };
  /** Tithi prevailing at sunrise. */
  tithi: PanchangaElement & {
    paksha: TithiResult['paksha'];
    tithiNumber: number;
  };
  /** Nakshatra prevailing at sunrise. */
  nakshatra: PanchangaElement & { pada: number };
  /** Yoga prevailing at sunrise. */
  yoga: PanchangaElement;
  /** Karana prevailing at sunrise. */
  karana: PanchangaElement;
}

/** Format a civil date (UTC parts = Kathmandu date parts) as YYYY-MM-DD. */
function civilDateString(civilDate: Date): string {
  const y = civilDate.getUTCFullYear();
  const mo = civilDate.getUTCMonth() + 1;
  const d = civilDate.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** The element transition nearest to sunrise within +/- windowMs, or null. */
function nearestTransition(
  findTransition: (t0: Date) => { utcInstant: Date } | null,
  sunrise: Date,
  windowMs: number,
): { utcInstant: Date } | null {
  const probe = new Date(sunrise.getTime() - windowMs);
  const cand = findTransition(probe);
  if (cand === null) return null;
  const gapMs = cand.utcInstant.getTime() - sunrise.getTime();
  // cand is strictly after (sunrise - windowMs); require it to be at or before
  // (sunrise + windowMs), i.e. |gap| within the window.
  if (gapMs > windowMs) return null;
  return cand;
}

/** Build a NearSunrise record from a candidate transition, or null. */
function nearElement(
  cand: { utcInstant: Date } | null,
  sunrise: Date,
): NearSunrise | null {
  if (cand === null) return null;
  const gapMs = cand.utcInstant.getTime() - sunrise.getTime();
  return {
    changeUtc: cand.utcInstant,
    changeKathmandu: toKathmanduString(cand.utcInstant),
    minutesFromSunrise: gapMs / 60000,
    beforeSunrise: gapMs < 0,
  };
}

/** Attach the end transition (next boundary after sunrise) to an element. */
function withEnd(
  findTransition: (t0: Date) => { utcInstant: Date } | null,
  sunrise: Date,
): { utcInstant: Date; kathmanduDisplay: string } | null {
  const t = findTransition(sunrise);
  if (t === null) return null;
  return { utcInstant: t.utcInstant, kathmanduDisplay: toKathmanduString(t.utcInstant) };
}

/**
 * Compute the daily panchanga for a Kathmandu civil date.
 *
 * Elements are those prevailing at the unrounded sunrise instant (Stage 6,
 * sea-level convention).
 *
 * @param civilDate  Kathmandu civil date (UTC parts = local date parts).
 * @param mode       ayanamsha mode.
 * @param options    nearSunriseWindowMinutes (default 10).
 * @returns DailyPanchanga
 * @throws if sunrise/sunset cannot be found within the search window.
 */
export function getDailyPanchanga(
  civilDate: Date,
  mode: AyanamshaMode = 'lahiri',
  options: { nearSunriseWindowMinutes?: number } = {},
): DailyPanchanga {
  const windowMs =
    (options.nearSunriseWindowMinutes ?? DEFAULT_NEAR_SUNRISE_WINDOW_MINUTES) *
    60000;
  const ss = getSunriseSunset(civilDate);
  if (ss.sunrise.utcInstant === null || ss.sunset.utcInstant === null) {
    throw new Error(
      `Sunrise/sunset not found for Kathmandu civil date ${civilDateString(civilDate)}`,
    );
  }
  const sunrise = ss.sunrise.utcInstant;

  // ---- Tithi at sunrise ----
  const tithiRes = getTithi(mode, sunrise);
  const tithiNextIndex = (tithiRes.tithiIndex + 1) % 30;
  const tithi: PanchangaElement & {
    paksha: TithiResult['paksha'];
    tithiNumber: number;
  } = {
    index: tithiRes.tithiIndex,
    name: tithiName(tithiRes.tithiIndex),
    paksha: tithiRes.paksha,
    tithiNumber: tithiRes.tithiNumber,
    end: withEnd((t0) => findTithiTransition(mode, t0), sunrise),
    nextIndex: tithiNextIndex,
    nextName: tithiName(tithiNextIndex),
    nearSunrise: nearElement(
      nearestTransition((t0) => findTithiTransition(mode, t0), sunrise, windowMs),
      sunrise,
    ),
  };

  // ---- Nakshatra at sunrise ----
  const nakRes = getRashiNakshatraPada(mode, sunrise, 'Moon');
  const nakNextIndex = (nakRes.nakshatraIndex + 1) % NAKSHATRA_COUNT;
  const nakshatra: PanchangaElement & { pada: number } = {
    index: nakRes.nakshatraIndex,
    name: nakshatraName(nakRes.nakshatraIndex),
    pada: nakRes.pada,
    end: withEnd(
      (t0) => findMoonTransition(mode, t0, 'nakshatra'),
      sunrise,
    ),
    nextIndex: nakNextIndex,
    nextName: nakshatraName(nakNextIndex),
    nearSunrise: nearElement(
      nearestTransition(
        (t0) => findMoonTransition(mode, t0, 'nakshatra'),
        sunrise,
        windowMs,
      ),
      sunrise,
    ),
  };

  // ---- Yoga at sunrise ----
  const yRes = getYoga(mode, sunrise);
  const yogaNextIndex = (yRes.yogaIndex + 1) % 27;
  const yoga: PanchangaElement = {
    index: yRes.yogaIndex,
    name: yogaName(yRes.yogaIndex),
    end: withEnd((t0) => findYogaTransition(mode, t0), sunrise),
    nextIndex: yogaNextIndex,
    nextName: yogaName(yogaNextIndex),
    nearSunrise: nearElement(
      nearestTransition((t0) => findYogaTransition(mode, t0), sunrise, windowMs),
      sunrise,
    ),
  };

  // ---- Karana at sunrise ----
  const kRes = getKarana(mode, sunrise);
  const karanaNextIndex = (kRes.karanaIndex + 1) % KARANA_COUNT;
  const karana: PanchangaElement = {
    index: kRes.karanaIndex,
    name: karanaName(kRes.karanaIndex),
    end: withEnd((t0) => findKaranaTransition(mode, t0), sunrise),
    nextIndex: karanaNextIndex,
    nextName: karanaName(karanaNextIndex),
    nearSunrise: nearElement(
      nearestTransition((t0) => findKaranaTransition(mode, t0), sunrise, windowMs),
      sunrise,
    ),
  };

  const weekday = WEEKDAY_NAMES[civilDate.getUTCDay()];

  return {
    civilDate: civilDateString(civilDate),
    weekday,
    sunrise: {
      utcInstant: sunrise,
      kathmanduDisplay: ss.sunrise.kathmanduDisplay,
    },
    sunset: {
      utcInstant: ss.sunset.utcInstant,
      kathmanduDisplay: ss.sunset.kathmanduDisplay,
    },
    tithi,
    nakshatra,
    yoga,
    karana,
  };
}
