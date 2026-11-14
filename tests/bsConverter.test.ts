import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BS_ANCHOR,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTH_DAYS,
} from '../lib/bsData';
import {
  BsDateError,
  adToBs,
  bsToAd,
  getBsMonthGrid,
  getTodayNepal,
  getTotalDaysInBsYear,
  toDevanagariDigits,
  validateAdDate,
  validateBsDate,
} from '../lib/bsConverter';

/**
 * 32 known, independently verified BS <-> AD date pairs covering:
 * - Anchor epoch (2000-01-01)
 * - Historic milestones & leap-year boundaries
 * - Recent years (2080–2085 BS) New Year days
 * - 32-day months (e.g. Ashad 2083) and 29-day months (e.g. Mangsir/Magh 2083)
 * - Year boundaries (Chaitra last day -> Baisakh 1)
 * - 2083 BS festivals (Vijaya Dashami, Laxmi Puja, Bhai Tika, Chhath, Shivaratri, Holi)
 */
const KNOWN_DATE_PAIRS: ReadonlyArray<{
  bs: [number, number, number];
  ad: string; // YYYY-MM-DD
  weekday: number; // 0=Sun .. 6=Sat
  note: string;
}> = [
  // Anchor & historical benchmarks
  { bs: [2000, 1, 1], ad: '1943-04-14', weekday: 3, note: 'Anchor: 1 Baisakh 2000 BS (Wed)' },
  { bs: [2000, 12, 31], ad: '1944-04-12', weekday: 3, note: 'End of 2000 BS (AD 1944 leap year)' },
  { bs: [2001, 1, 1], ad: '1944-04-13', weekday: 4, note: '1 Baisakh 2001 BS (shifted by 1944 AD leap day)' },
  { bs: [2007, 11, 7], ad: '1951-02-18', weekday: 0, note: 'Democracy Day 2007 BS (18 Feb 1951)' },
  { bs: [2046, 12, 26], ad: '1990-04-08', weekday: 0, note: '1990 Jana Andolan milestone' },
  { bs: [2050, 1, 1], ad: '1993-04-13', weekday: 2, note: '1 Baisakh 2050 BS (Tue)' },
  { bs: [2056, 9, 17], ad: '2000-01-01', weekday: 6, note: 'Y2K Gregorian New Year' },
  { bs: [2072, 1, 12], ad: '2015-04-25', weekday: 6, note: '2015 Gorkha earthquake date' },
  { bs: [2072, 6, 3], ad: '2015-09-20', weekday: 0, note: 'Constitution of Nepal promulgation' },

  // Leap-like / AD leap year & year boundaries (2080–2085)
  { bs: [2080, 1, 1], ad: '2023-04-14', weekday: 5, note: '1 Baisakh 2080 BS' },
  { bs: [2080, 11, 17], ad: '2024-02-29', weekday: 4, note: 'Gregorian leap day 2024-02-29' },
  { bs: [2080, 12, 30], ad: '2024-04-12', weekday: 5, note: 'Last day of 2080 BS' },
  { bs: [2081, 1, 1], ad: '2024-04-13', weekday: 6, note: '1 Baisakh 2081 BS (April 13)' },
  { bs: [2081, 11, 29], ad: '2025-03-13', weekday: 4, note: 'Last day of 29-day Falgun 2081 BS' },
  { bs: [2081, 12, 1], ad: '2025-03-14', weekday: 5, note: '1 Chaitra 2081 BS (31-day Chaitra)' },
  { bs: [2081, 12, 31], ad: '2025-04-13', weekday: 0, note: 'Last day of 2081 BS (366-day BS year)' },
  { bs: [2082, 1, 1], ad: '2025-04-14', weekday: 1, note: '1 Baisakh 2082 BS' },
  { bs: [2082, 12, 30], ad: '2026-04-13', weekday: 1, note: 'Last day of 2082 BS' },

  // Current year 2083 BS boundaries & festivals
  { bs: [2083, 1, 1], ad: '2026-04-14', weekday: 2, note: 'Nepali New Year 2083 BS' },
  { bs: [2083, 1, 18], ad: '2026-05-01', weekday: 5, note: 'Buddha Jayanti / Workers Day 2083' },
  { bs: [2083, 2, 15], ad: '2026-05-29', weekday: 5, note: 'Republic Day 2083 BS' },
  { bs: [2083, 3, 32], ad: '2026-07-16', weekday: 4, note: '32-day Ashad boundary in 2083 BS' },
  { bs: [2083, 4, 1], ad: '2026-07-17', weekday: 5, note: '1 Shrawan 2083 BS' },
  { bs: [2083, 6, 31], ad: '2026-10-17', weekday: 6, note: 'Fulpati / Last day of Ashwin 2083 BS' },
  { bs: [2083, 7, 1], ad: '2026-10-18', weekday: 0, note: '1 Kartik 2083 BS' },
  { bs: [2083, 7, 4], ad: '2026-10-21', weekday: 3, note: 'Vijaya Dashami 2083 BS' },
  { bs: [2083, 7, 22], ad: '2026-11-08', weekday: 0, note: 'Laxmi Puja 2083 BS' },
  { bs: [2083, 7, 24], ad: '2026-11-10', weekday: 2, note: 'Bhai Tika 2083 BS' },
  { bs: [2083, 7, 28], ad: '2026-11-14', weekday: 6, note: 'Reference date: Kartik 28, 2083 BS (Sat)' },
  { bs: [2083, 7, 29], ad: '2026-11-15', weekday: 0, note: 'Chhath Parba 2083 BS' },
  { bs: [2083, 8, 1], ad: '2026-11-17', weekday: 2, note: '1 Mangsir 2083 BS' },
  { bs: [2083, 8, 29], ad: '2026-12-15', weekday: 2, note: 'Last day of 29-day Mangsir 2083 BS' },
  { bs: [2083, 9, 1], ad: '2026-12-16', weekday: 3, note: '1 Poush 2083 BS' },
  { bs: [2083, 10, 1], ad: '2027-01-15', weekday: 5, note: 'Maghe Sankranti 2083 BS' },
  { bs: [2083, 11, 22], ad: '2027-03-06', weekday: 6, note: 'Maha Shivaratri 2083 BS' },
  { bs: [2083, 12, 7], ad: '2027-03-21', weekday: 0, note: 'Fagu Purnima (Hill) 2083 BS' },
  { bs: [2083, 12, 30], ad: '2027-04-13', weekday: 2, note: 'Last day of 2083 BS' },

  // Future years 2084–2090 BS
  { bs: [2084, 1, 1], ad: '2027-04-14', weekday: 3, note: '1 Baisakh 2084 BS' },
  { bs: [2085, 1, 1], ad: '2028-04-13', weekday: 4, note: '1 Baisakh 2085 BS (2028 AD leap year)' },
  { bs: [2090, 1, 1], ad: '2033-04-14', weekday: 4, note: '1 Baisakh 2090 BS' },
  { bs: [2090, 12, 30], ad: '2034-04-13', weekday: 4, note: 'End of supported range 2090 BS' },
];

test('anchor constant matches 1 Baisakh 2000 BS === 1943-04-14 AD', () => {
  assert.equal(BS_ANCHOR.bsYear, 2000);
  assert.equal(BS_ANCHOR.bsMonth, 1);
  assert.equal(BS_ANCHOR.bsDay, 1);
  const ad = bsToAd(2000, 1, 1);
  assert.equal(ad.iso, '1943-04-14');
  assert.equal(ad.weekday, 3);
});

test('every year row in BS_MONTH_DAYS (2000-2090) has 12 valid months (29-32) and plausible sum (365-366)', () => {
  for (let year = BS_MIN_YEAR; year <= BS_MAX_YEAR; year++) {
    const months = BS_MONTH_DAYS[year];
    assert.ok(months, `Missing BS_MONTH_DAYS row for ${year}`);
    assert.equal(months.length, 12, `Year ${year} must have 12 months`);
    for (let m = 0; m < 12; m++) {
      assert.ok(
        months[m] >= 29 && months[m] <= 32,
        `Year ${year} month ${m + 1} has implausible length ${months[m]}`,
      );
    }
    const sum = getTotalDaysInBsYear(year);
    assert.ok(sum === 365 || sum === 366, `Year ${year} summed to ${sum} days (expected 365 or 366)`);
  }
});

test('all 41 known BS <-> AD date pairs convert accurately in both directions', () => {
  for (const pair of KNOWN_DATE_PAIRS) {
    const [y, m, d] = pair.bs;
    const ad = bsToAd(y, m, d);
    assert.equal(ad.iso, pair.ad, `bsToAd(${y}-${m}-${d}) failed [${pair.note}]`);
    assert.equal(ad.weekday, pair.weekday, `weekday mismatch for ${pair.note}`);

    const bs = adToBs(pair.ad);
    assert.equal(bs.year, y, `adToBs(${pair.ad}) year failed [${pair.note}]`);
    assert.equal(bs.month, m, `adToBs(${pair.ad}) month failed [${pair.note}]`);
    assert.equal(bs.day, d, `adToBs(${pair.ad}) day failed [${pair.note}]`);
    assert.equal(bs.weekday, pair.weekday, `adToBs weekday mismatch [${pair.note}]`);
  }
});

test('full 91-year AD <-> BS round-trip consistency across sampled every-7th-day dates (2000–2090 BS)', () => {
  const startUtc = Date.UTC(1943, 3, 14);
  const endAd = bsToAd(BS_MAX_YEAR, 12, BS_MONTH_DAYS[BS_MAX_YEAR][11]);
  const endUtc = Date.UTC(endAd.year, endAd.month - 1, endAd.day);
  const dayMs = 86_400_000;

  let checked = 0;
  for (let ts = startUtc; ts <= endUtc; ts += 7 * dayMs) {
    const dt = new Date(ts);
    const adIso = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const bs = adToBs(adIso);
    const roundTrip = bsToAd(bs.year, bs.month, bs.day);
    assert.equal(roundTrip.iso, adIso, `Round-trip failed for ${adIso} -> ${bs.iso} -> ${roundTrip.iso}`);
    assert.equal(roundTrip.weekday, bs.weekday);
    checked++;
  }
  assert.ok(checked > 4700, `Expected >4700 sampled dates, checked ${checked}`);
});

test('validation rejects impossible BS dates, impossible AD dates, and out-of-range years', () => {
  // Impossible BS dates
  assert.equal(validateBsDate(2083, 8, 30).valid, false); // Mangsir 2083 only has 29 days
  assert.equal(validateBsDate(2083, 3, 33).valid, false); // Max BS month is 32
  assert.equal(validateBsDate(2083, 13, 1).valid, false); // Month 13
  assert.equal(validateBsDate(2083, 0, 1).valid, false); // Month 0
  assert.equal(validateBsDate(1999, 1, 1).valid, false); // Before 2000 BS
  assert.equal(validateBsDate(2091, 1, 1).valid, false); // After 2090 BS
  assert.equal(validateBsDate(2083.5, 1, 1).valid, false); // Non-integer

  assert.throws(() => bsToAd(2083, 8, 30), BsDateError);
  assert.throws(() => bsToAd(1999, 1, 1), BsDateError);
  assert.throws(() => bsToAd(2091, 1, 1), BsDateError);

  // Impossible AD dates
  assert.equal(validateAdDate(2026, 2, 29).valid, false); // 2026 is not a leap year
  assert.equal(validateAdDate(2024, 2, 29).valid, true); // 2024 is a leap year
  assert.equal(validateAdDate(2026, 4, 31).valid, false); // April has 30 days
  assert.equal(validateAdDate(1943, 4, 13).valid, false); // Day before anchor
  assert.equal(validateAdDate(2034, 4, 14).valid, false); // Day after 2090-12-30 BS

  assert.throws(() => adToBs('2026-02-29'), BsDateError);
  assert.throws(() => adToBs('1943-04-13'), BsDateError);
  assert.throws(() => adToBs('not-a-date'), BsDateError);
});

test('getTodayNepal computes date strictly in Asia/Kathmandu (UTC+05:45), ignoring UTC day lag', () => {
  // 2026-11-13 18:20 UTC === 2026-11-14 00:05 Asia/Kathmandu (already Kartik 28, 2083)
  const rolloverInstant = new Date('2026-11-13T18:20:00.000Z');
  const nepalToday = getTodayNepal(rolloverInstant);
  assert.equal(nepalToday.ad.iso, '2026-11-14');
  assert.equal(nepalToday.bs.iso, '2083-07-28');
  assert.equal(nepalToday.weekday.en, 'Saturday');
  assert.equal(nepalToday.nepalTime, '00:05:00');

  // 2026-11-13 18:10 UTC === 2026-11-13 23:55 Asia/Kathmandu (still Kartik 27, 2083)
  const beforeMidnightInstant = new Date('2026-11-13T18:10:00.000Z');
  const nepalYesterday = getTodayNepal(beforeMidnightInstant);
  assert.equal(nepalYesterday.ad.iso, '2026-11-13');
  assert.equal(nepalYesterday.bs.iso, '2083-07-27');
  assert.equal(nepalYesterday.weekday.en, 'Friday');
});

test('getBsMonthGrid builds accurate month grid & Devanagari formatting', () => {
  const kartik2083 = getBsMonthGrid(2083, 7);
  assert.equal(kartik2083.totalDays, 30);
  assert.equal(kartik2083.startWeekday, 0); // Kartik 1, 2083 (Oct 18, 2026) is Sunday
  assert.equal(kartik2083.adStartIso, '2026-10-18');
  assert.equal(kartik2083.adEndIso, '2026-11-16');
  assert.equal(kartik2083.days.length, 30);
  assert.equal(kartik2083.days[27].bsDay, 28);
  assert.equal(kartik2083.days[27].bsDayNe, '२८');
  assert.equal(kartik2083.days[27].adIso, '2026-11-14');
  assert.equal(kartik2083.days[27].isSaturday, true);
  assert.equal(kartik2083.prevMonth?.slug, 'ashwin');
  assert.equal(kartik2083.nextMonth?.slug, 'mangsir');
  assert.equal(toDevanagariDigits(2083), '२०८३');
});
