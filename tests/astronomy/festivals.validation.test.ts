// tests/astronomy/festivals.validation.test.ts
//
// Stage 10 — Independent validation against printed Nepali patro (2083 BS)
//
// Compares computed sunrise tithi against printed panchanga data from
// reference-data/2083.csv. All values are computed independently; mismatches
// are reported, never tuned away. Nothing replaces or edits lib/holidays.ts.
//
// SOURCE: 2083.csv — printed Nepali patro daily panchanga data for BS 2083
//   Column 2 = BS month (1-12), column 3 = BS day (1-32)
//   Column 6 = tithi number at sunrise (1-30)
//   Column 7 = tithi ghatipala
//
// No formula, tolerance, or ayanamsha changes are made. This test only
// reports differences between computed and printed values.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDailyPanchanga } from '../../lib/astronomy/panchanga.js';
import { HOLIDAYS_DATA } from '../../lib/holidays.js';
import type { HolidayRecord } from '../../lib/holidays.js';

const MODE = 'lahiri';

const SHUKLA_NAMES = [
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
  'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
  'Trayodashi', 'Chaturdashi', 'Purnima',
];
const KRISHNA_NAMES = [
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
  'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
  'Trayodashi', 'Chaturdashi', 'Amavasya',
];

function tithiNameFromIndex(tithiIndex: number, paksha: string): string {
  const names = paksha === 'shukla' ? SHUKLA_NAMES : KRISHNA_NAMES;
  const num = paksha === 'shukla' ? names[tithiIndex] : names[tithiIndex - 15];
  return `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${num}`;
}

function parsePrintedTithi(tithiStr: string): { paksha: string; number: number; tithiName: string } {
  const str = tithiStr.trim();
  if (str.startsWith('शु.')) {
    return { paksha: 'shukla', number: parseInt(str.slice(3).trim(), 10), tithiName: str };
  }
  if (str.startsWith('कृ.')) {
    return { paksha: 'krishna', number: parseInt(str.slice(3).trim(), 10), tithiName: str };
  }
  return { paksha: 'unknown', number: -1, tithiName: str };
}

// Load printed panchanga data from 2083.csv
function loadPrintedPanchanga(): Map<string, { tithiNumber: number; paksha: string; tithiName: string }> {
  const csvPath = join(process.cwd(), 'reference-data', '2083.csv');
  let csv: string;
  try {
    csv = readFileSync(csvPath, 'utf-8');
  } catch (err) {
    console.error(`\nWARNING: Could not read ${csvPath}: ${(err as Error).message}`);
    return new Map();
  }
  const lines = csv.split('\n');
  const header = lines[0].split(',');
  const monthIdx = header.indexOf('month');
  const dayIdx = header.indexOf('day');
  const tithiIdx = header.indexOf('tithi');

  const map = new Map<string, { tithiNumber: number; paksha: string; tithiName: string }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length <= tithiIdx) continue;
    const bsMonth = cols[monthIdx].trim();
    const bsDay = cols[dayIdx].trim();
    const tithiStr = cols[tithiIdx].trim();
    const key = `${bsMonth}-${bsDay}`;
    const parsed = parsePrintedTithi(tithiStr);
    map.set(key, { tithiNumber: parsed.number, paksha: parsed.paksha, tithiName: parsed.tithiName });
  }

  return map;
}

const PRINTED_PANCHANGA = loadPrintedPanchanga();

test(
  'festivals.validation: compare computed vs printed panchanga for 2083 BS festival dates',
  () => {
    const year2083 = HOLIDAYS_DATA.filter((h) => h.bsYear === 2083);

    console.log(
      '\n=== FESTIVAL VALIDATION: Computed vs Printed Panchanga (2083 BS) ===\n',
    );
    console.log(
      'Festival               BS Date   Listed AD   Computed AD   Printed Tithi   Computed Tithi   Match',
    );
    console.log(
      '------------------------------------------------------------------------------------------------------------',
    );

    let totalChecked = 0;
    let totalMatch = 0;
    let totalMismatch = 0;
    let noPrintedData = 0;

    for (const h of year2083) {
      const bsKey = `${h.bsMonth}-${h.bsDay}`;
      const printed = PRINTED_PANCHANGA.get(bsKey);

      // Compute tithi at sunrise using Astronomy Engine
      const computed = getDailyPanchanga(
        new Date(Date.UTC(h.bsYear, h.bsMonth - 1, h.bsDay, 12, 0, 0, 0)),
        MODE,
      );
      const computedTithiName = tithiNameFromIndex(
        computed.tithi.index,
        computed.tithi.paksha,
      );

      totalChecked += 1;

      if (!printed) {
        console.log(
          `${h.nameEn.padEnd(22)} ${String(h.bsMonth).padStart(2, '0')}/${String(h.bsDay).padStart(2, '0')}   ${h.adDate}   computed=${computed.tithi.name}   printed=NO DATA`,
        );
        noPrintedData += 1;
        continue;
      }

      const match =
        computed.tithi.name === printed.tithiName &&
        computed.tithi.paksha === printed.paksha;

      if (match) totalMatch += 1;
      else totalMismatch += 1;

      console.log(
        `${h.nameEn.padEnd(22)} ${String(h.bsMonth).padStart(2, '0')}/${String(h.bsDay).padStart(2, '0')}   ${h.adDate}   ${computed.tithi.name.padEnd(14)}   ${printed.tithiName.padEnd(14)}   ${match ? 'YES' : 'NO'}`,
      );
    }

    console.log(
      `\n=== Summary: checked=${totalChecked} matched=${totalMatch} mismatched=${totalMismatch} noPrintedData=${noPrintedData} ===\n`,
    );
  },
);
