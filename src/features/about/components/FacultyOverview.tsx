/**
 * About page — Section 5: Faculty Overview
 *
 * Per design decision (option c): department-level breakdown without photos.
 * Department head name fields show [REPLACE] so the structure is visible
 * but the school controls when real names go up. Subject area summary at
 * the top humanizes without naming individuals.
 *
 * No photos by design — when the school is ready to add faculty photos,
 * this component can be extended or replaced with a photo grid variant.
 */

interface Department {
  name: string;
  headName: string;
  subjectsCovered: string;
}

const DEPARTMENTS: Department[] = [
  {
    name: 'Mathematics',
    headName: '[REPLACE]',
    subjectsCovered:
      'Pre-algebra, algebra, geometry, statistics, pre-calculus',
  },
  {
    name: 'Sciences',
    headName: '[REPLACE]',
    subjectsCovered:
      'Earth science, biology, chemistry, physics, research',
  },
  {
    name: 'English & Filipino',
    headName: '[REPLACE]',
    subjectsCovered:
      'Communication, literature, composition, panitikan',
  },
  {
    name: 'Araling Panlipunan',
    headName: '[REPLACE]',
    subjectsCovered:
      'History, economics, geography, contemporary issues',
  },
  {
    name: 'TLE & MAPEH',
    headName: '[REPLACE]',
    subjectsCovered:
      'Technology, livelihood, music, arts, P.E., health',
  },
  {
    name: 'Senior High Track Heads',
    headName: '[REPLACE]',
    subjectsCovered: 'Academic, TVL, and core subject coordination',
  },
];

export function FacultyOverview() {
  return (
    <section
      aria-labelledby="faculty-heading"
      className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="faculty-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Our Faculty
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Our teachers come from diverse backgrounds and bring deep expertise
          to their subject areas. They are organized into six departments
          covering the Junior and Senior High School curricula.
        </p>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => (
            <article key={dept.name} className="bg-white p-6">
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                {dept.name}
              </h3>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-slate-500">Head:</dt>
                  <dd className="text-slate-900">{dept.headName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Subjects covered:</dt>
                  <dd className="mt-0.5 leading-relaxed text-slate-700">
                    {dept.subjectsCovered}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
