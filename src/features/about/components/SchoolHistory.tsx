/**
 * About page — Section 4: School History
 *
 * Vertical timeline with year + brief milestone. Pattern picked over
 * paragraph because the brief explicitly says "prefer structured format".
 * Five milestones — enough to show evolution without being a wall of text.
 *
 * Years are marked [REPLACE] where I'm guessing. Founding year (1969)
 * comes from the home page hero, so that one is real.
 */

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const MILESTONES: Milestone[] = [
  {
    year: '1969',
    title: 'Founded',
    description:
      'Established to serve the secondary education needs of Badiang and surrounding barangays.',
  },
  {
    year: '[REPLACE]',
    title: 'First graduating class',
    description: 'Welcomed our first cohort of graduates into the community.',
  },
  {
    year: '[REPLACE]',
    title: 'Senior High School program',
    description:
      'Expanded to offer Grades 11 and 12 under the K–12 program, broadening pathways for our students.',
  },
  {
    year: '[REPLACE]',
    title: 'Facilities expansion',
    description:
      'Completed major upgrades to classrooms, science laboratories, and the school library.',
  },
  {
    year: '[REPLACE]',
    title: 'Today',
    description:
      'Continuing our mission of academic excellence and character formation for future generations.',
  },
];

export function SchoolHistory() {
  return (
    <section
      aria-labelledby="history-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2
          id="history-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Our History
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Five decades of service to the Badiang community.
        </p>

        <ol
          role="list"
          className="mt-10 border-l border-slate-200 pl-6 sm:pl-8"
        >
          {MILESTONES.map((m, i) => (
            <li
              key={`${m.year}-${m.title}`}
              className={`relative ${i < MILESTONES.length - 1 ? 'pb-8' : ''}`}
            >
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[#c8a85c] bg-white sm:-left-[39px]"
              />
              <p className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                {m.year}
              </p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-slate-900">
                {m.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                {m.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
