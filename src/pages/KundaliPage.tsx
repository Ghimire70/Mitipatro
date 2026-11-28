import React, { useMemo, useState } from 'react';
import { AlertCircle, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { calculateJyotishChart } from '../../lib/jyotish/ephemeris.js';
import type {
  BirthDetails,
  JyotishCalculationResult,
} from '../../lib/jyotish/types.js';
import { ALL_LOCATIONS } from '../../lib/jyotish/locations.js';
import { buildInterpreterContext } from '../../lib/jyotish/interpreter-context.js';
import type { JyotishClientChart } from '../../lib/jyotish/client.js';
import { AiReadingPanel } from '../components/jyotish/AiReadingPanel.js';
import { AskJyotishBox } from '../components/jyotish/AskJyotishBox.js';
import { MultiDashaTabs } from '../components/jyotish/MultiDashaTabs.js';
import { PlanetaryPositionsTable } from '../components/jyotish/PlanetaryPositionsTable.js';
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../lib/i18n/format';
import { useJyotishReading } from '../../hooks/useJyotishReading.js';
import type { InterpreterContext } from '../../lib/jyotish/interpreter-context.js';

interface KundaliPageProps {
  onNavigate?: (path: string) => void;
}

const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const RASHI_NAMES_NE = [
  'मेष', 'वृष', 'मिथुन', 'कर्कट', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन',
];

function formatAngle(value: number): string {
  return `${value.toFixed(2)}°`;
}

export const KundaliPage: React.FC<KundaliPageProps> = () => {
  const { locale, t } = useLocale();
  const [adDate, setAdDate] = useState('2000-01-01');
  const [birthTime, setBirthTime] = useState('06:00');
  const [locationName, setLocationName] = useState('Kathmandu');
  const [chart, setChart] = useState<{
    result: JyotishCalculationResult;
    birthDetails: BirthDetails;
    clientChart: JyotishClientChart;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const location = useMemo(
    () => ALL_LOCATIONS.find((item) => item.name === locationName) ?? ALL_LOCATIONS[0],
    [locationName],
  );

  const calculateChart = () => {
    setError(null);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(adDate);
    if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
      setError(t('errors.invalidBirthDetails'));
      return;
    }

    const birthDetails: BirthDetails = {
      birthDateAd: {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      },
      birthDateBs: null,
      birthTime,
      timeZone: location.timezone,
      location,
    };

    try {
      const result = calculateJyotishChart(birthDetails, {
        ayanamshaMode: 'lahiri',
        referenceNow: new Date(),
      });
      setChart({
        result,
        birthDetails,
        clientChart: {
          lagnaRashiIndex: result.houses.lagnaRashiIndex,
          moonRashiIndex: result.planets.find((planet) => planet.graha === 'Moon')?.rashiIndex,
          sunRashiIndex: result.planets.find((planet) => planet.graha === 'Sun')?.rashiIndex,
          ayanamshaDegrees: result.ayanamshaDegrees,
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('errors.chartCalculationFailed'));
    }
  };

  const context = chart
    ? buildInterpreterContext(chart.result)
    : null;

  const { submitQuestion: submitPlanetaryQuestion, asking: planetaryAsking } = useJyotishReading({
    birthDetails: chart?.birthDetails ?? null,
    chart: chart?.clientChart,
    language: locale,
    locale,
  });

  const handleAskAboutPlanet = (question: string) => {
    void submitPlanetaryQuestion(question);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section aria-labelledby="kundali-heading" className="border-b border-stone-200 pb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
            Lahiri Sidereal Chart
          </p>
        </div>
        <h1
          id="kundali-heading"
          className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
        >
          {t('kundali.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          {t('kundali.subtitle')}
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="font-display text-xl font-semibold text-stone-900">{t('kundali.birthDetails')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="kundali-date" className="block text-xs font-medium text-stone-600">
              <Calendar className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {t('kundali.birthDate')} (AD)
            </label>
            <input
              id="kundali-date"
              type="date"
              value={adDate}
              onChange={(event) => setAdDate(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="kundali-time" className="block text-xs font-medium text-stone-600">
              <Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {t('kundali.birthTime')}
            </label>
            <input
              id="kundali-time"
              type="time"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="kundali-location" className="block text-xs font-medium text-stone-600">
              <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {t('kundali.birthPlace')}
            </label>
            <select
              id="kundali-location"
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            >
              {ALL_LOCATIONS.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={calculateChart}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
        >
          {t('kundali.calculate')}
        </button>
      </section>

      {chart && context && (
        <div className="mt-8 space-y-8">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="font-display text-xl font-semibold text-stone-900">{t('kundali.chartSummary')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
                <p className="text-xs text-stone-500">{t('kundali.lagna')}</p>
                <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                  {chart.result.houses.lagnaRashiName} · {(locale === 'ne' ? RASHI_NAMES_NE : RASHI_NAMES)[chart.result.houses.lagnaRashiIndex]}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
                <p className="text-xs text-stone-500">{t('kundali.ayanamsha')}</p>
                <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                  Lahiri {formatAngle(chart.result.ayanamshaDegrees)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
                <p className="text-xs text-stone-500">{t('kundali.mahadasha')}</p>
                <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                  {chart.result.currentMahadasha?.graha ?? t('dasha.unavailable')}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#FBF9F5] p-4">
                <p className="text-xs text-stone-500">{t('kundali.antardasha')}</p>
                <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                  {chart.result.currentAntardasha?.graha ?? t('dasha.unavailable')}
                </p>
              </div>
            </div>

            <PlanetaryPositionsTable
              planets={chart.result.planets}
              houses={chart.result.houses}
              dignities={context.grahaDignities}
              language={locale}
              onAskQuestion={handleAskAboutPlanet}
            />
          </section>

          <MultiDashaTabs
            chart={chart.result}
            context={context}
            birthDetails={chart.birthDetails}
            clientChart={chart.clientChart}
            language={locale}
          />

          <div className="grid gap-8 lg:grid-cols-2">
            <AiReadingPanel
              birthDetails={chart.birthDetails}
              chart={chart.clientChart}
              language={locale}
              grahaDignities={context.grahaDignities.map((dignity) => ({
                graha: dignity.graha,
                rashiName: dignity.rashiName,
                status: dignity.status,
              }))}
              sadeSatiStatus={context.sadeSati}
            />
            <AskJyotishBox
              birthDetails={chart.birthDetails}
              chart={chart.clientChart}
              language={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
};
