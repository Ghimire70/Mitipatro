/**
 * Bikram Sambat (BS) Calendar Lookup Data & Metadata
 *
 * Anchor verification (cross-checked against two independent open-source
 * datasets and official Nepal calendar references):
 *   1 Baisakh 2000 BS === 14 April 1943 AD (Wednesday)
 *   - Source A: nepali-date-converter (v3.4.2) date-config & epoch
 *   - Source B: bikram-sambat (v1.8.1) & @sbmdkl/nepali-date-converter (v2.0.5)
 *   - Cross-check: 2083-01-01 BS === 2026-04-14 AD, 2083-07-28 BS === 2026-11-14 AD
 *
 * Coverage & accuracy policy:
 *   - Years 2000–2090 BS are 100% consistent across all three open-source
 *     references, with every year summing to 365 or 366 days.
 *   - Years 2091–2100 BS are intentionally excluded from the authoritative map
 *     because official Nepal Panchanga Nirnayak Samiti solar-month lengths are
 *     published closer to each year (and provisional tables show a 364-day
 *     anomaly in 2096 BS). Add rows here once officially gazetted.
 */

export const BS_ANCHOR = {
  bsYear: 2000,
  bsMonth: 1, // 1 = Baisakh
  bsDay: 1,
  adYear: 1943,
  adMonth: 4, // 4 = April
  adDay: 14,
} as const;

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

/**
 * Browsable BS years on the site (2082–2085 BS).
 * - INDEXABLE_BS_YEARS (2082–2083 BS): Complete verified calendars & official
 *   holiday schedules -> indexed & included in sitemap.xml.
 * - Future years (2084–2085 BS): Lunar holidays pending official Nepal Gazette
 *   notice -> browsable with <meta name="robots" content="noindex, follow">
 *   and excluded from sitemap.xml until complete.
 */
export const INDEXABLE_BS_YEARS = [2082, 2083] as const;
export const PUBLISHED_BS_YEARS = [2082, 2083, 2084, 2085] as const;
export const CURRENT_BS_YEAR = 2083;

export type BsMonthLengths = readonly [
  number, number, number, number, number, number,
  number, number, number, number, number, number
];

/**
 * Map of Bikram Sambat year (2000–2090) to 12 month lengths:
 * [Baisakh, Jestha, Ashad, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
 */
export const BS_MONTH_DAYS: Record<number, BsMonthLengths> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

export interface BsMonthMeta {
  index: number; // 1–12
  slug: string;
  en: string;
  ne: string;
  seasonEn: string;
  seasonNe: string;
}

export const BS_MONTHS: readonly BsMonthMeta[] = [
  { index: 1, slug: 'baisakh', en: 'Baisakh', ne: 'वैशाख', seasonEn: 'Basanta (Spring)', seasonNe: 'वसन्त ऋतु' },
  { index: 2, slug: 'jestha', en: 'Jestha', ne: 'जेठ', seasonEn: 'Grishma (Early Summer)', seasonNe: 'ग्रीष्म ऋतु' },
  { index: 3, slug: 'ashad', en: 'Ashad', ne: 'असार', seasonEn: 'Grishma (Monsoon Onset)', seasonNe: 'ग्रीष्म ऋतु' },
  { index: 4, slug: 'shrawan', en: 'Shrawan', ne: 'साउन', seasonEn: 'Barsha (Monsoon)', seasonNe: 'वर्षा ऋतु' },
  { index: 5, slug: 'bhadra', en: 'Bhadra', ne: 'भदौ', seasonEn: 'Barsha (Late Monsoon)', seasonNe: 'वर्षा ऋतु' },
  { index: 6, slug: 'ashwin', en: 'Ashwin', ne: 'असोज', seasonEn: 'Sharad (Autumn)', seasonNe: 'शरद ऋतु' },
  { index: 7, slug: 'kartik', en: 'Kartik', ne: 'कार्तिक', seasonEn: 'Sharad (Festive Autumn)', seasonNe: 'शरद ऋतु' },
  { index: 8, slug: 'mangsir', en: 'Mangsir', ne: 'मंसिर', seasonEn: 'Hemanta (Pre-Winter)', seasonNe: 'हेमन्त ऋतु' },
  { index: 9, slug: 'poush', en: 'Poush', ne: 'पुस', seasonEn: 'Hemanta (Winter)', seasonNe: 'हेमन्त ऋतु' },
  { index: 10, slug: 'magh', en: 'Magh', ne: 'माघ', seasonEn: 'Shishir (Deep Winter)', seasonNe: 'शिशिर ऋतु' },
  { index: 11, slug: 'falgun', en: 'Falgun', ne: 'फागुन', seasonEn: 'Shishir (Late Winter)', seasonNe: 'शिशिर ऋतु' },
  { index: 12, slug: 'chaitra', en: 'Chaitra', ne: 'चैत', seasonEn: 'Basanta (Spring)', seasonNe: 'वसन्त ऋतु' },
] as const;

export interface WeekdayMeta {
  index: number; // 0 = Sunday .. 6 = Saturday
  en: string;
  shortEn: string;
  ne: string;
  shortNe: string;
  isHoliday: boolean;
}

export const WEEKDAYS: readonly WeekdayMeta[] = [
  { index: 0, en: 'Sunday', shortEn: 'Sun', ne: 'आइतबार', shortNe: 'आइत', isHoliday: false },
  { index: 1, en: 'Monday', shortEn: 'Mon', ne: 'सोमबार', shortNe: 'सोम', isHoliday: false },
  { index: 2, en: 'Tuesday', shortEn: 'Tue', ne: 'मंगलबार', shortNe: 'मंगल', isHoliday: false },
  { index: 3, en: 'Wednesday', shortEn: 'Wed', ne: 'बुधबार', shortNe: 'बुध', isHoliday: false },
  { index: 4, en: 'Thursday', shortEn: 'Thu', ne: 'बिहिबार', shortNe: 'बिहि', isHoliday: false },
  { index: 5, en: 'Friday', shortEn: 'Fri', ne: 'शुक्रबार', shortNe: 'शुक्र', isHoliday: false },
  { index: 6, en: 'Saturday', shortEn: 'Sat', ne: 'शनिबार', shortNe: 'शनि', isHoliday: true },
] as const;

export const AD_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const AD_MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
