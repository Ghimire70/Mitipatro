import React from 'react';
import { bsToAd } from '../../lib/bsConverter';
import type { FaqItem } from '../../lib/seo';
import { DateConverter } from '../components/DateConverter';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';

interface ConverterPageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

const REFERENCE_ANCHORS = [
  { bsYear: 2000, note: 'Primary verified anchor epoch' },
  { bsYear: 2080, note: '2023–2024 AD' },
  { bsYear: 2081, note: '2024–2025 AD (366-day BS year)' },
  { bsYear: 2082, note: '2025–2026 AD' },
  { bsYear: 2083, note: '2026–2027 AD (Current BS year)' },
  { bsYear: 2084, note: '2027–2028 AD' },
  { bsYear: 2085, note: '2028–2029 AD (366-day BS year)' },
];

export const ConverterPage: React.FC<ConverterPageProps> = ({ faqs, nowMs, onNavigate }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">BS to AD Date Converter</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        BS to AD &amp; AD to BS Date Converter
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Convert any Bikram Sambat (BS) date between 2000 and 2090 BS to its exact Gregorian (AD) equivalent, or convert AD dates (1943–2034) into Nepali dates with Devanagari formatting.
      </p>

      <div className="mt-6">
        <DateConverter nowMs={nowMs} onNavigate={onNavigate} />
      </div>

      <div className="mt-8">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Reference Table */}
      <section aria-labelledby="anchor-table-heading" className="mt-10">
        <h2 id="anchor-table-heading" className="font-display text-2xl font-semibold text-stone-900">
          Nepali New Year (1 Baisakh) Reference Dates
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Because Bikram Sambat months range from 29 to 32 days based on solar sankranti moments, every conversion counts exact days from 1 Baisakh 2000 BS (April 14, 1943 AD).
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-[#F3EFE6]/60 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-3">BS Date</th>
                <th className="px-4 py-3">Gregorian (AD)</th>
                <th className="px-4 py-3">Weekday</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {REFERENCE_ANCHORS.map((row) => {
                const ad = bsToAd(row.bsYear, 1, 1);
                return (
                  <tr key={row.bsYear} className="hover:bg-[#FBF9F5]">
                    <td className="px-4 py-3 font-mono font-semibold text-stone-900 tabular-nums">
                      1 Baisakh {row.bsYear}
                    </td>
                    <td className="px-4 py-3 font-mono text-stone-700 tabular-nums">
                      {ad.formattedEn}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{ad.weekdayEn}</td>
                    <td className="px-4 py-3 text-stone-500">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FaqSection faqs={faqs} />
    </div>
  );
};
