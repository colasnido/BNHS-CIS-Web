/**
 * Media page — Section 5: Achievements / Recognition
 *
 * Card layout per design decision. Eight entries — covers the brief's
 * suggested categories (awards, competitions, certifications) with breathing
 * room for variety.
 *
 * Categories use a small color label (Award / Competition / Certification)
 * so the eye can quickly group similar items at a glance.
 */

interface Achievement {
  /** Display year — keep as string so "2024" and "2023–2024" both work. */
  year: string;
  category: 'Award' | 'Competition' | 'Certification' | 'Recognition';
  title: string;
  /** One-line context. Keep concise — this is a list, not a profile. */
  detail: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    year: '[REPLACE]',
    category: 'Award',
    title: '[REPLACE Award Name]',
    detail: 'Recognized for outstanding performance in [field/category].',
  },
  {
    year: '[REPLACE]',
    category: 'Competition',
    title: 'Regional Science & Technology Fair',
    detail: '[REPLACE — placement/category and student level].',
  },
  {
    year: '[REPLACE]',
    category: 'Competition',
    title: 'Division Math Olympiad',
    detail: '[REPLACE — placement and team/individual].',
  },
  {
    year: '[REPLACE]',
    category: 'Recognition',
    title: 'Top-Performing School in Division',
    detail: '[REPLACE — assessment basis and standing].',
  },
  {
    year: '[REPLACE]',
    category: 'Competition',
    title: 'Sports — [REPLACE Sport]',
    detail: '[REPLACE — meet name, level, placement].',
  },
  {
    year: '[REPLACE]',
    category: 'Certification',
    title: 'School Improvement Plan Recognition',
    detail: 'Certified compliance with DepEd standards for [year range].',
  },
  {
    year: '[REPLACE]',
    category: 'Award',
    title: 'Brigada Eskwela [REPLACE]',
    detail:
      'Recognized for outstanding community participation in school readiness.',
  },
  {
    year: '[REPLACE]',
    category: 'Recognition',
    title: 'Faculty Excellence — [REPLACE Teacher Name]',
    detail: 'Awarded for [REPLACE — subject area and contribution].',
  },
];

/** Small mapping for the category label color. Kept inside the component
 *  file because it's only used here. Light backgrounds with darker text
 *  for AA contrast at the small sizes used. */
const CATEGORY_STYLES: Record<Achievement['category'], string> = {
  Award: 'bg-amber-50 text-amber-800',
  Competition: 'bg-blue-50 text-blue-800',
  Certification: 'bg-emerald-50 text-emerald-800',
  Recognition: 'bg-violet-50 text-violet-800',
};

export function Achievements() {
  return (
    <section
      aria-labelledby="achievements-heading"
      className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="achievements-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Achievements &amp; Recognition
        </h2>
        <p className="mt-2 text-base text-slate-600">
          A selection of honors, competitions, and certifications.
        </p>

        <ul
          role="list"
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ACHIEVEMENTS.map((a, i) => (
            <li
              key={`${a.year}-${i}`}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              {/* Top row: year (mono, dim) + category badge (right-aligned). */}
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  {a.year}
                </p>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_STYLES[a.category]}`}
                >
                  {a.category}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-base font-semibold leading-snug text-slate-900">
                {a.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {a.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
