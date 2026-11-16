// scripts/elevation_variant_compare.mjs
//
// Scratch script used during Stage 6 to compare three observer-height variants
// against 7 published VedicMarga Kathmandu sunrise/sunset pairs (14 values).
//
// Variants:
//   (a) Observer height=0 m, metersAboveGround=0   -> matches all 14 (0.00 min)
//   (b) Observer height=1400 m, metersAboveGround=0 -> off by up to 1 min
//   (c) Observer height=0 m, metersAboveGround=1400 -> throws (negative elevation)
//
// Variant (a) was adopted for Stage 6: OBSERVER_ELEVATION_METERS = 0,
// OBSERVER_METERS_ABOVE_GROUND = 0. Kathmandu's true elevation (~1400 m) does
// NOT match the published reference times; the published times correspond to a
// sea-level observer convention.
//
// The difference reported here (0.00 min) differs from the reference test's
// difference (0.15–0.93 min) because this script rounded each computed time to
// the nearest minute (nptFromUtc emits only HH:MM), whereas the reference test
// compares against the unrounded computed value (see sunriseSunset.reference.test.ts).

import { SearchRiseSet, Observer, Body } from '../node_modules/astronomy-engine/astronomy.js';

const KATH_LAT = 27.7172;
const KATH_LON = 85.3240;
const KATH_OFFSET_S = 5 * 3600 + 45 * 60; // 20700

const rows = [
  ['2024-03-26', '06:00', '18:18'],
  ['2024-07-01', '05:11', '19:03'],
  ['2025-04-08', '05:46', '18:24'],
  ['2025-06-16', '05:07', '19:01'],
  ['2025-07-23', '05:21', '18:58'],
  ['2026-03-16', '06:12', '18:12'],
  ['2026-09-28', '05:54', '17:53'],
];

function utcFromNpt(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, hh, mm, 0, 0) - KATH_OFFSET_S * 1000);
}

function nptFromUtc(utcDate) {
  const ms = utcDate.getTime() + KATH_OFFSET_S * 1000;
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function findSunriseSunset(dateStr, height, metersAboveGround) {
  const obs = new Observer(KATH_LAT, KATH_LON, height);
  const start = utcFromNpt(dateStr, '00:00');
  let riseStr = 'ERROR';
  let setStr = 'ERROR';
  try {
    const rise = SearchRiseSet(Body.Sun, obs, +1, start, 2, metersAboveGround);
    const set = SearchRiseSet(Body.Sun, obs, -1, start, 2, metersAboveGround);
    if (rise) riseStr = nptFromUtc(rise.date);
    if (set) setStr = nptFromUtc(set.date);
  } catch (e) {
    riseStr = 'ERR:' + e.message;
    setStr = 'ERR:' + e.message;
  }
  return { rise: riseStr, set: setStr };
}

const variants = [
  { name: '(a) height=0, mag=0', height: 0, mag: 0 },
  { name: '(b) height=1400, mag=0', height: 1400, mag: 0 },
  { name: '(c) height=0, mag=1400', height: 0, mag: 1400 },
];

console.log('=== Elevation Variant Comparison ===\n');
console.log('Kathmandu: 27.7172° N, 85.3240° E');
console.log('Variant (a): Observer height=0m (sea level), metersAboveGround=0');
console.log('Variant (b): Observer height=1400m, metersAboveGround=0');
console.log('Variant (c): Observer height=0m, metersAboveGround=1400m\n');

for (const row of rows) {
  const [date, expRise, expSet] = row;
  console.log(`--- ${date} (site: rise ${expRise}, set ${expSet}) ---`);
  for (const v of variants) {
    const r = findSunriseSunset(date, v.height, v.mag);
    const expRiseMs = utcFromNpt(date, expRise).getTime();
    const expSetMs = utcFromNpt(date, expSet).getTime();
    let riseDiff = 'N/A';
    let setDiff = 'N/A';
    if (r.rise !== 'null' && !r.rise.startsWith('ERR')) {
      const riseMs = utcFromNpt(date, r.rise).getTime();
      riseDiff = ((expRiseMs - riseMs) / 60000).toFixed(2);
    }
    if (r.set !== 'null' && !r.set.startsWith('ERR')) {
      const setMs = utcFromNpt(date, r.set).getTime();
      setDiff = ((expSetMs - setMs) / 60000).toFixed(2);
    }
    console.log(`  ${v.name}: rise=${r.rise} (diff ${riseDiff} min), set=${r.set} (diff ${setDiff} min)`);
  }
  console.log();
}
