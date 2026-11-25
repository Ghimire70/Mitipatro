import { renderToString } from 'react-dom/server';
import App from './App';

export function render(
  pathname: string,
  origin: string,
  nowMs: number,
  noindexSite = true,
  adsEnabled = false,
  adsenseClientId = '',
  googleSiteVerification = '',
  converterToolsIndexingEnabled = false,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
  adSenseSlotLeaderboard = '',
  adSenseSlotRectangle = '',
): string {
  return renderToString(
    <App
      initialPath={pathname}
      initialOrigin={origin}
      initialNowMs={nowMs}
      noindexSite={noindexSite}
      adsEnabled={adsEnabled}
      adsenseClientId={adsenseClientId}
      adSenseSlotLeaderboard={adSenseSlotLeaderboard}
      adSenseSlotRectangle={adSenseSlotRectangle}
      googleSiteVerification={googleSiteVerification}
      converterToolsIndexingEnabled={converterToolsIndexingEnabled}
      rashifalIndexingEnabled={rashifalIndexingEnabled}
      panchangIndexingEnabled={panchangIndexingEnabled}
    />,
  ).replace(/</g, '\\u003c');
}
