/**
 * About page — Section 7: Leadership
 *
 * Two cards per design decision. Add more as needed by appending to the
 * LEADERSHIP array. Each card has a name, role, and an optional one-line
 * message. All fields marked [REPLACE] until you have real content.
 *
 * No photos by design — same rationale as the faculty section. When you're
 * ready to add photos, the markup below has space allocated above the name.
 */

interface Leader {
  name: string;
  role: string;
  /** Optional one-line message from this leader. */
  message?: string;
}

const LEADERSHIP: Leader[] = [
  {
    name: '[REPLACE]',
    role: 'School Principal',
    message:
      'We are committed to providing every student with the tools and support they need to succeed.',
  },
  {
    name: '[REPLACE]',
    role: 'Assistant Principal for Academics',
    message:
      'Our academic program is designed to challenge students and prepare them for what comes next.',
  },
];

export function Leadership() {
  return (
    <section
      aria-labelledby="leadership-heading"
      className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2
          id="leadership-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          School Leadership
        </h2>
        <p className="mt-2 text-base text-slate-600">
          The people guiding our school&apos;s direction and operations.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {LEADERSHIP.map((leader) => (
            <article
              key={leader.role}
              className="rounded-lg border border-slate-200 bg-white p-6 sm:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c8a85c]">
                {leader.role}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-slate-900">
                {leader.name}
              </h3>
              {leader.message && (
                <p className="mt-4 border-l-2 border-slate-200 pl-4 text-sm italic leading-relaxed text-slate-600">
                  &ldquo;{leader.message}&rdquo;
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
