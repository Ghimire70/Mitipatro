import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Briefcase,
  Coins,
  Heart,
  Activity,
  Compass,
  Clock,
} from 'lucide-react';
import {
  RASHIS,
  getAvailableRashifalDates,
  getHoroscope,
  getRashiById,
  type HoroscopePeriod,
  type RashiId,
  type RashiMeta,
} from '../../lib/rashifal';
import {
  bsToAd,
  getTodayNepal,
  toDevanagariDigits,
} from '../../lib/bsConverter';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';

interface RashifalPageProps {
  initialPeriod?: HoroscopePeriod;
  rashiFilter?: string;
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const RashifalPage: React.FC<RashifalPageProps> = ({
  initialPeriod = 'daily',
  rashiFilter,
  faqs,
  nowMs,
  onNavigate,
}) => {
  const today = useMemo(
    () => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined),
    [nowMs],
  );

  const [period, setPeriod] = useState<HoroscopePeriod>(initialPeriod);

  // Sync state if initialPeriod changes (e.g. browser back/forward or route changes)
  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  const availableDailyDates = useMemo(() => getAvailableRashifalDates(), []);
  
  const defaultDailyDate = today.bs.iso;

  const [selectedDate, setSelectedDate] = useState<string>(defaultDailyDate);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const selectedRashiMeta: RashiMeta | undefined = useMemo(() => {
    return rashiFilter ? getRashiById(rashiFilter) : undefined;
  }, [rashiFilter]);

  const rashifalResult = useMemo(() => {
    if (period === 'daily') {
      return getHoroscope('daily', { rashiId: selectedRashiMeta?.id, dateOrKey: selectedDate, nowMs });
    }
    if (period === 'weekly') {
      return getHoroscope('weekly', { rashiId: selectedRashiMeta?.id, nowMs });
    }
    return getHoroscope('monthly', { rashiId: selectedRashiMeta?.id, nowMs });
  }, [period, selectedRashiMeta?.id, selectedDate, nowMs]);

  // Gregorian date reference for daily view
  const selectedAdDateInfo = useMemo(() => {
    if (period !== 'daily') return null;
    try {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        return bsToAd(parts[0], parts[1], parts[2]);
      }
    } catch {
      // Fallback
    }
    return null;
  }, [period, selectedDate]);

  const currentDailyIndex = availableDailyDates.indexOf(selectedDate);
  const canGoPrev = currentDailyIndex > 0;
  const canGoNext = currentDailyIndex >= 0 && currentDailyIndex < availableDailyDates.length - 1;

  const goToPrevDate = () => {
    if (canGoPrev) setSelectedDate(availableDailyDates[currentDailyIndex - 1]);
  };

  const goToNextDate = () => {
    if (canGoNext) setSelectedDate(availableDailyDates[currentDailyIndex + 1]);
  };

  const isSelectedDateToday = period === 'daily' && selectedDate === today.bs.iso;

  const getPeriodUrl = (targetPeriod: HoroscopePeriod) => {
    if (targetPeriod === 'daily') {
      return selectedRashiMeta ? `/rashifal/${selectedRashiMeta.id}` : '/rashifal';
    }
    return selectedRashiMeta
      ? `/rashifal/${targetPeriod}/${selectedRashiMeta.id}`
      : `/rashifal/${targetPeriod}`;
  };

  const getRashiUrl = (rashiId: RashiId) => {
    if (period === 'daily') {
      return `/rashifal/${rashiId}`;
    }
    return `/rashifal/${period}/${rashiId}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="hover:text-[#9A3412] hover:underline"
            >
              Home
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            {period === 'daily' && !selectedRashiMeta ? (
              <span className="font-medium text-stone-800">Rashifal</span>
            ) : (
              <a
                href="/rashifal"
                onClick={(e) => handleLink(e, '/rashifal')}
                className="hover:text-[#9A3412] hover:underline"
              >
                Rashifal
              </a>
            )}
          </li>
          {period !== 'daily' && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                {selectedRashiMeta ? (
                  <a
                    href={`/rashifal/${period}`}
                    onClick={(e) => handleLink(e, `/rashifal/${period}`)}
                    className="hover:text-[#9A3412] hover:underline"
                  >
                    {period === 'weekly' ? 'Weekly' : 'Monthly'}
                  </a>
                ) : (
                  <span className="font-medium text-stone-800">
                    {period === 'weekly' ? 'Weekly' : 'Monthly'}
                  </span>
                )}
              </li>
            </>
          )}
          {selectedRashiMeta && (
            <>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-stone-800">
                {selectedRashiMeta.nameNe} ({selectedRashiMeta.englishSign})
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header Section */}
      <section aria-labelledby="rashifal-heading" className="mt-4 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
                वैदिक राशिफल · Vedic Nepali Horoscope
              </span>
            </div>
            <h1
              id="rashifal-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
            >
              {selectedRashiMeta
                ? `${selectedRashiMeta.nameNe} ${rashifalResult.periodTitleNe} (${selectedRashiMeta.englishSign} ${rashifalResult.periodTitleEn})`
                : rashifalResult.periodTitleNe}
            </h1>
            <p className="mt-2 text-base text-stone-600 max-w-2xl">
              नेपालको आधिकारिक समय (Asia/Kathmandu, UTC+05:45) अनुसार Bikram Sambat पात्रोसँग
              आबद्ध {rashifalResult.periodTitleNe} फलादेश।
            </p>
            <p
              role="note"
              className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
            >
              Sample content for development, not published predictions.
            </p>
          </div>

          {/* Period Coverage Badge & Date Navigation */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs flex flex-col gap-2 shrink-0">
            {period === 'daily' ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPrevDate}
                  disabled={!canGoPrev}
                  aria-label="Previous available daily horoscope date"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#9A3412]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="text-center px-2">
                  <span className="text-xs font-semibold text-[#9A3412] uppercase tracking-wider block">
                    {isSelectedDateToday ? 'आज (Today)' : 'फलादेश मिति'}
                  </span>
                  <span className="font-mono text-sm font-bold text-stone-900 tabular-nums block">
                    {selectedDate} BS
                  </span>
                  {selectedAdDateInfo && (
                    <span className="text-[11px] text-stone-500 block">
                      {selectedAdDateInfo.formattedEn}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={goToNextDate}
                  disabled={!canGoNext}
                  aria-label="Next available daily horoscope date"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#9A3412]"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="text-center px-3 py-1">
                <span className="text-xs font-semibold text-[#9A3412] uppercase tracking-wider block">
                  {period === 'weekly' ? 'साप्ताहिक समयावधि (Coverage)' : 'मासिक अवधि (Bikram Sambat Month)'}
                </span>
                <span className="font-display text-base font-bold text-stone-900 block mt-0.5">
                  {rashifalResult.coverageLabelNe}
                </span>
                <span className="text-xs text-stone-500 font-mono block mt-0.5">
                  {rashifalResult.coverageLabelEn}
                </span>
              </div>
            )}

            <div className="border-t border-stone-100 pt-2 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <Clock className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
              <span>Asia/Kathmandu (UTC+05:45)</span>
            </div>
          </div>
        </div>

        {/* 3 Clear Period Navigation Tabs: दैनिक, साप्ताहिक, मासिक */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-5" role="tablist" aria-label="Horoscope Periods">
          <a
            href={getPeriodUrl('daily')}
            onClick={(e) => {
              handleLink(e, getPeriodUrl('daily'));
              setPeriod('daily');
            }}
            role="tab"
            aria-selected={period === 'daily'}
            className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all ${
              period === 'daily'
                ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <span>दैनिक राशिफल</span>
            <span className={`text-xs ${period === 'daily' ? 'text-white/80' : 'text-stone-400'}`}>
              (Daily)
            </span>
          </a>

          <a
            href={getPeriodUrl('weekly')}
            onClick={(e) => {
              handleLink(e, getPeriodUrl('weekly'));
              setPeriod('weekly');
            }}
            role="tab"
            aria-selected={period === 'weekly'}
            className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all ${
              period === 'weekly'
                ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <span>साप्ताहिक राशिफल</span>
            <span className={`text-xs ${period === 'weekly' ? 'text-white/80' : 'text-stone-400'}`}>
              (Weekly)
            </span>
          </a>

          <a
            href={getPeriodUrl('monthly')}
            onClick={(e) => {
              handleLink(e, getPeriodUrl('monthly'));
              setPeriod('monthly');
            }}
            role="tab"
            aria-selected={period === 'monthly'}
            className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all ${
              period === 'monthly'
                ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <span>मासिक राशिफल</span>
            <span className={`text-xs ${period === 'monthly' ? 'text-white/80' : 'text-stone-400'}`}>
              (Monthly)
            </span>
          </a>
        </div>
      </section>

      {/* Rashi Filter Bar */}
      <section aria-label="Rashi Filter" className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            राशि छान्नुहोस्:
          </span>
          {selectedRashiMeta && (
            <a
              href={period === 'daily' ? '/rashifal' : `/rashifal/${period}`}
              onClick={(e) => handleLink(e, period === 'daily' ? '/rashifal' : `/rashifal/${period}`)}
              className="text-xs font-semibold text-[#9A3412] hover:underline"
            >
              सबै १२ राशि हेर्नुहोस् (Show All)
            </a>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <a
            href={period === 'daily' ? '/rashifal' : `/rashifal/${period}`}
            onClick={(e) => handleLink(e, period === 'daily' ? '/rashifal' : `/rashifal/${period}`)}
            className={`inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              !selectedRashiMeta
                ? 'border-[#9A3412] bg-[#9A3412] text-white font-semibold'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            सबै १२ राशि
          </a>
          {RASHIS.map((r) => {
            const isActive = selectedRashiMeta?.id === r.id;
            return (
              <a
                key={r.id}
                href={getRashiUrl(r.id)}
                onClick={(e) => handleLink(e, getRashiUrl(r.id))}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#9A3412] bg-[#9A3412] text-white font-semibold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span>{r.nameNe}</span>
                <span
                  className={`text-xs ${
                    isActive ? 'text-white/80' : 'text-stone-400'
                  }`}
                >
                  ({r.englishSign})
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Ad slot for layout and monetization balance */}
      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Horoscope Content Display */}
      {!rashifalResult.isAvailable ? (
        /* Missing Content Graceful Notice */
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-xs">
          <Compass className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-stone-900">
            {rashifalResult.periodTitleNe} सामग्री हाल उपलब्ध छैन
          </h2>
          <p className="mt-2 text-sm text-stone-700 max-w-xl mx-auto">
            {rashifalResult.missingMessageNe}
          </p>
          <p className="mt-1 text-xs text-stone-500 max-w-xl mx-auto">
            {rashifalResult.missingMessageEn}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPeriod('daily');
                setSelectedDate(defaultDailyDate);
              }}
              className="rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
            >
              उपलब्ध दैनिक राशिफल हेर्नुहोस्
            </button>
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              क्यालेन्डर गृहपृष्ठमा फर्कनुहोस्
            </a>
          </div>
        </div>
      ) : (
        /* Available Horoscope Display */
        <div className="mt-8">
          {selectedRashiMeta ? (
            /* Single Selected Rashi Detail View */
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
              {(() => {
                const pred = rashifalResult.allPredictions?.[selectedRashiMeta.id];
                return (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
                      <div>
                        <div className="flex items-baseline gap-3">
                          <h2 className="font-display text-3xl font-bold text-stone-900">
                            {selectedRashiMeta.nameNe} राशि
                          </h2>
                          <span className="text-lg text-stone-600 font-medium">
                            ({selectedRashiMeta.nameEn} · {selectedRashiMeta.englishSign})
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#9A3412] uppercase tracking-wider">
                          {rashifalResult.periodTitleNe} ({rashifalResult.coverageLabelNe})
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          नामाक्षर: <strong className="text-stone-700">{selectedRashiMeta.lettersNe}</strong>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center sm:text-right shrink-0">
                        <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-2.5">
                          <span className="text-[11px] text-stone-500 block">स्वामी ग्रह</span>
                          <span className="text-xs font-semibold text-stone-900 block mt-0.5">
                            {selectedRashiMeta.rulingPlanetNe}
                          </span>
                        </div>
                        <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-2.5">
                          <span className="text-[11px] text-stone-500 block">तत्व</span>
                          <span className="text-xs font-semibold text-stone-900 block mt-0.5">
                            {selectedRashiMeta.elementNe}
                          </span>
                        </div>
                        <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-2.5">
                          <span className="text-[11px] text-stone-500 block">चिह्न</span>
                          <span className="text-xs font-semibold text-stone-900 block mt-0.5">
                            {selectedRashiMeta.symbolNe}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pred ? (
                      <div className="mt-6 space-y-6">
                        {/* Overall Period Description */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A3412]">
                            समग्र {rashifalResult.periodTitleNe} फलादेश ({rashifalResult.periodTitleEn})
                          </h3>
                          <p className="mt-2 text-lg leading-relaxed text-stone-900 font-sans">
                            {pred.descriptionNe}
                          </p>
                        </div>

                        {/* Breakdown Grid: Career, Finance, Relationships, Health */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                          {pred.careerNe && (
                            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-4">
                              <div className="flex items-center gap-2 text-[#9A3412]">
                                <Briefcase className="h-4 w-4" aria-hidden="true" />
                                <h4 className="text-sm font-semibold">करिअर तथा पेशा (Career)</h4>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                                {pred.careerNe}
                              </p>
                            </div>
                          )}

                          {pred.financialNe && (
                            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-4">
                              <div className="flex items-center gap-2 text-[#9A3412]">
                                <Coins className="h-4 w-4" aria-hidden="true" />
                                <h4 className="text-sm font-semibold">आर्थिक अवस्था (Finance)</h4>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                                {pred.financialNe}
                              </p>
                            </div>
                          )}

                          {pred.relationshipNe && (
                            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-4">
                              <div className="flex items-center gap-2 text-[#9A3412]">
                                <Heart className="h-4 w-4" aria-hidden="true" />
                                <h4 className="text-sm font-semibold">प्रेम तथा सम्बन्ध (Relationships)</h4>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                                {pred.relationshipNe}
                              </p>
                            </div>
                          )}

                          {pred.healthNe && (
                            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-4">
                              <div className="flex items-center gap-2 text-[#9A3412]">
                                <Activity className="h-4 w-4" aria-hidden="true" />
                                <h4 className="text-sm font-semibold">स्वास्थ्य (Health)</h4>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                                {pred.healthNe}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Lucky Color & Number */}
                        <div className="flex flex-wrap gap-4 border-t border-stone-200 pt-4 text-sm">
                          {pred.luckyColorNe && (
                            <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2">
                              <span className="text-stone-500">शुभ रङ्ग:</span>
                              <strong className="text-stone-900">{pred.luckyColorNe}</strong>
                            </div>
                          )}
                          {pred.luckyNumber !== undefined && (
                            <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 font-mono">
                              <span className="text-stone-500">शुभ अङ्क:</span>
                              <strong className="text-stone-900">{pred.luckyNumber}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-stone-600">
                        यस राशिको {rashifalResult.periodTitleNe} विवरण उपलब्ध छैन।
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* All 12 Rashis Grid View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {RASHIS.map((rashi) => {
                const pred = rashifalResult.allPredictions?.[rashi.id];
                return (
                  <article
                    key={rashi.id}
                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-baseline justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-baseline gap-2">
                          <h2 className="font-display text-xl font-bold text-stone-900">
                            {rashi.nameNe}
                          </h2>
                          <span className="text-xs text-stone-500 font-medium">
                            {rashi.nameEn} · {rashi.englishSign}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-stone-400">
                          #{toDevanagariDigits(rashi.order)}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-stone-400">
                        स्वामी: {rashi.rulingPlanetNe} · तत्व: {rashi.elementNe}
                      </p>

                      {/* Prediction Text */}
                      {pred ? (
                        <p className="mt-3 text-sm leading-relaxed text-stone-800 line-clamp-3">
                          {pred.descriptionNe}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-stone-500">
                          विवरण उपलब्ध हुन बाँकी छ।
                        </p>
                      )}

                      {/* Lucky Attributes */}
                      {pred && (
                        <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
                          {pred.luckyColorNe && (
                            <span>
                              रङ्ग: <strong className="text-stone-800">{pred.luckyColorNe}</strong>
                            </span>
                          )}
                          {pred.luckyNumber !== undefined && (
                            <span>
                              अङ्क: <strong className="text-stone-800 font-mono">{pred.luckyNumber}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-stone-100 pt-3">
                      <a
                        href={getRashiUrl(rashi.id)}
                        onClick={(e) => handleLink(e, getRashiUrl(rashi.id))}
                        className="inline-flex items-center text-xs font-semibold text-[#9A3412] hover:underline"
                      >
                        {rashi.nameNe}को पूर्ण {rashifalResult.periodTitleNe} पढ्नुहोस् →
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Internal Navigation Links connecting to Calendar & Tools */}
      <section aria-label="Related calendar links" className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          सम्बन्धित पात्रो तथा सेवाहरू (Related Calendar Tools)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="/aaja-ko-miti"
            onClick={(e) => handleLink(e, '/aaja-ko-miti')}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-[#9A3412]"
          >
            <span className="block font-semibold text-stone-900 text-sm">आजको मिति (Aaja Ko Miti)</span>
            <span className="block text-xs text-stone-500 mt-1">
              {today.bs.formattedEn} ({today.weekday.ne})
            </span>
          </a>
          <a
            href={`/calendar/${today.bs.year}/${today.bs.monthSlug}`}
            onClick={(e) => handleLink(e, `/calendar/${today.bs.year}/${today.bs.monthSlug}`)}
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
            onClick={(e) => handleLink(e, '/date-converter')}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-[#9A3412]"
          >
            <span className="block font-semibold text-stone-900 text-sm">BS ↔ AD मिति परिवर्तन</span>
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
