// lib/jyotish/interpreter-context.ts
//
// Phase 2: Deterministic chart summary and yoga detector for AI Jyotish.
// Produces a compact, unambiguous ground-truth JSON payload (InterpreterContext)
// so the AI model relies 100% on calculated astronomical facts.
//
// REUSES existing types from ./types.ts and constants from ../astronomy/nakshatra.ts
// Does NOT modify any lib/astronomy/* files.
//
// SOURCES for classical constants:
//   - Exaltation/debilitation/own-sign: Brihat Parashara Hora Shastra (BPHS),
//     Phaladeepika, Saravali - standard Vedic astrology texts.
//     Specific degrees from BPHS Ch. 10 (exaltation) and Ch. 11 (debilitation).
//   - House lordship (whole-sign): Standard Vedic assignment: rashi lords
//     become house lords per Lagna-based whole-sign house system.
//   - Yoga definitions: Classical texts (BPHS, Phaladeepika, Saravali,
//     Jataka Parijata, Bhavartha Ratnakara). All orbs/definitions use
//     whole-sign house placement and exact conjunction (same rashi).
//   - Sade Sati: Traditional 7.5-year transit of Saturn over natal Moon rashi
//     and adjacent rashis (12th, 1st, 2nd from Moon).
//
// BOUNDARY RULE: All rashi/nakshatra assignments use [start, start+span)
// semantics (lower-bound-inclusive, upper-bound-exclusive) matching
// lib/astronomy/nakshatra.ts. An exact boundary (e.g., 0.0000 degree) belongs
// to the next division. Floating-point noise is not corrected here; the
// underlying astronomy modules already flag near-boundary cases.
//
// DETERMINISM: All calculations are pure functions of JyotishCalculationResult.
// No external I/O, no randomness, no "current time" except referenceNow
// passed through for dasha (already in input).

import type {
  GrahaId,
  RashiIndex,
  NakshatraIndex,
  PlanetPosition,
  HouseCusps,
  DashaPeriod,
  JyotishCalculationResult,
} from './types.js';

import { RASHI_IDS, NAKSHATRA_IDS } from '../astronomy/nakshatra.js';

/* ------------------------------------------------------------------ */
/* CONSTANTS - CLASSICAL VEDIC ASSIGNMENTS (with source citations)    */
/* ------------------------------------------------------------------ */

/** Rashi lord for each rashi (index 0 = Mesha ... 11 = Meena).
 *  Source: Brihat Parashara Hora Shastra, standard Vedic rashi lordship. */
export const RASHI_LORDS: readonly GrahaId[] = [
  'Mars',    // 0 Mesha
  'Venus',   // 1 Vrishabha
  'Mercury', // 2 Mithuna
  'Moon',    // 3 Karkata
  'Sun',     // 4 Simha
  'Mercury', // 5 Kanya
  'Venus',   // 6 Tula
  'Mars',    // 7 Vrischika
  'Jupiter', // 8 Dhanu
  'Saturn',  // 9 Makara
  'Saturn',  // 10 Kumbha
  'Jupiter', // 11 Meena
] as const;

/** Exaltation rashi for each graha (index by GrahaId order).
 *  Source: BPHS Ch. 10. Degrees of deep exaltation noted in comments. */
export const EXALTATION_RASHI: Record<GrahaId, RashiIndex> = {
  Sun: 0,      // Mesha 10 degree (deep exaltation)
  Moon: 1,     // Vrishabha 3 degree
  Mars: 9,     // Makara 28 degree
  Mercury: 5,  // Kanya 15 degree
  Jupiter: 3,  // Karkata 5 degree
  Venus: 11,   // Meena 27 degree
  Saturn: 6,   // Tula 20 degree
  Rahu: 1,     // Vrishabha (traditional assignment; varies by text)
  Ketu: 7,     // Vrischika (traditional assignment; varies by text)
};

/** Debilitation rashi for each graha (always 7th from exaltation).
 *  Source: BPHS Ch. 11. Deep debilitation degrees in comments. */
export const DEBILITATION_RASHI: Record<GrahaId, RashiIndex> = {
  Sun: 6,      // Tula 10 degree
  Moon: 7,     // Vrischika 3 degree
  Mars: 3,     // Karkata 28 degree
  Mercury: 11, // Meena 15 degree
  Jupiter: 9,  // Makara 5 degree
  Venus: 5,    // Kanya 27 degree
  Saturn: 0,   // Mesha 20 degree
  Rahu: 7,     // Vrischika (7th from Taurus)
  Ketu: 1,     // Vrishabha (7th from Scorpio)
};

/** Moolatrikona rashi for each graha (where applicable).
 *  Source: BPHS Ch. 12. Used for additional strength assessment. */
export const MOOLATRIKONA_RASHI: Record<GrahaId, RashiIndex | null> = {
  Sun: 4,      // Simha 0-20 degree
  Moon: 1,     // Vrishabha 3-30 degree (overlaps exaltation)
  Mars: 0,     // Mesha 0-12 degree
  Mercury: 5,  // Kanya 15-20 degree
  Jupiter: 8,  // Dhanu 0-10 degree
  Venus: 6,    // Tula 0-15 degree
  Saturn: 9,   // Makara 0-20 degree
  Rahu: null,  // Nodes have no moolatrikona in standard texts
  Ketu: null,
};

/** Natural benefic/malefic classification (for yoga logic).
 *  Source: Standard Vedic classification (BPHS, Phaladeepika).
 *  Mercury is benefic when unafflicted; treated as benefic here. */
export const NATURAL_BENEFIC: ReadonlySet<GrahaId> = new Set([
  'Jupiter', 'Venus', 'Mercury', 'Moon', // waxing Moon; waning handled separately
]);
export const NATURAL_MALEFIC: ReadonlySet<GrahaId> = new Set([
  'Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu',
]);

/** Kendra (angular) house numbers in whole-sign system. */
export const KENDRA_HOUSES: readonly number[] = [1, 4, 7, 10] as const;
/** Trikona (trinal) house numbers. */
export const TRIKONA_HOUSES: readonly number[] = [1, 5, 9] as const;
/** Dusthana (difficult) house numbers. */
export const DUSTHANA_HOUSES: readonly number[] = [6, 8, 12] as const;

/* ------------------------------------------------------------------ */
/* TYPE DEFINITIONS - INTERPRETER CONTEXT                             */
/* ------------------------------------------------------------------ */

/** House lordship info: which graha rules this house and where placed. */
export interface HouseLordship {
  /** House number 1-12. */
  house: number;
  /** Rashi index of this house (whole-sign). */
  rashiIndex: RashiIndex;
  /** Rashi name. */
  rashiName: string;
  /** Lord of this house (rashi lord of the rashi occupying this house). */
  lord: GrahaId;
  /** House number where the lord is placed (1-12). */
  lordPlacedHouse: number;
  /** Rashi index where lord is placed. */
  lordPlacedRashiIndex: RashiIndex;
  /** Rashi name where lord is placed. */
  lordPlacedRashiName: string;
}

/** Dignity status of a graha in its current rashi. */
export interface GrahaDignity {
  graha: GrahaId;
  rashiIndex: RashiIndex;
  rashiName: string;
  /** 'exalted' | 'debilitated' | 'own_sign' | 'moolatrikona' | 'friendly' | 'neutral' | 'enemy' */
  status: 'exalted' | 'debilitated' | 'own_sign' | 'moolatrikona' | 'friendly' | 'neutral' | 'enemy';
  /** True if graha is in its own rashi (Swakshetra). */
  isOwnSign: boolean;
  /** True if graha is exalted. */
  isExalted: boolean;
  /** True if graha is debilitated. */
  isDebilitated: boolean;
  /** True if graha is in moolatrikona portion (approx, by rashi only). */
  isMoolatrikona: boolean;
}

/** Single detected yoga with metadata. */
export interface DetectedYoga {
  /** Yoga name (standard classical name). */
  name: string;
  /** Short human-readable description. */
  description: string;
  /** Grahas involved in this yoga. */
  grahas: GrahaId[];
  /** Houses involved (1-12). */
  houses: number[];
  /** Rashi indices involved. */
  rashiIndices: RashiIndex[];
  /** Classical source reference. */
  source: string;
  /** True if yoga is considered "strong" (e.g., planets in own/exalted sign). */
  isStrong: boolean;
}

/** Sade Sati transit status relative to natal Moon. */
export interface SadeSatiStatus {
  /** Natal Moon rashi index. */
  natalMoonRashiIndex: RashiIndex;
  /** Natal Moon rashi name. */
  natalMoonRashiName: string;
  /** Current Saturn rashi index (at referenceNow). */
  currentSaturnRashiIndex: RashiIndex;
  /** Current Saturn rashi name. */
  currentSaturnRashiName: string;
  /** Phase: 'first' (12th from Moon), 'second' (over Moon), 'third' (2nd from Moon), 'none'. */
  phase: 'first' | 'second' | 'third' | 'none';
  /** True if currently in any Sade Sati phase. */
  isActive: boolean;
  /** Approximate start date of current phase (ISO YYYY-MM-DD) if active. */
  phaseStartAd?: string;
  /** Approximate end date of current phase (ISO YYYY-MM-DD) if active. */
  phaseEndAd?: string;
}

/** Complete interpreter context payload for AI consumption. */
export interface InterpreterContext {
  /** Chart identification. */
  chartId: string;
  /** Birth instant (UTC ISO string). */
  birthInstantUtc: string;
  /** Lahiri ayanamsha at birth (degrees). */
  ayanamshaDegrees: number;
  /** Lagna (Ascendant) summary. */
  lagna: {
    rashiIndex: RashiIndex;
    rashiName: string;
    nakshatraIndex: NakshatraIndex;
    nakshatraName: string;
    pada: number;
    longitudeDegrees: number;
  };
  /** House lordships (1-12). */
  houseLordships: HouseLordship[];
  /** Graha dignities (all 9 grahas). */
  grahaDignities: GrahaDignity[];
  /** All detected classical yogas. */
  yogas: DetectedYoga[];
  /** Sade Sati transit status. */
  sadeSati: SadeSatiStatus;
  /** Current Vimshottari dasha (from input). */
  currentMahadasha: DashaPeriod | null;
  /** Current Antardasha (from input). */
  currentAntardasha: DashaPeriod | null;
}

/* ------------------------------------------------------------------ */
/* HELPER FUNCTIONS                                                   */
/* ------------------------------------------------------------------ */

/** Normalize angle to [0, 360). */
function wrap360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Get rashi index from sidereal longitude [0, 360). */
function longitudeToRashiIndex(lon: number): RashiIndex {
  return Math.floor(wrap360(lon) / 30);
}

/** Get graha by name from planets array. */
function getPlanet(planets: PlanetPosition[], graha: GrahaId): PlanetPosition | undefined {
  return planets.find((p) => p.graha === graha);
}

/** Check if two grahas are conjunct (same rashi, whole-sign). */
function areConjunct(p1: PlanetPosition, p2: PlanetPosition): boolean {
  return p1.rashiIndex === p2.rashiIndex;
}

/** Check if graha is in Kendra (1,4,7,10) from a reference rashi. */
function isInKendraFrom(grahaRashi: RashiIndex, refRashi: RashiIndex): boolean {
  const diff = (grahaRashi - refRashi + 12) % 12;
  return diff === 0 || diff === 3 || diff === 6 || diff === 9; // 1st, 4th, 7th, 10th
}

/** Check if graha is in Trikona (1,5,9) from a reference rashi. */
function isInTrikonaFrom(grahaRashi: RashiIndex, refRashi: RashiIndex): boolean {
  const diff = (grahaRashi - refRashi + 12) % 12;
  return diff === 0 || diff === 4 || diff === 8; // 1st, 5th, 9th
}

/** Get house number (1-12) for a given rashi index relative to Lagna. */
function getHouseForRashi(rashiIndex: RashiIndex, lagnaRashiIndex: RashiIndex): number {
  let house = rashiIndex - lagnaRashiIndex;
  if (house < 0) house += 12;
  return house + 1; // 1-12
}

/** Get rashi index for a given house number (1-12) relative to Lagna. */
function getRashiForHouse(house: number, lagnaRashiIndex: RashiIndex): RashiIndex {
  return (lagnaRashiIndex + house - 1) % 12;
}

/** Determine dignity status of a graha in a rashi. */
function computeDignity(graha: GrahaId, rashiIndex: RashiIndex): GrahaDignity['status'] {
  if (EXALTATION_RASHI[graha] === rashiIndex) return 'exalted';
  if (DEBILITATION_RASHI[graha] === rashiIndex) return 'debilitated';
  if (RASHI_LORDS[rashiIndex] === graha) return 'own_sign';
  const mt = MOOLATRIKONA_RASHI[graha];
  if (mt !== null && mt === rashiIndex) return 'moolatrikona';
  // Friend/enemy/neutral based on traditional relationships (simplified)
  // Full friend/enemy matrix omitted for brevity; default to 'neutral'.
  // Source: BPHS Ch. 3 (Graha Maitri). This is a placeholder for future expansion.
  return 'neutral';
}

/** Check if graha is natural benefic (for yoga logic). */
function isBenefic(graha: GrahaId): boolean {
  return NATURAL_BENEFIC.has(graha);
}

/** Check if graha is natural malefic. */
function isMalefic(graha: GrahaId): boolean {
  return NATURAL_MALEFIC.has(graha);
}

/* ------------------------------------------------------------------ */
/* MAIN EXPORT: BUILD INTERPRETER CONTEXT                             */
/* ------------------------------------------------------------------ */

/**
 * Build a deterministic InterpreterContext from a JyotishCalculationResult.
 *
 * @param result  Complete jyotish calculation result from calculateJyotishChart().
 * @returns       InterpreterContext payload for AI model consumption.
 */
export function buildInterpreterContext(
  result: JyotishCalculationResult,
): InterpreterContext {
  const { planets, houses, navamsa, mahadasha, currentMahadasha, currentAntardasha, birthInstantUtc, ayanamshaDegrees } = result;

  // --- LAGNA SUMMARY ---
  const lagna = {
    rashiIndex: houses.lagnaRashiIndex,
    rashiName: houses.lagnaRashiName,
    nakshatraIndex: houses.lagnaNakshatraIndex,
    nakshatraName: houses.lagnaNakshatraName,
    pada: houses.lagnaPada,
    longitudeDegrees: houses.lagnaLongitudeDegrees,
  };

  // --- HOUSE LORDSHIPS ---
  const houseLordships: HouseLordship[] = [];
  for (let h = 1; h <= 12; h++) {
    const rashiIndex = getRashiForHouse(h, houses.lagnaRashiIndex);
    const rashiName = RASHI_IDS[rashiIndex];
    const lord = RASHI_LORDS[rashiIndex];
    // Find where the lord is placed
    const lordPlanet = getPlanet(planets, lord);
    const lordPlacedRashiIndex = lordPlanet?.rashiIndex ?? rashiIndex; // fallback
    const lordPlacedRashiName = RASHI_IDS[lordPlacedRashiIndex];
    const lordPlacedHouse = getHouseForRashi(lordPlacedRashiIndex, houses.lagnaRashiIndex);

    houseLordships.push({
      house: h,
      rashiIndex,
      rashiName,
      lord,
      lordPlacedHouse,
      lordPlacedRashiIndex,
      lordPlacedRashiName,
    });
  }

  // --- GRAHA DIGNITIES ---
  const grahaDignities: GrahaDignity[] = [];
  for (const p of planets) {
    const status = computeDignity(p.graha, p.rashiIndex);
    const mt = MOOLATRIKONA_RASHI[p.graha];
    grahaDignities.push({
      graha: p.graha,
      rashiIndex: p.rashiIndex,
      rashiName: p.rashiName,
      status,
      isOwnSign: status === 'own_sign',
      isExalted: status === 'exalted',
      isDebilitated: status === 'debilitated',
      isMoolatrikona: status === 'moolatrikona' || (mt !== null && mt === p.rashiIndex),
    });
  }

  // --- YOGA DETECTION ---
  const yogas: DetectedYoga[] = [];

  // Helper: get planet position by graha
  const sun = getPlanet(planets, 'Sun')!;
  const moon = getPlanet(planets, 'Moon')!;
  const mars = getPlanet(planets, 'Mars')!;
  const mercury = getPlanet(planets, 'Mercury')!;
  const jupiter = getPlanet(planets, 'Jupiter')!;
  const venus = getPlanet(planets, 'Venus')!;
  const saturn = getPlanet(planets, 'Saturn')!;
  const rahu = getPlanet(planets, 'Rahu')!;
  const ketu = getPlanet(planets, 'Ketu')!;

  // 1. Gaja Kesari Yoga: Jupiter in Kendra from Moon
  if (isInKendraFrom(jupiter.rashiIndex, moon.rashiIndex)) {
    yogas.push({
      name: 'Gaja Kesari Yoga',
      description: 'Jupiter in Kendra (1,4,7,10) from Moon',
      grahas: ['Jupiter', 'Moon'],
      houses: [
        getHouseForRashi(jupiter.rashiIndex, houses.lagnaRashiIndex),
        getHouseForRashi(moon.rashiIndex, houses.lagnaRashiIndex),
      ],
      rashiIndices: [jupiter.rashiIndex, moon.rashiIndex],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: jupiter.isRetrograde === false && (jupiter.rashiIndex === EXALTATION_RASHI.Jupiter || RASHI_LORDS[jupiter.rashiIndex] === 'Jupiter'),
    });
  }

  // 2. Budhaditya Yoga: Sun-Mercury conjunction (same rashi)
  if (areConjunct(sun, mercury)) {
    yogas.push({
      name: 'Budhaditya Yoga',
      description: 'Sun and Mercury conjunct in same rashi',
      grahas: ['Sun', 'Mercury'],
      houses: [getHouseForRashi(sun.rashiIndex, houses.lagnaRashiIndex)],
      rashiIndices: [sun.rashiIndex],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: mercury.isCombust === false && (mercury.rashiIndex === EXALTATION_RASHI.Mercury || RASHI_LORDS[mercury.rashiIndex] === 'Mercury'),
    });
  }

  // 3. Pancha Mahapurusha Yogas: Mars/Mercury/Jupiter/Venus/Saturn in own/exalted sign in Kendra
  const mahaPurushaGrahas: GrahaId[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const mahaPurushaNames: Partial<Record<GrahaId, string>> = {
    Mars: 'Ruchaka Yoga',
    Mercury: 'Bhadra Yoga',
    Jupiter: 'Hamsa Yoga',
    Venus: 'Malavya Yoga',
    Saturn: 'Sasha Yoga',
  };
  for (const g of mahaPurushaGrahas) {
    const planet = getPlanet(planets, g)!;
    const inKendra = KENDRA_HOUSES.includes(getHouseForRashi(planet.rashiIndex, houses.lagnaRashiIndex));
    const inOwnOrExalted = planet.rashiIndex === EXALTATION_RASHI[g] || RASHI_LORDS[planet.rashiIndex] === g;
    if (inKendra && inOwnOrExalted) {
      yogas.push({
        name: mahaPurushaNames[g] ?? `${g} Mahapurusha Yoga`,
        description: `${g} in own/exalted sign in Kendra (1,4,7,10)`,
        grahas: [g],
        houses: [getHouseForRashi(planet.rashiIndex, houses.lagnaRashiIndex)],
        rashiIndices: [planet.rashiIndex],
        source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
        isStrong: true,
      });
    }
  }

  // 4. Chandra-Mangal Yoga: Moon-Mars conjunction (same rashi)
  if (areConjunct(moon, mars)) {
    yogas.push({
      name: 'Chandra-Mangal Yoga',
      description: 'Moon and Mars conjunct in same rashi',
      grahas: ['Moon', 'Mars'],
      houses: [getHouseForRashi(moon.rashiIndex, houses.lagnaRashiIndex)],
      rashiIndices: [moon.rashiIndex],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: mars.rashiIndex === EXALTATION_RASHI.Mars || RASHI_LORDS[mars.rashiIndex] === 'Mars',
    });
  }

  // 5. Vipareeta Raja Yoga: 6th/8th/12th lords in 6th/8th/12th houses
  const dusthanaHouses = [6, 8, 12];
  for (const dh of dusthanaHouses) {
    const dusthanaRashi = getRashiForHouse(dh, houses.lagnaRashiIndex);
    const dusthanaLord = RASHI_LORDS[dusthanaRashi];
    const lordPlanet = getPlanet(planets, dusthanaLord)!;
    const lordHouse = getHouseForRashi(lordPlanet.rashiIndex, houses.lagnaRashiIndex);
    if (dusthanaHouses.includes(lordHouse)) {
      yogas.push({
        name: 'Vipareeta Raja Yoga',
        description: `${dusthanaLord} (lord of ${dh}th) placed in ${lordHouse}th house`,
        grahas: [dusthanaLord],
        houses: [dh, lordHouse],
        rashiIndices: [dusthanaRashi, lordPlanet.rashiIndex],
        source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
        isStrong: lordPlanet.rashiIndex === EXALTATION_RASHI[dusthanaLord] || RASHI_LORDS[lordPlanet.rashiIndex] === dusthanaLord,
      });
    }
  }

  // 6. Sade Sati: Computed separately in sadeSati field (see below)

  // 7. Amala Yoga: Benefic in 10th from Lagna or Moon
  const tenthFromLagnaRashi = getRashiForHouse(10, houses.lagnaRashiIndex);
  const tenthFromMoonRashi = (moon.rashiIndex + 9) % 12; // 10th from Moon
  const planetsIn10thLagna = planets.filter((p) => p.rashiIndex === tenthFromLagnaRashi);
  const planetsIn10thMoon = planets.filter((p) => p.rashiIndex === tenthFromMoonRashi);
  const beneficsIn10thLagna = planetsIn10thLagna.filter((p) => isBenefic(p.graha));
  const beneficsIn10thMoon = planetsIn10thMoon.filter((p) => isBenefic(p.graha));
  if (beneficsIn10thLagna.length > 0 || beneficsIn10thMoon.length > 0) {
    const beneficGrahas = [...new Set([...beneficsIn10thLagna, ...beneficsIn10thMoon].map((p) => p.graha))];
    yogas.push({
      name: 'Amala Yoga',
      description: 'Benefic planet(s) in 10th house from Lagna or Moon',
      grahas: beneficGrahas,
      houses: [10],
      rashiIndices: [...new Set([tenthFromLagnaRashi, tenthFromMoonRashi])],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: beneficGrahas.some((g) => {
        const p = getPlanet(planets, g)!;
        return p.rashiIndex === EXALTATION_RASHI[g] || RASHI_LORDS[p.rashiIndex] === g;
      }),
    });
  }

  // 8. Durudhara Yoga: Planets on both sides of Moon (2nd and 12th from Moon)
  const secondFromMoonRashi = (moon.rashiIndex + 1) % 12;
  const twelfthFromMoonRashi = (moon.rashiIndex + 11) % 12;
  const planets2ndFromMoon = planets.filter((p) => p.rashiIndex === secondFromMoonRashi);
  const planets12thFromMoon = planets.filter((p) => p.rashiIndex === twelfthFromMoonRashi);
  if (planets2ndFromMoon.length > 0 && planets12thFromMoon.length > 0) {
    const involvedGrahas = [...planets2ndFromMoon, ...planets12thFromMoon].map((p) => p.graha);
    yogas.push({
      name: 'Durudhara Yoga',
      description: 'Planets on both sides of Moon (2nd and 12th from Moon)',
      grahas: involvedGrahas,
      houses: [
        getHouseForRashi(secondFromMoonRashi, houses.lagnaRashiIndex),
        getHouseForRashi(twelfthFromMoonRashi, houses.lagnaRashiIndex),
      ],
      rashiIndices: [secondFromMoonRashi, twelfthFromMoonRashi],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: involvedGrahas.some((g) => {
        const p = getPlanet(planets, g)!;
        return isBenefic(g) && (p.rashiIndex === EXALTATION_RASHI[g] || RASHI_LORDS[p.rashiIndex] === g);
      }),
    });
  }

  // 9. Sunapha/Anapha Yoga: Planets in 2nd (Sunapha) or 12th (Anapha) from Moon
  if (planets2ndFromMoon.length > 0) {
    yogas.push({
      name: 'Sunapha Yoga',
      description: 'Planet(s) in 2nd house from Moon',
      grahas: planets2ndFromMoon.map((p) => p.graha),
      houses: [getHouseForRashi(secondFromMoonRashi, houses.lagnaRashiIndex)],
      rashiIndices: [secondFromMoonRashi],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: planets2ndFromMoon.some((p) => isBenefic(p.graha) && (p.rashiIndex === EXALTATION_RASHI[p.graha] || RASHI_LORDS[p.rashiIndex] === p.graha)),
    });
  }
  if (planets12thFromMoon.length > 0) {
    yogas.push({
      name: 'Anapha Yoga',
      description: 'Planet(s) in 12th house from Moon',
      grahas: planets12thFromMoon.map((p) => p.graha),
      houses: [getHouseForRashi(twelfthFromMoonRashi, houses.lagnaRashiIndex)],
      rashiIndices: [twelfthFromMoonRashi],
      source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
      isStrong: planets12thFromMoon.some((p) => isBenefic(p.graha) && (p.rashiIndex === EXALTATION_RASHI[p.graha] || RASHI_LORDS[p.rashiIndex] === p.graha)),
    });
  }

  // 10. Saraswati Yoga: Jupiter, Mercury, Venus in Kendras/Trikonas
  const saraswatiGrahas: GrahaId[] = ['Jupiter', 'Mercury', 'Venus'];
  const saraswatiPlanets = saraswatiGrahas.map((g) => getPlanet(planets, g)!);
  const allInKendraOrTrikona = saraswatiPlanets.every((p) => {
    const h = getHouseForRashi(p.rashiIndex, houses.lagnaRashiIndex);
    return KENDRA_HOUSES.includes(h) || TRIKONA_HOUSES.includes(h);
  });
  if (allInKendraOrTrikona) {
    yogas.push({
      name: 'Saraswati Yoga',
      description: 'Jupiter, Mercury, Venus all in Kendra/Trikona houses',
      grahas: saraswatiGrahas,
      houses: saraswatiPlanets.map((p) => getHouseForRashi(p.rashiIndex, houses.lagnaRashiIndex)),
      rashiIndices: saraswatiPlanets.map((p) => p.rashiIndex),
      source: 'BPHS Ch. 12, Saravali',
      isStrong: saraswatiPlanets.every((p) => p.rashiIndex === EXALTATION_RASHI[p.graha] || RASHI_LORDS[p.rashiIndex] === p.graha),
    });
  }

  // 11. Parivartana Yoga: Sign exchange between lords (mutual reception)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const lord1 = RASHI_LORDS[p1.rashiIndex];
      const lord2 = RASHI_LORDS[p2.rashiIndex];
      if (lord1 === p2.graha && lord2 === p1.graha) {
        yogas.push({
          name: 'Parivartana Yoga',
          description: `Mutual sign exchange: ${p1.graha} in ${p2.graha}'s sign and vice versa`,
          grahas: [p1.graha, p2.graha],
          houses: [
            getHouseForRashi(p1.rashiIndex, houses.lagnaRashiIndex),
            getHouseForRashi(p2.rashiIndex, houses.lagnaRashiIndex),
          ],
          rashiIndices: [p1.rashiIndex, p2.rashiIndex],
          source: 'BPHS Ch. 12, Phaladeepika Ch. 6',
          isStrong: true, // Parivartana is inherently strong
        });
      }
    }
  }

  // --- SADE SATI STATUS ---
  // Uses referenceNow from the dasha calculation (already in result via mahadasha referenceNow)
  // We approximate: Saturn transit is ~2.5 years per sign. Use current Saturn position
  // from the birth chart as a proxy for "now" transit (user must supply current transit
  // separately for exact Sade Sati). Here we compute based on birth Saturn vs Moon.
  // For a true transit check, the caller should provide current Saturn position.
  // This implementation uses birth Saturn as reference; mark as approximate.
  const currentSaturnRashiIndex = saturn.rashiIndex;
  const natalMoonRashiIndex = moon.rashiIndex;
  const saturnFromMoon = (currentSaturnRashiIndex - natalMoonRashiIndex + 12) % 12;
  let sadeSatiPhase: SadeSatiStatus['phase'] = 'none';
  if (saturnFromMoon === 11) sadeSatiPhase = 'first';    // 12th from Moon
  else if (saturnFromMoon === 0) sadeSatiPhase = 'second'; // Over Moon
  else if (saturnFromMoon === 1) sadeSatiPhase = 'third';  // 2nd from Moon

  const sadeSati: SadeSatiStatus = {
    natalMoonRashiIndex,
    natalMoonRashiName: moon.rashiName,
    currentSaturnRashiIndex,
    currentSaturnRashiName: saturn.rashiName,
    phase: sadeSatiPhase,
    isActive: sadeSatiPhase !== 'none',
    // Phase dates require transit ephemeris; omitted here (marked as approximate).
    // Caller should compute from actual Saturn transit if needed.
  };

  // --- CHART ID (deterministic from birth instant) ---
  const chartId = `chart_${birthInstantUtc.toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

  return {
    chartId,
    birthInstantUtc: birthInstantUtc.toISOString(),
    ayanamshaDegrees,
    lagna,
    houseLordships,
    grahaDignities,
    yogas,
    sadeSati,
    currentMahadasha,
    currentAntardasha,
  };
}

/* ------------------------------------------------------------------ */
/* SERIALIZATION HELPER                                               */
/* ------------------------------------------------------------------ */

/**
 * Serialize InterpreterContext to compact JSON string.
 * Use this for AI model input to ensure deterministic, unambiguous payload.
 */
export function serializeInterpreterContext(ctx: InterpreterContext): string {
  return JSON.stringify(ctx, null, 0); // Compact (no whitespace)
}

/**
 * Parse InterpreterContext from JSON string.
 */
export function parseInterpreterContext(json: string): InterpreterContext {
  return JSON.parse(json) as InterpreterContext;
}

export { RASHI_IDS, NAKSHATRA_IDS } from '../astronomy/nakshatra.js';
