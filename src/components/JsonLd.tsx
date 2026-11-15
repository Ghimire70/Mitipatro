import { useEffect } from 'react';
import type { PageSeoData } from '../../lib/seo';
import { buildCanonicalUrl } from '../../lib/siteConfig';

interface SeoHeadSyncProps {
  seo: PageSeoData;
  baseUrl: string;
  googleSiteVerification: string;
}

/**
 * Synchronizes document title, meta description, canonical link, OpenGraph tags,
 * and JSON-LD structured data on client-side route transitions.
 * (Initial page loads also receive these tags directly from Express SSR.)
 */
export const SeoHeadSync: React.FC<SeoHeadSyncProps> = ({
  seo,
  baseUrl,
  googleSiteVerification,
}) => {
  useEffect(() => {
    document.title = seo.title;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', seo.description);
    setMeta('meta[name="robots"]', 'name', 'robots', seo.robots);
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);

    const verificationMeta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="google-site-verification"]',
    );
    if (seo.canonicalPath === '/' && googleSiteVerification.trim()) {
      const meta = verificationMeta ?? document.createElement('meta');
      meta.setAttribute('name', 'google-site-verification');
      meta.setAttribute('content', googleSiteVerification.trim());
      if (!verificationMeta) document.head.appendChild(meta);
    } else {
      verificationMeta?.remove();
    }

    const canonicalUrl = buildCanonicalUrl(seo.canonicalPath, baseUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Replace managed JSON-LD scripts
    document.head
      .querySelectorAll('script[data-mitipatro-jsonld="true"]')
      .forEach((node) => node.remove());

    for (const schema of seo.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-mitipatro-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [seo, googleSiteVerification]);

  return null;
};
