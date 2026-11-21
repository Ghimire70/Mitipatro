import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  RASHIS,
  getRashiById,
  type RashiId,
  type RashiMeta,
} from '../../lib/rashifal';
import {
  computeRashifalEngine,
  moonPositionFromSign,
} from '../../lib/rashifalEngine.js';
import { RASHIFAL_READINGS, type RashifalReading } from '../../lib/rashifalReadings.js';
import { getTodayNepal } from '../../lib/bsConverter.js';

interface RasifalSectionProps {
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const RasifalSection: React.FC<RasifalSectionProps> = ({ nowMs, onNavigate }) => {
  const today = useMemo(
    () => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined),
    [nowMs],
  );

  const [selectedRashiId, setSelectedRashiId] = useState<RashiId>('mesha');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const bsYear = today.bs.year;
  const bsMonth = today.bs.month;
  const bsDay = today.bs.day;

  const engineResult = computeRashifalEngine(bsYear, bsMonth, bsDay, 'mesha');
  const moonRashiIndex = engineResult.moonRashiIndex;

  const { reading, position } = useMemo(() => {
    const rashiMeta = RASHIS.find((r) => r.id === selectedRashiId);
    if (!rashiMeta) return { reading: null as RashifalReading | null, position: 1 };
    const position = moonPositionFromSign(rashiMeta.order - 1, moonRashiIndex);
    const reading = RASHIFAL_READINGS.find(
      (r) => r.position === position && r.variant === 'a',
    );
    const approvedReading =
      reading &&
      reading.approved === true &&
      reading.source === 'original-editorial' &&
      reading.textNe.trim().length > 0
        ? reading
        : null;
    return { reading: approvedReading, position };
  }, [bsYear, bsMonth, bsDay, moonRashiIndex, selectedRashiId]);

  const activeRashi: RashiMeta = RASHIS.find((r) => r.id === selectedRashiId) || RASHIS[0];
  const isAvailable = !!reading;

  const periodTitleNe = 'दैनिक राशिफल';
  const coverageLabelNe = `${engineResult.adYear}-${String(engineResult.adMonth).padStart(2, '0')}-${String(engineResult.adDay).padStart(2, '0')}`;

  const rashiDetailUrl = `/rashifal/${activeRashi.id}`;

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
            {periodTitleNe} ({coverageLabelNe})
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {today.bs.monthNameEn} {today.bs.day}, {today.bs.year} BS · १२ वटै राशिको आधिकारिक वैदिक {periodTitleNe}
          </p>
        </div>

        <a
          href="/rashifal"
          onClick={(e) => handleLink(e, '/rashifal')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] self-start sm:self-auto shrink-0"
        >
          सबै १२ राशि हेर्नुहोस्
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
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
              {periodTitleNe} · {coverageLabelNe}
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
            {activeRashi.nameNe}को पूर्ण {periodTitleNe} →
          </a>
        </div>

        {reading ? (
          <div className="mt-4 space-y-4">
            <p className="text-base leading-relaxed text-stone-800 font-sans">
              {reading.textNe}
            </p>
          </div>
        ) : (
          <div className="mt-4 text-sm text-stone-500 bg-white border border-stone-200 rounded-md p-4">
            <p className="font-medium text-stone-800">यस मितिको आधिकारिक दैनिक राशिफल हाल उपलब्ध छैन।</p>
            <p className="mt-1 text-xs text-stone-500">मितिपत्रोले प्रमाणित र आधिकारिक राशिफल सामग्री मात्र प्रस्तुत गर्दछ।</p>
          </div>
        )}
      </div>
    </section>
  );
};
