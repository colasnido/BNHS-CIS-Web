/**
 * About page — Section 8: Contact
 *
 * Address, phone, email. Per design decision (option a), the "map placeholder"
 * is a slate block with the address and a link out to Google Maps with the
 * address pre-filled. No iframe, no API key, no third-party tracking, no
 * runtime cost — but the user can still click through to a real map.
 *
 * The Google Maps URL uses the public search format that doesn't require
 * an API key. URL-encoding handles spaces and special characters.
 */

const SCHOOL_ADDRESS = 'Badiang National High School, Badiang, Philippines';
const SCHOOL_PHONE = '+63 [REPLACE]';
const SCHOOL_EMAIL = '[REPLACE]@deped.gov.ph';

export function ContactSection() {
  // Build the Google Maps deep-link once — no runtime cost, just URL encoding.
  // Format: https://www.google.com/maps/search/?api=1&query=ENCODED+ADDRESS
  // This is a public, key-free endpoint that opens the address in Maps on
  // any device (web, Android, iOS).
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SCHOOL_ADDRESS
  )}`;

  return (
    <section
      aria-labelledby="contact-heading"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="contact-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Contact Us
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Reach out for inquiries, enrollment, or to visit the school.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Contact info — semantic <address> for the postal address.
              Each contact method gets a label + value pattern that screen
              readers can announce as a list. */}
          <div>
            <dl className="space-y-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Address
                </dt>
                <dd className="mt-2 text-base not-italic text-slate-900">
                  <address className="not-italic leading-relaxed">
                    Badiang National High School
                    <br />
                    Badiang, [REPLACE Municipality]
                    <br />
                    [REPLACE Province], Philippines
                  </address>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Phone
                </dt>
                <dd className="mt-2 text-base text-slate-900">
                  <a
                    href={`tel:${SCHOOL_PHONE.replace(/\s/g, '')}`}
                    className="hover:text-[#c8a85c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                  >
                    {SCHOOL_PHONE}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Email
                </dt>
                <dd className="mt-2 text-base text-slate-900">
                  <a
                    href={`mailto:${SCHOOL_EMAIL}`}
                    className="hover:text-[#c8a85c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                  >
                    {SCHOOL_EMAIL}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Map placeholder — pure CSS box, no iframe, no JS, no API key.
              Click target is the entire block for a generous tap area on
              mobile. The external SVG marker is decorative; aria-hidden
              prevents screen readers from announcing it. */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            <svg
              aria-hidden="true"
              className="h-10 w-10 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <p className="mt-3 font-serif text-base font-semibold text-slate-900">
              View location on Google Maps
            </p>
            <p className="mt-1 max-w-xs text-sm text-slate-600">
              Opens the address in your maps app for directions.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[#c8a85c] group-hover:gap-2">
              Open in Google Maps
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-all"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
