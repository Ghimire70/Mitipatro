import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  RASHIS,
  getHoroscope,
  type HoroscopePeriod,
  type RashiId,
  type RashiMeta,
} from '../../lib/rashifal';
import { getTodayNepal } from '../../lib/bsConverter';

interface RasifalSectionProps {
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const RasifalSection: React.FC<RasifalSectionProps> = ({ nowMs, onNavigate }) => {
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  const [period, setPeriod] = useState<HoroscopePeriod>('daily');
  const [selectedRashiId, setSelectedRashiId] = useState<RashiId>('mesha');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const currentResult = getHoroscope(period, { rashiId: selectedRashiId, nowMs });
  const activeRashi: RashiMeta = RASHIS.find((r) => r.id === selectedRashiId) || RASHIS[0];

  const mainPeriodUrl = period === 'daily' ? '/rashifal' : `/rashifal/${period}`;
  const rashiDetailUrl =
    period === 'daily'
      ? `/rashifal/${activeRashi.id}`
      : `/rashifal/${period}/${activeRashi.id}`;

  return (
    <section
      aria-labelledby="rasifal-section-heading"
      className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
              नेपाली राशिफल · Vedic Nepali Horoscope
            </span>
          </div>
          <h2
            id="rasifal-section-heading"
            className="mt-1 font-display text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
          >
            {currentResult.periodTitleNe} ({currentResult.coverageLabelNe})
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {today.bs.monthNameEn} {today.bs.day}, {today.bs.year} BS · १२ वटै राशिको आधिकारिक वैदिक {currentResult.periodTitleNe}
          </p>
        </div>

        <a
          href={mainPeriodUrl}
          onClick={(e) => handleLink(e, mainPeriodUrl)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] self-start sm:self-auto shrink-0"
        >
          सबै १२ राशि हेर्नुहोस्
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {/* 3 Clear Period Selection Tabs */}
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Horoscope Periods">
        <button
          type="button"
          onClick={() => setPeriod('daily')}
          role="tab"
          aria-selected={period === 'daily'}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
            period === 'daily'
              ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
              : 'border-stone-200 bg-[#FBF9F5] text-stone-700 hover:border-stone-300 hover:bg-stone-100'
          }`}
        >
          <span>दैनिक राशिफल</span>
          <span className={`text-[11px] ${period === 'daily' ? 'text-white/80' : 'text-stone-400'}`}>
            (Daily)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPeriod('weekly')}
          role="tab"
          aria-selected={period === 'weekly'}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
            period === 'weekly'
              ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
              : 'border-stone-200 bg-[#FBF9F5] text-stone-700 hover:border-stone-300 hover:bg-stone-100'
          }`}
        >
          <span>साप्ताहिक राशिफल</span>
          <span className={`text-[11px] ${period === 'weekly' ? 'text-white/80' : 'text-stone-400'}`}>
            (Weekly)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          role="tab"
          aria-selected={period === 'monthly'}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
            period === 'monthly'
              ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
              : 'border-stone-200 bg-[#FBF9F5] text-stone-700 hover:border-stone-300 hover:bg-stone-100'
          }`}
        >
          <span>मासिक राशिफल</span>
          <span className={`text-[11px] ${period === 'monthly' ? 'text-white/80' : 'text-stone-400'}`}>
            (Monthly)
          </span>
        </button>
      </div>

      {/* 12 Rashi Interactive Selector Grid */}
      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2.5">
          आफ्नो राशि छान्नुहोस् (Select Rashi):
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
          {RASHIS.map((rashi) => {
            const isSelected = rashi.id === selectedRashiId;
            return (
              <button
                key={rashi.id}
                type="button"
                onClick={() => setSelectedRashiId(rashi.id)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all min-h-[60px] focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
                  isSelected
                    ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412] font-semibold ring-1 ring-[#9A3412]'
                    : 'border-stone-200 bg-[#FBF9F5] text-stone-800 hover:border-stone-300 hover:bg-stone-100'
                }`}
              >
                <span className="font-display text-base sm:text-lg leading-tight">{rashi.nameNe}</span>
                <span className="text-[10px] text-stone-500 font-sans mt-0.5">{rashi.englishSign}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Rashi Highlight Card */}
      <div className="mt-5 rounded-lg border border-stone-200 bg-[#FBF9F5] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-4">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h3 className="font-display text-2xl font-bold text-stone-900">
                {activeRashi.nameNe} राशि
              </h3>
              <span className="text-base text-stone-600 font-medium">
                ({activeRashi.nameEn} / {activeRashi.englishSign})
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#9A3412] uppercase tracking-wider">
              {currentResult.periodTitleNe} · {currentResult.coverageLabelNe}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              स्वामी: <strong className="text-stone-700">{activeRashi.rulingPlanetNe}</strong> · 
              तत्व: <strong className="text-stone-700">{activeRashi.elementNe}</strong> · 
              चिह्न: <strong className="text-stone-700">{activeRashi.symbolNe}</strong>
            </p>
          </div>

          <a
            href={rashiDetailUrl}
            onClick={(e) => handleLink(e, rashiDetailUrl)}
            className="text-xs font-semibold text-[#9A3412] hover:underline self-start sm:self-auto shrink-0"
          >
            {activeRashi.nameNe}को पूर्ण {currentResult.periodTitleNe} →
          </a>
        </div>

        {currentResult.isAvailable && currentResult.prediction ? (
          <div className="mt-4 space-y-4">
            <p className="text-base leading-relaxed text-stone-800 font-sans">
              {currentResult.prediction.descriptionNe}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 text-xs">
              {currentResult.prediction.luckyColorNe && (
                <div className="rounded-md border border-stone-200 bg-white p-2.5">
                  <span className="text-stone-500 block">शुभ रङ्ग</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {currentResult.prediction.luckyColorNe}
                  </span>
                </div>
              )}
              {currentResult.prediction.luckyNumber !== undefined && (
                <div className="rounded-md border border-stone-200 bg-white p-2.5">
                  <span className="text-stone-500 block">शुभ अङ्क</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block font-mono">
                    {currentResult.prediction.luckyNumber}
                  </span>
                </div>
              )}
              {currentResult.prediction.careerNe && (
                <div className="rounded-md border border-stone-200 bg-white p-2.5 col-span-2 sm:col-span-2">
                  <span className="text-stone-500 block">करिअर / पेशा</span>
                  <span className="font-medium text-stone-800 mt-0.5 block line-clamp-2">
                    {currentResult.prediction.careerNe}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-stone-600 bg-white border border-stone-200 rounded-md p-4">
            <p className="font-medium text-stone-800">{currentResult.missingMessageNe}</p>
            <p className="mt-1 text-xs text-stone-500">{currentResult.missingMessageEn}</p>
          </div>
        )}
      </div>
    </section>
  );
};
