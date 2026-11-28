// components/jyotish/MultiDashaTabs.tsx
// Multi-dasha tab switcher: Vimshottari, Yogini, Tribhagi.
// Shows active Mahadasha, Antardasha, and Pratyantardasha with BS/AD date ranges.
// Includes classical shloka ↔ plain-language toggle and "Ask AI about active dashas" flow.

import React, { useMemo, useState } from 'react';
import { ChevronDown, Globe, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import type { BirthDetails, DashaPeriod, GrahaId, JyotishCalculationResult } from '../../../lib/jyotish/types.js';
import type { InterpreterContext } from '../../../lib/jyotish/interpreter-context.js';
import type { JyotishClientChart } from '../../../lib/jyotish/client.js';
import { generateAntardasha } from '../../../lib/jyotish/dasha.js';
import { useJyotishReading } from '../../../hooks/useJyotishReading.js';
import { useLocale } from '../../../contexts/LocaleContext.js';
import { formatLocaleNumber } from '../../../lib/i18n/format.js';

type DashaSystem = 'vimshottari' | 'yogini' | 'tribhagi';

interface MultiDashaTabsProps {
  chart: JyotishCalculationResult;
  context: InterpreterContext | null;
  birthDetails: BirthDetails | null;
  clientChart?: JyotishClientChart;
  language: 'en' | 'ne';
}

const DASHA_YEARS: Record<GrahaId, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
} as const;

const GRAHA_LABELS: Record<GrahaId, { en: string; ne: string }> = {
  Sun: { en: 'Sun', ne: 'सूर्य' },
  Moon: { en: 'Moon', ne: 'चन्द्र' },
  Mars: { en: 'Mars', ne: 'मंगल' },
  Mercury: { en: 'Mercury', ne: 'बुध' },
  Jupiter: { en: 'Jupiter', ne: 'बृहस्पति' },
  Venus: { en: 'Venus', ne: 'शुक्र' },
  Saturn: { en: 'Saturn', ne: 'शनि' },
  Rahu: { en: 'Rahu', ne: 'राहु' },
  Ketu: { en: 'Ketu', ne: 'केतु' },
};

const SHLOKA_TEXT: Record<GrahaId, { en: string; ne: string }> = {
  Sun: { en: 'The Sun governs vitality, authority, and the soul.', ne: 'सूर्य जीवनशक्ति, अधिकार र आत्माको स्वामी हो।' },
  Moon: { en: 'The Moon governs mind, emotions, and mother.', ne: 'चन्द्र मन, भावना र आमाको स्वामी हो।' },
  Mars: { en: 'Mars governs energy, courage, and siblings.', ne: 'मंगल ऊर्जा, साहस र भाइ-बहिनीको स्वामी हो।' },
  Mercury: { en: 'Mercury governs intellect, speech, and commerce.', ne: 'बुध बुद्धि, वाणी र व्यापारको स्वामी हो।' },
  Jupiter: { en: 'Jupiter governs wisdom, expansion, and children.', ne: 'गुरु ज्ञान, विस्तार र सन्तानको स्वामी हो।' },
  Venus: { en: 'Venus governs love, beauty, and relationships.', ne: 'शुक्र प्रेम, सुन्दरता र सम्बन्धको स्वामी हो।' },
  Saturn: { en: 'Saturn governs discipline, structure, and longevity.', ne: 'शनि अनुशासन, संरचना र दीर्घायुको स्वामी हो।' },
  Rahu: { en: 'Rahu governs ambition, foreign matters, and illusion.', ne: 'राहु महत्वाकांक्षा, विदेशी मामिला र भ्रमको स्वामी हो।' },
  Ketu: { en: 'Ketu governs spirituality, detachment, and past karma.', ne: 'केतु आध्यात्मिकता, वैराग्य र विगत कर्मको स्वामी हो।' },
};

function formatIsoDate(isoDate: string, locale: 'en' | 'ne'): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${formatLocaleNumber(y, locale)}-${formatLocaleNumber(m, locale)}-${formatLocaleNumber(d, locale)}`;
}

function formatDuration(years: number, locale: 'en' | 'ne'): string {
  const months = Math.round(years * 12);
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${formatLocaleNumber(y, locale)} ${locale === 'ne' ? 'वर्ष' : y === 1 ? 'year' : 'years'}`);
  if (m > 0) parts.push(`${formatLocaleNumber(m, locale)} ${locale === 'ne' ? 'महिना' : m === 1 ? 'month' : 'months'}`);
  return parts.join(' · ') || `${formatLocaleNumber(0, locale)} ${locale === 'ne' ? 'महिना' : 'months'}`;
}

function computePratyantardasha(
  antardasha: DashaPeriod,
  referenceNow: Date,
): DashaPeriod | null {
  const startDate = new Date(antardasha.startDateAd + 'T00:00:00Z');
  const pratyantardashas = generateAntardasha(
    startDate,
    antardasha.graha,
    antardasha.durationYears,
  );
  const refMs = referenceNow.getTime();
  for (const p of pratyantardashas) {
    const startMs = new Date(p.startDateAd + 'T00:00:00Z').getTime();
    const endMs = new Date(p.endDateAd + 'T00:00:00Z').getTime();
    if (refMs >= startMs && refMs < endMs) {
      return { ...p, isActive: true };
    }
  }
  return null;
}

export const MultiDashaTabs: React.FC<MultiDashaTabsProps> = ({
  chart,
  context,
  birthDetails,
  clientChart,
  language = 'en',
}) => {
  const { locale, t } = useLocale();
  const { submitQuestion, asking } = useJyotishReading({
    birthDetails,
    chart: clientChart,
    language: locale,
    locale,
  });

  const [activeSystem, setActiveSystem] = useState<DashaSystem>('vimshottari');
  const [showShloka, setShowShloka] = useState(false);
  const [askLoading, setAskLoading] = useState(false);

  const currentMahadasha = chart.currentMahadasha;
  const currentAntardasha = chart.currentAntardasha;
  const referenceNow = new Date();

  const currentPratyantardasha = useMemo(() => {
    if (activeSystem !== 'vimshottari' || !currentAntardasha) return null;
    return computePratyantardasha(currentAntardasha, referenceNow);
  }, [activeSystem, currentAntardasha]);

  const activePeriods = useMemo(() => {
    const periods: { label: string; value: string }[] = [];
    if (currentMahadasha) {
      periods.push({
        label: t('multiDasha.mahadasha'),
        value: `${GRAHA_LABELS[currentMahadasha.graha as GrahaId][language]}`,
      });
    }
    if (currentAntardasha) {
      periods.push({
        label: t('multiDasha.antardasha'),
        value: `${GRAHA_LABELS[currentAntardasha.graha as GrahaId][language]}`,
      });
    }
    if (currentPratyantardasha) {
      periods.push({
        label: t('multiDasha.pratyantardasha'),
        value: `${GRAHA_LABELS[currentPratyantardasha.graha as GrahaId][language]}`,
      });
    }
    return periods;
  }, [currentMahadasha, currentAntardasha, currentPratyantardasha, language, t]);

  const handleAskAI = () => {
    if (asking || askLoading) return;
    setAskLoading(true);
    const question = buildDashaQuestion();
    void submitQuestion(question).finally(() => setAskLoading(false));
  };

  const buildDashaQuestion = (): string => {
    const lines: string[] = [];
    lines.push(`Current dasha status for the chart (${activeSystem}):`);
    if (currentMahadasha) {
      const g = currentMahadasha.graha as GrahaId;
      lines.push(
        `- Mahadasha: ${GRAHA_LABELS[g].en} (${formatIsoDate(currentMahadasha.startDateAd, 'en')} to ${formatIsoDate(currentMahadasha.endDateAd, 'en')}, BS: ${formatIsoDate(currentMahadasha.startDateBs, 'en')} to ${formatIsoDate(currentMahadasha.endDateBs, 'en')})`,
      );
    }
    if (currentAntardasha) {
      const g = currentAntardasha.graha as GrahaId;
      lines.push(
        `- Antardasha: ${GRAHA_LABELS[g].en} (${formatIsoDate(currentAntardasha.startDateAd, 'en')} to ${formatIsoDate(currentAntardasha.endDateAd, 'en')}, BS: ${formatIsoDate(currentAntardasha.startDateBs, 'en')} to ${formatIsoDate(currentAntardasha.endDateBs, 'en')})`,
      );
    }
    if (currentPratyantardasha) {
      const g = currentPratyantardasha.graha as GrahaId;
      lines.push(
        `- Pratyantardasha: ${GRAHA_LABELS[g].en} (${formatIsoDate(currentPratyantardasha.startDateAd, 'en')} to ${formatIsoDate(currentPratyantardasha.endDateAd, 'en')}, BS: ${formatIsoDate(currentPratyantardasha.startDateBs, 'en')} to ${formatIsoDate(currentPratyantardasha.endDateBs, 'en')})`,
      );
    }
    lines.push(`Please interpret the combined influence of these active dasha periods.`);
    return lines.join('\n');
  };

  const dashaSystemTabs: { id: DashaSystem; label: string; implemented: boolean }[] = [
    { id: 'vimshottari', label: t('multiDasha.tabs.vimshottari'), implemented: true },
    { id: 'yogini', label: t('multiDasha.tabs.yogini'), implemented: false },
    { id: 'tribhagi', label: t('multiDasha.tabs.tribhagi'), implemented: false },
  ];

  const grahaLabel = (graha: GrahaId): string =>
    GRAHA_LABELS[graha][language] ?? graha;

  return (
    <section
      aria-labelledby="multi-dasha-tabs-heading"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
              {t('multiDasha.title')}
            </p>
          </div>
          <h2 id="multi-dasha-tabs-heading" className="mt-1 font-display text-xl font-semibold tracking-tight text-stone-900">
            {t('multiDasha.title')}
          </h2>
          <p className="mt-1 text-sm text-stone-600">{t('multiDasha.subtitle')}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-1">
        {dashaSystemTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSystem(tab.id)}
            disabled={!tab.implemented}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              activeSystem === tab.id
                ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412]'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            } ${!tab.implemented ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!tab.implemented ? t('multiDasha.notImplemented') : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {!dashaSystemTabs.find((t) => t.id === activeSystem)?.implemented && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-stone-200 bg-[#FBF9F5] px-4 py-3 text-sm text-stone-600">
          <Sparkles className="h-4 w-4 text-[#9A3412]" aria-hidden="true" />
          <span>{t('multiDasha.notImplemented')}</span>
        </div>
      )}
      {activeSystem === 'vimshottari' && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <DashaPeriodCard
              title={t('multiDasha.mahadasha')}
              period={currentMahadasha ?? null}
              language={language}
              t={t as (key: string) => string}
              isActive={!!currentMahadasha}
            />
            <DashaPeriodCard
              title={t('multiDasha.antardasha')}
              period={currentAntardasha ?? null}
              language={language}
              t={t as (key: string) => string}
              isActive={!!currentAntardasha}
            />
            <DashaPeriodCard
              title={t('multiDasha.pratyantardasha')}
              period={currentPratyantardasha ?? null}
              language={language}
              t={t as (key: string) => string}
              isActive={!!currentPratyantardasha}
            />
          </div>
          <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs font-medium text-stone-600 cursor-pointer select-none">
                {t('multiDasha.toggleView')}
              </label>
              <button
                type="button"
                onClick={() => setShowShloka((prev) => !prev)}
                className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  showShloka
                    ? 'border-[#9A3412] bg-[#9A3412] text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {showShloka ? t('multiDasha.plainSummary') : t('multiDasha.shloka')}
              </button>
            </div>
            <div className="text-sm leading-6 text-stone-700">
              {showShloka ? (
                <>
                  <p className="font-medium text-stone-900">{currentMahadasha ? grahaLabel(currentMahadasha.graha) : t('common.notAvailable')}</p>
                  <p className="mt-1 italic text-stone-600">
                    {SHLOKA_TEXT[currentMahadasha?.graha as GrahaId]?.[language] ?? t('multiDasha.notAvailable')}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-stone-900">
                    {currentMahadasha ? `${grahaLabel(currentMahadasha.graha)} Mahadasha` : t('multiDasha.notAvailable')}
                  </p>
                  <p className="mt-1 text-stone-600">
                    {currentMahadasha && currentAntardasha ? (
                      <>
                        {grahaLabel(currentMahadasha.graha)} Mahadasha with {grahaLabel(currentAntardasha.graha)} Antardasha is active.{' '}
                        {currentPratyantardasha ? (
                          <>
                            {' '}
                            Pratyantardasha of {grahaLabel(currentPratyantardasha.graha)} is also in effect.
                          </>
                        ) : null}
                      </>
                    ) : currentMahadasha ? (
                      <>
                        {grahaLabel(currentMahadasha.graha)} Mahadasha is active.
                        {currentAntardasha ? (
                          <>
                            {' '}
                            {grahaLabel(currentAntardasha.graha)} Antardasha is running.
                          </>
                        ) : null}
                      </>
                    ) : t('multiDasha.notAvailable')}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAskAI}
              disabled={askLoading || !birthDetails}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                askLoading || !birthDetails
                  ? 'border-stone-200 bg-stone-100 text-stone-400 disabled:cursor-not-allowed disabled:opacity-60'
                  : 'border-[#9A3412] bg-[#9A3412] text-white hover:bg-[#7C2D12]'
              }`}
            >
              {askLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{askLoading ? t('loadingStates.asking') : t('multiDasha.askAI')}</span>
            </button>
            <p className="text-xs text-stone-500">
              {t('multiDasha.active')}:
              {activePeriods.map((p, i) => (
                <span key={i} className="ml-1 font-medium text-stone-700">
                  {p.label}: {p.value}{i < activePeriods.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

/** Single dasha period card showing graha, dates, duration. */
function DashaPeriodCard({
  title,
  period,
  language,
  t,
  isActive,
}: {
  title: string;
  period: DashaPeriod | null;
  language: 'en' | 'ne';
  t: (key: string) => string;
  isActive: boolean;
}) {
  const grahaLabelMap: Record<GrahaId, { en: string; ne: string }> = {
    Sun: { en: 'Sun', ne: 'सूर्य' },
    Moon: { en: 'Moon', ne: 'चन्द्र' },
    Mars: { en: 'Mars', ne: 'मंगल' },
    Mercury: { en: 'Mercury', ne: 'बुध' },
    Jupiter: { en: 'Jupiter', ne: 'बृहस्पति' },
    Venus: { en: 'Venus', ne: 'शुक्र' },
    Saturn: { en: 'Saturn', ne: 'शनि' },
    Rahu: { en: 'Rahu', ne: 'राहु' },
    Ketu: { en: 'Ketu', ne: 'केतु' },
  };

  const label = period ? grahaLabelMap[period.graha][language] : null;

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        isActive
          ? 'border-[#9A3412]/30 bg-[#FDF7F2]'
          : 'border-stone-100 bg-stone-50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </p>
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#9A3412]/30 bg-[#9A3412]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7C2D12]">
            {t('multiDasha.active')}
          </span>
        )}
      </div>
      {period ? (
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold text-stone-900">{label}</p>
          <p className="text-xs text-stone-500">
            {t('multiDasha.startDate')}:
            <span className="font-mono text-stone-700">{formatIsoDate(period.startDateAd, language)}</span>
          </p>
          <p className="text-xs text-stone-500">
            {t('multiDasha.endDate')}:
            <span className="font-mono text-stone-700">{formatIsoDate(period.endDateAd, language)}</span>
          </p>
          <p className="text-xs text-stone-500">
            {t('multiDasha.bsDate')}:
            <span className="font-mono text-stone-700">{period.startDateBs ? formatIsoDate(period.startDateBs, language) : t('common.notAvailable')}</span>
            {' - '}
            <span className="font-mono text-stone-700">{period.endDateBs ? formatIsoDate(period.endDateBs, language) : t('common.notAvailable')}</span>
          </p>
          <p className="text-xs text-stone-500">{formatDuration(period.durationYears, language)}</p>
        </div>
      ) : (
        <p className="text-sm text-stone-400">{t('multiDasha.notAvailable')}</p>
      )}
    </article>
  );
}