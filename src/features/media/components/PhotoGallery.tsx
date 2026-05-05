import Image from 'next/image';

/**
 * Media page — Section 3: Photo Gallery (Categorized)
 *
 * Four categories, stacked vertically, each rendering a 5×4 grid (20 photos
 * per category, 80 total). Per design decision: stacked sub-sections, not
 * a tab/filter UI. This keeps the entire page server-rendered (no JS) and
 * matches how everything else on the site is structured.
 *
 * Performance:
 *   - Every image uses next/image with `loading="lazy"` (default below-fold)
 *   - sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
 *     tells Next/Image to serve appropriately-sized variants for each
 *     viewport — a phone gets a 200px-wide variant, not the full 1200px.
 *   - Aspect-ratio container reserves layout space, so images loading in
 *     don't cause cumulative layout shift (CLS).
 *
 * To add fewer photos: just remove items from the relevant array. The grid
 * collapses naturally — 17 photos render as 5+5+5+2.
 *
 * To add more: add entries to the array. With more than 20 per category,
 * consider adding pagination or a "view more" link rather than letting the
 * page balloon.
 */

interface Photo {
  /** Path under /public — leave as-is until the file exists. */
  src: string;
  /** Alt text. Keep descriptive; "photo" or "image" is bad alt text. */
  alt: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  photos: Photo[];
}

// Helper: builds a photo array given a count + path prefix.
// Saves writing 20 nearly-identical entries by hand.
function makePhotos(prefix: string, count: number, altBase: string): Photo[] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/images/media/${prefix}/${prefix}-${String(i + 1).padStart(2, '0')}.jpg`,
    alt: `${altBase} — photo ${i + 1}`,
  }));
}

const CATEGORIES: Category[] = [
  {
    id: 'events',
    title: 'Events',
    description:
      'Foundation Day, Buwan ng Wika, Family Day, Recognition, and other school-wide gatherings.',
    photos: makePhotos('events', 20, 'School event'),
  },
  {
    id: 'classrooms',
    title: 'Classrooms',
    description:
      'Day-to-day learning across our Junior and Senior High School classrooms.',
    photos: makePhotos('classrooms', 20, 'Classroom scene'),
  },
  {
    id: 'facilities',
    title: 'Facilities',
    description:
      'Our laboratories, library, sports areas, and other learning spaces.',
    photos: makePhotos('facilities', 20, 'School facility'),
  },
  {
    id: 'extracurriculars',
    title: 'Extracurriculars',
    description:
      'Clubs, performances, sports teams, and student-led activities.',
    photos: makePhotos('extracurriculars', 20, 'Extracurricular activity'),
  },
];

/**
 * Reusable grid for one category's photos. Pulled out as a sub-component
 * so each category section is identical in layout — adjust this once and
 * all four categories update.
 */
function GalleryGrid({ photos }: { photos: Photo[] }) {
  return (
    <ul
      role="list"
      // 5×4 on desktop, scales down: 2 col mobile, 3 col tablet, 5 col desktop.
      // Tight gaps (gap-2) so the grid reads as a unified collage rather
      // than separated cards.
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
    >
      {photos.map((photo, i) => (
        <li key={photo.src} className="overflow-hidden rounded-md bg-slate-100">
          {/* Square aspect — uniform grid reads cleaner than mixed ratios.
              Aspect-ratio is set via the wrapper, image fills it. */}
          <div className="relative aspect-square w-full">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              // Below-fold lazy loading is the default for Next/Image; we
              // only mark `priority` for above-the-fold imagery (e.g. the
              // featured video thumbnail). Don't touch this default.
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition hover:scale-105"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PhotoGallery() {
  return (
    // Wrapping section — semantic group, but each category is a sub-section
    // with its own h2 below.
    <div className="bg-slate-50">
      {CATEGORIES.map((category, idx) => (
        <section
          key={category.id}
          aria-labelledby={`gallery-${category.id}-heading`}
          // Alternating background between categories: white on first/third,
          // slate-50 on second/fourth. Subtle but separates them visually.
          className={`border-b border-slate-200 py-14 sm:py-16 ${
            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c8a85c]">
                  Gallery
                </p>
                <h2
                  id={`gallery-${category.id}-heading`}
                  className="mt-2 font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
                >
                  {category.title}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-right">
                {category.description}
              </p>
            </div>

            <div className="mt-8">
              <GalleryGrid photos={category.photos} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
