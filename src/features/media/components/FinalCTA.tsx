import Link from 'next/link';

/**
 * Media page — Section 6: Call-to-Action
 *
 * Two buttons:
 *   - "Enroll Now" — currently linked to /announcements (where enrollment
 *     announcements go). When you build a real /admissions page, swap the
 *     ENROLL_HREF below.
 *   - "Contact Us" — links to the About page's contact section anchor.
 *
 * Visual: navy background bookends the page (matches the hero's navy at
 * the top), giving a sense of containment. Gold CTA primary, white outline
 * secondary — clear hierarchy without competing.
 */

// [REPLACE] — when an /admissions page exists, point this there.
// For now, /announcements is where enrollment-related posts live.
const ENROLL_HREF = '/announcements';
const CONTACT_HREF = '/about#contact-heading';

export function FinalCTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-[#0f1f3a] text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(200,168,92,0.18),transparent)]"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
          Join us
        </p>
        <h2
          id="cta-heading"
          className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl"
        >
          Become part of the Badiang community
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300">
          Whether you&apos;re considering enrollment or just want to know more
          about our school, we&apos;d love to hear from you.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={ENROLL_HREF}
            className="inline-flex w-full items-center justify-center rounded-md bg-[#c8a85c] px-6 py-3 text-sm font-semibold text-[#0f1f3a] transition hover:bg-[#d4b86c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Enroll Now
          </Link>
          <Link
            href={CONTACT_HREF}
            className="inline-flex w-full items-center justify-center rounded-md border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] sm:w-auto"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
