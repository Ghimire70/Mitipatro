import React from 'react';
import { bsToAd } from '../../lib/bsConverter';
import type { FaqItem } from '../../lib/seo';
import { DateConverter } from '../components/DateConverter';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { useLocale } from '../../contexts/LocaleContext';

interface ConverterPageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

const REFERENCE_ANCHORS = [
  { bsYear: 2000, note: 'Conversion anchor' },
  { bsYear: 2080, note: '2023–2024 AD' },
  { bsYear: 2081, note: '2024–2025 AD (366-day BS year)' },
  { bsYear: 2082, note: '2025–2026 AD' },
  { bsYear: 2083, note: '2026–2027 AD (Current BS year)' },
  { bsYear: 2084, note: '2027–2028 AD' },
  { bsYear: 2085, note: '2028–2029 AD (366-day BS year)' },
];

export const ConverterPage: React.FC<ConverterPageProps> = ({ faqs, nowMs, onNavigate }) => {
  const { t } = useLocale();
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          {t('routes.home')}
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">{t('navigation.dateConverter')}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {t('routes.converterTitle')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {t('routes.converterSubtitle')}
      </p>

      <div className="mt-6">
        <DateConverter nowMs={nowMs} onNavigate={onNavigate} />
      </div>

      <section aria-labelledby="more-bs-tools" className="mt-8">
        <h2 id="more-bs-tools" className="font-display text-xl font-semibold text-stone-900">
          {t('routes.moreTools')}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              href: '/bs-date-difference',
              title: 'BS Date Difference',
              description: 'Count elapsed days between two BS dates.',
            },
            {
              href: '/bs-age-calculator',
              title: 'BS Age Calculator',
              description: 'Show age as completed BS years, months, and days.',
            },
            {
              href: '/nepali-numbers',
              title: 'Nepali Number Converter',
              description: 'Convert Arabic and Devanagari digits and show words.',
            },
          ].map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              onClick={(event) => handleLink(event, tool.href)}
              className="rounded-lg border border-stone-200 bg-white p-4 hover:border-[#9A3412]/50 hover:shadow-xs"
            >
              <span className="block text-sm font-semibold text-stone-900">{tool.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-stone-600">{tool.description}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Reference Table */}
      <section aria-labelledby="anchor-table-heading" className="mt-10">
        <h2 id="anchor-table-heading" className="font-display text-2xl font-semibold text-stone-900">
          {t('routes.referenceDates')}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Conversions use a stored table of BS month lengths and count days from the 1 Baisakh 2000 BS (April 14, 1943 AD) anchor. Tests cover selected published date pairs and conversion round trips within the supported range.
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
