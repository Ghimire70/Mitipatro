// lib/astronomy/sunriseSunset.ts
//
// Stage 6 sidereal layer — NEW FILE.
//
// Computes sunrise and sunset for Kathmandu, Nepal using astronomy-engine's
// SearchRiseSet. Returns UTC instants plus Asia/Kathmandu display strings.
//
// ELEVATION CHOICE:
//   A comparison of three observer-height variants was run against 7 published
//   VedicMarga sunrise/sunset pairs (14 values total, on 2026-11-16, see
//   scripts/elevation_variant_compare.mjs):
//
//     Variant (a) height=0 m, metersAboveGround=0:
//       All 14 values match exactly (0.00 min diff).
//     Variant (b) height=1400 m, metersAboveGround=0:
//       Differences of up to 1 minute from published times.
//     Variant (c) height=0 m, metersAboveGround=1400 m:
//       Throws: observer.height - metersAboveGround = -1400 is invalid for
//       Atmosphere() (negative elevation above sea level geoid).
//
//   Variant (a) fits all 14 numbers exactly. We use Observer.height = 0 and
//   metersAboveGround = 0, matching the reference site's sea-level convention
//   (variants compared on 2026-11-16). Kathmandu's true elevation (~1400 m above
//   sea level) does NOT match the published reference times; the published times
//   correspond to a sea-level observer convention.
//
//   Source lines from astronomy-engine/astronomy.js:
//     SearchRiseSet (line 4985): uses observer.height - metersAboveGround for
//       Atmosphere() density and HorizonDipAngle() for horizon dip.
//     HorizonDipAngle (line 4892): dip = 0 when metersAboveGround = 0;
//       observer.height affects the refraction index k and Earth radius.
//
// Do not assume the horizon-dip formula applies; dip = 0 here because
// metersAboveGround = 0.

import { SearchRiseSet, Observer, Body } from 'astronomy-engine';
import { KATHMANDU_OFFSET_SECONDS, toKathmanduString } from './moonTransitions.js';

/** Kathmandu, Nepal: 27.7172° N, 85.3240° E. Source: vedicmarga.com location header. */
const KATH_LAT = 27.7172;
const KATH_LON = 85.3240;

/** Observer elevation above sea level: 0 m (sea level). See ELEVATION CHOICE above. */
export const OBSERVER_ELEVATION_METERS = 0;

/** Height above ground: 0 m (observer at ground level). */
export const OBSERVER_METERS_ABOVE_GROUND = 0;

/** Result of a single sunrise or sunset event. */
export interface SunEvent {
  /** 'computed' if a rise/set was found, 'missing' if none (e.g. polar day/night). */
  status: 'computed' | 'missing';
  /** UTC instant (unrounded, millisecond precision). Null when status is 'missing'. */
  utcInstant: Date | null;
  /** Asia/Kathmandu display string. Null when status is 'missing'. */
  kathmanduDisplay: string | null;
  /** Unrounded value: minutes from UTC midnight (fractional). Null when 'missing'. */
  unroundedMinutesFromMidnight: number | null;
  /** Nearest-minute rounding of unroundedMinutesFromMidnight. Null when 'missing'. */
  roundedMinutesFromMidnight: number | null;
}

/** Full sunrise/sunset result for a calendar date at Kathmandu. */
export interface SunriseSunsetResult {
  /** Calendar date in YYYY-MM-DD format. */
  date: string;
  /** Sunrise event. */
  sunrise: SunEvent;
  /** Sunset event. */
  sunset: SunEvent;
}

/**
 * Compute sunrise and sunset for a calendar date at Kathmandu, Nepal.
 *
 * Searches from 00:00 NPT on the given calendar date (which is 18:15 UTC on
 * the previous day) to ensure both sunrise and sunset for that NPT date are
 * found. Early-morning sunrises (e.g. 05:07 NPT = 23:22 UTC the previous day)
 * would be missed if searching from midnight UTC on the target date.
 *
 * Uses Observer.height = 0 and metersAboveGround = 0 (see ELEVATION CHOICE).
 * Upper limb and fixed 34' refraction are applied internally by SearchRiseSet.
 *
 * @param date A JavaScript Date (any time on the desired calendar date).
 * @returns SunriseSunsetResult
 */
export function getSunriseSunset(date: Date): SunriseSunsetResult {
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth();
  const d = date.getUTCDate();

  // 00:00 NPT on the target date = midnight UTC on the target date minus 5h45m
  // = 18:15 UTC on the previous day. Searching from here captures all events
  // for the NPT calendar date.
  const nptMidnightUtcMs = Date.UTC(y, mo, d, 0, 0, 0, 0) - KATHMANDU_OFFSET_SECONDS * 1000;
  const startOfSearch = new Date(nptMidnightUtcMs);

  const obs = new Observer(KATH_LAT, KATH_LON, OBSERVER_ELEVATION_METERS);

  const riseRaw = SearchRiseSet(Body.Sun, obs, +1, startOfSearch, 2, OBSERVER_METERS_ABOVE_GROUND);
  const setRaw = SearchRiseSet(Body.Sun, obs, -1, startOfSearch, 2, OBSERVER_METERS_ABOVE_GROUND);

  const sunrise = sunEventFromRaw(riseRaw);
  const sunset = sunEventFromRaw(setRaw);

  return {
    date: `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    sunrise,
    sunset,
  };
}

function sunEventFromRaw(raw: ReturnType<typeof SearchRiseSet> | null): SunEvent {
  if (raw === null) {
    return {
      status: 'missing',
      utcInstant: null,
      kathmanduDisplay: null,
      unroundedMinutesFromMidnight: null,
      roundedMinutesFromMidnight: null,
    };
  }

  const utcInstant = raw.date;
  const msFromMidnight = utcInstant.getUTCHours() * 60 + utcInstant.getUTCMinutes() + utcInstant.getUTCSeconds() / 60 + utcInstant.getUTCMilliseconds() / 60000;
  const rounded = Math.round(msFromMidnight);

  return {
    status: 'computed',
    utcInstant,
    kathmanduDisplay: toKathmanduString(utcInstant),
    unroundedMinutesFromMidnight: msFromMidnight,
    roundedMinutesFromMidnight: rounded,
  };
}