// lib/trisambat-adapter.ts
//
// Maps Trisambat API holiday events to MitiPatro FestivalEvent shape.
//
// Verification status mapping (STRICT RULES — per mandatory corrections):
//   - API verified: true  → apiVerified: true, verificationStatus: 'unverified'
//     (API data remains unverified until independently confirmed;
//      'cross_verified' only after multiple independent sources;
//      'official' only after Gazette confirmation)
//   - API verified: false → apiVerified: false, verificationStatus: 'unverified'
//
// Applicability mapping (STRICT RULES):
//   - API holiday: null → applicability: 'unknown' (never assume 'national')
//   - API holiday: 'regional' → applicability: 'regional', provinces: undefined
//     (never invent province information)
//   - API holiday: 'national' → applicability: 'national', isPublicHoliday: true
//
// Duplicate detection:
//   - Normalize names before comparison (lowercase, trim, remove punctuation)
//   - Compare BS dates + normalized names
//   - Support explicit aliases for known naming variations
//   - Flag uncertain matches with uncertainMatch: true
//   - Never silently create duplicate events

import type { FestivalEvent } from './events';
import type { TrisambatHolidayEvent, TrisambatHolidayResponse } from './trisambat-cache';

export type TrisambatSourceMeta = {
  bsYear: number;
  retrievedAt: string;
  sourceUrl: string;
  etag?: string;
  provisional?: boolean;
};

// Known naming variations between Trisambat API and MitiPatro holidays.ts.
// Used for duplicate detection — if a Trisambat event name matches a holiday.ts
// name via aliases, it is treated as a potential duplicate and flagged for review.
const NAME_ALIASES: Record<string, string[]> = {
  'krishna-janmashtami': ['janmashtami', 'krishna janmashtami', 'श्रीकृष्ण जन्माष्टमी'],
  'janai-purnima': ['janai purnima', 'raksha bandhan', 'रक्षाबन्धन', 'जनै पूर्णिमा'],
  'bhai-tika': ['bhai tika', 'भाइटीका'],
  'chhath': ['chhath parba', 'छठ पर्व'],
  'maghe-sankranti': ['maghe sankranti', 'माघे संक्रान्ति', 'maghi parva'],
  'vijaya-dashami': ['vijaya dashami', 'दशैं टीका', 'dashain tika'],
  'ghatasthapana': ['ghatasthapana', 'घटस्थापना'],
  'maha-shivaratri': ['maha shivaratri', 'महाशिवरात्रि'],
  'fagu-purnima': ['fagu purnima', 'holi', 'फागु पूर्णिमा'],
  'tamu-lhosar': ['tamu lhosar', 'तमु ल्होसार'],
  'sonam-lhosar': ['sonam lhosar', 'सोनाम ल्होसार'],
  'gyalpo-lhosar': ['gyalpo lhosar', 'ग्याल्पो ल्होसार'],
  'india-jatra': ['indra jatra', 'इन्द्रजात्रा'],
  'prithvi-jayanti': ['prithvi jayanti', 'पृथ्वी जयन्ती'],
  'loktantra-diwas': ['loktantra diwas', 'लोकतन्त्र दिवस'],
  'republic-day': ['republic day', 'गणतन्त्र दिवस'],
  'constitution-day': ['constitution day', 'संविधान दिवस'],
  'democracy-day': ['democracy day', 'प्रजातन्त्र दिवस'],
  'martyrs-day': ['martyrs day', 'शहीद दिवस'],
  'new-year': ['nepali new year', 'नयाँ वर्ष'],
  'womens-day': ["women's day", 'अन्तर्राष्ट्रिय महिला दिवस'],
  'labour-day': ['labour day', 'international workers day', 'अन्तर्राष्ट्रिय श्रमिक दिवस'],
};

/** Normalize an event name for duplicate comparison. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\b(the|of|and|r)\b/g, '') // remove common stop words
    .trim();
}

/** Get all alias forms for a Trisambat event id. */
function getAliasForms(apiId: string, nameEn: string): string[] {
  const aliases = NAME_ALIASES[apiId] ?? [];
  return [apiId, nameEn, ...aliases].map((a) => normalizeName(a));
}

/** Check if two names could refer to the same event (via aliases or normalization). */
function namesMayMatch(
  nameA: string,
  nameB: string,
  aliasesA: string[],
  aliasesB: string[],
): boolean {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);
  if (normA === normB) return true;
  // Check alias cross-matching
  for (const a of aliasesA) {
    for (const b of aliasesB) {
      if (a === b) return true;
    }
  }
  return false;
}

/** Map Trisambat category to MitiPatro event category. */
function mapCategory(apiCategory: string): FestivalEvent['category'] {
  switch (apiCategory) {
    case 'national':
      return 'national_day';
    case 'festival':
      return 'religious_festival';
    case 'jayanti':
      return 'national_day';
    case 'international':
      return 'international';
    default:
      return 'cultural_regional';
  }
}

/** Map Trisambat holiday flag to MitiPatro public holiday + applicability. */
function mapHoliday(
  apiHoliday: string | null,
): {
  isPublicHoliday: boolean;
  applicability: FestivalEvent['applicability'];
} {
  switch (apiHoliday) {
    case 'national':
      return { isPublicHoliday: true, applicability: 'national' };
    case 'regional':
      return { isPublicHoliday: true, applicability: 'regional' };
    case 'women':
      return { isPublicHoliday: false, applicability: 'community' };
    case 'community':
      return { isPublicHoliday: false, applicability: 'community' };
    case null:
    default:
      // Do not assume national applicability when the API field is null.
      // Preserve unknown/general applicability; never invent provinces.
      return { isPublicHoliday: false, applicability: 'unknown' };
  }
}

/** Verification status — API data is always 'unverified' until independently confirmed. */
export function mapVerificationStatus(): FestivalEvent['verificationStatus'] {
  return 'unverified';
}

/**
 * Convert a Trisambat API holiday response into FestivalEvent entries.
 *
 * @param response  Raw API response for a BS year
 * @param meta      Source metadata (retrievedAt, sourceUrl, etag, provisional)
 * @param holidayNames  Map of dedup key → nameEn from lib/holidays.ts, for duplicate detection
 * @returns FestivalEvent[] that complement (never duplicate) holidays.ts
 */
export function adaptTrisambatHolidays(
  response: TrisambatHolidayResponse,
  meta: TrisambatSourceMeta,
  holidayNames: Map<string, string>,
): FestivalEvent[] {
  const events: FestivalEvent[] = [];
  const isProvisional = meta.provisional ?? false;

  for (const e of response.events) {
    const normName = normalizeName(e.name.en);
    const aliases = getAliasForms(e.id, e.name.en);

    // Duplicate detection: check against holidays.ts names
    let matchedHolidayName: string | undefined;
    let uncertain = false;

    for (const [dedupKey, holidayName] of holidayNames) {
      const [keyYear, keyMonth, keyDay] = dedupKey.split('-').map(Number);
      if (
        keyYear === response.bsYear &&
        keyMonth === e.bs.month &&
        keyDay === e.bs.day
      ) {
        const holidayAliases = getAliasForms('', holidayName);
        if (namesMayMatch(e.name.en, holidayName, aliases, holidayAliases)) {
          matchedHolidayName = holidayName;
          // If names differ after normalization, flag as uncertain match
          if (normalizeName(holidayName) !== normName) {
            uncertain = true;
          }
          break;
        }
      }
    }

    // Skip events that confidently duplicate holidays.ts entries
    if (matchedHolidayName && !uncertain) continue;

    const { isPublicHoliday, applicability } = mapHoliday(e.holiday);

    // For provisional years (2084+), mark as unverified regardless of API verified flag
    const verificationStatus = isProvisional ? 'unverified' : 'unverified';

    events.push({
      id: `trisambat-${e.id}`,
      category: mapCategory(e.category),
      nameEn: e.name.en,
      nameNe: e.name.ne,
      descriptionEn: undefined,
      descriptionNe: undefined,
      bsYear: response.bsYear,
      bsMonth: e.bs.month,
      bsDay: e.bs.day,
      adDate: e.ad,
      isPublicHoliday,
      applicability,
      provinces: undefined, // Never invent province information
      source: 'Trisambat API v1',
      sourceUrl: meta.sourceUrl,
      sourcePublicationYear: response.bsYear,
      verificationStatus,
      lastUpdated: meta.retrievedAt,
      isRecurring: false,
      tithiBased: false,
      apiVerified: e.verified,
      uncertainMatch: uncertain,
    });
  }

  return events;
}

/**
 * Build a map of dedup key → nameEn from lib/holidays.ts entries for a given year.
 * Used by the caller to detect Trisambat events that duplicate holidays.ts.
 */
export function buildHolidayNameMap(
  holidays: readonly { bsYear: number; bsMonth: number; bsDay: number; nameEn: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of holidays) {
    const key = `${h.bsYear}-${h.bsMonth}-${h.bsDay}-${normalizeName(h.nameEn)}`;
    map.set(key, h.nameEn);
  }
  return map;
}
