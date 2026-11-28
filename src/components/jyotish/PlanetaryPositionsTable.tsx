// components/jyotish/PlanetaryPositionsTable.tsx
// Responsive table listing Lagna and all 9 Grahas with Rashi, exact degrees,
// Nakshatra & Pada, House number, and Dignity/Retrograde badges.
// Clicking any row opens/prefills a focused AI question about that planet's placement.

import React from 'react';
import { ChevronRight, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import type { GrahaId, HouseCusps, PlanetPosition } from '../../../lib/jyotish/types.js';
import type { GrahaDignity } from '../../../lib/jyotish/interpreter-context.js';
import { useLocale } from '../../../contexts/LocaleContext.js';
import { formatLocaleNumber } from '../../../lib/i18n/format.js';

interface PlanetaryPositionsTableProps {
  planets: PlanetPosition[];
  houses: HouseCusps;
  dignities: GrahaDignity[];
  language: 'en' | 'ne';
  onAskQuestion: (question: string) => void;
}

const GRAHA_ORDER: GrahaId[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

const GRAHA_LABELS: Record<GrahaId | 'Lagna', { en: string; ne: string }> = {
  Sun: { en: 'Sun', ne: 'सूर्य' },
  Moon: { en: 'Moon', ne: 'चन्द्र' },
  Mars: { en: 'Mars', ne: 'मंगल' },
  Mercury: { en: 'Mercury', ne: 'बुध' },
  Jupiter: { en: 'Jupiter', ne: 'बृहस्पति' },
  Venus: { en: 'Venus', ne: 'शुक्र' },
  Saturn: { en: 'Saturn', ne: 'शनि' },
  Rahu: { en: 'Rahu', ne: 'राहु' },
  Ketu: { en: 'Ketu', ne: 'केतु' },
  Lagna: { en: 'Lagna', ne: 'लग्न' },
};

const DIGNITY_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  exalted: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-800' },
  debilitated: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800' },
  own_sign: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800' },
  moolatrikona: { border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-800' },
  friendly: { border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-800' },
  neutral: { border: 'border-stone-200', bg: 'bg-stone-50', text: 'text-stone-700' },
  enemy: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-800' },
};

function formatDegrees(degrees: number, locale: 'en' | 'ne'): string {
  const totalSeconds = Math.round(degrees * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${formatLocaleNumber(d, locale)}° ${formatLocaleNumber(m, locale)}′ ${formatLocaleNumber(s, locale)}″`;
}

export const PlanetaryPositionsTable: React.FC<PlanetaryPositionsTableProps> = ({
  planets,
  houses,
  dignities,
  language,
  onAskQuestion,
}) => {
  const { locale, t } = useLocale();

  const dignityMap = new Map(dignities.map((d) => [d.graha, d]));

  const rows = [
    {
      graha: 'Lagna' as const,
      label: GRAHA_LABELS.Lagna[language],
      rashiName: houses.lagnaRashiName,
      rashiIndex: houses.lagnaRashiIndex,
      nakshatraName: houses.lagnaNakshatraName,
      nakshatraIndex: houses.lagnaNakshatraIndex,
      pada: houses.lagnaPada,
      degrees: houses.lagnaLongitudeDegrees % 30,
      house: 1,
      isRetrograde: false,
      isCombust: false,
      dignity: undefined,
    },
    ...planets.map((p) => ({
      graha: p.graha,
      label: GRAHA_LABELS[p.graha][language],
      rashiName: p.rashiName,
      rashiIndex: p.rashiIndex,
      nakshatraName: p.nakshatraName,
      nakshatraIndex: p.nakshatraIndex,
      pada: p.pada,
      degrees: p.rashiLongitudeDegrees,
      house: houses.rashiToHouse[p.rashiIndex],
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
      dignity: dignityMap.get(p.graha),
    })),
  ];

  const handleRowClick = (graha: GrahaId | 'Lagna', rashiName: string, house: number) => {
    const grahaName = GRAHA_LABELS[graha].en;
    const question = t('planetaryTable.askAboutPlanet').replace('{graha}', grahaName);
    onAskQuestion(`${question} It is placed in ${rashiName} (house ${formatLocaleNumber(house, locale)}).`);
  };

  return (
    <section
      aria-labelledby="planetary-positions-heading"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-[#9A3412]" aria-hidden="true" />
        <h2
          id="planetary-positions-heading"
          className="font-display text-xl font-semibold tracking-tight text-stone-900"
        >
          {t('planetaryTable.title')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-stone-600">{t('planetaryTable.subtitle')}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="py-3 pr-4 font-medium">{t('planetaryTable.columns.graha')}</th>
              <th className="py-3 pr-4 font-medium">{t('planetaryTable.columns.rashi')}</th>
              <th className="py-3 pr-4 font-medium">{t('planetaryTable.columns.degree')}</th>
              <th className="py-3 font-medium">{t('planetaryTable.columns.nakshatra')}</th>
              <th className="py-3 pr-4 font-medium">{t('planetaryTable.columns.house')}</th>
              <th className="py-3 font-medium">{t('planetaryTable.columns.dignity')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => {
              const dignity = row.dignity;
              const status = dignity?.status ?? 'neutral';
              const style = DIGNITY_STYLE[status] ?? DIGNITY_STYLE.neutral;
              const dignityLabel = t(`planetaryTable.dignity.${status}`);
              const isClickable = row.graha !== 'Lagna';

              return (
                <tr
                  key={row.graha}
                  className="border-b border-stone-100 last:border-0 hover:bg-[#FBF9F5] transition-colors cursor-pointer group"
                  onClick={() => handleRowClick(row.graha, row.rashiName, row.house)}
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">{row.label}</span>
                      {row.isRetrograde && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {t('planetaryTable.retrograde')}
                        </span>
                      )}
                      {row.isCombust && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
                          <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                          {t('planetaryTable.combust')}
                        </span>
                      )}
                    </div>
                    {isClickable && (
                      <p className="mt-1 text-[10px] text-stone-400 uppercase tracking-wider">
                        {t('planetaryTable.askAboutPlanet').replace('{graha}', GRAHA_LABELS[row.graha].en)}
                      </p>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-stone-700">{row.rashiName}</td>
                  <td className="py-4 pr-4 font-mono text-stone-700">
                    {formatDegrees(row.degrees, language)}
                  </td>
                  <td className="py-4 text-stone-700">
                    {row.nakshatraName} <span className="text-stone-500">({t('planetaryTable.columns.pada')} {formatLocaleNumber(row.pada, language)})</span>
                  </td>
                  <td className="py-4 pr-4 text-stone-700">
                    {formatLocaleNumber(row.house, language)}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center rounded-full ${style.border} ${style.bg} px-2.5 py-0.5 text-[10px] font-semibold ${style.text}`}
                    >
                      {dignityLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="mt-4 flex items-center gap-2 text-xs text-stone-500">
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span>Click any planet row to ask about its placement.</span>
      </footer>
    </section>
  );
};