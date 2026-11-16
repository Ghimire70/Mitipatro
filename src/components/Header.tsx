import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CURRENT_BS_YEAR } from '../../lib/bsData';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
  panchangIndexingEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  rashifalIndexingEnabled = false,
  panchangIndexingEnabled = false,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Today', path: '/aaja-ko-miti' },
    { label: `Calendar ${CURRENT_BS_YEAR}`, path: `/calendar/${CURRENT_BS_YEAR}` },
    { label: 'Holidays', path: `/holidays/${CURRENT_BS_YEAR}` },
    ...(rashifalIndexingEnabled ? [{ label: 'Rashifal', path: '/rashifal' }] : []),
    ...(panchangIndexingEnabled ? [{ label: 'Panchang', path: '/panchang' }] : []),
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header className="print-hidden border-b border-stone-200 bg-[#FBF9F5]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark only */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display text-2xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412]"
        >
          MitiPatro
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
        >
          {navLinks.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path.startsWith('/calendar/') && currentPath.startsWith('/calendar/')) ||
              (item.path.startsWith('/holidays/') && currentPath.startsWith('/holidays/')) ||
              (item.path === '/rashifal' && currentPath.startsWith('/rashifal'));
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-stone-900 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412] ${
                  isActive ? 'text-[#9A3412] underline underline-offset-4' : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/date-converter"
            onClick={(e) => handleLinkClick(e, '/date-converter')}
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#7C2D12] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            BS–AD Converter
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-stone-200 bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/date-converter"
              onClick={(e) => handleLinkClick(e, '/date-converter')}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
            >
              BS–AD Date Converter
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};
