import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CURRENT_BS_YEAR, PUBLISHED_BS_YEARS } from '../lib/bsData';
import { getBsMonthBySlug } from '../lib/bsConverter';
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
import { StaticPages } from './pages/StaticPages';
import { RashifalPage } from './pages/RashifalPage';
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
  googleSiteVerification?: string;
  converterToolsIndexingEnabled?: boolean;
  rashifalIndexingEnabled?: boolean;
}

export default function App({
  initialPath,
  initialOrigin,
  initialNowMs,
  noindexSite = true,
  adsEnabled = false,
  adsenseClientId = '',
  googleSiteVerification = '',
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
}: AppProps = {}) {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    normalizePath(initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/')),
  );
  const [nowMs] = useState<number>(() => initialNowMs ?? Date.now());

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
    ),
    [currentPath, baseUrl, referenceDate, noindexSite, converterToolsIndexingEnabled, rashifalIndexingEnabled],
  );

  const renderPage = () => {
    const converterTool = getConverterToolSlug(currentPath);
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
    if (currentPath === '/rashifal' || currentPath === '/rashifal/daily') {
      return <RashifalPage initialPeriod="daily" faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} />;
    }
    if (currentPath === '/rashifal/weekly') {
      return <RashifalPage initialPeriod="weekly" faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} />;
    }
    if (currentPath === '/rashifal/monthly') {
      return <RashifalPage initialPeriod="monthly" faqs={seo.faqs} nowMs={nowMs} onNavigate={navigate} />;
    }
    const periodRashiMatch = /^\/rashifal\/(daily|weekly|monthly)\/([a-z]+)$/i.exec(currentPath);
    if (periodRashiMatch) {
      const p = periodRashiMatch[1].toLowerCase() as 'daily' | 'weekly' | 'monthly';
      const rashiMeta = getRashiById(periodRashiMatch[2]);
      if (rashiMeta) {
        return (
          <RashifalPage
            initialPeriod={p}
            rashiFilter={rashiMeta.id}
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
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
            initialPeriod="daily"
            rashiFilter={rashiMeta.id}
            faqs={seo.faqs}
            nowMs={nowMs}
            onNavigate={navigate}
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

    // Fallback: clean 404 notice with quick links to valid intents
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
    <AdSettingsContext.Provider value={{ enabled: adsEnabled, clientId: adsenseClientId }}>
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
        />
        <main id="main-content" className="flex-1">
          {renderPage()}
        </main>
        <Footer
          nowMs={nowMs}
          onNavigate={navigate}
          rashifalIndexingEnabled={rashifalIndexingEnabled}
        />
      </div>
    </AdSettingsContext.Provider>
  );
}
