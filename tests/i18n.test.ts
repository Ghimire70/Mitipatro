import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocaleNumber, formatLocaleYear } from '../lib/i18n/format.js';

test('locale formatting keeps years ungrouped in English and Nepali', () => {
  assert.equal(formatLocaleNumber(2083, 'en'), '2083');
  assert.equal(formatLocaleNumber(2083, 'ne'), '२०८३');
  assert.equal(formatLocaleYear(2026, 'en'), '2026');
  assert.equal(formatLocaleYear(2026, 'ne'), '२०२६');
});

test('number formatting can opt into grouping when needed', () => {
  assert.equal(formatLocaleNumber(2083, 'en', { useGrouping: true }), '2,083');
  assert.equal(formatLocaleNumber(2083, 'ne', { useGrouping: true }), '२,०८३');
});
