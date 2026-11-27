// lib/jyotish/types.ts
//
// Phase 1 foundation for AI Jyotish — deterministic Vedic (Sidereal / Lahiri)
// astronomical calculation engine.
//
// All angles in degrees unless noted. All dates as ISO strings (YYYY-MM-DD).
// Times are 24h HH:MM unless noted.

/** The nine grahas used in Vedic astrology. */
export type GrahaId =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn'
  | 'Rahu'
  | 'Ketu';

/** Traditional Vedic order of rashis (signs), index 0 = Mesha ... 11 = Meena. */
export const RASHI_IDS: readonly string[] = [
  'mesha', 'vrisha', 'mithun', 'karkat', 'simha', 'kanya',
  'tula', 'vrischik', 'dhanu', 'makar', 'kumbha', 'meen',
] as const;

/** Rashi index 0..11. */
export type RashiIndex = number;

/** Nakshatra index 0..26 (Ashwini..Revati). */
export type NakshatraIndex = number;

/** Birth date specified in either Bikram Sambat (BS) or Gregorian (AD). */
export interface BirthDateInput {
  /** AD date components. One of birthDateAd or birthDateBs must be provided. */
  ad?: { year: number; month: number; day: number };
  /** BS date components. One of birthDateAd or birthDateBs must be provided. */
  bs?: { year: number; month: number; day: number };
}

/** Birth time (24h HH:MM) plus timezone. */
export interface BirthTimeInput {
  /** Time in 24h format, e.g. "14:30". */
  time: string;
  /** IANA timezone string, e.g. "Asia/Kathmandu". */
  timeZone: string;
}

/** Birth place — geographic coordinates and timezone. */
export interface BirthPlace {
  name: string;
  latitude: number;  // degrees, north positive
  longitude: number; // degrees, east positive
  timezone: string;  // IANA timezone string
  district?: string; // Nepali district name (for district headquarters)
}

/** Complete birth details for a jyotish calculation. */
export interface BirthDetails {
  birthDateAd: { year: number; month: number; day: number } | null;
  birthDateBs: { year: number; month: number; day: number } | null;
  birthTime: string;
  timeZone: string;
  location: BirthPlace;
}

/** Sidereal planetary position for a single graha. */
export interface PlanetPosition {
  graha: GrahaId;
  /** Sidereal longitude [0, 360). */
  siderealLongitudeDegrees: number;
  /** Tropical longitude [0, 360) before ayanamsha subtraction. */
  tropicalLongitudeDegrees: number;
  /** Rashi index 0..11. */
  rashiIndex: RashiIndex;
  /** Rashi name. */
  rashiName: string;
  /** Longitude within rashi [0, 30). */
  rashiLongitudeDegrees: number;
  /** Nakshatra index 0..26. */
  nakshatraIndex: NakshatraIndex;
  /** Nakshatra name. */
  nakshatraName: string;
  /** Longitude within nakshatra [0, 13°20′). */
  nakshatraLongitudeDegrees: number;
  /** Pada 1..4. */
  pada: number;
  /** Longitude within pada [0, 3°20′). */
  padaLongitudeDegrees: number;
  /** True if planet is retrograde at this instant. */
  isRetrograde: boolean;
  /** True if planet is combust (within combustion orb of Sun). */
  isCombust: boolean;
  /** Angular distance from Sun in degrees (null for Sun itself). Null if not combust. */
  combustionDistanceDegrees: number | null;
}

/** Whole-sign house cusps relative to Lagna. House 1 starts at Lagna rashi. */
export interface HouseCusps {
  /** Lagna (Ascendant) longitude [0, 360). */
  lagnaLongitudeDegrees: number;
  /** Lagna rashi index 0..11. */
  lagnaRashiIndex: RashiIndex;
  /** Lagna rashi name. */
  lagnaRashiName: string;
  /** Lagna nakshatra index 0..26. */
  lagnaNakshatraIndex: NakshatraIndex;
  /** Lagna nakshatra name. */
  lagnaNakshatraName: string;
  /** Lagna pada 1..4. */
  lagnaPada: number;
  /** House cusp longitudes [0, 360), house 1 = lagna rashi start. */
  houseCusps: number[];
  /** Whole-sign house number (1-12) for each of the 12 rashis in order. */
  rashiToHouse: number[];
}

/** Navamsa (D9) placement for a graha or Lagna. */
export interface NavamsaPlacement {
  /** Graha identifier, or 'Lagna' for the ascendant's D9. */
  graha: GrahaId | 'Lagna';
  /** D9 sign index 0..11. */
  d9RashiIndex: RashiIndex;
  /** D9 sign name. */
  d9RashiName: string;
  /** Longitude within D9 sign [0, 30). */
  d9LongitudeDegrees: number;
  /** Pada within birth rashi (1-9 segment) that produced this D9 sign. */
  birthPada: number;
}

/** One Vimshottari Mahadasha or Antardasha period. */
export interface DashaPeriod {
  graha: GrahaId;
  /** Start date in AD (ISO YYYY-MM-DD). */
  startDateAd: string;
  /** End date in AD (ISO YYYY-MM-DD), exclusive. */
  endDateAd: string;
  /** Start date in BS (YYYY-MM-DD). */
  startDateBs: string;
  /** End date in BS (YYYY-MM-DD), exclusive. */
  endDateBs: string;
  /** Duration in years (fractional). */
  durationYears: number;
  /** True if this period contains the reference "now" date. */
  isActive: boolean;
}

/** Complete jyotish calculation result. */
export interface JyotishCalculationResult {
  birthDetails: BirthDetails;
  /** Birth instant converted to UTC. */
  birthInstantUtc: Date;
  /** Julian Day (UT) at birth instant. */
  julianDayUt: number;
  /** Lahiri ayanamsha at birth instant (degrees). */
  ayanamshaDegrees: number;
  /** Positions of all 9 grahas. */
  planets: PlanetPosition[];
  /** Lagna and whole-sign houses. */
  houses: HouseCusps;
  /** Navamsa (D9) placements for the 9 grahas. */
  navamsa: NavamsaPlacement[];
  /** Navamsa (D9) placement for Lagna (Ascendant). */
  lagnaNavamsa: NavamsaPlacement;
  /** Vimshottari Mahadasha periods (120 years). */
  mahadasha: DashaPeriod[];
  /** Currently active Mahadasha as of reference now. */
  currentMahadasha: DashaPeriod | null;
  /** Currently active Antardasha within current Mahadasha as of reference now. */
  currentAntardasha: DashaPeriod | null;
}

/** Configuration for a jyotish calculation. */
export interface JyotishConfig {
  ayanamshaMode: 'lahiri';
  referenceNow: Date; // "now" for determining active dasha
}
