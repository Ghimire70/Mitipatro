import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CURRENT_BS_YEAR, PUBLISHED_BS_YEARS } from '../lib/bsData';
import { getBsMonthBySlug, getTodayNepal } from '../lib/bsConverter';
import { getSeoForRoute } from '../lib/seo';
import type { ConverterToolSlug } from '../lib/converterTools';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeoHeadSync } from './components/JsonLd';
import { AdSettingsContext } from './components/AdSettingsContext';
import { HomePage } from './pages/HomePage';
import { TodayPage } from './pages/TodayPage';
import { YearPage } from './pages/YearPage';
import { MonthPage } from './pages/MonthPage';
import { ConverterPage } from './pages/ConverterPage';
import { ConverterToolsPage } from './pages/ConverterToolsPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { FestivalsPage } from './pages/FestivalsPage';
import { StaticPages } from './pages/StaticPages';
import { PanchangPage } from './pages/PanchangPage';
import { RashifalPage } from './pages/RashifalPage';
import { FaqPage } from './pages/FaqPage';
import { getRashiById } from '../lib/rashifal';

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function getConverterToolSlug(pathname: string): ConverterToolSlug | null {
  switch (pathname) {
    case '/bs-date-difference':
      return 'bs-date-difference';
    case '/bs-age-calculator':
      return 'bs-age-calculator';
    case '/nepali-numbers':
      return 'nepali-numbers';
    default:
      return null;
  }
}

export interface AppProps {
  initialPath?: string;
  initialOrigin?: string;
  initialNowMs?: number;
  noindexSite?: boolean;
  adsEnabled?: boolean;
  adsenseClientId?: string;
  adSenseSlotLeaderboard?: string;
  adSenseSlotRectangle?: string;
  googleSiteVerification?: string;
  converterToolsIndexingEnabled?: boolean;
  rashifalIndexingEnabled?: boolean;
  panchangIndexingEnabled?: boolean;
}

export default function App({
  initialPath,
  initialOrigin,
  initialNowMs,
  noindexSite = true,
  adsEnabled = false,
  adsenseClientId = '',
  adSenseSlotLeaderboard = '',
  adSenseSlotRectangle = '',
  googleSiteVerification = '',
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
}: AppProps = {}) {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    normalizePath(initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/')),
  );
  const [nowMs, setNowMs] = useState<number>(() => initialNowMs ?? Date.now());

  // Keep nowMs current at 00:00 Asia/Kathmandu (UTC+05:45, no DST) so rashifal
  // and date-sensitive pages update at Nepal midnight regardless of visitor timezone.
  // A precise timer fires at the next NPT midnight and re-arms daily; a 60s poll
  // is a safety net for tabs that are backgrounded when midnight passes.
  useEffect(() => {
    const KATHMANDU_OFFSET_MS = (5 * 3600 + 45 * 60) * 1000;

    let pollTimer: ReturnType<typeof setInterval>;
    let midnightTimer: ReturnType<typeof setTimeout>;

    function scheduleNextMidnight() {
      clearTimeout(midnightTimer);
      const now = Date.now();
      const nptMidnight = new Date(now + KATHMANDU_OFFSET_MS);
      nptMidnight.setUTCHours(0, 0, 0, 0);
      nptMidnight.setUTCDate(nptMidnight.getUTCDate() + 1); // next NPT midnight
      const nextMidnightUtcMs = new Date(nptMidnight.getTime() - KATHMANDU_OFFSET_MS).getTime();
      const delay = Math.max(nextMidnightUtcMs - now, 60_000);
      midnightTimer = setTimeout(() => {
        setNowMs(Date.now());
        scheduleNextMidnight();
      }, delay);
    }

    function tick() {
      if (
        getTodayNepal(new Date(Date.now())).bs.iso !==
        getTodayNepal(new Date(nowMs)).bs.iso
      ) {
        setNowMs(Date.now());
      }
    }

    tick();
    pollTimer = setInterval(tick, 60_000);
    scheduleNextMidnight();

    return () => {
      clearInterval(pollTimer);
      clearTimeout(midnightTimer);
    };
  }, [nowMs]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const next = normalizePath(path);
    if (next !== currentPath) {
      window.history.pushState({}, '', next);
      setCurrentPath(next);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [currentPath]);

  const baseUrl =
    initialOrigin ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const referenceDate = useMemo(() => new Date(nowMs), [nowMs]);
  const seo = useMemo(
    () => getSeoForRoute(
      currentPath,
      baseUrl,
      referenceDate,
      noindexSite,
      converterToolsIndexingEnabled,
      rashifalIndexingEnabled,
      panchangIndexingEnabled,
    ),
    [currentPath, baseUrl, referenceDate, noindexSite, converterToolsIndexingEnabled, rashifalIndexingEnabled, panchangIndexingEnabled],
  );

  const renderPage = () => {
    const converterTool = getConverterToolSlug(currentPath);

    // If SEO marks this route as not found (e.g. rashifal/panchang with gate off),
    // render the same 404 page as unknown routes.
    if (seo.isNotFound) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Page Not Found
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900">
            This calendar route is not published
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            MitiPatro publishes full monthly and holiday pages for {PUBLISHED_BS_YEARS.join(', ')} BS, and supports date conversions from 2000–2090 BS.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
            >
              Go to Current Month ({CURRENT_BS_YEAR} BS)
            </button>
            <button
              type="button"
              onClick={() => navigate('/date-converter')}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Open BS–AD Converter
            </button>
          </div>
        </div>
      );
    }

    if (currentPath === '/') {
      return (
        <HomePage
          faqs={seo.faqs}
          nowMs={nowMs}
          onNavigate={navigate}
          rashifalIndexingEnabled={rashifalIndexingEnabled}
        />
      );
    }
    if (currentPath === '/aaja-ko-miti') {
      return (
        <TodayPage
          faqs={seo.faqs}
          nowMs={nowMs}
          onNavigate={navigate}
          rashifalIndexingEnabled={rashifalIndexingEnabled}
        />
      );
    }
    if (currentPath === '/date-converter') {
      return <ConverterPage faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} />;
    }
    if (currentPath === '/panchang') {
      return (
        <PanchangPage
          faqs={seo.faqs}
          nowMs={nowMs}
          onNavigate={navigate}
        />
      );
    }
    if (currentPath === '/rashifal' || currentPath === '/rashifal/daily') {
      return <RashifalPage faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} rashifalIndexingEnabled={rashifalIndexingEnabled} />;
    }
    if (currentPath === '/rashifal/weekly') {
      return <RashifalPage faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} rashifalIndexingEnabled={rashifalIndexingEnabled} />;
    }
    if (currentPath === '/rashifal/monthly') {
      return <RashifalPage faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} rashifalIndexingEnabled={rashifalIndexingEnabled} />;
    }
    const periodRashiMatch = /^\/rashifal\/(daily|weekly|monthly)\/([a-z]+)$/i.exec(currentPath);
    if (periodRashiMatch) {
      const p = periodRashiMatch[1].toLowerCase() as 'daily' | 'weekly' | 'monthly';
      const rashiMeta = getRashiById(periodRashiMatch[2]);
      if (rashiMeta) {
        return (
          <RashifalPage
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
            rashifalIndexingEnabled={rashifalIndexingEnabled}
          />
        );
      }
    }
    const rashiMatch = /^\/rashifal\/([a-z]+)$/i.exec(currentPath);
    if (rashiMatch) {
      const rashiMeta = getRashiById(rashiMatch[1]);
      if (rashiMeta) {
        return (
          <RashifalPage
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
            rashifalIndexingEnabled={rashifalIndexingEnabled}
          />
        );
      }
    }
    if (converterTool) {
      return (
        <ConverterToolsPage
          key={converterTool}
          tool={converterTool}
          faqs={seo.faqs}
          nowMs={nowMs}
          onNavigate={navigate}
        />
      );
    }
    if (
      currentPath === '/about' ||
      currentPath === '/contact' ||
      currentPath === '/privacy' ||
      currentPath === '/terms'
    ) {
      const pageKey = currentPath.slice(1) as 'about' | 'contact' | 'privacy' | 'terms';
      return <StaticPages page={pageKey} onNavigate={navigate} />;
    }

    const monthMatch = /^\/calendar\/(\d{4})\/([a-z-]+)$/i.exec(currentPath);
    if (monthMatch) {
      const year = Number(monthMatch[1]);
      const monthMeta = getBsMonthBySlug(monthMatch[2]);
      if (monthMeta && (PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
        return (
          <MonthPage
            year={year}
            month={monthMeta.index}
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
            rashifalIndexingEnabled={rashifalIndexingEnabled}
          />
        );
      }
    }

    const yearMatch = /^\/calendar\/(\d{4})$/.exec(currentPath);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
        return (
          <YearPage
            year={year}
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
          />
        );
      }
    }

    const holMatch = /^\/holidays\/(\d{4})$/.exec(currentPath);
    if (holMatch) {
      const year = Number(holMatch[1]);
      if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
        return <HolidaysPage year={year} faqs={seo.faqs} onNavigate={navigate} />;
      }
    }

    const festMatch = /^\/festivals\/(\d{4})$/.exec(currentPath);
    if (festMatch) {
      const year = Number(festMatch[1]);
      if ((PUBLISHED_BS_YEARS as readonly number[]).includes(year)) {
        return <FestivalsPage year={year} faqs={seo.faqs} onNavigate={navigate} />;
      }
    }

    if (currentPath === '/faq') {
      return <FaqPage onNavigate={navigate} />;
    }

    // All remaining routes have isNotFound=true from getSeoForRoute,
    // handled by the early return at the top of renderPage().
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          Page Not Found
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900">
          This calendar route is not published
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          MitiPatro publishes full monthly and holiday pages for {PUBLISHED_BS_YEARS.join(', ')} BS, and supports date conversions from 2000–2090 BS.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
          >
            Go to Current Month ({CURRENT_BS_YEAR} BS)
          </button>
          <button
            type="button"
            onClick={() => navigate('/date-converter')}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            Open BS–AD Converter
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdSettingsContext.Provider value={{ enabled: adsEnabled, clientId: adsenseClientId, slotLeaderboard: adSenseSlotLeaderboard, slotRectangle: adSenseSlotRectangle }}>
      <div className="app-shell flex min-h-screen flex-col bg-[#FBF9F5] text-[#1C1917]">
        <SeoHeadSync
          seo={seo}
          baseUrl={baseUrl}
          googleSiteVerification={googleSiteVerification}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#9A3412] focus:shadow"
        >
          Skip to main content
        </a>
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
          rashifalIndexingEnabled={rashifalIndexingEnabled}
          panchangIndexingEnabled={panchangIndexingEnabled}
        />
        <main id="main-content" className="flex-1">
          {renderPage()}
        </main>
        <Footer
          nowMs={nowMs}
          onNavigate={navigate}
          rashifalIndexingEnabled={rashifalIndexingEnabled}
          panchangIndexingEnabled={panchangIndexingEnabled}
        />
      </div>
    </AdSettingsContext.Provider>
  );
}
