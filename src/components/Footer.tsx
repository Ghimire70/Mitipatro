import React from 'react';
import { CURRENT_BS_YEAR, PUBLISHED_BS_YEARS } from '../../lib/bsData';

import { getTodayNepal } from '../../lib/bsConverter';

interface FooterProps {
  nowMs?: number;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
  panchangIndexingEnabled?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  nowMs,
  onNavigate,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
}) => {
  const copyrightYear = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined).ad.year;
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="print-hidden mt-16 border-t border-hairline bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="font-serif text-xl font-bold text-ink"
            >
              MitiPatro
            </a>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slatewarm">
              An independent Bikram Sambat (BS) calendar and BS-to-AD date reference. Today&rsquo;s date uses Asia/Kathmandu (UTC+05:45); holiday listings are for reference and should be checked against government notices.
            </p>
            <p className="mt-4 text-xs text-stone-500">
              BS–AD conversion range: 2000–2090 BS (1943–2034 AD).
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slatewarm">
              Calendars &amp; Tools
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-700">
              <li>
                <a href="/aaja-ko-miti" onClick={(e) => handleLink(e, '/aaja-ko-miti')} className="hover:text-terracotta hover:underline transition-colors">
                  Aaja Ko Miti (Today)
                </a>
              </li>
              {rashifalIndexingEnabled && (
                <li>
                  <a href="/rashifal" onClick={(e) => handleLink(e, '/rashifal')} className="hover:text-terracotta hover:underline transition-colors whitespace-nowrap shrink-0">
                    Rashifal (Horoscope)
                  </a>
                </li>
              )}
              {panchangIndexingEnabled && (
                <li>
                  <a href="/panchang" onClick={(e) => handleLink(e, '/panchang')} className="hover:text-terracotta hover:underline transition-colors">
                    Panchang (पञ्चाङ्ग)
                  </a>
                </li>
              )}
              <li>
                <a href="/date-converter" onClick={(e) => handleLink(e, '/date-converter')} className="hover:text-terracotta hover:underline transition-colors">
                  BS to AD Converter
                </a>
              </li>
              <li>
                <a href="/bs-date-difference" onClick={(e) => handleLink(e, '/bs-date-difference')} className="hover:text-terracotta hover:underline transition-colors">
                  BS Date Difference
                </a>
              </li>
              <li>
                <a href="/bs-age-calculator" onClick={(e) => handleLink(e, '/bs-age-calculator')} className="hover:text-terracotta hover:underline transition-colors">
                  BS Age Calculator
                </a>
              </li>
              <li>
                <a href="/nepali-numbers" onClick={(e) => handleLink(e, '/nepali-numbers')} className="hover:text-terracotta hover:underline transition-colors">
                  Nepali Number Converter
                </a>
              </li>
              {PUBLISHED_BS_YEARS.map((yr) => (
                <li key={yr}>
                  <a href={`/calendar/${yr}`} onClick={(e) => handleLink(e, `/calendar/${yr}`)} className="hover:text-terracotta hover:underline transition-colors">
                    Nepali Calendar {yr} BS
                  </a>
                </li>
              ))}
              <li>
                <a href={`/holidays/${CURRENT_BS_YEAR}`} onClick={(e) => handleLink(e, `/holidays/${CURRENT_BS_YEAR}`)} className="hover:text-terracotta hover:underline transition-colors">
                  Public Holidays {CURRENT_BS_YEAR} BS
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slatewarm">
              Editorial &amp; Policies
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-700">
              <li>
                <a href="/about" onClick={(e) => handleLink(e, '/about')} className="hover:text-terracotta hover:underline transition-colors">
                  About &amp; Methodology
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => handleLink(e, '/contact')} className="hover:text-terracotta hover:underline transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => handleLink(e, '/privacy')} className="hover:text-terracotta hover:underline transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" onClick={(e) => handleLink(e, '/terms')} className="hover:text-terracotta hover:underline transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" className="hover:text-terracotta hover:underline transition-colors">
                  XML Sitemap
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-hairline pt-6 text-xs text-slatewarm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {copyrightYear} MitiPatro. Independent Bikram Sambat reference.</p>
          <p>Timezone: Asia/Kathmandu (NPT, UTC+05:45)</p>
        </div>
      </div>
    </footer>
  );
};
