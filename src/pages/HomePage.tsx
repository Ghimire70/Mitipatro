import React, { useMemo } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { BS_MONTHS, CURRENT_BS_YEAR, PUBLISHED_BS_YEARS, WEEKDAYS } from '../../lib/bsData';
import { bsToAd, getTodayNepal, toDevanagariDigits } from '../../lib/bsConverter';
import { getHolidaysForYear } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { CalendarGrid } from '../components/CalendarGrid';
import { DateConverter } from '../components/DateConverter';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';
import { RasifalSection } from '../components/RasifalSection';
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../lib/i18n/format';

interface HomePageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  faqs,
  nowMs,
  onNavigate,
  rashifalIndexingEnabled = false,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const { locale, t } = useLocale();
  const yearHolidays = useMemo(() => getHolidaysForYear(today.bs.year), [today.bs.year]);

  const upcomingHolidays = useMemo(() => {
    return yearHolidays
      .filter((h) => {
        if (h.bsMonth > today.bs.month) return true;
        if (h.bsMonth === today.bs.month && h.bsDay >= today.bs.day) return true;
        return false;
      })
      .slice(0, 6);
  }, [yearHolidays, today.bs.month, today.bs.day]);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner: Today's BS Date in Nepal Time */}
      <section aria-labelledby="hero-heading" className="border-b border-stone-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500">
              {t('calendar.today')} · Asia/Kathmandu (UTC+05:45)
            </p>
            <h1
              id="hero-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl"
            >
              {locale === 'ne'
                ? `नेपाली पात्रो ${formatLocaleNumber(today.bs.year, locale)} वि.सं.`
                : `Nepali Calendar ${formatLocaleNumber(today.bs.year, locale)} BS`}
            </h1>
            <p className="mt-3 text-lg text-stone-700">
              {locale === 'ne'
                ? `आज ${BS_MONTHS[today.bs.month - 1].ne} ${formatLocaleNumber(today.bs.day, locale)}, ${formatLocaleNumber(today.bs.year, locale)} वि.सं.`
                : `आज ${BS_MONTHS[today.bs.month - 1].en} ${formatLocaleNumber(today.bs.day, locale)}, ${formatLocaleNumber(today.bs.year, locale)} BS`}
            </p>
            <p className="mt-3 text-lg text-stone-700">
              {locale === 'ne'
                ? `${WEEKDAYS[today.weekday.index].ne}`
                : `${WEEKDAYS[today.weekday.index].en}`}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-stone-500">
              <Clock className="h-4 w-4 text-stone-400" aria-hidden="true" />
              <span>
                {locale === 'ne'
                  ? `ग्रेगोरियन: ${today.ad.formattedEn} · नेपाल समय: ${today.nepalTime} NPT`
                  : `Gregorian: ${today.ad.formattedEn} · Nepal Time: ${today.nepalTime} NPT`}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/aaja-ko-miti"
              onClick={(e) => handleLink(e, '/aaja-ko-miti')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] whitespace-nowrap shrink-0"
            >
              {locale === 'ne' ? 'आजको मिति हेर्नुहोस्' : t('navigation.today')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            {rashifalIndexingEnabled && (
              <a
                href="/rashifal"
                onClick={(e) => handleLink(e, '/rashifal')}
                className="inline-flex min-h-[44px] items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
              >
                {locale === 'ne' ? 'आजको राशिफल' : t('navigation.rashifal')}
              </a>
            )}
            <a
              href={`/holidays/${CURRENT_BS_YEAR}`}
              onClick={(e) => handleLink(e, `/holidays/${CURRENT_BS_YEAR}`)}
              className="inline-flex min-h-[44px] items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
            >
              {locale === 'ne'
                ? `${formatLocaleNumber(CURRENT_BS_YEAR, locale)} वि.सं. सार्वजनिक बिदा`
                : `${formatLocaleNumber(CURRENT_BS_YEAR, locale)} Public Holidays`}
            </a>
          </div>
        </div>
      </section>

      {/* Reserved Top Leaderboard Ad Slot (Zero CLS) */}
      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Main 2-Column Workspace: Calendar Grid + Converter/Holidays Sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CalendarGrid
            bsYear={today.bs.year}
            bsMonth={today.bs.month}
            nowMs={nowMs}
            onNavigate={onNavigate}
            rashifalIndexingEnabled={rashifalIndexingEnabled}
          />

          {/* Quick 12-Month Navigation Strip */}
          <section aria-label={`${today.bs.year} BS Months`} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold text-stone-900">
                {locale === 'ne'
                  ? `नेपाली पात्रो ${formatLocaleNumber(today.bs.year, locale)} वि.सं.`
                  : `All Months of ${formatLocaleNumber(today.bs.year, locale)} BS`}
              </h2>
              <a
                href={`/calendar/${today.bs.year}`}
                onClick={(e) => handleLink(e, `/calendar/${today.bs.year}`)}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                {locale === 'ne' ? `पूर्ण ${formatLocaleNumber(today.bs.year, locale)} अवलोकन →` : `Full ${formatLocaleNumber(today.bs.year, locale)} Overview →`}
              </a>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {BS_MONTHS.map((m) => {
                const isCurrent = m.index === today.bs.month;
                const monthName = locale === 'ne' ? m.ne : m.en;
                return (
                  <a
                    key={m.slug}
                    href={`/calendar/${today.bs.year}/${m.slug}`}
                    onClick={(e) => handleLink(e, `/calendar/${today.bs.year}/${m.slug}`)}
                    className={`flex min-h-[48px] flex-col justify-center rounded-lg border px-3.5 py-2.5 transition-colors ${
                      isCurrent
                        ? 'border-[#9A3412] bg-[#9A3412]/5 text-[#9A3412]'
                        : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-[#F3EFE6]/50'
                    }`}
                  >
                    <span className="text-sm font-semibold">{monthName}</span>
                  </a>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-8 lg:col-span-4">
          <section aria-labelledby="quick-converter-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="quick-converter-heading" className="font-display text-xl font-semibold text-stone-900">
                {t('calendar.quickConverter')}
              </h2>
              <a
                href="/date-converter"
                onClick={(e) => handleLink(e, '/date-converter')}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                {t('calendar.fullTool')}
              </a>
            </div>
            <div className="mt-3">
              <DateConverter compact nowMs={nowMs} onNavigate={onNavigate} />
            </div>
          </section>

          <section aria-labelledby="upcoming-holidays-heading" className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
              <h2 id="upcoming-holidays-heading" className="font-display text-lg font-semibold text-stone-900">
                {locale === 'ne'
                  ? `आउने ${formatLocaleNumber(today.bs.year, locale)} वि.सं. बिदाहरू`
                  : `Upcoming ${formatLocaleNumber(today.bs.year, locale)} Holidays`}
              </h2>
              <a
                href={`/holidays/${today.bs.year}`}
                onClick={(e) => handleLink(e, `/holidays/${today.bs.year}`)}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                {locale === 'ne' ? 'सबै बिदाहरू →' : t('calendar.allHolidays')}
              </a>
            </div>
            <ul className="mt-3 divide-y divide-stone-100">
              {upcomingHolidays.map((h) => {
                const ad = bsToAd(h.bsYear, h.bsMonth, h.bsDay);
                const mMeta = BS_MONTHS[h.bsMonth - 1];
                const monthShort = locale === 'ne' ? mMeta.ne : mMeta.en.slice(0, 3);
                const holidayName = locale === 'ne' ? h.nameNe : h.nameEn;
                return (
                  <li key={h.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900">{holidayName}</span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#9A3412] tabular-nums">
                        {monthShort} {formatLocaleNumber(h.bsDay, locale)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {locale === 'ne'
                        ? `${h.nameEn} · ${formatLocaleNumber(ad.day, locale)} ${ad.monthShortEn}, ${formatLocaleNumber(ad.year, locale)} (${ad.weekdayEn})`
                        : `${h.nameNe} · ${ad.monthShortEn} ${formatLocaleNumber(ad.day, locale)}, ${formatLocaleNumber(ad.year, locale)} (${ad.weekdayEn})`}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3">
              <HolidayReferenceNote />
            </div>
          </section>

          <AdSlot variant="rectangle" />
        </aside>
      </div>

      {/* Daily Rashifal Feature Section */}
      {rashifalIndexingEnabled && (
        <div className="mt-12">
          <RasifalSection nowMs={nowMs} onNavigate={onNavigate} />
        </div>
      )}

      {/* Browse Multi-Year Calendars */}
      <section aria-labelledby="years-browse-heading" className="mt-12 border-t border-stone-200 pt-10">
        <h2 id="years-browse-heading" className="font-display text-2xl font-semibold text-stone-900">
          {t('calendar.browseYears')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          {locale === 'ne'
            ? 'प्रत्येक वार्षिक संस्करणमा यसको सङ्ग्रहित महिना लम्बाइ, सम्बन्धित ग्रेगोरियन मितिहरू र बिदा सूचीका लागि सन्दर्भ देखाइएको छ।'
            : 'Each annual edition shows its stored month lengths, corresponding Gregorian dates, and holiday listings for reference.'}
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLISHED_BS_YEARS.map((yr) => {
            const start = bsToAd(yr, 1, 1);
            return (
              <a
                key={yr}
                href={`/calendar/${yr}`}
                onClick={(e) => handleLink(e, `/calendar/${yr}`)}
                className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-[#9A3412]"
              >
                <p className="text-xs font-medium text-stone-500">
                  {locale === 'ne'
                    ? `${formatLocaleNumber(start.year, locale)}–${formatLocaleNumber(start.year + 1, locale)} ई.सं.`
                    : `${formatLocaleNumber(start.year, locale)}–${formatLocaleNumber(start.year + 1, locale)} AD`}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-stone-900">
                  {locale === 'ne'
                    ? `नेपाली पात्रो ${formatLocaleNumber(yr, locale)} वि.सं.`
                    : `Nepali Calendar ${formatLocaleNumber(yr, locale)} BS`}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {locale === 'ne'
                    ? `नेपाली पात्रो ${toDevanagariDigits(yr)}`
                    : `Nepali Patro ${formatLocaleNumber(yr, locale)}`}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <FaqSection heading={t('calendar.faqsHeading')} faqs={faqs} />
    </div>
  );
};
