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
): string {
  return renderToString(
    <App
      initialPath={pathname}
      initialOrigin={origin}
      initialNowMs={nowMs}
      noindexSite={noindexSite}
      adsEnabled={adsEnabled}
      adsenseClientId={adsenseClientId}
      googleSiteVerification={googleSiteVerification}
    />,
  );
}
