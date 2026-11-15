import React, { useMemo, useState } from 'react';
import { BS_MAX_YEAR, BS_MIN_YEAR, BS_MONTHS } from '../../lib/bsData';
import {
  BsDateError,
  getTodayNepal,
  validateBsDate,
} from '../../lib/bsConverter';
import {
  convertNepaliNumber,
  formatBsDateInput,
  getBsAge,
  getBsDateMonthLength,
  getElapsedBsDays,
  MAX_NEPALI_NUMBER,
  type BsDateInput,
  type ConverterToolSlug,
} from '../../lib/converterTools';
import type { FaqItem } from '../../lib/seo';
import { FaqSection } from '../components/FaqSection';

interface ConverterToolsPageProps {
  tool: ConverterToolSlug;
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

interface BsDateFieldsValue {
  year: string;
  month: string;
  day: string;
}

const TOOL_COPY: Record<ConverterToolSlug, { title: string; description: string }> = {
  'bs-date-difference': {
    title: 'BS Date Difference Calculator',
    description: 'Find the elapsed days between two Bikram Sambat dates.',
  },
  'bs-age-calculator': {
    title: 'BS Age Calculator',
    description: 'Calculate completed years, months, and days between two BS dates.',
  },
  'nepali-numbers': {
    title: 'Nepali Digit and Number-to-Words Converter',
    description: 'Convert whole numbers between Arabic and Devanagari digits and display a Nepali word form.',
  },
};

function dateToFields(date: BsDateInput): BsDateFieldsValue {
  return {
    year: String(date.year),
    month: String(date.month),
    day: String(date.day),
  };
}

function fieldsToDate(fields: BsDateFieldsValue): BsDateInput {
  return {
    year: Number(fields.year),
    month: Number(fields.month),
    day: Number(fields.day),
  };
}

interface BsDateFieldsProps {
  id: string;
  label: string;
  value: BsDateFieldsValue;
  onChange: (value: BsDateFieldsValue) => void;
}

const BsDateFields: React.FC<BsDateFieldsProps> = ({ id, label, value, onChange }) => {
  const maxDay = getBsDateMonthLength(fieldsToDate(value)) || 32;
  const update = (key: keyof BsDateFieldsValue, next: string) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <fieldset className="rounded-lg border border-stone-200 p-4">
      <legend className="px-1 text-sm font-semibold text-stone-800">{label}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${id}-year`} className="block text-xs font-medium text-stone-600">
            BS year ({BS_MIN_YEAR}–{BS_MAX_YEAR})
          </label>
          <input
            id={`${id}-year`}
            type="number"
            min={BS_MIN_YEAR}
            max={BS_MAX_YEAR}
            step={1}
            value={value.year}
            onChange={(event) => update('year', event.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm tabular-nums focus:border-[#9A3412] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={`${id}-month`} className="block text-xs font-medium text-stone-600">
            BS month
          </label>
          <select
            id={`${id}-month`}
            value={value.month}
            onChange={(event) => update('month', event.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm focus:border-[#9A3412] focus:outline-none"
          >
            {BS_MONTHS.map((month) => (
              <option key={month.index} value={month.index}>
                {month.en} ({month.ne})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-day`} className="block text-xs font-medium text-stone-600">
            BS day (1–{maxDay})
          </label>
          <input
            id={`${id}-day`}
            type="number"
            min={1}
            max={maxDay}
            step={1}
            value={value.day}
            onChange={(event) => update('day', event.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm tabular-nums focus:border-[#9A3412] focus:outline-none"
          />
        </div>
      </div>
    </fieldset>
  );
};

function getDateError(date: BsDateInput): string | null {
  const validation = validateBsDate(date.year, date.month, date.day);
  return validation.valid ? null : validation.error ?? 'Enter a valid BS date.';
}

export const ConverterToolsPage: React.FC<ConverterToolsPageProps> = ({
  tool,
  faqs,
  nowMs,
  onNavigate,
}) => {
  const today = useMemo(
    () => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined).bs,
    [nowMs],
  );
  const monthStart = useMemo(() => {
    return { year: today.year, month: today.month, day: 1 };
  }, [today]);

  const [fromDate, setFromDate] = useState(() => dateToFields(monthStart));
  const [toDate, setToDate] = useState(() => dateToFields(today));
  const [birthDate, setBirthDate] = useState(() =>
    dateToFields({ year: BS_MIN_YEAR, month: 1, day: 1 }),
  );
  const [asOfDate, setAsOfDate] = useState(() => dateToFields(today));
  const [numberInput, setNumberInput] = useState('12345');
  const [numberError, setNumberError] = useState<string | null>(null);
  const [numberResult, setNumberResult] = useState(() => convertNepaliNumber('12345'));

  const copy = TOOL_COPY[tool];
  const from = fieldsToDate(fromDate);
  const to = fieldsToDate(toDate);
  const birth = fieldsToDate(birthDate);
  const asOf = fieldsToDate(asOfDate);
  const dateError =
    tool === 'bs-date-difference'
      ? getDateError(from) ?? getDateError(to)
      : tool === 'bs-age-calculator'
        ? getDateError(birth) ?? getDateError(asOf)
        : null;

  let dateResult: number | ReturnType<typeof getBsAge> | null = null;
  let calculationError = dateError;
  if (!dateError && tool === 'bs-date-difference') {
    dateResult = getElapsedBsDays(from, to);
  } else if (!dateError && tool === 'bs-age-calculator') {
    try {
      dateResult = getBsAge(birth, asOf);
    } catch (error) {
      if (error instanceof BsDateError || error instanceof RangeError) {
        calculationError = error.message;
      } else {
        throw error;
      }
    }
  }

  const handleLink = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(path);
  };

  const handleNumberSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = convertNepaliNumber(numberInput);
      setNumberResult(result);
      setNumberError(null);
    } catch (error) {
      if (error instanceof RangeError) {
        setNumberError(error.message);
      } else {
        throw error;
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(event) => handleLink(event, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">{copy.title}</span>
      </nav>

      <header className="mt-4 border-b border-stone-200 pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{copy.description}</p>
        {tool !== 'nepali-numbers' && (
          <p className="mt-3 text-xs text-stone-500">
            Date inputs must be valid BS dates in the supported range {BS_MIN_YEAR}–{BS_MAX_YEAR} BS.
          </p>
        )}
      </header>

      {tool === 'bs-date-difference' && (
        <section aria-label="Calculate elapsed days" className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
          <BsDateFields id="difference-from" label="From date" value={fromDate} onChange={setFromDate} />
          <BsDateFields id="difference-to" label="To date" value={toDate} onChange={setToDate} />
          <div className="border-t border-stone-200 pt-4" aria-live="polite">
            {calculationError ? (
              <p role="alert" className="text-sm font-medium text-red-800">{calculationError}</p>
            ) : (
              <p className="text-lg font-semibold text-stone-900">
                {typeof dateResult === 'number' ? dateResult : null} elapsed {dateResult === 1 ? 'day' : 'days'}
                <span className="mt-1 block text-xs font-normal text-stone-600">
                  The starting date is not counted as an elapsed day.
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {tool === 'bs-age-calculator' && (
        <section aria-label="Calculate age in BS" className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
          <BsDateFields id="age-birth" label="Birth date" value={birthDate} onChange={setBirthDate} />
          <BsDateFields id="age-as-of" label="As of date" value={asOfDate} onChange={setAsOfDate} />
          <p className="text-xs leading-relaxed text-stone-500">
            Month anniversaries use the last day of the target month when the birth day does not exist in that month.
          </p>
          <div className="border-t border-stone-200 pt-4" aria-live="polite">
            {calculationError ? (
              <p role="alert" className="text-sm font-medium text-red-800">{calculationError}</p>
            ) : (
              <p className="text-lg font-semibold text-stone-900">
                {dateResult && typeof dateResult !== 'number' && (
                  <>
                    {dateResult.years} years, {dateResult.months} months, {dateResult.days} days
                    <span className="mt-1 block text-xs font-normal text-stone-600">
                      From {formatBsDateInput(birth)} to {formatBsDateInput(asOf)}.
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {tool === 'nepali-numbers' && (
        <section aria-label="Convert Nepali numbers" className="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
          <form onSubmit={handleNumberSubmit}>
            <label htmlFor="nepali-number-input" className="block text-sm font-medium text-stone-700">
              Whole number (0–{MAX_NEPALI_NUMBER.toLocaleString('en-US')})
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="nepali-number-input"
                type="text"
                inputMode="numeric"
                value={numberInput}
                onChange={(event) => setNumberInput(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 font-mono text-sm tabular-nums focus:border-[#9A3412] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-11 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
              >
                Convert number
              </button>
            </div>
          </form>
          {numberError ? (
            <p role="alert" className="mt-4 text-sm font-medium text-red-800">{numberError}</p>
          ) : (
            <dl className="mt-5 grid gap-3 border-t border-stone-200 pt-5 sm:grid-cols-3" aria-live="polite">
              <div>
                <dt className="text-xs font-medium text-stone-500">Arabic digits</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-stone-900">{numberResult.arabicDigits}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Devanagari digits</dt>
                <dd className="mt-1 text-lg font-semibold text-stone-900">{numberResult.nepaliDigits}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Nepali words</dt>
                <dd className="mt-1 text-lg font-semibold text-stone-900">{numberResult.words}</dd>
              </div>
            </dl>
          )}
          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            Word spellings can vary; this tool uses one display form and does not accept decimals or negative numbers.
          </p>
        </section>
      )}

      <nav aria-label="More date tools" className="mt-8">
        <h2 className="font-display text-lg font-semibold text-stone-900">More date tools</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href="/date-converter" onClick={(event) => handleLink(event, '/date-converter')} className="font-medium text-[#9A3412] hover:underline">
            BS to AD date converter
          </a>
          {(['/bs-date-difference', '/bs-age-calculator', '/nepali-numbers'] as const)
            .filter((path) => path !== `/${tool}`)
            .map((path) => (
              <a key={path} href={path} onClick={(event) => handleLink(event, path)} className="font-medium text-[#9A3412] hover:underline">
                {TOOL_COPY[path.slice(1) as ConverterToolSlug].title}
              </a>
            ))}
        </div>
      </nav>

      <FaqSection faqs={faqs} />
    </div>
  );
};
