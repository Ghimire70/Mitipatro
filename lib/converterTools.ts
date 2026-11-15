import { BS_MAX_YEAR, BS_MIN_YEAR, BS_MONTH_DAYS } from './bsData';
import {
  BsDateError,
  bsToAd,
  getDaysInBsMonth,
  validateBsDate,
} from './bsConverter';

const MS_PER_DAY = 86_400_000;
export const MAX_NEPALI_NUMBER = 999_999_999;
export type ConverterToolSlug = 'bs-date-difference' | 'bs-age-calculator' | 'nepali-numbers';

export interface BsDateInput {
  year: number;
  month: number;
  day: number;
}

export interface BsAge {
  years: number;
  months: number;
  days: number;
}

function assertValidBsDate(date: BsDateInput): void {
  const validation = validateBsDate(date.year, date.month, date.day);
  if (!validation.valid) {
    throw new BsDateError(
      validation.code ?? 'INVALID_TYPE',
      validation.error ?? 'Enter a valid BS date.',
    );
  }
}

function bsDateAsUtcDay(date: BsDateInput): number {
  assertValidBsDate(date);
  const ad = bsToAd(date.year, date.month, date.day);
  return Math.floor(Date.UTC(ad.year, ad.month - 1, ad.day) / MS_PER_DAY);
}

function compareBsDates(first: BsDateInput, second: BsDateInput): number {
  return bsDateAsUtcDay(first) - bsDateAsUtcDay(second);
}

export function getElapsedBsDays(from: BsDateInput, to: BsDateInput): number {
  return Math.abs(bsDateAsUtcDay(to) - bsDateAsUtcDay(from));
}

function addBsMonths(date: BsDateInput, monthsToAdd: number): BsDateInput {
  const monthIndex = (date.year - BS_MIN_YEAR) * 12 + date.month - 1 + monthsToAdd;
  const year = BS_MIN_YEAR + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  if (year > BS_MAX_YEAR) {
    throw new BsDateError(
      'YEAR_OUT_OF_RANGE',
      `BS year ${year} is outside the supported range (${BS_MIN_YEAR}–${BS_MAX_YEAR} BS).`,
    );
  }

  return {
    year,
    month,
    day: Math.min(date.day, getDaysInBsMonth(year, month)),
  };
}

export function getBsAge(birthDate: BsDateInput, asOfDate: BsDateInput): BsAge {
  assertValidBsDate(birthDate);
  assertValidBsDate(asOfDate);
  if (compareBsDates(birthDate, asOfDate) > 0) {
    throw new RangeError('Birth date must not be after the as-of date.');
  }

  let totalMonths =
    (asOfDate.year - birthDate.year) * 12 + asOfDate.month - birthDate.month;
  let monthAnniversary = addBsMonths(birthDate, totalMonths);
  if (compareBsDates(monthAnniversary, asOfDate) > 0) {
    totalMonths -= 1;
    monthAnniversary = addBsMonths(birthDate, totalMonths);
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const days = bsDateAsUtcDay(asOfDate) - bsDateAsUtcDay(monthAnniversary);
  return { years, months, days };
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
export function toArabicDigits(value: string): string {
  return value.replace(/[०-९]/g, (digit) => String(DEVANAGARI_DIGITS.indexOf(digit)));
}

const NEPALI_CARDINALS_0_TO_99 = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  'दस', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तीस',
  'तीस', 'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौँतीस', 'पैँतीस', 'छत्तीस', 'सैँतीस', 'अठतीस', 'उनन्चालीस',
  'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चवालीस', 'पैँतालीस', 'छयालीस', 'सतचालीस', 'अठचालीस', 'उनन्चास',
  'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चउन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी',
  'साठी', 'एकसट्ठी', 'बासट्ठी', 'त्रिसट्ठी', 'चौंसट्ठी', 'पैँसट्ठी', 'छैसट्ठी', 'सतसट्ठी', 'अठसट्ठी', 'उनन्सत्तरी',
  'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'असी', 'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
  'नब्बे', 'एकान्नब्बे', 'बयानब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पन्चान्नब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनान्सय',
] as const;

export function parseNepaliInteger(input: string): number {
  const normalized = toArabicDigits(input.trim());
  if (!/^\d+$/.test(normalized)) {
    throw new RangeError('Enter a whole number using Arabic or Devanagari digits.');
  }

  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value > MAX_NEPALI_NUMBER) {
    throw new RangeError(`Enter a whole number from 0 to ${MAX_NEPALI_NUMBER}.`);
  }
  return value;
}

export function toNepaliNumberWords(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_NEPALI_NUMBER) {
    throw new RangeError(`Enter a whole number from 0 to ${MAX_NEPALI_NUMBER}.`);
  }
  if (value < 100) return NEPALI_CARDINALS_0_TO_99[value];

  let remaining = value;
  const parts: string[] = [];
  const units = [
    { value: 10_000_000, label: 'करोड' },
    { value: 100_000, label: 'लाख' },
    { value: 1_000, label: 'हजार' },
    { value: 100, label: 'सय' },
  ];

  for (const unit of units) {
    const count = Math.floor(remaining / unit.value);
    if (count > 0) {
      parts.push(NEPALI_CARDINALS_0_TO_99[count], unit.label);
      remaining %= unit.value;
    }
  }

  if (remaining > 0) parts.push(NEPALI_CARDINALS_0_TO_99[remaining]);
  return parts.join(' ');
}

export function convertNepaliNumber(input: string): {
  value: number;
  arabicDigits: string;
  nepaliDigits: string;
  words: string;
} {
  const value = parseNepaliInteger(input);
  const arabicDigits = String(value);
  const nepaliDigits = arabicDigits.replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]);
  return {
    value,
    arabicDigits,
    nepaliDigits,
    words: toNepaliNumberWords(value),
  };
}

export function getBsDateMonthLength(date: BsDateInput): number {
  return BS_MONTH_DAYS[date.year]?.[date.month - 1] ?? 0;
}

export function formatBsDateInput(date: BsDateInput): string {
  const ad = bsToAd(date.year, date.month, date.day);
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} BS (${ad.iso} AD)`;
}
