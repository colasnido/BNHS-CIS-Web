import Image from 'next/image';

/**
 * Media page — Photo gallery.
 *
 * Single curated grid of school event photos. Hand-written array (rather than
 * `makePhotos()` auto-generation) so each image gets descriptive alt text for
 * screen readers and image search.
 *
 * To add more photos: drop the file into /public/images/media/events/ and add
 * an entry below. To remove: delete from the array. The grid handles any count
 * from 1 upward — collapses naturally on the last row.
 *
 * Performance:
 *   - next/image with `loading="lazy"` (default below-fold)
 *   - sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" gives
 *     a phone a 200px-wide variant rather than the full 1200px.
 *   - Aspect-ratio container reserves layout space → no CLS.
 */

interface Photo {
  src: string;
  alt: string;
}

const PHOTOS: Photo[] = [
  {
    src: '/images/media/events/drum-corps-01.jpg',
    alt: 'BNHS drum and lyre corps drummer in parade uniform',
  },
  {
    src: '/images/media/events/drum-corps-02.jpg',
    alt: 'BNHS drum and lyre corps performing at a community parade',
  },
  {
    src: '/images/media/events/drum-corps-03.jpg',
    alt: 'BNHS drum and lyre corps members marching',
  },
  {
    src: '/images/media/events/drum-corps-04.jpg',
    alt: 'BNHS color guard at a community event',
  },
  {
    src: '/images/media/events/drum-corps-05.jpg',
    alt: 'BNHS color guard with gold flags during a parade',
  },
  {
    src: '/images/media/events/drum-corps-06.jpg',
    alt: 'BNHS drum and lyre corps in formation',
  },
  {
    src: '/images/media/events/drum-corps-07.jpg',
    alt: 'BNHS color guard carrying letter shields',
  },
  {
    src: '/images/media/events/buwan-ng-wika.jpg',
    alt: 'Buwan ng Wika celebration at BNHS',
  },
  {
    src: '/images/media/events/field-day-01.jpg',
    alt: 'BNHS field day activities',
  },
  {
    src: '/images/media/events/field-day-02.jpg',
    alt: 'BNHS field day activities',
  },
  {
    src: '/images/media/events/field-day-03.jpg',
    alt: 'BNHS field day activities',
  },
  {
    src: '/images/media/events/athletes.jpg',
    alt: 'BNHS student athletes',
  },
  {
    src: '/images/media/events/graduation.jpg',
    alt: 'BNHS graduation ceremony',
  },
  {
    src: '/images/media/events/recognition-01.jpg',
    alt: 'BNHS recognition ceremony',
  },
  {
    src: '/images/media/events/recognition-02.jpg',
    alt: 'BNHS recognition ceremony',
  },
  {
    src: '/images/media/events/ojt-01.jpg',
    alt: 'BNHS senior high on-the-job training program',
  },
  {
    src: '/images/media/events/ojt-02.jpg',
    alt: 'BNHS senior high on-the-job training program',
  },
  {
    src: '/images/media/events/extracurricular-01.jpg',
    alt: 'BNHS extracurricular activity',
  },
  {
    src: '/images/media/events/extracurricular-02.jpg',
    alt: 'BNHS extracurricular activity',
  },
];

export function PhotoGallery() {
  return (
    <section
      aria-labelledby="gallery-heading"
      className="border-b border-slate-200 bg-[#f8f7f3] py-14 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
              Gallery
            </p>
            <h2
              id="gallery-heading"
              className="mt-2 font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
            >
              A look at life at Badiang
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-right">
            Drum &amp; lyre corps, Buwan ng Wika, field day, recognition,
            graduation, and the moments in between.
          </p>
        </div>

        <ul
          role="list"
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
        >
          {PHOTOS.map((photo) => (
            <li key={photo.src} className="overflow-hidden bg-slate-100">
              <div className="relative aspect-square w-full">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition hover:scale-105"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
