import Image from 'next/image';

/**
 * About page — Section 6: Facilities
 *
 * Image + short description grid. Image paths point to /public/images/about/
 * — the actual files don't ship with this package; drop them in when ready.
 * See `public/images/about/README.md` for required filenames and dimensions.
 *
 * Until images are added, Next/Image renders a blank box (no error). To make
 * it visually obvious during development that photos are missing, the parent
 * div has a slate-100 background — the eye sees a placeholder block instead
 * of empty space.
 *
 * Six facilities — covers the four required types (classrooms, labs, library,
 * sports) plus two common ones (computer lab, multi-purpose hall). Trim to
 * four if your school has fewer.
 */

interface Facility {
  /** Short title shown beneath the image. */
  title: string;
  /** One-line description. */
  description: string;
  /** Path under /public — this component prepends nothing. */
  imageSrc: string;
  /** Alt text for accessibility. */
  imageAlt: string;
}

const FACILITIES: Facility[] = [
  {
    title: 'Classrooms',
    description:
      'Well-lit, ventilated learning spaces for Grades 7 through 12.',
    imageSrc: '/images/about/classrooms.jpg',
    imageAlt: 'A typical classroom at Badiang National High School',
  },
  {
    title: 'Science Laboratories',
    description:
      'Fully-equipped labs supporting biology, chemistry, and physics coursework.',
    imageSrc: '/images/about/science-lab.jpg',
    imageAlt: 'Students working in the science laboratory',
  },
  {
    title: 'Library',
    description:
      'Reference materials, study spaces, and computer access for research.',
    imageSrc: '/images/about/library.jpg',
    imageAlt: 'The school library reading area',
  },
  {
    title: 'Computer Laboratory',
    description:
      'Hands-on space for ICT, research, and digital literacy classes.',
    imageSrc: '/images/about/computer-lab.jpg',
    imageAlt: 'Rows of computers in the ICT laboratory',
  },
  {
    title: 'Sports Facilities',
    description:
      'Covered court and field for P.E. classes, sports, and assemblies.',
    imageSrc: '/images/about/sports.jpg',
    imageAlt: 'The school covered court and sports area',
  },
  {
    title: 'Multi-Purpose Hall',
    description:
      'Hosts assemblies, programs, and community gatherings.',
    imageSrc: '/images/about/hall.jpg',
    imageAlt: 'The multi-purpose hall set up for an event',
  },
];

export function Facilities() {
  return (
    <section
      aria-labelledby="facilities-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="facilities-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Facilities
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Spaces that support how our students learn, build, and grow.
        </p>

        <ul
          role="list"
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FACILITIES.map((facility) => (
            <li
              key={facility.title}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              {/* Aspect-ratio container keeps layout stable even before image
                  loads or if the file is missing. Slate-100 fill makes the
                  empty state visible during development. */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <Image
                  src={facility.imageSrc}
                  alt={facility.imageAlt}
                  fill
                  // Sized to render no larger than ~440px on a 3-col grid;
                  // tells Next.js the appropriate intrinsic resolution.
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  {facility.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {facility.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
