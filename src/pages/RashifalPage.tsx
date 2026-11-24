// src/pages/RashifalPage.tsx
//
// Rashifal page — daily only, position-based readings.
// Method: Moon's sidereal position computed by lib/rashifalEngine.ts
// (Astronomy Engine VSOP87/ELP2000-82B pipeline, Lahiri ayanamsha).
// Content: lib/rashifalReadings.ts (editorial, supplied separately).
// Gate: controlled by RASHIFAL_INDEXING_ENABLED via lib/siteConfig.ts.
//   When off: noindex, out of sitemap, unlinked, sample-content note only.
//
// SOURCES:
//   - Astronomy Engine (VSOP87/ELP2000-82B) — named and opened.
//   - Lahiri ayanamsha — named and opened (lib/astronomy/ayanamsha.ts).
//   - Reading text: 'original-editorial' (supplied separately); all 12 positions
//     have an approved variant "a" reading in lib/rashifalReadings.ts.
//
// DISCLAIMER: Entertainment and reference only. Based on the Moon's sidereal
// position. No accuracy claim. Not a substitute for professional advice.

import React, { useMemo } from 'react';
import { Compass } from 'lucide-react';
import {
  computeRashifalEngine,
  moonPositionFromSign,
} from '../../lib/rashifalEngine.js';
import { RASHIFAL_READINGS, type RashifalReading } from '../../lib/rashifalReadings.js';
import { RASHIS } from '../../lib/rashifal.js';
import { bsToAd, getTodayNepal } from '../../lib/bsConverter.js';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';

const DAILY_TITLE_NE = 'दैनिक राशिफल';
const DAILY_TITLE_EN = 'Daily Horoscope';

const DISCLAIMER_NE =
  'यो पृष्ठ केवल मनोरञ्जन तथा सन्दर्भको लागि हो। यो चन्द्रमाको राशि स्थितिमा आधारित छ र कुनै सटीकता दाबी गर्दैन।';
const DISCLAIMER_EN =
  "This page is for entertainment and reference only. It is based on the Moon's sidereal position and makes no accuracy claim. Not a substitute for professional advice.";

const RASHI_LABELS: readonly string[] = [
  'मेष (Aries)', 'वृष (Taurus)', 'मिथुन (Gemini)', 'कर्कट (Cancer)',
  'सिंह (Leo)', 'कन्या (Virgo)', 'तुला (Libra)', 'वृश्चिक (Scorpio)',
  'धनु (Sagittarius)', 'मकर (Capricorn)', 'कुम्भ (Aquarius)', 'मीन (Pisces)',
];

export const RashifalPage: React.FC<{
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
}> = ({ faqs, nowMs, onNavigate, rashifalIndexingEnabled = false }) => {
  const today = useMemo(
    () => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined),
    [nowMs],
  );

  // Gate: when off, Rashifal is noindex, out of sitemap, unlinked.
  if (!rashifalIndexingEnabled) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="hover:text-[#9A3412] hover:underline"
              >
                क्यालेन्डर गृहपृष्ठ
              </a>
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-3xl font-bold text-stone-900 mt-6 mb-4">
          {DAILY_TITLE_NE} ({DAILY_TITLE_EN})
        </h1>
        <div className="rounded-xl border border-stone-200 bg-amber-50 p-6 shadow-xs">
          <Compass className="mx-auto h-10 w-10 text-amber-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-stone-900">
            नमुना सामग्री (Sample Content)
          </h2>
          <p className="mt-2 text-sm text-stone-700 max-w-xl mx-auto">
            दैनिक राशिफल सामग्री हाल उपलब्ध छैन। राशिफल प्रकाशित गर्नको लागि
            RASHIFAL_INDEXING_ENABLED सेट गर्नुहोस् र सम्पादकीय सामग्री थप्नुहोस्।
          </p>
          <p className="mt-1 text-xs text-stone-500 max-w-xl mx-auto">
            {DISCLAIMER_NE}
          </p>
          <p className="mt-1 text-xs text-stone-500 max-w-xl mx-auto">
            {DISCLAIMER_EN}
          </p>
        </div>
      </div>
    );
  }

  const bsYear = today.bs.year;
  const bsMonth = today.bs.month;
  const bsDay = today.bs.day;

  const adInfo = bsToAd(bsYear, bsMonth, bsDay);

  const engineResult = computeRashifalEngine(bsYear, bsMonth, bsDay, 'mesha');
  const moonRashiIndex = engineResult.moonRashiIndex;
  const nextChange = engineResult.nextChangeUtc;
  const changesSignToday = engineResult.changesSignToday;

  // Format next change time as Kathmandu NPT
  const nextChangeKathmandu = nextChange
    ? new Date(nextChange.getTime() + 5 * 3600 * 1000 + 45 * 60 * 1000)
        .toISOString()
        .replace(/T/, ' ')
        .replace(/\..*/, '') + ' NPT'
    : null;

  // Build readings for all 12 rashis
  const readingsByRashi = useMemo(() => {
    const readings: Record<string, { reading: RashifalReading | null; position: number }> = {};

    for (const rashi of RASHIS) {
      const position = moonPositionFromSign(rashi.order - 1, moonRashiIndex);
      // Only approved editorial readings (variant "a") are published. Variants
      // b/c are unpublished placeholders and must never blank out the page.
      const variant: 'a' | 'b' | 'c' = 'a';
      const reading = RASHIFAL_READINGS.find(
        (r) => r.position === position && r.variant === variant,
      );
      const approvedReading =
        reading &&
        reading.approved === true &&
        reading.source === 'original-editorial' &&
        reading.textNe.trim().length > 0
          ? reading
          : null;
      readings[rashi.id] = { reading: approvedReading, position };
    }

    return readings;
  }, [bsYear, bsMonth, bsDay, adInfo, moonRashiIndex]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="hover:text-[#9A3412] hover:underline"
            >
              क्यालेन्डर गृहपृष्ठ
            </a>
          </li>
          <li>
            <span className="text-stone-400">{DAILY_TITLE_NE}</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mt-6 mb-6">
        <h1 className="font-display text-3xl font-bold text-stone-900">
          {DAILY_TITLE_NE} ({DAILY_TITLE_EN})
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          मंसिर {bsDay}, {bsYear} वि.सं.
          ({adInfo.year}-{String(adInfo.month).padStart(2, '0')}-{String(adInfo.day).padStart(2, '0')})
        </p>
        <p className="mt-1 text-xs text-stone-600">
          चन्द्रमाको राशिः {RASHI_LABELS[moonRashiIndex]} (सूर्योदयमा)
        </p>
        {changesSignToday && nextChangeKathmandu && (
          <p className="mt-1 text-xs text-[#9A3412] font-medium">
            चन्द्रमाको राशि परिवर्तन आज: {nextChangeKathmandu}
          </p>
        )}
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs text-stone-600">{DISCLAIMER_NE}</p>
          <p className="text-xs text-stone-600">{DISCLAIMER_EN}</p>
        </div>
      </div>

      {/* All 12 Rashis Grid View */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RASHIS.map((rashi) => {
          const { reading, position } = readingsByRashi[rashi.id];
          return (
            <article
              key={rashi.id}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div>
                <div className="flex items-baseline justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-display text-xl font-bold text-stone-900">
                      {rashi.nameNe}
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">
                      {rashi.nameEn} · {rashi.englishSign}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-stone-400">
                  चन्द्रमाको स्थान: स्थान {position}
                </p>
              </div>

              {reading ? (
                <div className="mt-4 rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
                  <p className="text-sm leading-relaxed text-stone-800">
                    {reading.textNe}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="font-semibold text-stone-600">
                      शुभ रङ्ग:
                    </span>
                    <span className="font-medium text-[#9A3412]">
                      {reading.luckyColorNe ?? "—"}
                    </span>
                    <span className="font-semibold text-stone-600">
                      शुभ अंक:
                    </span>
                    <span className="font-medium text-[#9A3412]">
                      {reading.luckyNumber ?? "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
                  <p className="text-sm text-stone-500 italic">
                    सम्पादकीय सामग्री उपलब्ध छैन।
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Internal Navigation Links */}
      <section aria-label="Related calendar links" className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          सम्बन्धित पात्रो तथा सेवाहरू (Related Calendar Tools)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="/aaja-ko-miti"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/aaja-ko-miti');
            }}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-[#9A3412]"
          >
            <span className="block font-semibold text-stone-900 text-sm">
              आजको मिति (Aaja Ko Miti)
            </span>
            <span className="block text-xs text-stone-500 mt-1">
              {today.bs.formattedEn} ({today.weekday.ne})
            </span>
          </a>
          <a
            href={`/calendar/${today.bs.year}/${today.bs.monthSlug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`/calendar/${today.bs.year}/${today.bs.monthSlug}`);
            }}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-[#9A3412]"
          >
            <span className="block font-semibold text-stone-900 text-sm">
              {today.bs.monthNameEn} {today.bs.year} क्यालेन्डर
            </span>
            <span className="block text-xs text-stone-500 mt-1">
              महिनाको सम्पूर्ण तिथि तथा बिदाहरू हेर्नुहोस्
            </span>
          </a>
          <a
            href="/date-converter"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/date-converter');
            }}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-[#9A3412]"
          >
            <span className="block font-semibold text-stone-900 text-sm">
              BS ↔ AD मिति परिवर्तन
            </span>
            <span className="block text-xs text-stone-500 mt-1">
              २००० देखि २०९० वि.सं. सम्मका मिति रूपान्तरण
            </span>
          </a>
        </div>
      </section>

      {/* FAQs Section */}
      <FaqSection faqs={faqs} />
    </div>
  );
};
