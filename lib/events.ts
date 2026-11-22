// lib/events.ts
//
// Phase 3 — Festival & Events Calendar data architecture.
//
// This file contains festival and event records that COMPLEMENT (never duplicate)
// lib/holidays.ts. Every entry here has a named source. Recurring tithi-based
// observances (Ekadashi, Purnima, Aunsi) are defined as rules; their dates are
// computed via lib/astronomy/panchanga.ts in lib/eventService.ts, never hardcoded.
//
// Source categories:
//   - official: Government of Nepal gazette / Nepal Panchanga Nirnayak Bikash Samiti
//   - astronomical: Computed from Panchanga calculations (tithi, nakshatra, etc.)
//   - international: UN/international observance bodies
//   - editorial: Informational, not verified as official
//
// Never label an unverified event as 'official'.

export type EventCategory =
  | 'religious_festival'
  | 'religious_observance'
  | 'public_holiday'
  | 'national_day'
  | 'cultural_regional'
  | 'international';

export type VerificationStatus =
  | 'official'
  | 'cross_verified'
  | 'unverified'
  | 'astronomical'
  | 'editorial'
  | 'international';

export type Applicability = 'national' | 'regional' | 'province' | 'community' | 'unknown';

export interface FestivalEvent {
  id: string;
  category: EventCategory;
  nameEn: string;
  nameNe: string;
  descriptionEn?: string;
  descriptionNe?: string;
  bsYear: number;
  bsMonth: number; // 1–12
  bsDay: number; // 1–32
  endBsDay?: number; // multi-day festivals
  adDate: string; // YYYY-MM-DD
  endAdDate?: string; // multi-day
  isPublicHoliday: boolean;
  applicability: Applicability;
  provinces?: string[]; // if regional
  source: string;
  sourceUrl?: string;
  sourcePublicationYear?: number;
  verificationStatus: VerificationStatus;
  lastUpdated: string; // ISO date
  isRecurring?: boolean;
  tithiBased?: boolean;
  apiVerified?: boolean; // Preserve API's original verified field (never mapped to verificationStatus)
  uncertainMatch?: boolean; // true when duplicate detection could not confidently rule out a match
}

export interface RecurringObservanceRule {
  id: string;
  category: 'religious_observance';
  nameEn: string;
  nameNe: string;
  descriptionEn: string;
  descriptionNe: string;
  tithiNumber: number; // 1–15 within paksha
  paksha: 'shukla' | 'krishna';
  isPublicHoliday: boolean;
  applicability: Applicability;
  source: string;
  verificationStatus: VerificationStatus;
}

// ============================================================
// RECURRING OBSERVANCE RULES — dates computed via Panchanga
// ============================================================

export const RECURRING_OBSERVANCE_RULES: RecurringObservanceRule[] = [
  {
    id: 'ekadashi-shukla',
    category: 'religious_observance',
    nameEn: 'Ekadashi (Shukla Paksha)',
    nameNe: 'एकादशी (शुक्ल पक्ष)',
    descriptionEn: 'Eleventh lunar day (tithi) of the waxing fortnight, observed as a fasting day.',
    descriptionNe: 'शुक्ल पक्षको ११ौं तिथि, उपवास पर्वको रूपमा मनाइने धार्मिक पर्व।',
    tithiNumber: 11,
    paksha: 'shukla',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'Vedic tithi calendar — computed via Panchanga sunrise rule',
    verificationStatus: 'astronomical',
  },
  {
    id: 'ekadashi-krishna',
    category: 'religious_observance',
    nameEn: 'Ekadashi (Krishna Paksha)',
    nameNe: 'एकादशी (कृष्ण पक्ष)',
    descriptionEn: 'Eleventh lunar day of the waning fortnight.',
    descriptionNe: 'कृष्ण पक्षको ११ौं तिथि।',
    tithiNumber: 11,
    paksha: 'krishna',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'Vedic tithi calendar — computed via Panchanga sunrise rule',
    verificationStatus: 'astronomical',
  },
  {
    id: 'purnima',
    category: 'religious_observance',
    nameEn: 'Purnima',
    nameNe: 'पूर्णिमा',
    descriptionEn: 'Full moon day (tithi 15 of Shukla Paksha).',
    descriptionNe: 'शुक्ल पक्षको १५ौं तिथि, पूर्णिमा।',
    tithiNumber: 15,
    paksha: 'shukla',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'Vedic tithi calendar — computed via Panchanga sunrise rule',
    verificationStatus: 'astronomical',
  },
  {
    id: 'aunsi',
    category: 'religious_observance',
    nameEn: 'Aunsi (Amavasya)',
    nameNe: 'औंसी (अमावस्या)',
    descriptionEn: 'New moon day (final tithi of Krishna Paksha).',
    descriptionNe: 'कृष्ण पक्षको अन्तिम तिथि, औंसी।',
    tithiNumber: 15,
    paksha: 'krishna',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'Vedic tithi calendar — computed via Panchanga sunrise rule',
    verificationStatus: 'astronomical',
  },
];

// ============================================================
// FESTIVAL EVENTS — complement lib/holidays.ts (no duplication)
// ============================================================
//
// Every entry here must NOT already exist in lib/holidays.ts.
// International observance BS dates are computed from AD dates using
// lib/bsConverter.ts adToBs(); the AD date is the authoritative source.

export const FESTIVAL_EVENTS: readonly FestivalEvent[] = [
  // ======== International observances — 2083 BS (not in lib/holidays.ts) ========
  // Source: United Nations observance calendar.
  {
    id: '2083-02-22-intl-env-day',
    category: 'international',
    nameEn: 'World Environment Day',
    nameNe: 'विश्व वातावरण दिवस',
    descriptionEn: 'United Nations observance for environmental awareness and action.',
    descriptionNe: 'वातावरण सचेतनता र कार्यका लागि संयुक्त राष्ट्रसंघद्वारा मनाइने दिवस।',
    bsYear: 2083,
    bsMonth: 2,
    bsDay: 22,
    adDate: '2026-06-05',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — World Environment Day (June 5)',
    sourceUrl: 'https://www.un.org/en/observances/environment-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-03-07-intl-yoga-day',
    category: 'international',
    nameEn: 'International Day of Yoga',
    nameNe: 'अन्तर्राष्ट्रिय योग दिवस',
    descriptionEn: 'United Nations observance celebrating yoga as a holistic practice.',
    descriptionNe: 'योगलाई समग्र अभ्यासको रूपमा मनाइने संयुक्त राष्ट्रसंघको अन्तर्राष्ट्रिय दिवस।',
    bsYear: 2083,
    bsMonth: 3,
    bsDay: 7,
    adDate: '2026-06-21',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — International Day of Yoga (June 21)',
    sourceUrl: 'https://www.un.org/en/observances/yoga-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-03-27-intl-population-day',
    category: 'international',
    nameEn: 'World Population Day',
    nameNe: 'विश्व जनसंख्या दिवस',
    descriptionEn: 'United Nations observance focusing on population issues.',
    descriptionNe: 'जनसंख्या मुद्दामा केन्द्रित संयुक्त राष्ट्रसंघको दिवस।',
    bsYear: 2083,
    bsMonth: 3,
    bsDay: 27,
    adDate: '2026-07-11',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — World Population Day (July 11)',
    sourceUrl: 'https://www.un.org/en/observances/world-population-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-05-23-intl-literacy-day',
    category: 'international',
    nameEn: 'International Literacy Day',
    nameNe: 'अन्तर्राष्ट्रिय साक्षरता दिवस',
    descriptionEn: 'United Nations observance promoting literacy as a human right.',
    descriptionNe: 'साक्षरतालाई मानव अधिकारको रूपमा बढावा दिने संयुक्त राष्ट्रसंघको दिवस।',
    bsYear: 2083,
    bsMonth: 5,
    bsDay: 23,
    adDate: '2026-09-08',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — International Literacy Day (September 8)',
    sourceUrl: 'https://www.un.org/en/observances/literacy-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-06-30-intl-food-day',
    category: 'international',
    nameEn: 'World Food Day',
    nameNe: 'विश्व खाद्य दिवस',
    descriptionEn: 'United Nations observance promoting food security and zero hunger.',
    descriptionNe: 'खाद्य सुरक्षा र शून्य भोकको प्रवर्द्धनका लागि संयुक्त राष्ट्रसंघको दिवस।',
    bsYear: 2083,
    bsMonth: 6,
    bsDay: 30,
    adDate: '2026-10-16',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — World Food Day (October 16)',
    sourceUrl: 'https://www.un.org/en/observances/food-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-08-24-intl-human-rights-day',
    category: 'international',
    nameEn: 'Human Rights Day',
    nameNe: 'मानव अधिकार दिवस',
    descriptionEn: 'United Nations observance commemorating the Universal Declaration of Human Rights.',
    descriptionNe: 'सार्वभौमिक मानव अधिकार घोषणापत्रको स्मृतिमा मनाइने संयुक्त राष्ट्रसंघको दिवस।',
    bsYear: 2083,
    bsMonth: 8,
    bsDay: 24,
    adDate: '2026-12-10',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — Human Rights Day (December 10)',
    sourceUrl: 'https://www.un.org/en/observances/human-rights-day',
    sourcePublicationYear: 2026,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
  {
    id: '2083-12-24-intl-health-day',
    category: 'international',
    nameEn: 'World Health Day',
    nameNe: 'विश्व स्वास्थ्य दिवस',
    descriptionEn: 'United Nations observance marking the founding of WHO and global health awareness.',
    descriptionNe: 'विश्व स्वास्थ्य संगठन (डब्ल्यूएचओ)को स्थापना र वैश्विक स्वास्थ्य सचेतनताका लागि मनाइने दिवस।',
    bsYear: 2083,
    bsMonth: 12,
    bsDay: 24,
    adDate: '2027-04-07',
    isPublicHoliday: false,
    applicability: 'national',
    source: 'United Nations — World Health Day (April 7)',
    sourceUrl: 'https://www.un.org/en/observances/health-day',
    sourcePublicationYear: 2027,
    verificationStatus: 'international',
    lastUpdated: '2026-11-21',
    isRecurring: true,
    tithiBased: false,
  },
];
