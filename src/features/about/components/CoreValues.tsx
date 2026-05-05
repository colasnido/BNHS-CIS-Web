/**
 * About page — Section 3: Core Values
 *
 * Five values, one-line each. Grid responds to viewport: 1 col mobile,
 * 2 cols tablet, 3 cols desktop with the last row centered. Each card is
 * minimal — no icons, no shadows, just a number indicator and clean type.
 *
 * Five values rather than three because the brief allows 3-6 and five fits
 * the 3-col grid better visually (three on top, two centered below).
 */

interface Value {
  title: string;
  description: string;
}

const VALUES: Value[] = [
  {
    title: 'Integrity',
    description: 'Honesty in word and deed, in every decision we make.',
  },
  {
    title: 'Excellence',
    description: 'Pursuing our best work in academics, conduct, and service.',
  },
  {
    title: 'Respect',
    description:
      'Treating every member of our community with dignity and care.',
  },
  {
    title: 'Responsibility',
    description: 'Owning our actions and contributing to our community.',
  },
  {
    title: 'Compassion',
    description: 'Looking out for one another, especially those who need it most.',
  },
];

export function CoreValues() {
  return (
    <section
      aria-labelledby="values-heading"
      className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="values-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Core Values
        </h2>
        <p className="mt-2 text-base text-slate-600">
          The principles that guide our school community.
        </p>

        <ul
          role="list"
          className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VALUES.map((value, idx) => (
            <li
              key={value.title}
              className="bg-white p-6 sm:p-7"
            >
              <p className="font-mono text-xs font-medium text-[#c8a85c]">
                {String(idx + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
