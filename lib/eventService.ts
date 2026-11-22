// lib/eventService.ts
//
// Phase 3 — Festival & Events Calendar service layer.
//
// Merges lib/holidays.ts (official records) with lib/events.ts (complementary
// events) and computes recurring tithi-based observances (Ekadashi, Purnima,
// Aunsi) via lib/astronomy/panchanga.ts. Never duplicates an entry that already
// exists in lib/holidays.ts.
//
// Trisambat API events are added only when present in the file-based cache
// (cache/trisambat/), populated by the dedicated refresh script. Never fetches
// from Trisambat during normal website visits.

import {
  getHolidaysForMonth,
  getHolidaysForYear,
  getHolidaysForDate,
  type HolidayRecord,
} from './holidays';
import {
  FESTIVAL_EVENTS,
  type FestivalEvent,
  RECURRING_OBSERVANCE_RULES,
  type RecurringObservanceRule,
} from './events';
import { getDailyPanchanga } from './astronomy/panchanga.js';
import { adToBs, bsToAd } from './bsConverter';
import { BS_MONTH_DAYS } from './bsData';
import { getTrisambatCacheEntry } from './trisambat-cache';
import {
  adaptTrisambatHolidays,
  buildHolidayNameMap,
} from './trisambat-adapter';

export interface EventEntry {
  id: string;
  category: string;
  nameEn: string;
  nameNe: string;
  descriptionEn?: string;
  descriptionNe?: string;
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  endBsDay?: number;
  adDate: string;
  endAdDate?: string;
  isPublicHoliday: boolean;
  applicability: string;
  provinces?: string[];
  source: string;
  sourceUrl?: string;
  verificationStatus: string;
  lastUpdated: string;
  sourceType: 'holiday' | 'festival' | 'recurring' | 'trisambat';
  apiVerified?: boolean;
  uncertainMatch?: boolean;
}

function holidayToEntry(h: HolidayRecord): EventEntry {
  // Map holiday types to event categories
  const categoryMap: Record<string, string> = {
    national: 'national_day',
    cultural: 'cultural_regional',
    civic: 'national_day',
    regional: 'cultural_regional',
    women: 'cultural_regional',
    women_only: 'cultural_regional',
  };
  return {
    id: h.id,
    category: categoryMap[h.type] || 'cultural_regional',
    nameEn: h.nameEn,
    nameNe: h.nameNe,
    descriptionEn: h.noteEn,
    descriptionNe: undefined,
    bsYear: h.bsYear,
    bsMonth: h.bsMonth,
    bsDay: h.bsDay,
    adDate: h.adDate,
    isPublicHoliday: h.isPublicHoliday,
    applicability: 'national',
    provinces: undefined,
    source: h.source || 'MitiPatro editorial',
    sourceUrl: undefined,
    verificationStatus: h.source ? 'official' : 'editorial',
    lastUpdated: '2026-11-21',
    sourceType: 'holiday',
  };
}

function festivalToEntry(f: FestivalEvent): EventEntry {
  return {
    id: f.id,
    category: f.category,
    nameEn: f.nameEn,
    nameNe: f.nameNe,
    descriptionEn: f.descriptionEn,
    descriptionNe: f.descriptionNe,
    bsYear: f.bsYear,
    bsMonth: f.bsMonth,
    bsDay: f.bsDay,
    endBsDay: f.endBsDay,
    adDate: f.adDate,
    endAdDate: f.endAdDate,
    isPublicHoliday: f.isPublicHoliday,
    applicability: f.applicability,
    provinces: f.provinces,
    source: f.source,
    sourceUrl: f.sourceUrl,
    verificationStatus: f.verificationStatus,
    lastUpdated: f.lastUpdated,
    sourceType: 'festival',
    apiVerified: f.apiVerified,
    uncertainMatch: f.uncertainMatch,
  };
}

function recurringToEntry(
  rule: RecurringObservanceRule,
  bsYear: number,
  bsMonth: number,
  bsDay: number,
  adDate: string,
): EventEntry {
  return {
    id: `${rule.id}-${bsYear}-${bsMonth}-${bsDay}`,
    category: rule.category,
    nameEn: rule.nameEn,
    nameNe: rule.nameNe,
    descriptionEn: rule.descriptionEn,
    descriptionNe: rule.descriptionNe,
    bsYear,
    bsMonth,
    bsDay,
    adDate,
    isPublicHoliday: rule.isPublicHoliday,
    applicability: rule.applicability,
    provinces: undefined,
    source: rule.source,
    sourceUrl: undefined,
    verificationStatus: rule.verificationStatus,
    lastUpdated: '2026-11-21',
    sourceType: 'recurring',
  };
}

function trisambatToEntry(f: FestivalEvent): EventEntry {
  return {
    id: f.id,
    category: f.category,
    nameEn: f.nameEn,
    nameNe: f.nameNe,
    descriptionEn: f.descriptionEn,
    descriptionNe: f.descriptionNe,
    bsYear: f.bsYear,
    bsMonth: f.bsMonth,
    bsDay: f.bsDay,
    endBsDay: f.endBsDay,
    adDate: f.adDate,
    endAdDate: f.endAdDate,
    isPublicHoliday: f.isPublicHoliday,
    applicability: f.applicability,
    provinces: f.provinces,
    source: f.source,
    sourceUrl: f.sourceUrl,
    verificationStatus: f.verificationStatus,
    lastUpdated: f.lastUpdated,
    sourceType: 'trisambat',
    apiVerified: f.apiVerified,
    uncertainMatch: f.uncertainMatch,
  };
}

/** Build a dedup key from bs date + normalized name. */
function dedupKey(bsYear: number, bsMonth: number, bsDay: number, nameEn: string): string {
  const norm = nameEn
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${bsYear}-${bsMonth}-${bsDay}-${norm}`;
}

/** Compute recurring tithi-based observances (Ekadashi, Purnima, Aunsi) for a BS month. */
function computeRecurringObservancesForMonth(
  bsYear: number,
  bsMonth: number,
): EventEntry[] {
  const entries: EventEntry[] = [];
  const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);

  for (let bsDay = 1; bsDay <= daysInMonth; bsDay++) {
    const ad = bsToAd(bsYear, bsMonth, bsDay);
    const instant = new Date(Date.UTC(ad.year, ad.month - 1, ad.day, 12, 0, 0, 0));
    let panch;
    try {
      panch = getDailyPanchanga(instant);
    } catch {
      continue;
    }

    const { tithiNumber, paksha } = panch.tithi;

    for (const rule of RECURRING_OBSERVANCE_RULES) {
      if (tithiNumber === rule.tithiNumber && paksha === rule.paksha) {
        entries.push(recurringToEntry(rule, bsYear, bsMonth, bsDay, ad.iso));
      }
    }
  }

  return entries;
}

/** All holidays for a month, keyed by dedup key. */
function holidayEntriesByKey(bsYear: number, bsMonth: number): Map<string, EventEntry> {
  const map = new Map<string, EventEntry>();
  for (const h of getHolidaysForMonth(bsYear, bsMonth)) {
    const entry = holidayToEntry(h);
    map.set(dedupKey(h.bsYear, h.bsMonth, h.bsDay, h.nameEn), entry);
  }
  return map;
}

/** Build a map of dedup key → nameEn from holidays.ts for duplicate detection. */
function holidayNameMap(bsYear: number): Map<string, string> {
  const holidays = getHolidaysForYear(bsYear);
  const map = new Map<string, string>();
  for (const h of holidays) {
    const key = `${h.bsYear}-${h.bsMonth}-${h.bsDay}-${normalizeName(h.nameEn)}`;
    map.set(key, h.nameEn);
  }
  return map;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** All festival events for a month, keyed by dedup key. */
function festivalEntriesByKey(bsYear: number, bsMonth: number): Map<string, EventEntry> {
  const map = new Map<string, EventEntry>();
  for (const f of FESTIVAL_EVENTS) {
    if (f.bsYear === bsYear && f.bsMonth === bsMonth) {
      const entry = festivalToEntry(f);
      map.set(dedupKey(f.bsYear, f.bsMonth, f.bsDay, f.nameEn), entry);
    }
  }
  return map;
}

/**
 * Get Trisambat API events for a BS month, synchronously from file cache.
 * Returns an empty array if the Trisambat data for this year is not cached.
 * Never throws, never fetches at call time.
 */
function trisambatEntriesByKey(
  bsYear: number,
  bsMonth: number,
): Map<string, EventEntry> {
  const map = new Map<string, EventEntry>();
  try {
    // Synchronously read from file cache — no fetch here
    const cached = getTrisambatCacheEntry(bsYear);
    if (!cached) return map;

    const holidayNames = holidayNameMap(bsYear);

    const adapted = adaptTrisambatHolidays(
      cached.data,
      {
        bsYear: cached.data.bsYear,
        retrievedAt: cached.meta.retrievedAt,
        sourceUrl: cached.meta.sourceUrl,
        etag: cached.meta.etag,
        provisional: cached.meta.provisional,
      },
      holidayNames,
    );

    for (const f of adapted) {
      if (f.bsMonth === bsMonth) {
        const entry = trisambatToEntry(f);
        map.set(dedupKey(f.bsYear, f.bsMonth, f.bsDay, f.nameEn), entry);
      }
    }
  } catch {
    // Silently ignore any Trisambat integration errors
  }
  return map;
}

/**
 * Get all events for a BS month.
 * Holidays from lib/holidays.ts take priority; festival events from
 * lib/events.ts are added only when not already present as a holiday.
 * Trisambat API events are added only when cached and not already present.
 * Recurring observances (Ekadashi, Purnima, Aunsi) are computed via Panchanga.
 */
export function getEventsForMonth(bsYear: number, bsMonth: number): EventEntry[] {
  const merged = new Map<string, EventEntry>();

  // Holidays first (authoritative source)
  for (const [key, entry] of holidayEntriesByKey(bsYear, bsMonth)) {
    merged.set(key, entry);
  }

  // Festival events: add only if not already present as a holiday
  for (const [key, entry] of festivalEntriesByKey(bsYear, bsMonth)) {
    if (!merged.has(key)) {
      merged.set(key, entry);
    }
  }

  // Trisambat API events: add only if cached and not already present
  for (const [key, entry] of trisambatEntriesByKey(bsYear, bsMonth)) {
    if (!merged.has(key)) {
      merged.set(key, entry);
    }
  }

  // Recurring observances: add only if not already present
  const recurring = computeRecurringObservancesForMonth(bsYear, bsMonth);
  for (const entry of recurring) {
    const key = dedupKey(entry.bsYear, entry.bsMonth, entry.bsDay, entry.nameEn);
    if (!merged.has(key)) {
      merged.set(key, entry);
    }
  }

  return [...merged.values()].sort((a, b) => a.bsDay - b.bsDay);
}

/**
 * Preload Trisambat holiday data for multiple BS years into the file cache.
 * Intended for the refresh script (scripts/refresh-trisambat-cache.ts),
 * never for runtime use during website visits.
 * Returns the years that were successfully fetched and written.
 * Never throws.
 */
export async function preloadTrisambatEvents(
  bsYears: number[],
): Promise<number[]> {
  const { fetchTrisambatHolidays, writeTrisambatCacheEntry } = await import(
    './trisambat-cache'
  );
  const fetched: number[] = [];
  for (const year of bsYears) {
    const result = await fetchTrisambatHolidays(year);
    if (result) {
      writeTrisambatCacheEntry(year, result.data, result.meta);
      fetched.push(year);
    }
  }
  return fetched;
}

/**
 * Get all events for a specific BS date.
 */
export function getEventsForDate(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
): EventEntry[] {
  const all = getEventsForMonth(bsYear, bsMonth);
  return all.filter((e) => e.bsDay === bsDay);
}

/**
 * Get all events for a BS year.
 */
export function getEventsForYear(bsYear: number): EventEntry[] {
  const all: EventEntry[] = [];
  for (let bsMonth = 1; bsMonth <= 12; bsMonth++) {
    all.push(...getEventsForMonth(bsYear, bsMonth));
  }
  return all.sort((a, b) => a.bsMonth - b.bsMonth || a.bsDay - b.bsDay);
}

/** Get unique categories present in events for a month. */
export function getEventCategoriesForMonth(
  bsYear: number,
  bsMonth: number,
): string[] {
  const cats = new Set<string>();
  for (const e of getEventsForMonth(bsYear, bsMonth)) {
    cats.add(e.category);
  }
  return [...cats].sort();
}

function getDaysInBsMonth(bsYear: number, bsMonth: number): number {
  const row = BS_MONTH_DAYS[bsYear];
  if (!row) {
    throw new Error(`BS year ${bsYear} is outside the verified range.`);
  }
  return row[bsMonth - 1];
}
