import Image from 'next/image';

/**
 * Media page — Section 4: Event Highlights
 *
 * Three recent events. Each card has title, date, 1–3 images, and a brief
 * description. Layout is asymmetrical — image strip on top, content below.
 *
 * Why three events: brief said "recent events" without a count; per your
 * call we're keeping at three. Easy to add a fourth — just extend the array.
 */

interface EventHighlight {
  /** Event title (keep concise — appears in card heading). */
  title: string;
  /** Display-friendly date string. */
  date: string;
  /** 2-line max description. */
  description: string;
  /** 1–3 image references under /public/images/media/event-highlights/ */
  images: { src: string; alt: string }[];
}

const EVENTS: EventHighlight[] = [
  {
    title: 'Foundation Day [REPLACE]',
    date: '[REPLACE Month Day, Year]',
    description:
      'Students, faculty, alumni, and the broader community came together to mark another year of service. Featured performances, recognitions, and a community feast.',
    images: [
      {
        src: '/images/media/event-highlights/foundation-01.jpg',
        alt: 'Foundation Day program in progress',
      },
      {
        src: '/images/media/event-highlights/foundation-02.jpg',
        alt: 'Students performing during Foundation Day',
      },
      {
        src: '/images/media/event-highlights/foundation-03.jpg',
        alt: 'Community gathering at Foundation Day',
      },
    ],
  },
  {
    title: 'Buwan ng Wika [REPLACE]',
    date: '[REPLACE Month Day, Year]',
    description:
      'A month-long celebration of Filipino language and culture. Students participated in poetry, song, and traditional dance.',
    images: [
      {
        src: '/images/media/event-highlights/buwan-ng-wika-01.jpg',
        alt: 'Buwan ng Wika opening ceremony',
      },
      {
        src: '/images/media/event-highlights/buwan-ng-wika-02.jpg',
        alt: 'Students in traditional Filipino attire',
      },
    ],
  },
  {
    title: 'Science & Math Fair [REPLACE]',
    date: '[REPLACE Month Day, Year]',
    description:
      'Student investigatory projects and math problem-solving competitions, showcasing creativity and technical skill across all year levels.',
    images: [
      {
        src: '/images/media/event-highlights/sci-math-01.jpg',
        alt: 'Student presenting research project',
      },
    ],
  },
];

/**
 * Renders the image strip for an event. Layout adjusts based on count:
 *   - 1 image: full-width banner
 *   - 2 images: side-by-side equal split
 *   - 3 images: 1 large + 2 stacked thumbnails
 *
 * Uniform 16:9 aspect ratio inside each cell prevents layout shift when
 * images load and gives the strip a clean, magazine-like rhythm.
 */
function EventImageStrip({
  images,
}: {
  images: EventHighlight['images'];
}) {
  if (images.length === 1) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={images[0].src}
          alt={images[0].alt}
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover"
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img) => (
          <div
            key={img.src}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 50vw, 400px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 images: 1 large + 2 stacked
  const [primary, ...rest] = images;
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={primary.src}
          alt={primary.alt}
          fill
          sizes="(max-width: 1024px) 66vw, 540px"
          className="object-cover"
        />
      </div>
      <div className="grid grid-rows-2 gap-2">
        {rest.map((img) => (
          <div
            key={img.src}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 33vw, 270px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventHighlights() {
  return (
    <section
      aria-labelledby="events-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="events-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Event Highlights
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Recent moments from across the school year.
        </p>

        <div className="mt-12 space-y-14 sm:space-y-16">
          {EVENTS.map((event) => (
            <article
              key={event.title}
              className="border-l-4 border-[#c8a85c] pl-5 sm:pl-7"
            >
              {/* Date as eyebrow — small, monospaced, gold. The visual
                  hierarchy puts the title first by weight, but the date is
                  legible without competing. */}
              <p className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                {event.date}
              </p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-slate-900 sm:text-2xl">
                {event.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {event.description}
              </p>

              <div className="mt-6">
                <EventImageStrip images={event.images} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
