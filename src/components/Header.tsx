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
    <header className="print-hidden sticky top-0 z-30 border-b border-hairline bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Brand wordmark + BS-year badge */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <span className="font-serif font-bold text-2xl tracking-tight text-ink group-hover:text-terracotta transition-colors whitespace-nowrap shrink-0">
            MitiPatro
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-widest text-slatewarm border border-hairline bg-card px-2 py-0.5 rounded-full">
            २०८३
          </span>
        </a>

        {/* Zone 2: Centered nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slatewarm whitespace-nowrap shrink-0"
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
                className={`transition-colors duration-150 hover:text-ink hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta min-h-[44px] ${
                  isActive ? 'text-terracotta underline underline-offset-4' : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Mobile Holidays button + BS-AD Converter CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Holidays drawer"
            className="md:hidden px-3 py-2 text-xs font-medium text-ink bg-card border border-hairline rounded-lg hover:bg-sand transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Holidays
          </button>
          <a
            href="/date-converter"
            onClick={(e) => handleLinkClick(e, '/date-converter')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-terracotta hover:bg-terracotta-hover rounded-lg shadow-sm transition-all active:scale-[0.99] whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            BS–AD Converter
          </a>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-hairline bg-card px-4 py-4 md:hidden shadow-float"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-sand hover:text-terracotta transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/date-converter"
              onClick={(e) => handleLinkClick(e, '/date-converter')}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-hover transition-colors"
            >
              BS–AD Date Converter
            </a>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-card text-ink hover:bg-sand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </header>
  );
};
