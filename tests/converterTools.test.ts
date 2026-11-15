import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertNepaliNumber,
  getBsAge,
  getElapsedBsDays,
  parseNepaliInteger,
  toArabicDigits,
  toNepaliNumberWords,
} from '../lib/converterTools';

test('BS date difference uses converter dates and reports elapsed, not inclusive, days', () => {
  assert.equal(getElapsedBsDays(
    { year: 2083, month: 6, day: 31 },
    { year: 2083, month: 7, day: 1 },
  ), 1);
  assert.equal(getElapsedBsDays(
    { year: 2083, month: 7, day: 1 },
    { year: 2083, month: 6, day: 31 },
  ), 1);
  assert.equal(getElapsedBsDays(
    { year: 2083, month: 7, day: 1 },
    { year: 2083, month: 7, day: 1 },
  ), 0);
});

test('BS date difference rejects invalid dates and dates outside the supported years', () => {
  assert.throws(
    () => getElapsedBsDays(
      { year: 1999, month: 1, day: 1 },
      { year: 2083, month: 1, day: 1 },
    ),
    { name: 'BsDateError', code: 'YEAR_OUT_OF_RANGE' },
  );
  assert.throws(
    () => getElapsedBsDays(
      { year: 2083, month: 8, day: 30 },
      { year: 2083, month: 8, day: 29 },
    ),
    { name: 'BsDateError', code: 'INVALID_DAY' },
  );
});

test('BS age reports completed years, months, and days with a clipped month anniversary', () => {
  assert.deepEqual(
    getBsAge(
      { year: 2083, month: 1, day: 1 },
      { year: 2084, month: 1, day: 1 },
    ),
    { years: 1, months: 0, days: 0 },
  );
  assert.deepEqual(
    getBsAge(
      { year: 2083, month: 7, day: 30 },
      { year: 2083, month: 8, day: 29 },
    ),
    { years: 0, months: 1, days: 0 },
  );
});

test('BS age rejects reversed and out-of-range dates', () => {
  assert.throws(
    () => getBsAge(
      { year: 2083, month: 2, day: 1 },
      { year: 2083, month: 1, day: 1 },
    ),
    /Birth date must not be after the as-of date/,
  );
  assert.throws(
    () => getBsAge(
      { year: 2091, month: 1, day: 1 },
      { year: 2091, month: 1, day: 2 },
    ),
    { name: 'BsDateError', code: 'YEAR_OUT_OF_RANGE' },
  );
});

test('Nepali number conversion accepts both digit sets and formats Nepali words', () => {
  assert.equal(toArabicDigits('१२३४५'), '12345');
  assert.equal(parseNepaliInteger('१२३४५'), 12345);
  assert.deepEqual(convertNepaliNumber('१२३४५'), {
    value: 12345,
    arabicDigits: '12345',
    nepaliDigits: '१२३४५',
    words: 'बाह्र हजार तीन सय पैँतालीस',
  });
  assert.equal(toNepaliNumberWords(0), 'शून्य');
  assert.equal(toNepaliNumberWords(123), 'एक सय तेइस');
  assert.equal(toNepaliNumberWords(999_999_999), 'उनान्सय करोड उनान्सय लाख उनान्सय हजार नौ सय उनान्सय');
});

test('Nepali number conversion rejects non-integers and values outside its stated range', () => {
  for (const input of ['', '-1', '1.5', 'abc', '1000000000']) {
    assert.throws(() => parseNepaliInteger(input), RangeError, `Expected rejection for ${input}`);
  }
  assert.throws(() => toNepaliNumberWords(-1), RangeError);
});
