import React from 'react';
import { AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { JyotishClientChart } from '../../../lib/jyotish/client.js';
import type { BirthDetails } from '../../../lib/jyotish/types.js';
import { useJyotishReading } from '../../../hooks/useJyotishReading.js';
import { useLocale } from '../../../contexts/LocaleContext';

export interface GrahaDignityBadge {
  graha: string;
  rashiName: string;
  status: 'exalted' | 'debilitated' | 'own_sign' | 'moolatrikona' | 'friendly' | 'neutral' | 'enemy';
}

export interface AiReadingPanelProps {
  birthDetails: BirthDetails | null;
  chart?: JyotishClientChart;
  language?: string;
  grahaDignities?: GrahaDignityBadge[];
  sadeSatiStatus?: {
    isActive: boolean;
    phase: 'first' | 'second' | 'third' | 'none';
    currentSaturnRashiName: string;
  } | null;
}

const ReadingSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <article className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-5">
    <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
    <div className="mt-2 text-sm leading-7 text-stone-700">{children}</div>
  </article>
);

export const AiReadingPanel: React.FC<AiReadingPanelProps> = ({
  birthDetails,
  chart,
  language = 'en',
  grahaDignities = [],
  sadeSatiStatus,
}) => {
  const { locale, t } = useLocale();
  const {
    fullReading,
    loading,
    error,
    generateReading,
  } = useJyotishReading({ birthDetails, chart, language: locale, locale });

  return (
    <section
      aria-labelledby="ai-jyotish-reading-heading"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
              {t('jyotish.aiTitle')}
            </p>
          </div>
          <h2
            id="ai-jyotish-reading-heading"
            className="mt-1 font-display text-2xl font-semibold tracking-tight text-stone-900"
          >
            {t('jyotish.traditionalGuidance')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void generateReading()}
          disabled={loading || !birthDetails}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{fullReading ? t('jyotish.regenerate') : t('kundali.generateReading')}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex flex-col gap-3 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void generateReading()}
            disabled={loading || !birthDetails}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 self-start rounded-md border border-[#B91C1C]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#991B1B] hover:bg-[#FEF2F2]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('jyotish.retry')}
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-5 grid gap-4" aria-label={t('jyotish.loading')} aria-busy="true">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse rounded-lg border border-stone-200 p-5">
              <div className="h-5 w-40 rounded bg-stone-200" />
              <div className="mt-3 space-y-2">
                <div className="h-3.5 rounded bg-stone-100" />
                <div className="h-3.5 w-5/6 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && fullReading && (
        <div className="mt-5 space-y-5">
          {(fullReading.detectedYogas.length > 0 ||
            grahaDignities.length > 0 ||
            sadeSatiStatus) && (
            <div className="flex flex-wrap gap-2" aria-label={t('jyotish.chartIndicators')}>
              {fullReading.detectedYogas.map((yoga) => (
                <span
                  key={yoga}
                  className="rounded-full border border-[#9A3412]/20 bg-[#FDF7F2] px-3 py-1 text-xs font-semibold text-[#7C2D12]"
                >
                  Yoga: {yoga}
                </span>
              ))}
              {grahaDignities.map((dignity) => (
                <span
                  key={`${dignity.graha}-${dignity.status}`}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700"
                >
                  {dignity.graha}: {dignity.status.replace('_', ' ')} ({dignity.rashiName})
                </span>
              ))}
              {sadeSatiStatus && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    sadeSatiStatus.isActive
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700'
                  }`}
                >
                  {t('jyotish.sadeSati')}: {sadeSatiStatus.isActive
                    ? `${sadeSatiStatus.phase} phase`
                    : t('jyotish.notActive')} · Saturn in {sadeSatiStatus.currentSaturnRashiName}
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4">
            <ReadingSection title={t('jyotish.overview')}>{fullReading.overview}</ReadingSection>
            <ReadingSection title={t('jyotish.personality')}>
              {fullReading.personalityAndStrengths}
            </ReadingSection>
            <ReadingSection title={t('jyotish.career')}>
              {fullReading.careerAndWealth}
            </ReadingSection>
            <ReadingSection title={t('jyotish.relationships')}>
              {fullReading.relationshipsAndFamily}
            </ReadingSection>
            <ReadingSection title={t('jyotish.dashaTransit')}>
              {fullReading.currentDashaGuidance}
            </ReadingSection>
            <ReadingSection title={t('jyotish.remedies')}>
              {fullReading.practicalRemedies.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {fullReading.practicalRemedies.map((remedy, index) => (
                    <li key={`${index}-${remedy}`}>{remedy}</li>
                  ))}
                </ul>
              ) : (
                <p>{t('jyotish.noRemedies')}</p>
              )}
            </ReadingSection>
          </div>
        </div>
      )}

      <footer className="mt-6 border-t border-stone-200 pt-4 text-xs leading-5 text-stone-500">
        {t('jyotish.disclaimer')}
      </footer>
    </section>
  );
};
