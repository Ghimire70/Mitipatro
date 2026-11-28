import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Clock, Moon, Sun, Star } from 'lucide-react';
import {
  adToBs,
  getTodayNepal,
  validateAdDate,
  toDevanagariDigits,
} from '../../lib/bsConverter';
import type { FaqItem } from '../../lib/seo';
import {
  getDailyPanchanga,
  type DailyPanchanga,
} from '../../lib/astronomy/panchanga.js';
import { FaqSection } from '../components/FaqSection';
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../lib/i18n/format';

interface PanchangPageProps {
  faqs?: FaqItem[];
  nowMs?: number;
  onNavigate?: (path: string) => void;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'दैनिक पञ्चाङ्ग के हो?',
    answer: 'पञ्चाङ्ग नेपाली पात्रोको एक दैनिक खगोलशास्त्रीय विवरण हो, जसमा तिथि, नक्षत्र, योग र करण समावेश हुन्छन्।',
  },
  {
    question: 'यस पृष्ठको पञ्चाङ्ग कुन समय र स्थानको आधारमा गणना गरिएको छ?',
    answer: 'यस पृष्ठको सूर्योदय, सूर्यास्त, तिथि, नक्षत्र, योग र करण काठमाडौं (२७.७१७२° उत्तर, ८५.३२४०° पूर्व) को Asia/Kathmandu (UTC+०५:४५) समयका आधारमा गणना गरिएको छ।',
  },
  {
    question: 'के यो परिणामलाई धार्मिक वा उत्सवको मिति निश्चित गर्न एक्लै प्रयोग गर्न सकिन्छ?',
    answer: 'धार्मिक वा उत्सवको मिति निश्चित गर्नु अघि कृपया स्थानीय पात्रोसँग पुष्टि गर्नुहोला।',
  },
  {
    question: 'सूर्योदयको समयमा कुन तत्व प्रभावी हुन्छ भनी कसरी थाहा पाइन्छ?',
    answer: 'सूर्यको वास्तविक सूर्योदय क्षणमा कुन तिथि, नक्षत्र, योग र करण प्रभावी छ, त्यसलाई त्यस मितिको तत्व मानिन्छ। सूर्योदयको नजिकै तत्व परिवर्तन भएमा त्यसलाई नजिकको परिवर्तन (near-sunrise) को रूपमा चिन्हित गरिएको छ।',
  },
];

function kathmanduNoonDate(year: number, month: number, day: number): Date {
  // The existing astronomy layer defines Asia/Kathmandu as UTC+05:45
  // (lib/astronomy/moonTransitions.ts). 12:00 NPT is therefore 06:15 UTC.
  return new Date(Date.UTC(year, month - 1, day, 6, 15));
}

function formatKathmanduTime(kathmanduDisplay: string | null | undefined): string {
  if (!kathmanduDisplay) return '–';
  // VedicMarga's Kathmandu display was observed at HH:MM; deliberately drop
  // seconds rather than rounding them.
  const time = /T(\d{2}:\d{2})/.exec(kathmanduDisplay)?.[1];
  return time ? `${time} NPT` : '–';
}

export const PanchangPage: React.FC<PanchangPageProps> = ({
  faqs: passedFaqs,
  nowMs,
  onNavigate,
}) => {
  const { locale, t } = useLocale();
  const today = useMemo(
    () => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined),
    [nowMs],
  );

  const [adYear, setAdYear] = useState<string>(String(today.ad.year));
  const [adMonth, setAdMonth] = useState<string>(String(today.ad.month));
  const [adDay, setAdDay] = useState<string>(String(today.ad.day));

  const check = useMemo(() => {
    const y = Number(adYear);
    const m = Number(adMonth);
    const d = Number(adDay);
    return validateAdDate(y, m, d);
  }, [adYear, adMonth, adDay]);

  const calculation = useMemo(() => {
    if (!check.valid) {
      return { panchanga: null as DailyPanchanga | null, error: null as string | null };
    }
    const y = Number(adYear);
    const m = Number(adMonth);
    const d = Number(adDay);
    try {
      return {
        panchanga: getDailyPanchanga(kathmanduNoonDate(y, m, d)),
        error: null as string | null,
      };
    } catch {
      return {
        panchanga: null as DailyPanchanga | null,
        error: 'यस मितिका लागि सूर्योदय वा पञ्चाङ्गको परिणाम उपलब्ध भएन।',
      };
    }
  }, [adYear, adMonth, adDay, check.valid]);

  const panchanga = calculation.panchanga;

  const bsDate = useMemo(() => {
    if (!panchanga) return null;
    try {
      return adToBs({ year: Number(adYear), month: Number(adMonth), day: Number(adDay) });
    } catch {
      return null;
    }
  }, [panchanga, adYear, adMonth, adDay]);

  const selectedAdIso = check.valid
    ? `${String(adYear).padStart(4, '0')}-${String(adMonth).padStart(2, '0')}-${String(adDay).padStart(2, '0')}`
    : null;

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate?.(path);
  };

  const resetToToday = () => {
    setAdYear(String(today.ad.year));
    setAdMonth(String(today.ad.month));
    setAdDay(String(today.ad.day));
  };

  const elementCard = (
    title: string,
    icon: React.ReactNode,
    value: string,
    meta: string,
    near: string | null,
  ) => (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-stone-400">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-wide text-stone-500">{title}</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-stone-900">
            {value}
          </p>
          {meta && <p className="mt-1 text-sm text-stone-600">{meta}</p>}
          {near && (
            <p className="mt-1.5 text-xs text-[#9A3412] font-medium">
              {near}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const nearSunriseNote = (el: { nearSunrise: { changeKathmandu: string; minutesFromSunrise: number; beforeSunrise: boolean } | null } | null): string | null => {
    if (!el || !el.nearSunrise) return null;
    const dir = el.nearSunrise.beforeSunrise ? 'before' : 'after';
    const abs = Math.abs(el.nearSunrise.minutesFromSunrise);
    return `सूर्योदयको नजिकै परिवर्तन: ${formatKathmanduTime(el.nearSunrise.changeKathmandu)} (${dir} ${abs.toFixed(1)} मिनेट)`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section aria-labelledby="panchang-heading" className="border-b border-stone-200 pb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500">
              {locale === 'ne' ? 'नेपाली पात्रो · एशिया/काठमाडौं (UTC+०५:४५)' : 'Nepali Panchang · Asia/Kathmandu (UTC+05:45)'}
            </p>
            <h1 id="panchang-heading" className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {locale === 'ne' ? 'नेपाली पात्रो – दैनिक पञ्चाङ्ग' : 'Nepali Panchang – Daily Panchang'}
            </h1>
            <p className="mt-1.5 text-lg text-stone-700">
              {bsDate
                ? `${locale === 'ne' ? bsDate.formattedNe : bsDate.formattedEn} &middot; ${locale === 'ne' ? bsDate.weekdayNe : bsDate.weekdayEn}`
                : locale === 'ne' ? 'अमान्य मिति' : 'Invalid date'}
              &nbsp;({String(adYear).padStart(4, '0')}-${String(adMonth).padStart(2, '0')}-${String(adDay).padStart(2, '0')})
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <Clock className="h-4 w-4 text-stone-400" aria-hidden="true" />
              <span>ISO: <span className="font-mono text-xs tabular-nums">{panchanga?.civilDate ?? selectedAdIso ?? '–'}</span></span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetToToday}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-stone-200 bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
            >
              <Calendar className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
              <span>आज (NPT)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Date selection */}
      <section aria-labelledby="panchang-date-heading" className="mt-8">
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
          <h2 id="panchang-date-heading" className="font-display text-lg font-semibold text-stone-900">
            {locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select Date'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="panchang-ad-year" className="block text-xs font-medium text-stone-600">
                {locale === 'ne' ? 'वर्ष' : 'Year'}
              </label>
              <input
                id="panchang-ad-year"
                type="number"
                min={1943}
                max={2034}
                value={adYear}
                onChange={(e) => setAdYear(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="panchang-ad-month" className="block text-xs font-medium text-stone-600">
                {locale === 'ne' ? 'महिना' : 'Month'}
              </label>
              <input
                id="panchang-ad-month"
                type="number"
                min={1}
                max={12}
                value={adMonth}
                onChange={(e) => setAdMonth(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="panchang-ad-day" className="block text-xs font-medium text-stone-600">
                {locale === 'ne' ? 'दिन' : 'Day'}
              </label>
              <input
                id="panchang-ad-day"
                type="number"
                min={1}
                max={31}
                value={adDay}
                onChange={(e) => setAdDay(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
              />
            </div>
          </div>
          {!check.valid && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{check.error ?? (locale === 'ne' ? 'अमान्य ग्रेगोरियन मिति।' : 'Invalid Gregorian date.')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Panchang results */}
      {panchanga && bsDate ? (
        <section aria-labelledby="panchang-results-heading" className="mt-8">
          <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
            <h2 id="panchang-results-heading" className="font-display text-lg font-semibold text-stone-900">
              {locale === 'ne' ? 'सूर्योदयको समयमा प्रभावी तत्व' : 'Elements at Sunrise'}
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {locale === 'ne' ? 'काठमाडौंको सूर्योदय:' : 'Kathmandu Sunrise:'} <strong>{formatKathmanduTime(panchanga.sunrise.kathmanduDisplay)}</strong>
              &nbsp;·&nbsp; {locale === 'ne' ? 'काठमाडौंको सूर्यास्त:' : 'Kathmandu Sunset:'} <strong>{formatKathmanduTime(panchanga.sunset.kathmanduDisplay)}</strong>
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {elementCard(
                locale === 'ne' ? 'सूर्योदय' : 'Sunrise',
                <Sun className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />,
                formatKathmanduTime(panchanga.sunrise.kathmanduDisplay),
                locale === 'ne' ? 'काठमाडौं समय' : 'Kathmandu Time',
                null,
              )}
              {elementCard(
                locale === 'ne' ? 'सूर्यास्त' : 'Sunset',
                <Moon className="h-5 w-5 text-stone-500" aria-hidden="true" />,
                formatKathmanduTime(panchanga.sunset.kathmanduDisplay),
                locale === 'ne' ? 'काठमाडौं समय' : 'Kathmandu Time',
                null,
              )}
              {elementCard(
                locale === 'ne' ? 'तिथि' : 'Tithi',
                <Calendar className="h-5 w-5 text-stone-500" aria-hidden="true" />,
                `${panchanga.tithi.name} (${panchanga.tithi.paksha})`,
                locale === 'ne'
                  ? `तिथि नम्बर ${panchanga.tithi.tithiNumber} · अन्त्य: ${formatKathmanduTime(panchanga.tithi.end?.kathmanduDisplay)} · अर्को: ${panchanga.tithi.nextName}`
                  : `Tithi Number ${panchanga.tithi.tithiNumber} · End: ${formatKathmanduTime(panchanga.tithi.end?.kathmanduDisplay)} · Next: ${panchanga.tithi.nextName}`,
                nearSunriseNote(panchanga.tithi),
              )}
              {elementCard(
                locale === 'ne' ? 'नक्षत्र' : 'Nakshatra',
                <Star className="h-5 w-5 text-amber-500" aria-hidden="true" />,
                `${panchanga.nakshatra.name} (${locale === 'ne' ? 'पाद' : 'Pada'} ${panchanga.nakshatra.pada})`,
                locale === 'ne'
                  ? `अन्त्य: ${formatKathmanduTime(panchanga.nakshatra.end?.kathmanduDisplay)} · अर्को: ${panchanga.nakshatra.nextName}`
                  : `End: ${formatKathmanduTime(panchanga.nakshatra.end?.kathmanduDisplay)} · Next: ${panchanga.nakshatra.nextName}`,
                nearSunriseNote(panchanga.nakshatra),
              )}
              {elementCard(
                locale === 'ne' ? 'योग' : 'Yoga',
                <Star className="h-5 w-5 text-violet-500" aria-hidden="true" />,
                panchanga.yoga.name,
                locale === 'ne'
                  ? `अन्त्य: ${formatKathmanduTime(panchanga.yoga.end?.kathmanduDisplay)} · अर्को: ${panchanga.yoga.nextName}`
                  : `End: ${formatKathmanduTime(panchanga.yoga.end?.kathmanduDisplay)} · Next: ${panchanga.yoga.nextName}`,
                nearSunriseNote(panchanga.yoga),
              )}
              {elementCard(
                locale === 'ne' ? 'करण' : 'Karana',
                <Calendar className="h-5 w-5 text-stone-500" aria-hidden="true" />,
                panchanga.karana.name,
                locale === 'ne'
                  ? `अन्त्य: ${formatKathmanduTime(panchanga.karana.end?.kathmanduDisplay)} · अर्को: ${panchanga.karana.nextName}`
                  : `End: ${formatKathmanduTime(panchanga.karana.end?.kathmanduDisplay)} · Next: ${panchanga.karana.nextName}`,
                nearSunriseNote(panchanga.karana),
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs text-center">
          <p className="text-sm text-stone-600">
            {calculation.error ?? (locale === 'ne' ? 'मिति छान्नुहोस् र पञ्चाङ्ग हेर्नुहोस्।' : 'Please select a date and view the panchang.')}
          </p>
        </div>
      )}

      <section aria-labelledby="panchang-disclaimer-heading" className="mt-12">
        <div className="rounded-xl border border-[#9A3412]/30 bg-[#FDF7F2] p-5 sm:p-6">
          <h2 id="panchang-disclaimer-heading" className="font-display text-lg font-semibold text-[#7C2D12]">
            {locale === 'ne' ? 'महत्त्वपूर्ण सूचना' : 'Important Disclaimer'}
          </h2>
          <p className="mt-2 text-sm text-stone-700 leading-relaxed">
{locale === 'ne' ? 'गणना गरिएका मानहरू, नेपालको आधिकारिक पात्रो होइन। एक वेबसाइटसँग क्रस-चेक गरिएको छ। कृपया आधिकारिक पात्रोसँग पुष्टि गर्नुहोस्।' : 'Computed values, not Nepal&apos;s official patro. Cross-checked against one website only. Please confirm with an official patro.'}
          </p>
        </div>
      </section>

      <FaqSection heading={locale === 'ne' ? 'सोधेका जिज्ञासा' : t('calendar.faqsHeading')} faqs={passedFaqs ?? DEFAULT_FAQS} />
    </div>
  );
};
