import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface StaticPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms';
  onNavigate: (path: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ page, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please enter your name, email address, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setFormError('');
    setSubmitted(true);
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="capitalize text-stone-800">{page}</span>
      </nav>

      {page === 'about' && (
        <div className="mt-4 space-y-6 text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            About MitiPatro &amp; Calendar Methodology
          </h1>
          <p className="text-base leading-relaxed">
            MitiPatro is an independent, lightweight Bikram Sambat (BS) Nepali calendar and date conversion utility built for residents of Nepal and the global Nepali diaspora. Our editorial focus is date accuracy, fast page loads, and clear bilingual presentation in English and Devanagari script.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            How Bikram Sambat Conversion Works
          </h2>
          <p className="text-sm leading-relaxed">
            Unlike the Gregorian calendar, Bikram Sambat has no fixed leap-year formula. Each solar month ranges between 29 and 32 days depending on the astronomical moment the Sun enters each zodiacal sign (Sankranti). Consequently, accurate conversion requires a verified lookup table of month lengths anchored to a confirmed epoch.
          </p>
          <p className="text-sm leading-relaxed">
            MitiPatro anchors all calculations to <strong>1 Baisakh 2000 BS = 14 April 1943 AD</strong>, cross-verified across multiple open-source Bikram Sambat datasets (`nepali-date-converter`, `bikram-sambat`) and Government of Nepal Gazette calendars for 2000–2090 BS.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Timezone Discipline (Asia/Kathmandu)
          </h2>
          <p className="text-sm leading-relaxed">
            Whether you open MitiPatro from Kathmandu, New York, London, Sydney, or Doha, the &ldquo;Aaja Ko Miti&rdquo; (Today&rsquo;s Date) calculation always resolves strictly in Nepal Standard Time (Asia/Kathmandu, UTC+05:45) rather than your browser&rsquo;s local clock.
          </p>
        </div>
      )}

      {page === 'contact' && (
        <div className="mt-4 space-y-6 text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Contact MitiPatro
          </h1>
          <p className="text-sm leading-relaxed">
            Spot a regional holiday update, Nepal Gazette amendment, or accessibility issue? Send a note to our editorial desk below.
          </p>

          {submitted ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#14532D]" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-semibold text-stone-900">Message recorded</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Thank you, {name}. Your note has been logged for review by our editorial team.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setMessage('');
                    }}
                    className="mt-4 rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Send Another Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              noValidate
              className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
            >
              {formError && (
                <p role="alert" className="rounded-md bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
                  {formError}
                </p>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-stone-600">
                  Full Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-stone-300 px-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-stone-600">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-stone-300 px-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-msg" className="block text-xs font-medium text-stone-600">
                  Message or Holiday Correction
                </label>
                <textarea
                  id="contact-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-stone-300 p-3 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C2D12]"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      )}

      {page === 'privacy' && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p>
            MitiPatro respects your privacy. All BS-to-AD date conversions and monthly calendar views run locally without requiring user registration or personal accounts.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Advertising &amp; Third-Party Cookies (Google AdSense)
          </h2>
          <p>
            To keep MitiPatro free to use, we reserve display ad placements for Google AdSense. Third-party vendors, including Google, may use cookies to serve ads based on a user&rsquo;s prior visits to this website or other websites. Users may opt out of personalized advertising by visiting Google&rsquo;s Ad Settings.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Server Logs &amp; Contact Information
          </h2>
          <p>
            Standard HTTP request logs are used solely to ensure uptime and prevent abuse. Information voluntarily submitted through our Contact form is used only to respond to your inquiry.
          </p>
        </div>
      )}

      {page === 'terms' && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Terms of Use
          </h1>
          <p>
            By accessing MitiPatro, you agree to use the calendar, converter, and holiday reference materials for informational and personal planning purposes.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Data Accuracy &amp; Official Gazette Notices
          </h2>
          <p>
            While we verify all Bikram Sambat month lengths (2000–2090 BS) and public holidays against open-source datasets and Government of Nepal Gazette schedules, official public holidays may occasionally be amended by Government of Nepal announcements. Always confirm time-critical legal or banking closures with the relevant authority.
          </p>
        </div>
      )}
    </article>
  );
};
