import React from "react";

const CONTACT_EMAIL = "utsavghimire34@gmail.com";

interface StaticPageProps {
  page: "about" | "contact" | "privacy" | "terms";
  onNavigate: (path: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({
  page,
  onNavigate,
}) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a
          href="/"
          onClick={(e) => handleLink(e, "/")}
          className="hover:text-[#9A3412] hover:underline"
        >
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="capitalize text-stone-800">{page}</span>
      </nav>

      {page === "about" && (
        <div className="mt-4 space-y-6 text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            About MitiPatro &amp; Calendar Methodology
          </h1>
          <p className="text-base leading-relaxed">
            MitiPatro is an independent Nepali calendar for looking up Bikram
            Sambat (BS) dates, their Gregorian (AD) equivalents, monthly
            calendar grids, and listed festivals and holidays. It supports BS
            and AD date conversion from 2000 through 2090 BS and presents dates
            in English and Devanagari.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Calendar Data and Conversion Method
          </h2>
          <p className="text-sm leading-relaxed">
            The site uses a stored table of the twelve BS month lengths for each
            supported year. Conversion counts days from the reference date{" "}
            <strong>1 Baisakh 2000 BS = 14 April 1943 AD</strong>; it does not
            estimate dates from a repeating leap-year rule or fetch calendar
            data from a live service.
          </p>
          <p className="text-sm leading-relaxed">
            The BS month-length table is stored with the calendar data; the
            conversion code counts from the anchor above instead of fetching
            dates from a live service. The data notes list{" "}
            <code>nepali-date-converter</code>, <code>bikram-sambat</code>, and{" "}
            <code>@sbmdkl/nepali-date-converter</code> as comparison references.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            How Dates Are Checked
          </h2>
          <p className="text-sm leading-relaxed">
            Automated tests check the converter against the anchor, selected
            date pairs, sampled round trips, and stored AD equivalents for
            holiday entries. These checks show internal consistency; they do not
            establish the source accuracy of every month length or holiday.
          </p>
          <p className="text-sm leading-relaxed">
            Holiday records currently have empty source fields, so no per-entry
            citation is provided. Dates may also vary by region or change after
            publication. Confirm important holidays with the relevant government
            notice. To report an error, email the BS date, the displayed AD
            date, the holiday name, page URL, and a source link or reference
            when available.
          </p>

          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Nepal Time
          </h2>
          <p className="text-sm leading-relaxed">
            The Aaja Ko Miti page determines today using the Asia/Kathmandu
            timezone (Nepal Standard Time, UTC+05:45), rather than the
            device&rsquo;s local timezone.
          </p>
        </div>
      )}

      {page === "contact" && (
        <div className="mt-4 space-y-6 text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Contact MitiPatro
          </h1>
          <p className="text-sm leading-relaxed">
            Email us to report a BS-to-AD conversion issue, holiday date or name
            correction, regional observance, or accessibility problem. Include
            the BS date, the AD date shown, the page URL, and a source link or
            reference for a holiday correction when available.
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
              The link opens your email app. MitiPatro does not receive or store
              a contact form. Response time is not guaranteed. reports are
              reviewed as time allows.
            </p>
          </div>
        </div>
      )}

      {page === "privacy" && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p>
            MitiPatro does not currently provide accounts, analytics, a contact
            form, or a feature that stores the dates you convert. Date
            conversion runs in your browser, and entered dates are not sent to
            MitiPatro by the converter. If you email us, your email provider and
            the recipient handle that message.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Hosting Requests
          </h2>
          <p>
            A page request is sent to the site host to serve the page. The
            hosting provider may process technical request and security logs,
            such as IP address, requested URL, user agent, and request time.
            Those logs are controlled by the provider, not stored by MitiPatro
            application features.
          </p>
          <p>
            The contact link opens your own email application. Any message or
            address you choose to send is handled by your email provider and the
            recipient; it is not submitted to a MitiPatro contact database.
          </p>
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Cookies and Advertising
          </h2>
          <p>
            Ad slots are hidden unless the site operator sets{" "}
            <code>ADS_ENABLED=true</code> and provides an AdSense client ID. If
            Google AdSense is enabled, Google and its partners may use cookies
            or similar technologies to deliver, measure, and personalize ads,
            subject to your region, consent choices, and Google&rsquo;s
            policies. You can review or change Google ad personalization
            settings at{" "}
            <a
              href="https://adssettings.google.com"
              className="text-[#9A3412] hover:underline"
            >
              Google Ad Settings
            </a>
            . MitiPatro does not currently run a separate analytics service.
          </p>
        </div>
      )}

      {page === "terms" && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-stone-700">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Terms of Use
          </h1>
          <p>
            MitiPatro&rsquo;s calendar dates and holiday listings are for
            general reference only. Holiday dates can vary by region or change
            through official announcements; confirm holidays and any
            time-sensitive date with the relevant official source. MitiPatro is
            independent and is not an official government calendar.
          </p>
        </div>
      )}
    </article>
  );
};
