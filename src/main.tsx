import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { type AppProps } from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __MITIPATRO_DATA__?: AppProps;
  }
}

const rootEl = document.getElementById('root')!;
const ssrData = window.__MITIPATRO_DATA__;

// Client-side fallback: when SSR data is absent (static SPA deployment),
// read VITE_RASHIFAL_INDEXING_ENABLED from Vite env. Published by default;
// opt out with VITE_RASHIFAL_INDEXING_ENABLED=false|0|off|no.
const viteEnv: Record<string, string | undefined> =
  typeof import.meta.env !== 'undefined' ? import.meta.env : {};
const viteRashifal = viteEnv.VITE_RASHIFAL_INDEXING_ENABLED;
const clientRashifalIndexingEnabled =
  viteRashifal === undefined || viteRashifal === null || viteRashifal === ''
    ? true
    : !['false', '0', 'off', 'no'].includes(String(viteRashifal).trim().toLowerCase());

const rashifalIndexingEnabled = ssrData?.rashifalIndexingEnabled ?? clientRashifalIndexingEnabled;

const appElement = (
  <App
    initialPath={ssrData?.initialPath}
    initialOrigin={ssrData?.initialOrigin}
    initialNowMs={ssrData?.initialNowMs}
    noindexSite={ssrData?.noindexSite}
    adsEnabled={ssrData?.adsEnabled}
    adsenseClientId={ssrData?.adsenseClientId}
    googleSiteVerification={ssrData?.googleSiteVerification}
    converterToolsIndexingEnabled={ssrData?.converterToolsIndexingEnabled}
    rashifalIndexingEnabled={rashifalIndexingEnabled}
    panchangIndexingEnabled={ssrData?.panchangIndexingEnabled}
  />
);

if (rootEl.firstElementChild) {
  hydrateRoot(rootEl, appElement);
} else {
  createRoot(rootEl).render(appElement);
}
