import type { Locale } from './types.js';
import { toDevanagariDigits } from '../bsConverter.js';

export function formatDigits(value: number | string, locale: Locale): string {
  if (locale === 'ne') return toDevanagariDigits(value);
  return String(value);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  if (locale === 'ne') {
    const formatted = new Intl.NumberFormat('ne-NP', {
      useGrouping: true,
      ...options,
    }).format(value);
    return formatted.replace(/[\d]/g, (digit) => {
      const devanagari = '०१२३४५६७८९';
      return devanagari[Number(digit)] ?? digit;
    });
  }
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatLocaleNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, options);
}

export function formatLocaleDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(
    locale === 'ne' ? 'ne-NP' : 'en-US',
    {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    },
  ).format(date);
}

export function formatLocaleTime(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(
    locale === 'ne' ? 'ne-NP' : 'en-US',
    {
      timeZone: 'Asia/Kathmandu',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options,
    },
  ).format(date);
}
