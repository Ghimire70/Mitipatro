import React from 'react';

const CONTACT_EMAIL = 'replace-with-your-email@example.com';

interface StaticPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms';
  onNavigate: (path: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ page, onNavigate }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
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
            MitiPatro is an independent Nepali calendar for looking up Bikram Sambat (BS) dates, their Gregorian (AD) equivalents, monthly calendar grids, and listed festivals and holidays. It supports BS and AD date conversion from 2000 through 2090 BS and presents dates in English and Devanagari.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Calendar Data and Conversion Method
          </h2>
          <p className="text-sm leading-relaxed">
            The site uses a stored table of the twelve BS month lengths for each supported year. Conversion counts days from the reference date <strong>1 Baisakh 2000 BS = 14 April 1943 AD</strong>; it does not estimate dates from a repeating leap-year rule or fetch calendar data from a live service.
          </p>
          <p className="text-sm leading-relaxed">
            The calendar-data notes in the project identify <code>nepali-date-converter</code>, <code>bikram-sambat</code>, and <code>@sbmdkl/nepali-date-converter</code> as comparison references for the conversion table. Holiday entries are maintained separately. Individual holiday records do not currently include links or notice numbers for their sources, so a displayed holiday should not be treated as independently confirmed by this page.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            How We Verify Dates
          </h2>
          <p className="text-sm leading-relaxed">
            Conversion checks validate dates against the stored month lengths and reference date, then test BS-to-AD and AD-to-BS round trips across the supported range and against selected comparison dates. These checks help catch calculation and data-entry inconsistencies; they are not a substitute for an official calendar notice.
          </p>
          <p className="text-sm leading-relaxed">
            Holiday dates can be revised or vary by region. The holiday data file contains a general note about Nepal Gazette and Panchanga schedules for 2083 BS, but it does not cite a specific notice for each entry. Please confirm a holiday that affects travel, work, school, or government services with the relevant official announcement. If you find a discrepancy, send us the BS date, its AD equivalent, the entry name, and a link or reference to the source you checked.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Nepal Time
          </h2>
          <p className="text-sm leading-relaxed">
            The Aaja Ko Miti page determines today using the Asia/Kathmandu timezone (Nepal Standard Time, UTC+05:45), rather than the device&rsquo;s local timezone.
          </p>
        </div>
      )}

      {page === 'contact' && (
        <div className="mt-4 space-y-6 text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Contact MitiPatro
          </h1>
          <p className="text-sm leading-relaxed">
            Report a calendar conversion issue, a holiday date or name correction, a regional observance, or an accessibility problem by email. For date reports, include the BS date, the AD date shown, the page URL, and (for holiday changes) the official notice or source reference you used.
          </p>
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-700">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[#9A3412] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              Replace this placeholder with an email address you monitor before publishing. The link opens your email app; this site does not store or submit a contact form.
            </p>
          </div>
        </div>
      )}

      {page === 'privacy' && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p>
            MitiPatro does not require an account. Date conversion is performed by the site code in your browser; the site does not ask you to submit the dates you convert. The server still receives the page request needed to return the calendar.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Contact Email
          </h2>
          <p>
            Selecting the contact link opens your email application. The message and any address you provide are handled by your email provider and the recipient, not submitted to a MitiPatro contact database.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Server and Hosting Logs
          </h2>
          <p>
            The hosting provider may process request details such as IP address, requested URL, user agent, and request time in its operational or security logs. Retention and access to those logs depend on the hosting provider and its settings.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Cookies and Advertising
          </h2>
          <p>
            Ad slots are disabled unless the site operator enables them and configures an AdSense client ID. If Google AdSense is enabled, Google and its partners may use cookies or similar technologies to deliver, measure, and personalize ads, subject to your region, consent choices, and Google&rsquo;s policies. You can review or change Google ad personalization settings at{' '}
            <a href="https://adssettings.google.com" className="text-[#9A3412] hover:underline">
              Google Ad Settings
            </a>
            . MitiPatro does not currently describe a separate analytics service.
          </p>
          <p>
            This policy may need updating if the site adds analytics, a server-side contact form, or other third-party services.
          </p>
        </div>
      )}

      {page === 'terms' && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Terms of Use
          </h1>
          <p>
            MitiPatro provides Bikram Sambat calendar views, date conversions, and holiday listings for general information. The pages are not legal, financial, employment, travel, or official government advice.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Date and Holiday Data
          </h2>
          <p>
            BS-to-AD conversion uses the site&rsquo;s stored month-length table and the reference date 1 Baisakh 2000 BS = 14 April 1943 AD. Holiday records may be incomplete, region-specific, or changed by later announcements; individual entries do not all include a cited official notice. Confirm dates that affect a decision with the relevant Government of Nepal office or other responsible authority.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Use of the Site
          </h2>
          <p>
            You may use the calendar and converter for personal reference. Do not rely on this site as the sole source for time-critical closures, deadlines, or official observances. MitiPatro is independent and is not affiliated with or endorsed by the Government of Nepal.
          </p>
        </div>
      )}
    </article>
  );
};
