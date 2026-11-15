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
    rashifalIndexingEnabled={ssrData?.rashifalIndexingEnabled}
  />
);

if (rootEl.firstElementChild) {
  hydrateRoot(rootEl, appElement);
} else {
  createRoot(rootEl).render(appElement);
}
