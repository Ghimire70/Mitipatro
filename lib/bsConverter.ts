import {
  AD_MONTHS_LONG,
  AD_MONTHS_SHORT,
  BS_ANCHOR,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTHS,
  BS_MONTH_DAYS,
  WEEKDAYS,
  type BsMonthMeta,
  type WeekdayMeta,
} from './bsData';

const MS_PER_DAY = 86_400_000;
export const NEPAL_TIME_ZONE = 'Asia/Kathmandu';

const ANCHOR_AD_UTC_DAYS = Math.floor(
  Date.UTC(BS_ANCHOR.adYear, BS_ANCHOR.adMonth - 1, BS_ANCHOR.adDay) / MS_PER_DAY,
);

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

export interface BsDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–32
  monthNameEn: string;
  monthNameNe: string;
  monthSlug: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  weekdayEn: string;
  weekdayNe: string;
  formattedEn: string;
  formattedNe: string;
  iso: string; // YYYY-MM-DD (BS)
}

export interface AdDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  monthNameEn: string;
  monthShortEn: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  weekdayEn: string;
  weekdayNe: string;
  formattedEn: string;
  iso: string; // YYYY-MM-DD (AD)
}

export interface ValidationResult {
  valid: boolean;
  code?:
    | 'INVALID_TYPE'
    | 'YEAR_OUT_OF_RANGE'
    | 'INVALID_MONTH'
    | 'INVALID_DAY'
    | 'AD_OUT_OF_RANGE';
  error?: string;
}

export class BsDateError extends Error {
  readonly code: NonNullable<ValidationResult['code']>;

  constructor(code: NonNullable<ValidationResult['code']>, message: string) {
    super(message);
    this.name = 'BsDateError';
    this.code = code;
  }
}

export function toDevanagariDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInAdMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }
  const days = [31, isGregorianLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1];
}

export function getDaysInBsMonth(bsYear: number, bsMonth: number): number {
  const row = BS_MONTH_DAYS[bsYear];
  if (!row) {
    throw new BsDateError(
      'YEAR_OUT_OF_RANGE',
      `BS year ${bsYear} is outside the verified range (${BS_MIN_YEAR}–${BS_MAX_YEAR} BS).`,
    );
  }
  if (!Number.isInteger(bsMonth) || bsMonth < 1 || bsMonth > 12) {
    throw new BsDateError('INVALID_MONTH', `BS month must be between 1 and 12 (received ${bsMonth}).`);
  }
  return row[bsMonth - 1];
}

export function getTotalDaysInBsYear(bsYear: number): number {
  const row = BS_MONTH_DAYS[bsYear];
  if (!row) {
    throw new BsDateError(
      'YEAR_OUT_OF_RANGE',
      `BS year ${bsYear} is outside the verified range (${BS_MIN_YEAR}–${BS_MAX_YEAR} BS).`,
    );
  }
  return row.reduce((acc, d) => acc + d, 0);
}

/**
 * Validates a Bikram Sambat (BS) year, month (1-12), and day (1-32).
 */
export function validateBsDate(year: number, month: number, day: number): ValidationResult {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      error: 'Year, month, and day must be whole integers.',
    };
  }
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR || !BS_MONTH_DAYS[year]) {
    return {
      valid: false,
      code: 'YEAR_OUT_OF_RANGE',
      error: `BS year ${year} is out of range. Supported years: ${BS_MIN_YEAR}–${BS_MAX_YEAR} BS.`,
    };
  }
  if (month < 1 || month > 12) {
    return {
      valid: false,
      code: 'INVALID_MONTH',
      error: `Invalid BS month ${month}. Month must be between 1 (Baisakh) and 12 (Chaitra).`,
    };
  }
  const maxDays = BS_MONTH_DAYS[year][month - 1];
  if (day < 1 || day > maxDays) {
    const monthMeta = BS_MONTHS[month - 1];
    return {
      valid: false,
      code: 'INVALID_DAY',
      error: `${monthMeta.en} ${year} BS only has ${maxDays} days (received day ${day}).`,
    };
  }
  return { valid: true };
}

/**
 * Supported AD range matching 2000-01-01 BS to 2090-12-30 BS:
 *   Min AD: 1943-04-14
 *   Max AD: computed lazily from BS_MAX_YEAR
 */
function getMaxSupportedAdUtcDays(): number {
  let totalDays = 0;
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) {
    totalDays += getTotalDaysInBsYear(y);
  }
  return ANCHOR_AD_UTC_DAYS + totalDays - 1;
}

const MAX_AD_UTC_DAYS = getMaxSupportedAdUtcDays();

export function validateAdDate(year: number, month: number, day: number): ValidationResult {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      error: 'Gregorian year, month, and day must be whole integers.',
    };
  }
  if (month < 1 || month > 12) {
    return {
      valid: false,
      code: 'INVALID_MONTH',
      error: `Invalid Gregorian month ${month}. Must be between 1 and 12.`,
    };
  }
  const maxDays = getDaysInAdMonth(year, month);
  if (day < 1 || day > maxDays) {
    return {
      valid: false,
      code: 'INVALID_DAY',
      error: `${AD_MONTHS_LONG[month - 1]} ${year} only has ${maxDays} days (received day ${day}).`,
    };
  }
  const utcDays = Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
  if (utcDays < ANCHOR_AD_UTC_DAYS || utcDays > MAX_AD_UTC_DAYS) {
    const maxAdDate = new Date(MAX_AD_UTC_DAYS * MS_PER_DAY);
    const maxIso = `${maxAdDate.getUTCFullYear()}-${pad2(maxAdDate.getUTCMonth() + 1)}-${pad2(maxAdDate.getUTCDate())}`;
    return {
      valid: false,
      code: 'AD_OUT_OF_RANGE',
      error: `Gregorian date ${year}-${pad2(month)}-${pad2(day)} is outside the supported span (1943-04-14 to ${maxIso}).`,
    };
  }
  return { valid: true };
}

function buildBsDate(year: number, month: number, day: number, weekday: number): BsDate {
  const monthMeta = BS_MONTHS[month - 1];
  const weekdayMeta = WEEKDAYS[weekday];
  return {
    year,
    month,
    day,
    monthNameEn: monthMeta.en,
    monthNameNe: monthMeta.ne,
    monthSlug: monthMeta.slug,
    weekday,
    weekdayEn: weekdayMeta.en,
    weekdayNe: weekdayMeta.ne,
    formattedEn: `${monthMeta.en} ${day}, ${year} BS`,
    formattedNe: `${monthMeta.ne} ${toDevanagariDigits(day)}, ${toDevanagariDigits(year)}`,
    iso: `${year}-${pad2(month)}-${pad2(day)}`,
  };
}

function buildAdDate(year: number, month: number, day: number, weekday: number): AdDate {
  const monthNameEn = AD_MONTHS_LONG[month - 1];
  const monthShortEn = AD_MONTHS_SHORT[month - 1];
  const weekdayMeta = WEEKDAYS[weekday];
  return {
    year,
    month,
    day,
    monthNameEn,
    monthShortEn,
    weekday,
    weekdayEn: weekdayMeta.en,
    weekdayNe: weekdayMeta.ne,
    formattedEn: `${monthNameEn} ${day}, ${year}`,
    iso: `${year}-${pad2(month)}-${pad2(day)}`,
  };
}

/**
 * Extracts calendar year, month (1-12), day (1-31), and weekday (0-6)
 * of a JS Date instant in Asia/Kathmandu (UTC+05:45).
 */
export function getNepalDateParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  timeStr: string;
} {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new BsDateError('INVALID_TYPE', 'Invalid JavaScript Date object.');
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = map.hour === '24' ? '00' : map.hour;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return {
    year,
    month,
    day,
    weekday,
    timeStr: `${hour}:${map.minute}:${map.second}`,
  };
}

/**
 * Parses an AD input (Date in Nepal time, ISO string 'YYYY-MM-DD', or { year, month, day })
 * into Gregorian calendar components.
 */
function normalizeAdInput(
  input: Date | string | { year: number; month: number; day: number },
  options?: { timeZone?: 'Asia/Kathmandu' | 'UTC' },
): { year: number; month: number; day: number } {
  if (typeof input === 'string') {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input.trim());
    if (!match) {
      throw new BsDateError(
        'INVALID_TYPE',
        `Invalid AD date string "${input}". Expected YYYY-MM-DD format.`,
      );
    }
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new BsDateError('INVALID_TYPE', 'Invalid JavaScript Date instance.');
    }
    if (options?.timeZone === 'UTC') {
      return {
        year: input.getUTCFullYear(),
        month: input.getUTCMonth() + 1,
        day: input.getUTCDate(),
      };
    }
    const nepal = getNepalDateParts(input);
    return { year: nepal.year, month: nepal.month, day: nepal.day };
  }
  if (input && typeof input === 'object') {
    return { year: input.year, month: input.month, day: input.day };
  }
  throw new BsDateError('INVALID_TYPE', 'Unsupported AD date input.');
}

/**
 * Converts a Gregorian (AD) date to Bikram Sambat (BS) by counting exact UTC days
 * from the verified 1 Baisakh 2000 BS === 14 April 1943 AD anchor.
 */
export function adToBs(
  input: Date | string | { year: number; month: number; day: number },
  options?: { timeZone?: 'Asia/Kathmandu' | 'UTC' },
): BsDate {
  const { year, month, day } = normalizeAdInput(input, options);
  const check = validateAdDate(year, month, day);
  if (!check.valid) {
    throw new BsDateError(check.code!, check.error!);
  }

  const targetUtcDays = Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
  let remainingDays = targetUtcDays - ANCHOR_AD_UTC_DAYS;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  let bsYear = BS_MIN_YEAR;
  while (bsYear <= BS_MAX_YEAR) {
    const yearDays = getTotalDaysInBsYear(bsYear);
    if (remainingDays < yearDays) {
      break;
    }
    remainingDays -= yearDays;
    bsYear++;
  }

  const monthLengths = BS_MONTH_DAYS[bsYear];
  let bsMonth = 1;
  for (let i = 0; i < 12; i++) {
    const mDays = monthLengths[i];
    if (remainingDays < mDays) {
      bsMonth = i + 1;
      break;
    }
    remainingDays -= mDays;
  }

  const bsDay = remainingDays + 1;
  return buildBsDate(bsYear, bsMonth, bsDay, weekday);
}

/**
 * Converts a Bikram Sambat (BS) date (year, month 1–12, day 1–32) to Gregorian (AD).
 */
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): AdDate {
  const check = validateBsDate(bsYear, bsMonth, bsDay);
  if (!check.valid) {
    throw new BsDateError(check.code!, check.error!);
  }

  let offsetDays = 0;
  for (let y = BS_MIN_YEAR; y < bsYear; y++) {
    offsetDays += getTotalDaysInBsYear(y);
  }
  const monthLengths = BS_MONTH_DAYS[bsYear];
  for (let m = 0; m < bsMonth - 1; m++) {
    offsetDays += monthLengths[m];
  }
  offsetDays += bsDay - 1;

  const adDate = new Date((ANCHOR_AD_UTC_DAYS + offsetDays) * MS_PER_DAY);
  return buildAdDate(
    adDate.getUTCFullYear(),
    adDate.getUTCMonth() + 1,
    adDate.getUTCDate(),
    adDate.getUTCDay(),
  );
}

export interface TodayNepalInfo {
  bs: BsDate;
  ad: AdDate;
  weekday: WeekdayMeta;
  nepalTime: string;
  timeZone: string;
}

/**
 * Computes "today" strictly in Asia/Kathmandu (UTC+05:45),
 * never in the server's or browser's local timezone.
 */
export function getTodayNepal(now: Date = new Date()): TodayNepalInfo {
  const nepal = getNepalDateParts(now);
  const bs = adToBs({ year: nepal.year, month: nepal.month, day: nepal.day });
  const ad = buildAdDate(nepal.year, nepal.month, nepal.day, nepal.weekday);
  return {
    bs,
    ad,
    weekday: WEEKDAYS[nepal.weekday],
    nepalTime: nepal.timeStr,
    timeZone: NEPAL_TIME_ZONE,
  };
}

export function getBsMonthBySlug(slug: string): BsMonthMeta | undefined {
  const normalized = slug.trim().toLowerCase();
  return BS_MONTHS.find((m) => m.slug === normalized);
}

export interface CalendarCellData {
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  bsDayNe: string;
  adYear: number;
  adMonth: number;
  adDay: number;
  adMonthShort: string;
  adIso: string;
  bsIso: string;
  weekday: number; // 0..6
  isSaturday: boolean;
}

export interface BsMonthGridData {
  bsYear: number;
  bsMonth: number;
  monthMeta: BsMonthMeta;
  totalDays: number;
  startWeekday: number; // 0 = Sun .. 6 = Sat
  adSpanLabel: string;
  adStartIso: string;
  adEndIso: string;
  days: CalendarCellData[];
  prevMonth: { year: number; month: number; slug: string; nameEn: string } | null;
  nextMonth: { year: number; month: number; slug: string; nameEn: string } | null;
}

/**
 * Builds the complete day-by-day grid for a BS year and month,
 * including AD equivalents, leading weekday offset, and prev/next navigation links.
 */
export function getBsMonthGrid(bsYear: number, bsMonth: number): BsMonthGridData {
  const totalDays = getDaysInBsMonth(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const lastAd = bsToAd(bsYear, bsMonth, totalDays);
  const monthMeta = BS_MONTHS[bsMonth - 1];

  const firstUtcDay = Math.floor(
    Date.UTC(firstAd.year, firstAd.month - 1, firstAd.day) / MS_PER_DAY,
  );

  const days: CalendarCellData[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const adObj = new Date((firstUtcDay + d - 1) * MS_PER_DAY);
    const adYear = adObj.getUTCFullYear();
    const adMonth = adObj.getUTCMonth() + 1;
    const adDay = adObj.getUTCDate();
    const weekday = adObj.getUTCDay();
    days.push({
      bsYear,
      bsMonth,
      bsDay: d,
      bsDayNe: toDevanagariDigits(d),
      adYear,
      adMonth,
      adDay,
      adMonthShort: AD_MONTHS_SHORT[adMonth - 1],
      adIso: `${adYear}-${pad2(adMonth)}-${pad2(adDay)}`,
      bsIso: `${bsYear}-${pad2(bsMonth)}-${pad2(d)}`,
      weekday,
      isSaturday: weekday === 6,
    });
  }

  const adSpanLabel =
    firstAd.year === lastAd.year
      ? firstAd.month === lastAd.month
        ? `${firstAd.monthShortEn} ${firstAd.year}`
        : `${firstAd.monthShortEn} – ${lastAd.monthShortEn} ${firstAd.year}`
      : `${firstAd.monthShortEn} ${firstAd.year} – ${lastAd.monthShortEn} ${lastAd.year}`;

  let prevMonth: BsMonthGridData['prevMonth'] = null;
  if (bsMonth > 1) {
    const pm = BS_MONTHS[bsMonth - 2];
    prevMonth = { year: bsYear, month: pm.index, slug: pm.slug, nameEn: pm.en };
  } else if (BS_MONTH_DAYS[bsYear - 1]) {
    const pm = BS_MONTHS[11];
    prevMonth = { year: bsYear - 1, month: pm.index, slug: pm.slug, nameEn: pm.en };
  }

  let nextMonth: BsMonthGridData['nextMonth'] = null;
  if (bsMonth < 12) {
    const nm = BS_MONTHS[bsMonth];
    nextMonth = { year: bsYear, month: nm.index, slug: nm.slug, nameEn: nm.en };
  } else if (BS_MONTH_DAYS[bsYear + 1]) {
    const nm = BS_MONTHS[0];
    nextMonth = { year: bsYear + 1, month: nm.index, slug: nm.slug, nameEn: nm.en };
  }

  return {
    bsYear,
    bsMonth,
    monthMeta,
    totalDays,
    startWeekday: firstAd.weekday,
    adSpanLabel,
    adStartIso: firstAd.iso,
    adEndIso: lastAd.iso,
    days,
    prevMonth,
    nextMonth,
  };
}
