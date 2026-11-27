// lib/jyotish/ephemeris.ts
//
// Phase 1: Deterministic Vedic (Sidereal / Lahiri) ephemeris engine.
//
// Computes planetary positions, Lagna (Ascendant), whole-sign houses, and
// Navamsa (D9) for a birth instant using the Lahiri (Chitrapaksha) ayanamsha.
//
// REUSES existing lib/astronomy/* modules (not modified):
//   - getAyanamsha('lahiri', instant)  — Lahiri ayanamsha
//   - getSiderealPosition('lahiri', instant, body) — sidereal lon for 7 planets
//   - getRashiNakshatraPada('lahiri', instant, body) — rashi/nakshatra/pada
//   - e_tilt from astronomy-engine — obliquity of ecliptic
//
// RAHU/KETU: Mean Node longitude computed via standard formula
//   Ω = 125.0445479° − 1934.1362891°·T + 0.0020754°·T² + T³/450000
//   where T = centuries from J2000. Rahu = Ω, Ketu = Ω + 180° (mod 360).
//
// LAGNA: Local sidereal time + spherical trigonometry (Ascendant formula
// from Duffett-Smith, Practical Astronomy with your Calculator).
//
// COMBUSTION orbs (standard Vedic, degrees from Sun):
//   Moon 12°, Mars 17°, Mercury 14° (12° retro), Jupiter 11°,
//   Venus 10° (8° retro), Saturn 15°.

import { e_tilt, MakeTime } from 'astronomy-engine';
import {
  getAyanamsha,
  type AyanamshaMode,
} from '../astronomy/ayanamsha.js';
import {
  getSiderealPosition,
  wrap360,
  type SiderealPosition,
} from '../astronomy/sidereal.js';
import {
  getRashiNakshatraPada,
  type NakshatraResult,
  RASHI_IDS,
  NAKSHATRA_IDS,
} from '../astronomy/nakshatra.js';
import { bsToAd } from '../bsConverter.js';
import { NEPAL_TIME_ZONE } from '../bsConverter.js';
import {
  computeVimshottariDasha,
} from './dasha.js';
import type {
  BirthDetails,
  GrahaId,
  HouseCusps,
  JyotishCalculationResult,
  JyotishConfig,
  NavamsaPlacement,
  PlanetPosition,
} from './types.js';

/** J2000.0 epoch in Julian Date (TT). IAU definition. */
export const J2000_JD = 2451545.0;

/** Days per Julian century (TT). */
export const DAYS_PER_JULIAN_CENTURY = 36525;

/** Milliseconds per day. */
export const MS_PER_DAY = 86400_000;

/** Degrees to radians. */
export const DEG_TO_RAD = Math.PI / 180;

/** Radians to degrees. */
export const RAD_TO_DEG = 180 / Math.PI;

/** Mean Node (Rahu) reference epoch constants. Source: standard astronomical formula. */
// Mean Node longitude at J2000: 125.0445479°
// Regression rate: -1934.1362891° per century
// Quadratic: +0.0020754° per century²
// Cubic: +1/450000° per century³
const MEAN_NODE_EPOCH_DEG = 125.0445479;
const MEAN_NODE_RATE_DEG_PER_CENTURY = -1934.1362891;
const MEAN_NODE_QUADRATIC = 0.0020754;
const MEAN_NODE_CUBIC_DENOM = 450000;

/** Combustion orbs in degrees from Sun (standard Vedic values). */
export const COMBUSTION_ORB_DEGREES: Record<Exclude<GrahaId, 'Sun'>, number> = {
  Moon: 12,
  Mars: 17,
  Mercury: 14,
  Jupiter: 11,
  Venus: 10,
  Saturn: 15,
  Rahu: 0, // nodes not combust
  Ketu: 0,
};

/** Reduced Mercury combustion orb when retrograde. */
export const MERCURY_RETRO_ORB_DEGREES = 12;

/** Reduced Venus combustion orb when retrograde. */
export const VENUS_RETRO_ORB_DEGREES = 8;

/** Grahas with physical bodies in astronomy-engine (Sun..Saturn, no Rahu/Ketu). */
export const PHYSICAL_GRAHAS: readonly (Exclude<GrahaId, 'Rahu' | 'Ketu'>)[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
] as const;

/** Grahas that are never retrograde (Sun, Moon, Rahu, Ketu by convention). */
export const NEVER_RETROGRADE: readonly GrahaId[] = ['Sun', 'Moon'] as const;

/** Rashi type classifications for Navamsa calculation. */
export const CHARA_RASHIS = [0, 3, 6, 9]; // Mesha, Karka, Tula, Makara
export const STHIRA_RASHIS = [1, 4, 7, 10]; // Vrishabha, Simha, Vrischika, Kumbha
export const DVISVABHAVA_RASHIS = [2, 5, 8, 11]; // Mithuna, Kanya, Dhanu, Meena

/** Degrees per Navamsa pada (30° / 9 = 3°20′). */
export const NAVAMSA_PADA_DEGREES = 30 / 9;

/** Default dasha reference "now" if none supplied. */
export const DEFAULT_REFERENCE_NOW = new Date();

/* ------------------------------------------------------------------ */
/* TIME & JULIAN DAY                                                  */
/* ------------------------------------------------------------------ */

/**
 * Convert local birth date/time + timezone to a UTC instant.
 *
 * Parses HH:MM (24h) and applies the IANA timezone offset via Intl.
 * Falls back to Asia/Kathmandu if timezone is invalid.
 */
export function birthDateTimeToUtc(
  birthDate: { year: number; month: number; day: number },
  birthTime: string,
  timeZone: string,
): Date {
  const [hhStr, mmStr] = birthTime.split(':');
  const hh = Number(hhStr);
  const mm = Number(mmStr);

  if (!Number.isInteger(hh) || hh < 0 || hh > 23) {
    throw new Error(`Invalid birth hour: ${hh}. Must be 0-23.`);
  }
  if (!Number.isInteger(mm) || mm < 0 || mm > 59) {
    throw new Error(`Invalid birth minute: ${mm}. Must be 0-59.`);
  }

  // Build a UTC Date from the local date parts, then apply timezone offset.
  // Intl.DateTimeFormat resolves the offset for the given timezone.
  const utcDate = new Date(
    Date.UTC(birthDate.year, birthDate.month - 1, birthDate.day, hh, mm, 0, 0),
  );

  // Compute the timezone offset for this instant using Intl.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(utcDate);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName');
  let offsetMinutes = 0;
  if (offsetPart) {
    // e.g. "GMT+5:45" → +345 minutes
    const m = /([+-])(\d{1,2}):(\d{2})/.exec(offsetPart.value);
    if (m) {
      const sign = m[1] === '+' ? 1 : -1;
      offsetMinutes = sign * (Number(m[2]) * 60 + Number(m[3]));
    }
  }

  // Local time = UTC + offset → UTC = local - offset
  const utcMs = utcDate.getTime() - offsetMinutes * 60 * 1000;
  return new Date(utcMs);
}

/** Julian Day (UT) at the given instant. */
export function julianDayUt(instant: Date): number {
  return J2000_JD + instant.getTime() / MS_PER_DAY;
}

/** Centuries (TT) from J2000.0 at the given instant. */
export function centuriesFromJ2000(instant: Date): number {
  return (julianDayUt(instant) - J2000_JD) / DAYS_PER_JULIAN_CENTURY;
}

/* ------------------------------------------------------------------ */
/* GREENWICH MEAN SIDEREAL TIME                                       */
/* ------------------------------------------------------------------ */

/**
 * Greenwich Mean Sidereal Time in degrees at the given UT instant.
 *
 * Formula (Astronomical Almanac):
 *   GMST = 280.46061837 + 360.98564736629·d + 0.000387933·T² − T³/38710000
 *   where d = days since J2000.0 (fractional), T = d / 36525
 */
export function gmstDegrees(instant: Date): number {
  const d = julianDayUt(instant) - J2000_JD;
  const T = d / DAYS_PER_JULIAN_CENTURY;
  const T2 = T * T;
  const T3 = T2 * T;
  let gmst =
    280.46061837 +
    360.98564736629 * d +
    0.000387933 * T2 -
    T3 / 38710000;
  return wrap360(gmst);
}

/** Local Sidereal Time in degrees = GMST + longitude (east positive). */
export function lstDegrees(instant: Date, longitudeDeg: number): number {
  return wrap360(gmstDegrees(instant) + longitudeDeg);
}

/* ------------------------------------------------------------------ */
/* MEAN NODE (RAHU / KETU)                                            */
/* ------------------------------------------------------------------ */

/**
 * Mean Node (Rahu) longitude in degrees at the given instant.
 *
 * Ω = 125.0445479 − 1934.1362891·T + 0.0020754·T² + T³/450000
 * Standard formula for the mean longitude of the lunar ascending node.
 * Source: standard astronomical ephemeris references (unverified against
 * a specific published Vedic panchang; cross-check recommended).
 */
export function meanNodeLongitudeDegrees(instant: Date): number {
  const T = centuriesFromJ2000(instant);
  const T2 = T * T;
  const T3 = T2 * T;
  let omega =
    MEAN_NODE_EPOCH_DEG +
    MEAN_NODE_RATE_DEG_PER_CENTURY * T +
    MEAN_NODE_QUADRATIC * T2 +
    T3 / MEAN_NODE_CUBIC_DENOM;
  return wrap360(omega);
}

/* ------------------------------------------------------------------ */
/* OBLIQUITY OF THE ECLIPTIC                                          */
/* ------------------------------------------------------------------ */

/** True obliquity of the ecliptic (degrees) at the given instant. */
export function obliquityDegrees(instant: Date): number {
  const time = MakeTime(new Date(instant.getTime()));
  const tilt = e_tilt(time);
  return tilt.tobl; // true obliquity of the ecliptic, degrees
}

/* ------------------------------------------------------------------ */
/* PLANET POSITIONS                                                   */
/* ------------------------------------------------------------------ */

/**
 * Retrograde status: compare longitude at t and t+1 day. If longitude
 * decreases (accounting for 360° wrap), the planet is retrograde.
 * Sun and Moon are never retrograde.
 */
export function isPlanetRetrograde(
  instant: Date,
  body: Exclude<GrahaId, 'Rahu' | 'Ketu'>,
): boolean {
  if (NEVER_RETROGRADE.includes(body as GrahaId)) {
    return false;
  }

  const MS_PER_DAY_FRACTION = 1;
  const plusOneDay = new Date(instant.getTime() + MS_PER_DAY);

  const posNow = getSiderealPosition('lahiri', instant, body as any);
  const posNext = getSiderealPosition('lahiri', plusOneDay, body as any);

  const lonNow = posNow.siderealLongitudeDegrees;
  const lonNext = posNext.siderealLongitudeDegrees;

  // Compute angular difference accounting for wrap
  let delta = lonNext - lonNow;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  // Negative delta = retrograde motion
  return delta < 0;
}

/** Angular distance between two longitudes [0, 180]. */
export function angularDistance(lon1: number, lon2: number): number {
  let d = Math.abs(wrap360(lon1 - lon2));
  if (d > 180) d = 360 - d;
  return d;
}

/** Combustion orb for a graha, adjusted for retrograde status. */
export function combustionOrb(graha: GrahaId, isRetro: boolean): number {
  if (graha === 'Rahu' || graha === 'Ketu') return 0;
  const base = COMBUSTION_ORB_DEGREES[graha as Exclude<GrahaId, 'Sun'>];
  if (graha === 'Mercury' && isRetro) return MERCURY_RETRO_ORB_DEGREES;
  if (graha === 'Venus' && isRetro) return VENUS_RETRO_ORB_DEGREES;
  return base;
}

/**
 * Compute sidereal position for a physical graha (Sun..Saturn).
 * Reuses getSiderealPosition from lib/astronomy/sidereal.ts.
 */
function getPhysicalGrahaPosition(
  instant: Date,
  graha: Exclude<GrahaId, 'Rahu' | 'Ketu'>,
): PlanetPosition {
  const sidereal = getSiderealPosition('lahiri', instant, graha as any);
  const nakResult = getRashiNakshatraPada('lahiri', instant, graha as any);
  const retro = isPlanetRetrograde(instant, graha as any);

  // Combustion: angular distance from Sun
  const sunPos = getSiderealPosition('lahiri', instant, 'Sun');
  const distFromSun = angularDistance(
    sidereal.siderealLongitudeDegrees,
    sunPos.siderealLongitudeDegrees,
  );
  const orb = combustionOrb(graha, retro);
  const isCombust = distFromSun <= orb && distFromSun > 0;

  return {
    graha,
    siderealLongitudeDegrees: sidereal.siderealLongitudeDegrees,
    tropicalLongitudeDegrees: sidereal.tropicalLongitudeDegrees,
    rashiIndex: nakResult.rashiIndex,
    rashiName: RASHI_IDS[nakResult.rashiIndex],
    rashiLongitudeDegrees: nakResult.rashiLongitudeDegrees,
    nakshatraIndex: nakResult.nakshatraIndex,
    nakshatraName: NAKSHATRA_IDS[nakResult.nakshatraIndex],
    nakshatraLongitudeDegrees: nakResult.nakshatraLongitudeDegrees,
    pada: nakResult.pada,
    padaLongitudeDegrees: nakResult.padaLongitudeDegrees,
    isRetrograde: retro,
    isCombust,
    combustionDistanceDegrees: isCombust ? distFromSun : null,
  };
}

/**
 * Compute position for Rahu (Mean Node). Ketu = Rahu + 180°.
 * Nodes are always retrograde by convention; combustion orb = 0.
 */
function getNodePosition(
  instant: Date,
  graha: 'Rahu' | 'Ketu',
): PlanetPosition {
  const nodeLon = meanNodeLongitudeDegrees(instant);
  const rahuLon = wrap360(nodeLon);
  const ketuLon = wrap360(nodeLon + 180);
  const lon = graha === 'Rahu' ? rahuLon : ketuLon;

  const sidereal = getSiderealPosition('lahiri', instant, 'Moon'); // reuse ayanamsha
  const nakResult = getRashiNakshatraPada('lahiri', instant, 'Moon' as any);
  // Override with node's own sidereal longitude for rashi/nakshatra
  const nodeRashiIndex = Math.floor(lon / 30);
  const nodeRashiLon = lon - nodeRashiIndex * 30;
  const nodeNakIndex = Math.floor(lon / (40 / 3));
  const nodeNakLon = lon - nodeNakIndex * (40 / 3);
  const nodePada = Math.floor(nodeNakLon / ((40 / 3) / 4)) + 1;
  const nodePadaLon = nodeNakLon - (nodePada - 1) * ((40 / 3) / 4);

  const sunPos = getSiderealPosition('lahiri', instant, 'Sun');
  const distFromSun = angularDistance(lon, sunPos.siderealLongitudeDegrees);

  return {
    graha,
    siderealLongitudeDegrees: lon,
    tropicalLongitudeDegrees: lon, // nodes have no separate tropical
    rashiIndex: nodeRashiIndex,
    rashiName: RASHI_IDS[nodeRashiIndex],
    rashiLongitudeDegrees: nodeRashiLon,
    nakshatraIndex: nodeNakIndex,
    nakshatraName: NAKSHATRA_IDS[nodeNakIndex],
    nakshatraLongitudeDegrees: nodeNakLon,
    pada: nodePada,
    padaLongitudeDegrees: nodePadaLon,
    isRetrograde: true, // nodes always retrograde
    isCombust: false,
    combustionDistanceDegrees: null,
  };
}

/** Compute positions for all 9 grahas at the given instant. */
export function getAllGrahaPositions(instant: Date): PlanetPosition[] {
  const positions: PlanetPosition[] = [];
  for (const graha of PHYSICAL_GRAHAS) {
    positions.push(getPhysicalGrahaPosition(instant, graha));
  }
  positions.push(getNodePosition(instant, 'Rahu'));
  positions.push(getNodePosition(instant, 'Ketu'));
  return positions;
}

/* ------------------------------------------------------------------ */
/* LAGNA (ASCENDANT)                                                  */
/* ------------------------------------------------------------------ */

/**
 * Compute the Lagna (Ascendant) longitude in degrees at the given instant
 * and geographic coordinates.
 *
 * Uses the standard formula:
 *   ASC_ra = atan2(sin(LST), cos(ε)·cos(LST) − sin(ε)·tan(φ))
 *   ASC_lon = atan2(sin(ASC_ra), cos(ASC_ra)·cos(ε))
 */
export function computeLagnaLongitude(
  instant: Date,
  latitudeDeg: number,
  longitudeDeg: number,
): number {
  const lst = lstDegrees(instant, longitudeDeg);
  const eps = obliquityDegrees(instant);
  const lat = latitudeDeg;

  const lstRad = lst * DEG_TO_RAD;
  const epsRad = eps * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;

  // Ascendant Right Ascension
  const y = Math.sin(lstRad);
  const x =
    Math.cos(epsRad) * Math.cos(lstRad) -
    Math.sin(epsRad) * Math.tan(latRad);
  const ascRaRad = Math.atan2(y, x);

  // Convert RA to ecliptic longitude
  const ascLonRad = Math.atan2(
    Math.sin(ascRaRad) * Math.cos(epsRad),
    Math.cos(ascRaRad),
  );
  let ascLonDeg = ascLonRad * RAD_TO_DEG;
  ascLonDeg = wrap360(ascLonDeg);

  return ascLonDeg;
}

/* ------------------------------------------------------------------ */
/* HOUSES (WHOLE SIGN)                                                */
/* ------------------------------------------------------------------ */

/**
 * Compute whole-sign houses relative to Lagna.
 * House 1 = rashi containing Lagna. House cusps = start of each rashi.
 */
export function computeWholeSignHouses(
  lagnaLon: number,
): HouseCusps {
  const lagnaRashiIndex = Math.floor(lagnaLon / 30);
  const lagnaRashiLon = lagnaLon - lagnaRashiIndex * 30;

  // House cusps: start of each rashi in whole-sign order from Lagna
  const houseCusps: number[] = [];
  for (let h = 0; h < 12; h++) {
    houseCusps.push(wrap360((lagnaRashiIndex + h) * 30));
  }

  // rashiToHouse: for each rashi index (0-11), which house (1-12) it falls in
  const rashiToHouse: number[] = [];
  for (let r = 0; r < 12; r++) {
    let house = r - lagnaRashiIndex;
    if (house < 0) house += 12;
    rashiToHouse.push(house + 1); // 1-12
  }

  return {
    lagnaLongitudeDegrees: lagnaLon,
    lagnaRashiIndex,
    lagnaRashiName: RASHI_IDS[lagnaRashiIndex],
    lagnaNakshatraIndex: 0, // filled by caller
    lagnaNakshatraName: '', // filled by caller
    lagnaPada: 0, // filled by caller
    houseCusps,
    rashiToHouse,
  };
}

/* ------------------------------------------------------------------ */
/* NAVAMSA (D9)                                                       */
/* ------------------------------------------------------------------ */

/** Starting rashi index for Navamsa based on rashi type. */
function navamsaStartRashi(rashiIndex: number): number {
  if (CHARA_RASHIS.includes(rashiIndex)) return rashiIndex;
  if (STHIRA_RASHIS.includes(rashiIndex)) return (rashiIndex + 8) % 12; // 9th from
  if (DVISVABHAVA_RASHIS.includes(rashiIndex)) return (rashiIndex + 4) % 12; // 5th from
  return rashiIndex;
}

/**
 * Compute Navamsa (D9) sign for a planet given its sidereal longitude.
 * Each rashi is divided into 9 equal parts of 3°20′ each.
 */
export function computeNavamsaSign(siderealLon: number): {
  d9RashiIndex: number;
  d9LongitudeDegrees: number;
  birthPada: number;
} {
  const rashiIndex = Math.floor(siderealLon / 30);
  const rashiLon = siderealLon - rashiIndex * 30;
  const padaIndex = Math.floor(rashiLon / NAVAMSA_PADA_DEGREES); // 0-8
  const padaLon = rashiLon - padaIndex * NAVAMSA_PADA_DEGREES;
  const startRashi = navamsaStartRashi(rashiIndex);
  const d9RashiIndex = (startRashi + padaIndex) % 12;

  return {
    d9RashiIndex,
    d9LongitudeDegrees: padaLon,
    birthPada: padaIndex + 1, // 1-9? No, birthPada here refers to which 3°20' segment within rashi
  };
}

/* ------------------------------------------------------------------ */
/* MAIN ENTRY POINT                                                   */
/* ------------------------------------------------------------------ */

/**
 * Compute a full jyotish chart from birth details.
 *
 * @param birthDetails  Birth date, time, timezone, and place.
 * @param config        Calculation config (ayanamsha mode, reference now).
 * @returns JyotishCalculationResult
 */
export function calculateJyotishChart(
  birthDetails: BirthDetails,
  config: JyotishConfig = {
    ayanamshaMode: 'lahiri',
    referenceNow: DEFAULT_REFERENCE_NOW,
  },
): JyotishCalculationResult {
  // --- Resolve birth instant in AD ---
  let adDate: { year: number; month: number; day: number };
  if (birthDetails.birthDateAd) {
    adDate = birthDetails.birthDateAd;
  } else if (birthDetails.birthDateBs) {
    const ad = bsToAd(
      birthDetails.birthDateBs.year,
      birthDetails.birthDateBs.month,
      birthDetails.birthDateBs.day,
    );
    adDate = { year: ad.year, month: ad.month, day: ad.day };
  } else {
    throw new Error('Either birthDateAd or birthDateBs must be provided.');
  }

  const birthInstantUtc = birthDateTimeToUtc(
    adDate,
    birthDetails.birthTime,
    birthDetails.timeZone,
  );
  const jdUt = julianDayUt(birthInstantUtc);
  const aya = getAyanamsha('lahiri', birthInstantUtc);

  // --- Planet positions ---
  const planets = getAllGrahaPositions(birthInstantUtc);

  // --- Lagna ---
  const { location } = birthDetails;
  const lagnaLon = computeLagnaLongitude(
    birthInstantUtc,
    location.latitude,
    location.longitude,
  );

  // Lagna nakshatra/pada from Moon's nakshatra function applied at Lagna lon
  // We compute Lagna's nakshatra using the sidereal longitude directly
  const lagnaRashiIndex = Math.floor(lagnaLon / 30);
  const lagnaRashiLon = lagnaLon - lagnaRashiIndex * 30;
  const lagnaNakIndex = Math.floor(lagnaLon / (40 / 3));
  const lagnaNakLon = lagnaLon - lagnaNakIndex * (40 / 3);
  const lagnaPada = Math.floor(lagnaNakLon / ((40 / 3) / 4)) + 1;
  const lagnaPadaLon = lagnaNakLon - (lagnaPada - 1) * ((40 / 3) / 4);

  const houses: HouseCusps = {
    ...computeWholeSignHouses(lagnaLon),
    lagnaNakshatraIndex: lagnaNakIndex,
    lagnaNakshatraName: NAKSHATRA_IDS[lagnaNakIndex],
    lagnaPada,
  };

  // --- Navamsa ---
  const navamsa: NavamsaPlacement[] = [];
  // Lagna navamsa (computed separately)
  const lagnaD9 = computeNavamsaSign(lagnaLon);
  const lagnaNavamsa: NavamsaPlacement = {
    graha: 'Lagna',
    d9RashiIndex: lagnaD9.d9RashiIndex,
    d9RashiName: RASHI_IDS[lagnaD9.d9RashiIndex],
    d9LongitudeDegrees: lagnaD9.d9LongitudeDegrees,
    birthPada: lagnaD9.birthPada,
  };
  // Planet navamsas
  for (const p of planets) {
    const d9 = computeNavamsaSign(p.siderealLongitudeDegrees);
    navamsa.push({
      graha: p.graha,
      d9RashiIndex: d9.d9RashiIndex,
      d9RashiName: RASHI_IDS[d9.d9RashiIndex],
      d9LongitudeDegrees: d9.d9LongitudeDegrees,
      birthPada: d9.birthPada,
    });
  }

  // --- Vimshottari Dasha ---
  const moonPosition = planets.find((p) => p.graha === 'Moon');
  if (!moonPosition) {
    throw new Error('Moon position not found in graha list.');
  }
  const dashaResult = computeVimshottariDasha(
    birthInstantUtc,
    moonPosition,
    config.referenceNow,
  );

  return {
    birthDetails,
    birthInstantUtc,
    julianDayUt: jdUt,
    ayanamshaDegrees: aya.trueDegrees,
    planets,
    houses,
    navamsa,
    lagnaNavamsa,
    mahadasha: dashaResult.mahadasha,
    currentMahadasha: dashaResult.currentMahadasha,
    currentAntardasha: dashaResult.currentAntardasha,
  };
}
