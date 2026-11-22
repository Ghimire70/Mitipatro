import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RASHIS,
  getRashiById,
  getAvailableRashifalDates,
  getAvailableWeeklyKeys,
  getAvailableMonthlyKeys,
  getHoroscope,
  getDailyRashifal,
  getWeeklyRashifal,
  getMonthlyRashifal,
  isRashifalAvailableForDate,
  getTodayNepalBsDate,
  type RashiId,
  type HoroscopeRecord,
} from '../lib/rashifal';
import { bsToAd, getTodayNepal } from '../lib/bsConverter';
import { generateSitemapPaths, getSeoForRoute } from '../lib/seo';
import { render } from '../src/entry-server';
import { computeRashifalEngine } from '../lib/rashifalEngine.js';

const ORIGIN = 'https://mitipatro.com.np';
const SAMPLE_NOW_MS = new Date('2026-11-14T06:15:00.000Z').getTime(); // Kartik 28, 2083 BS

test('twelve Vedic Rashis are correctly defined in canonical order with accurate Nepali and English names', () => {
  assert.equal(RASHIS.length, 12, 'Must have exactly 12 Rashis');

  const expectedOrder: ReadonlyArray<{
    id: RashiId;
    nameNe: string;
    englishSign: string;
    order: number;
  }> = [
    { id: 'mesha', nameNe: 'मेष', englishSign: 'Aries', order: 1 },
    { id: 'vrisha', nameNe: 'वृष', englishSign: 'Taurus', order: 2 },
    { id: 'mithun', nameNe: 'मिथुन', englishSign: 'Gemini', order: 3 },
    { id: 'karkat', nameNe: 'कर्कट', englishSign: 'Cancer', order: 4 },
    { id: 'simha', nameNe: 'सिंह', englishSign: 'Leo', order: 5 },
    { id: 'kanya', nameNe: 'कन्या', englishSign: 'Virgo', order: 6 },
    { id: 'tula', nameNe: 'तुला', englishSign: 'Libra', order: 7 },
    { id: 'vrischik', nameNe: 'वृश्चिक', englishSign: 'Scorpio', order: 8 },
    { id: 'dhanu', nameNe: 'धनु', englishSign: 'Sagittarius', order: 9 },
    { id: 'makar', nameNe: 'मकर', englishSign: 'Capricorn', order: 10 },
    { id: 'kumbha', nameNe: 'कुम्भ', englishSign: 'Aquarius', order: 11 },
    { id: 'meen', nameNe: 'मीन', englishSign: 'Pisces', order: 12 },
  ];

  expectedOrder.forEach((expected, idx) => {
    const rashi = RASHIS[idx];
    assert.equal(rashi.id, expected.id);
    assert.equal(rashi.nameNe, expected.nameNe);
    assert.equal(rashi.englishSign, expected.englishSign);
    assert.equal(rashi.order, expected.order);
    assert.ok(rashi.rulingPlanetNe.length > 0, `Missing ruling planet for ${rashi.id}`);
    assert.ok(rashi.elementNe.length > 0, `Missing element for ${rashi.id}`);
    assert.ok(rashi.symbolNe.length > 0, `Missing symbol for ${rashi.id}`);
    assert.ok(rashi.lettersNe.length > 0, `Missing letters for ${rashi.id}`);
    assert.equal(getRashiById('karkat')?.symbolNe, 'गँगटो');
  });
});

test('getRashiById looks up Rashis accurately with case and whitespace trimming', () => {
  assert.equal(getRashiById('mesha')?.nameNe, 'मेष');
  assert.equal(getRashiById('MESHA')?.nameNe, 'मेष');
  assert.equal(getRashiById('  meen  ')?.englishSign, 'Pisces');
  assert.equal(getRashiById('invalid-rashi'), undefined);
});

test('daily horoscope data architecture separates sample predictions from UI', () => {
  const dates = getAvailableRashifalDates();
  assert.ok(dates.length > 0, 'Must have at least one sample date');

  for (const date of dates) {
    const result = getDailyRashifal(date);
    assert.equal(result.isAvailable, true);
    assert.equal(result.period, 'daily');
    assert.equal(result.bsDate, date);
    assert.ok(result.adDate, `Date ${date} must have an AD date reference`);
    assert.ok(result.allPredictions, `Date ${date} must provide all predictions`);
    const allPredictions = result.allPredictions;

    // Every Rashi must have an authentic prediction for this date
    for (const rashi of RASHIS) {
      const pred: HoroscopeRecord | undefined = allPredictions[rashi.id];
      assert.ok(pred, `Missing prediction for ${rashi.id} on ${date}`);
      assert.equal(pred.rashiId, rashi.id);
      assert.equal(pred.period, 'daily');
      assert.ok(pred.descriptionNe.length > 10, `Prediction description too short for ${rashi.id}`);
      assert.ok(pred.luckyColorNe, `Missing lucky color for ${rashi.id}`);
      assert.ok(pred.luckyNumber !== undefined, `Missing lucky number for ${rashi.id}`);
    }
  }
});

test('weekly horoscope content clearly identifies coverage dates for all twelve Rashis', () => {
  const weeklyKeys = getAvailableWeeklyKeys();
  assert.ok(weeklyKeys.length > 0, 'Must have sample weekly horoscope content');

  const weeklyResult = getWeeklyRashifal(undefined, undefined, SAMPLE_NOW_MS);
  assert.equal(weeklyResult.isAvailable, true);
  assert.equal(weeklyResult.period, 'weekly');
  assert.equal(weeklyResult.coverageLabelNe, 'कार्तिक २२ देखि २८, २०८३');
  assert.ok(weeklyResult.startDate, 'Weekly horoscope must have a start date');
  assert.ok(weeklyResult.endDate, 'Weekly horoscope must have an end date');
  assert.equal(bsToAd(2083, 7, 22).weekdayEn, 'Sunday');
  assert.equal(bsToAd(2083, 7, 28).weekdayEn, 'Saturday');
  assert.ok(weeklyResult.allPredictions, 'Must provide all predictions for weekly period');
  const allWeekly = weeklyResult.allPredictions;

  for (const rashi of RASHIS) {
    const pred = allWeekly[rashi.id];
    assert.ok(pred, `Missing weekly prediction for ${rashi.id}`);
    assert.equal(pred.period, 'weekly');
    assert.equal(pred.rashiId, rashi.id);
    assert.equal(pred.startDate, weeklyResult.startDate);
    assert.equal(pred.endDate, weeklyResult.endDate);
    assert.ok(pred.descriptionNe.length > 20, `Weekly description too short for ${rashi.id}`);
    assert.ok(pred.careerNe, `Missing weekly career prediction for ${rashi.id}`);
    assert.ok(pred.financialNe, `Missing weekly financial prediction for ${rashi.id}`);
    assert.ok(pred.relationshipNe, `Missing weekly relationship prediction for ${rashi.id}`);
    assert.ok(pred.healthNe, `Missing weekly health prediction for ${rashi.id}`);
    assert.ok(pred.luckyColorNe, `Missing weekly lucky color for ${rashi.id}`);
    assert.ok(pred.luckyNumber !== undefined, `Missing weekly lucky number for ${rashi.id}`);
  }
});

test('monthly horoscope content clearly identifies Bikram Sambat month and year for all twelve Rashis', () => {
  const monthlyKeys = getAvailableMonthlyKeys();
  assert.ok(monthlyKeys.length > 0, 'Must have sample monthly horoscope content');

  const monthlyResult = getMonthlyRashifal(2083, 7);
  assert.equal(monthlyResult.isAvailable, true);
  assert.equal(monthlyResult.period, 'monthly');
  assert.equal(monthlyResult.coverageLabelNe, 'कार्तिक २०८३');
  assert.ok(monthlyResult.coverageLabelEn.includes('Kartik 2083 BS'));
  assert.equal(monthlyResult.startDate, '2083-07-01');
  assert.equal(monthlyResult.endDate, '2083-07-30');
  assert.ok(monthlyResult.allPredictions, 'Must provide all predictions for monthly period');
  const allMonthly = monthlyResult.allPredictions;

  for (const rashi of RASHIS) {
    const pred = allMonthly[rashi.id];
    assert.ok(pred, `Missing monthly prediction for ${rashi.id}`);
    assert.equal(pred.period, 'monthly');
    assert.equal(pred.rashiId, rashi.id);
    assert.equal(pred.bsYear, 2083);
    assert.equal(pred.bsMonth, 7);
    assert.ok(pred.descriptionNe.length > 20, `Monthly description too short for ${rashi.id}`);
    assert.ok(pred.careerNe, `Missing monthly career prediction for ${rashi.id}`);
    assert.ok(pred.financialNe, `Missing monthly financial prediction for ${rashi.id}`);
    assert.ok(pred.relationshipNe, `Missing monthly relationship prediction for ${rashi.id}`);
    assert.ok(pred.healthNe, `Missing monthly health prediction for ${rashi.id}`);
    assert.ok(pred.luckyColorNe, `Missing monthly lucky color for ${rashi.id}`);
    assert.ok(pred.luckyNumber !== undefined, `Missing monthly lucky number for ${rashi.id}`);
  }
});

test('every Rashi has distinct, non-reused predictions across Daily, Weekly, and Monthly periods', () => {
  for (const rashi of RASHIS) {
    const daily = getHoroscope('daily', { rashiId: rashi.id, dateOrKey: '2083-07-29' });
    const weekly = getHoroscope('weekly', { rashiId: rashi.id, nowMs: SAMPLE_NOW_MS });
    const monthly = getHoroscope('monthly', { rashiId: rashi.id, nowMs: SAMPLE_NOW_MS });

    assert.ok(daily.prediction, `Missing daily prediction for ${rashi.id}`);
    assert.ok(weekly.prediction, `Missing weekly prediction for ${rashi.id}`);
    assert.ok(monthly.prediction, `Missing monthly prediction for ${rashi.id}`);

    // Verify distinct content
    assert.notEqual(
      daily.prediction.descriptionNe,
      weekly.prediction.descriptionNe,
      `Daily and weekly descriptions must be distinct for ${rashi.id}`,
    );
    assert.notEqual(
      weekly.prediction.descriptionNe,
      monthly.prediction.descriptionNe,
      `Weekly and monthly descriptions must be distinct for ${rashi.id}`,
    );
  }
});

test('daily coverage uses the selected record date, and current unavailable periods do not fall back', () => {
  const previousDailyRecord = getDailyRashifal('2083-07-28');
  assert.equal(previousDailyRecord.isAvailable, true);
  assert.equal(previousDailyRecord.coverageLabelNe, 'कार्तिक २८, २०८३');

  const nextWeek = getWeeklyRashifal(undefined, undefined, new Date('2026-11-15T06:15:00.000Z').getTime());
  assert.equal(nextWeek.isAvailable, false);
  assert.equal(nextWeek.allPredictions, undefined);

  const laterMonth = getMonthlyRashifal(
    undefined,
    undefined,
    undefined,
    new Date('2026-12-01T06:15:00.000Z').getTime(),
  );
  assert.equal(laterMonth.isAvailable, false);
  assert.equal(laterMonth.allPredictions, undefined);
});

test('non-fabricated fallback behavior: requests for unverified dates or periods return explicit missing status', () => {
  const unverifiedDate = '2083-01-01';
  assert.equal(isRashifalAvailableForDate(unverifiedDate), false);

  const dailyResult = getDailyRashifal(unverifiedDate, 'mesha');
  assert.equal(dailyResult.isAvailable, false);
  assert.equal(dailyResult.period, 'daily');
  assert.equal(dailyResult.prediction, undefined);
  assert.ok(dailyResult.missingMessageNe.includes(unverifiedDate));
  assert.ok(dailyResult.missingMessageEn.includes(unverifiedDate));

  const unverifiedWeekly = getHoroscope('weekly', { dateOrKey: '2090-W99' });
  assert.equal(unverifiedWeekly.isAvailable, false);
  assert.ok(unverifiedWeekly.missingMessageNe.length > 0);

  const unverifiedMonthly = getMonthlyRashifal(2090, 1);
  assert.equal(unverifiedMonthly.isAvailable, false);
  assert.ok(unverifiedMonthly.missingMessageNe.length > 0);
});

test('timezone handling uses Asia/Kathmandu and never displays yesterday as today', () => {
  const rolloverInstant = new Date('2026-11-14T18:20:00.000Z');
  const todayNepal = getTodayNepal(rolloverInstant);
  const todayBsIso = getTodayNepalBsDate(rolloverInstant.getTime());

  assert.equal(todayNepal.bs.iso, '2083-07-29');
  assert.equal(todayBsIso, '2083-07-29');

  const todayResult = getDailyRashifal(todayBsIso);
  assert.equal(todayResult.isAvailable, true);
  assert.equal(todayResult.bsDate, '2083-07-29');
});

test('SEO metadata for daily, weekly, and monthly periods generates valid tags and canonical URLs', () => {
  const now = new Date(SAMPLE_NOW_MS);

  // Main Daily, Weekly, and Monthly Pages
  const dailySeo = getSeoForRoute('/rashifal', ORIGIN, now, false, false, true);
  assert.equal(dailySeo.robots, 'index, follow');
  assert.equal(dailySeo.canonicalPath, '/rashifal');
  assert.ok(dailySeo.title.includes('दैनिक राशिफल'));

  const weeklySeo = getSeoForRoute('/rashifal/weekly', ORIGIN, now, false, false, true);
  assert.equal(weeklySeo.robots, 'index, follow');
  assert.equal(weeklySeo.canonicalPath, '/rashifal/weekly');
  assert.ok(weeklySeo.title.includes('साप्ताहिक राशिफल'));

  const monthlySeo = getSeoForRoute('/rashifal/monthly', ORIGIN, now, false, false, true);
  assert.equal(monthlySeo.robots, 'index, follow');
  assert.equal(monthlySeo.canonicalPath, '/rashifal/monthly');
  assert.ok(monthlySeo.title.includes('मासिक राशिफल'));

  // Single Rashi pages across all three periods
  for (const rashi of RASHIS) {
    const dailyRashiSeo = getSeoForRoute(`/rashifal/${rashi.id}`, ORIGIN, now, false, false, true);
    assert.equal(dailyRashiSeo.robots, 'index, follow');
    assert.equal(dailyRashiSeo.canonicalPath, `/rashifal/${rashi.id}`);
    assert.ok(dailyRashiSeo.title.includes(rashi.nameNe));

    const weeklyRashiSeo = getSeoForRoute(`/rashifal/weekly/${rashi.id}`, ORIGIN, now, false, false, true);
    assert.equal(weeklyRashiSeo.robots, 'index, follow');
    assert.equal(weeklyRashiSeo.canonicalPath, `/rashifal/weekly/${rashi.id}`);
    assert.ok(weeklyRashiSeo.title.includes('साप्ताहिक'));
    assert.ok(weeklyRashiSeo.title.includes(rashi.nameNe));

    const monthlyRashiSeo = getSeoForRoute(`/rashifal/monthly/${rashi.id}`, ORIGIN, now, false, false, true);
    assert.equal(monthlyRashiSeo.robots, 'index, follow');
    assert.equal(monthlyRashiSeo.canonicalPath, `/rashifal/monthly/${rashi.id}`);
    assert.ok(monthlyRashiSeo.title.includes('मासिक'));
    assert.ok(monthlyRashiSeo.title.includes(rashi.nameNe));
  }

  // Invalid Rashi slug returns 404 / noindex
  const invalidSeo = getSeoForRoute('/rashifal/weekly/unknown-slug', ORIGIN, now, false);
  assert.equal(invalidSeo.isNotFound, true);
  assert.equal(invalidSeo.robots, 'noindex, follow');
});

test('sitemap includes daily, weekly, monthly, and all individual Rashi URLs', () => {
  const paths = generateSitemapPaths(false, true);
  assert.ok(paths.includes('/rashifal'), 'Sitemap must include /rashifal');
  assert.ok(paths.includes('/rashifal/weekly'), 'Sitemap must include /rashifal/weekly');
  assert.ok(paths.includes('/rashifal/monthly'), 'Sitemap must include /rashifal/monthly');

  for (const rashi of RASHIS) {
    assert.ok(paths.includes(`/rashifal/${rashi.id}`));
    assert.ok(paths.includes(`/rashifal/weekly/${rashi.id}`));
    assert.ok(paths.includes(`/rashifal/monthly/${rashi.id}`));
  }
});

test('SSR renderToString produces full body HTML for daily Rashifal page', () => {
  // Gate off by default -> 404 page (not published)
  const gateOffHtml = render('/rashifal', ORIGIN, SAMPLE_NOW_MS);
  assert.ok(gateOffHtml.includes('This calendar route is not published'), 'Missing 404 heading when gate is off');
  assert.ok(!gateOffHtml.includes('मेष'), 'No rashi cards when gate is off');
  assert.ok(!gateOffHtml.includes('दैनिक राशिफल'), 'No daily rashifal heading when gate is off');

  // Gate on -> daily readings shown
  const gateOnHtml = render('/rashifal', ORIGIN, SAMPLE_NOW_MS, false, false, '', '', false, true);
  assert.ok(gateOnHtml.includes('दैनिक राशिफल'), 'Missing Daily heading in SSR');
  assert.ok(gateOnHtml.includes('entertainment and reference'), 'Missing English disclaimer when gate is on');
  assert.ok(gateOnHtml.includes('मेष'), 'Missing Mesha card in SSR');
  assert.ok(gateOnHtml.includes('चन्द्रमाको स्थान'), 'Missing moon position in SSR');

  // Sign-change notice when applicable
  const todayBs = getTodayNepal(new Date(SAMPLE_NOW_MS)).bs;
  const engineResult = computeRashifalEngine(todayBs.year, todayBs.month, todayBs.day, 'mesha');
  if (engineResult.changesSignToday) {
    assert.ok(
      gateOnHtml.includes('चन्द्रमाको राशि परिवर्तन आज'),
      'Missing sign-change notice in SSR',
    );
  }
});

