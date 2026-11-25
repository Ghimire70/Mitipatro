// lib/faqSynthesizer.ts
//
// Answer synthesizer for the FAQ Intelligence system.
// Every answer is computed exclusively from the verified BS calendar / holiday /
// astronomy engine functions. No hardcoded or guessed dates.
//
// Imported libs (read-only): lib/bsConverter.ts, lib/holidays.ts,
// lib/eventService.ts, lib/rashifalEngine.ts, lib/rashifal.ts, lib/bsData.ts.

import {
  adToBs,
  bsToAd,
  getBsMonthGrid,
  getDaysInBsMonth,
  getTotalDaysInBsYear,
  getTodayNepal,
  type BsDate,
  type AdDate,
} from './bsConverter';
import {
  getHolidaysForDate,
  getHolidaysForMonth,
  getHolidaysForYear,
  type HolidayRecord,
} from './holidays';
import { getEventsForMonth, getEventsForYear } from './eventService';
import { computeRashifalEngine } from './rashifalEngine';
import { RASHIS } from './rashifal';
import { BS_MONTHS, WEEKDAYS } from './bsData';
import type { FaqItem, FaqIntent, FaqSource } from './faqTypes';
import { canonicalHash } from './faqNormalizer';

const BS_MONTH_NAMES = BS_MONTHS.map((m) => m.en);

function monthName(bsMonth: number): string {
  return BS_MONTHS[bsMonth - 1]?.en ?? String(bsMonth);
}

function faq(
  question: string,
  answer: string,
  intent: FaqIntent,
  category: string,
  source: FaqSource,
  opts?: {
    bsYear?: number;
    bsMonth?: number;
    bsDay?: number;
    adIso?: string;
  },
): FaqItem {
  return {
    id: canonicalHash(question, intent),
    question,
    answer,
    intent,
    category,
    source,
    bsYear: opts?.bsYear,
    bsMonth: opts?.bsMonth,
    bsDay: opts?.bsDay,
    adIso: opts?.adIso,
    generatedAt: new Date().toISOString(),
    verified: true,
  };
}

/* ------------------------------------------------------------------ */
/* Today                                                              */
/* ------------------------------------------------------------------ */

export function synthesizeTodayFaqs(): FaqItem[] {
  const today = getTodayNepal();
  const ad = today.ad;
  const bs = today.bs;
  return [
    faq(
      "What is today's Nepali date (Bikram Sambat)?",
      `Today in Nepal (Asia/Kathmandu, UTC+05:45) is ${bs.formattedEn} (${bs.formattedNe}), which is ${today.weekday.en} (${today.weekday.ne}). The Gregorian equivalent is ${ad.formattedEn} (${ad.iso}).`,
      'today',
      'today-date',
      'deterministic',
      { bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day, adIso: ad.iso },
    ),
    faq(
      "What is today's Gregorian (AD) date?",
      `Today's Nepali date ${bs.formattedEn} corresponds to ${ad.formattedEn} (${ad.iso}), ${today.weekday.en}.`,
      'today',
      'today-date',
      'deterministic',
      { bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day, adIso: ad.iso },
    ),
    faq(
      'Which timezone does MitiPatro use for today’s date?',
      "All date calculations strictly use Asia/Kathmandu (Nepal Standard Time, UTC+05:45), regardless of where in the world you open the page.",
      'today',
      'today-date',
      'editorial',
    ),
    faq(
      'Is today a holiday in Nepal?',
      (() => {
        const holidays = getHolidaysForDate(bs.year, bs.month, bs.day);
        if (holidays.length > 0) {
          const names = holidays.map((h) => h.nameEn).join(', ');
          const sat = today.weekday.index === 6 ? ' Saturday is also the weekly rest day.' : '';
          return `${names} is listed for ${bs.formattedEn} (${ad.formattedEn}).${sat}`;
        }
        if (today.weekday.isHoliday) {
          return `No specific holiday is listed for ${bs.formattedEn} (${ad.formattedEn}), but today (${today.weekday.en}) is commonly observed as the weekly rest day.`;
        }
        return `No holiday is listed for ${bs.formattedEn} (${ad.formattedEn}).`;
      })(),
      'today',
      'today-date',
      'deterministic',
      { bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day, adIso: ad.iso },
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Month                                                              */
/* ------------------------------------------------------------------ */

export function synthesizeMonthFaqs(bsYear: number, bsMonth: number): FaqItem[] {
  const grid = getBsMonthGrid(bsYear, bsMonth);
  const firstAd = grid.days[0];
  const lastAd = grid.days[grid.days.length - 1];
  const monthNameEn = monthName(bsMonth);
  const holidays = getHolidaysForMonth(bsYear, bsMonth);
  const publicCount = holidays.filter((h) => h.isPublicHoliday).length;

  const faqs: FaqItem[] = [
    faq(
      `How many days are in ${monthNameEn} ${bsYear} BS?`,
      `${monthNameEn} ${bsYear} BS has ${grid.totalDays} days, from ${firstAd.adIso} to ${lastAd.adIso}.`,
      'month',
      'month-days',
      'deterministic',
      { bsYear, bsMonth },
    ),
    faq(
      `What Gregorian (AD) dates fall in ${monthNameEn} ${bsYear} BS?`,
      `${monthNameEn} 1, ${bsYear} BS corresponds to ${firstAd.adIso}, and ${monthNameEn} ${grid.totalDays}, ${bsYear} BS corresponds to ${lastAd.adIso}.`,
      'month',
      'month-dates',
      'deterministic',
      { bsYear, bsMonth },
    ),
    faq(
      `What day of the week does ${monthNameEn} 1, ${bsYear} BS fall on?`,
      `${monthNameEn} 1, ${bsYear} BS falls on ${WEEKDAYS[firstAd.weekday].en} (${firstAd.adIso}).`,
      'month',
      'month-start-weekday',
      'deterministic',
      { bsYear, bsMonth },
    ),
  ];

  if (holidays.length > 0) {
    const names = holidays.slice(0, 5).map((h) => h.nameEn).join(', ');
    faqs.push(
      faq(
        `Which holidays occur in ${monthNameEn} ${bsYear} BS?`,
        `Notable observances in ${monthNameEn} ${bsYear} BS include ${names}.${publicCount > 0 ? ` ${publicCount} of these are listed as public holidays.` : ''}`,
        'month',
        'month-holidays',
        'deterministic',
        { bsYear, bsMonth },
      ),
    );
  } else {
    faqs.push(
      faq(
        `Are there holidays in ${monthNameEn} ${bsYear} BS?`,
        `No holiday entries are listed for ${monthNameEn} ${bsYear} BS. Saturday is commonly observed as the weekly rest day.`,
        'month',
        'month-holidays',
        'deterministic',
        { bsYear, bsMonth },
      ),
    );
  }

  return faqs;
}

/* ------------------------------------------------------------------ */
/* Year (all months)                                                  */
/* ------------------------------------------------------------------ */

export function synthesizeYearFaqs(bsYear: number): FaqItem[] {
  const startAd = bsToAd(bsYear, 1, 1);
  const endMonthDays = getDaysInBsMonth(bsYear, 12);
  const endAd = bsToAd(bsYear, 12, endMonthDays);
  const totalDays = getTotalDaysInBsYear(bsYear);
  const holidays = getHolidaysForYear(bsYear);
  const publicCount = holidays.filter((h) => h.isPublicHoliday).length;

  return [
    faq(
      `When does Nepali Year ${bsYear} BS start and end in AD?`,
      `Baisakh 1, ${bsYear} BS starts on ${startAd.weekdayEn}, ${startAd.formattedEn} (${startAd.iso}), and Chaitra ${endMonthDays}, ${bsYear} BS ends on ${endAd.weekdayEn}, ${endAd.formattedEn} (${endAd.iso}).`,
      'month',
      'year-span',
      'deterministic',
      { bsYear },
    ),
    faq(
      `How many days are in Bikram Sambat ${bsYear}?`,
      `The Bikram Sambat year ${bsYear} BS has ${totalDays} days across 12 solar months from Baisakh to Chaitra.`,
      'month',
      'year-total-days',
      'deterministic',
      { bsYear },
    ),
    faq(
      `How many public holidays are listed for ${bsYear} BS?`,
      `MitiPatro currently has ${publicCount} entries marked as public holidays for ${bsYear} BS, excluding weekly Saturday observances.`,
      'holiday',
      'year-holidays',
      'deterministic',
      { bsYear },
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Holiday                                                            */
/* ------------------------------------------------------------------ */

export function synthesizeHolidayFaqs(bsYear: number): FaqItem[] {
  const holidays = getHolidaysForYear(bsYear);
  const faqs: FaqItem[] = [];

  for (const h of holidays) {
    const ad = bsToAd(h.bsYear, h.bsMonth, h.bsDay);
    faqs.push(
      faq(
        `When is ${h.nameEn} in ${bsYear} BS?`,
        `${h.nameEn} (${h.nameNe}) falls on ${monthName(h.bsMonth)} ${h.bsDay}, ${bsYear} BS, which corresponds to ${ad.formattedEn} (${ad.iso}), ${ad.weekdayEn}.`,
        'holiday',
        'holiday-date',
        'deterministic',
        { bsYear: h.bsYear, bsMonth: h.bsMonth, bsDay: h.bsDay, adIso: ad.iso },
      ),
    );
    if (h.isPublicHoliday) {
      faqs.push(
        faq(
          `Is ${h.nameEn} a public holiday in ${bsYear} BS?`,
          `Yes, ${h.nameEn} on ${monthName(h.bsMonth)} ${h.bsDay}, ${bsYear} BS (${ad.formattedEn}) is listed as a public holiday.`,
          'holiday',
          'holiday-public-status',
          'deterministic',
          { bsYear: h.bsYear, bsMonth: h.bsMonth, bsDay: h.bsDay, adIso: ad.iso },
        ),
      );
    }
  }

  faqs.push(
    faq(
      `Are Saturdays public holidays in Nepal?`,
      'Saturday (शनिबार) is commonly observed as the weekly rest day in Nepal.',
      'holiday',
      'saturday-rest-day',
      'editorial',
    ),
  );

  return faqs;
}

/* ------------------------------------------------------------------ */
/* Converter                                                          */
/* ------------------------------------------------------------------ */

export function synthesizeConverterFaqs(): FaqItem[] {
  const faqs: FaqItem[] = [];
  const sampleBsDates: [number, number, number][] = [
    [2083, 1, 1],   // Baisakh 1, 2083
    [2083, 7, 29],  // Kartik 29, 2083 (Dashain period)
    [2082, 1, 1],   // Baisakh 1, 2082
    [2085, 12, 30], // last day of 2085
  ];

  for (const [y, m, d] of sampleBsDates) {
    try {
      const ad = bsToAd(y, m, d);
      faqs.push(
        faq(
          `What is ${d} ${monthName(m)} ${y} BS in AD?`,
          `${d} ${monthName(m)} ${y} BS corresponds to ${ad.formattedEn} (${ad.iso}), ${ad.weekdayEn}.`,
          'converter',
          'bs-to-ad',
          'deterministic',
          { bsYear: y, bsMonth: m, bsDay: d, adIso: ad.iso },
        ),
      );
    } catch {
      // skip out-of-range
    }
  }

  const sampleAdDates: [number, number, number][] = [
    [2026, 4, 14], // Nepali New Year 2083
    [2026, 10, 21], // Vijaya Dashami 2083
    [2026, 11, 9], // Bhai Tika 2083
  ];

  for (const [y, m, d] of sampleAdDates) {
    try {
      const bs = adToBs({ year: y, month: m, day: d });
      faqs.push(
        faq(
          `What is ${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} AD in BS?`,
          `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} AD corresponds to ${bs.formattedEn} (${bs.formattedNe}), ${bs.weekdayEn}.`,
          'converter',
          'ad-to-bs',
          'deterministic',
          { bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day, adIso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` },
        ),
      );
    } catch {
      // skip out-of-range
    }
  }

  faqs.push(
    faq(
      'Which years does the BS to AD converter support?',
      'The converter supports Bikram Sambat years 2000–2090 BS (April 14, 1943 AD to approximately April 13, 2034 AD).',
      'converter',
      'converter-range',
      'editorial',
    ),
    faq(
      'How does the BS to AD date converter work?',
      'The converter uses the verified anchor 1 Baisakh 2000 BS = 14 April 1943 AD and counts exact days from that point using the stored Bikram Sambat month-length table.',
      'converter',
      'converter-method',
      'editorial',
    ),
  );

  return faqs;
}

/* ------------------------------------------------------------------ */
/* Rashifal                                                           */
/* ------------------------------------------------------------------ */

export function synthesizeRashifalFaqs(): FaqItem[] {
  const today = getTodayNepal();
  const rashiNamesEn = RASHIS.map((r) => `${r.nameEn} (${r.englishSign})`).join(', ');
  const rashiNamesNe = RASHIS.map((r) => r.nameNe).join(', ');

  return [
    faq(
      'When does today’s Nepali rashifal update?',
      "The daily rashifal is updated at midnight Nepal Standard Time (Asia/Kathmandu, UTC+05:45) with each new date and tithi.",
      'rashifal',
      'rashifal-update',
      'editorial',
      { bsYear: today.bs.year, bsMonth: today.bs.month, bsDay: today.bs.day },
    ),
    faq(
      'What are the 12 Nepali rashis (zodiac signs)?',
      `The 12 Vedic rashis are: ${rashiNamesEn}. In Nepali: ${rashiNamesNe}.`,
      'rashifal',
      'rashifal-12-rashis',
      'editorial',
    ),
    faq(
      'How is the daily rashifal calculated?',
      "It is based on the Moon's sidereal position at sunrise in Kathmandu, using the Lahiri ayanamsha (Astronomy Engine VSOP87/ELP2000-82B pipeline).",
      'rashifal',
      'rashifal-method',
      'editorial',
    ),
    faq(
      'Is MitiPatro rashifal an official astrological prediction?',
      'No. The rashifal is for entertainment and reference only. It is based on the Moon’s sidereal position and makes no accuracy claim. Not a substitute for professional advice.',
      'rashifal',
      'rashifal-disclaimer',
      'editorial',
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Tithi                                                              */
/* ------------------------------------------------------------------ */

export function synthesizeTithiFaqs(bsYear: number, bsMonth: number): FaqItem[] {
  const monthNameEn = monthName(bsMonth);
  const faqs: FaqItem[] = [];

  // Recurring observances (Ekadashi, Purnima, Aunsi) computed via eventService.
  // We scan the month to find which tithi-based observances occur.
  const events = getEventsForMonth(bsYear, bsMonth);
  const tithiEvents = events.filter(
    (e) =>
      e.nameEn.toLowerCase().includes('ekadashi') ||
      e.nameEn.toLowerCase().includes('purnima') ||
      e.nameEn.toLowerCase().includes('aunsi') ||
      e.nameEn.toLowerCase().includes('amavasya'),
  );

  for (const e of tithiEvents) {
    const ad = bsToAd(bsYear, bsMonth, e.bsDay);
    faqs.push(
      faq(
        `When is ${e.nameEn} in ${monthNameEn} ${bsYear} BS?`,
        `${e.nameEn} (${e.nameNe}) falls on ${e.bsDay} ${monthNameEn} ${bsYear} BS, which corresponds to ${ad.formattedEn} (${ad.iso}), ${ad.weekdayEn}.`,
        'tithi',
        'tithi-date',
        'deterministic',
        { bsYear, bsMonth, bsDay: e.bsDay, adIso: ad.iso },
      ),
    );
  }

  if (faqs.length === 0) {
    faqs.push(
      faq(
        `Are there tithi observances in ${monthNameEn} ${bsYear} BS?`,
        `Recurring tithi observances (Ekadashi, Purnima, Aunsi) are computed for each BS month. Check the ${monthNameEn} ${bsYear} calendar page for specific dates.`,
        'tithi',
        'tithi-general',
        'editorial',
        { bsYear, bsMonth },
      ),
    );
  }

  return faqs;
}

/* ------------------------------------------------------------------ */
/* General                                                            */
/* ------------------------------------------------------------------ */

export function synthesizeGeneralFaqs(): FaqItem[] {
  return [
    faq(
      'What is MitiPatro?',
      'MitiPatro is a Nepali (Bikram Sambat) calendar site that provides BS to AD date conversion, monthly calendars, holidays, festivals, and daily rashifal for Nepal.',
      'general',
      'about',
      'editorial',
    ),
    faq(
      'What calendar system does MitiPatro use?',
      "MitiPatro uses the Bikram Sambat (BS) calendar with verified month-length tables covering years 2000–2090 BS, anchored to 1 Baisakh 2000 BS = 14 April 1943 AD.",
      'general',
      'calendar-system',
      'editorial',
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Master generator                                                   */
/* ------------------------------------------------------------------ */

export function synthesizeAllFaqs(): FaqItem[] {
  const all: FaqItem[] = [];
  const today = getTodayNepal();
  const publishedYears = [2082, 2083, 2084, 2085];

  // Today FAQs (current date)
  all.push(...synthesizeTodayFaqs());

  // Month FAQs for published years (all 12 months each)
  for (const y of publishedYears) {
    for (let m = 1; m <= 12; m++) {
      all.push(...synthesizeMonthFaqs(y, m));
    }
  }

  // Year FAQs
  for (const y of publishedYears) {
    all.push(...synthesizeYearFaqs(y));
  }

  // Holiday FAQs
  for (const y of publishedYears) {
    all.push(...synthesizeHolidayFaqs(y));
  }

  // Converter FAQs
  all.push(...synthesizeConverterFaqs());

  // Rashifal FAQs
  all.push(...synthesizeRashifalFaqs());

  // Tithi FAQs
  for (const y of publishedYears) {
    for (let m = 1; m <= 12; m++) {
      all.push(...synthesizeTithiFaqs(y, m));
    }
  }

  // General FAQs
  all.push(...synthesizeGeneralFaqs());

  return all;
}
