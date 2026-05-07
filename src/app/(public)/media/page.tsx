import { FeaturedVideo } from '@/features/media/components/FeaturedVideo';
import { Testimonials } from '@/features/media/components/Testimonials';
import { PhotoGallery } from '@/features/media/components/PhotoGallery';
import { Achievements } from '@/features/media/components/Achievements';
import { FinalCTA } from '@/features/media/components/FinalCTA';

/**
 * Media page.
 *
 * Mostly server-rendered. The only client component is FeaturedVideo, which
 * needs interactivity to lazily load the YouTube iframe on click. Everything
 * else (testimonials, gallery, events, achievements, CTA) is pure server
 * rendering — no JS shipped for those sections.
 *
 * Performance:
 *   - YouTube facade pattern: ~600 KB iframe doesn't load until user clicks
 *   - All gallery images use next/image with proper `sizes` so a phone gets
 *     a 200px-wide variant, not the full 1200px source
 *   - Aspect-ratio containers on every image prevent CLS
 *   - No animation libraries; all motion is CSS-only (hover scale, etc.)
 *
 * Accessibility:
 *   - Single h1 in FeaturedVideo, all other section headings are h2
 *   - Each section has aria-labelledby pointing to its heading
 *   - Lists use role="list" since Tailwind's reset removes default semantics
 *   - Color contrast targets WCAG AA at body sizes
 *   - Video play button has aria-label; iframe has title
 *
 * Order is fixed by the brief.
 */

export const metadata = {
  title: 'Media — Badiang National High School',
  description:
    'Photos, videos, and stories from across Badiang National High School. See our students, faculty, events, and achievements.',
};

// Page is fully static — pre-rendered at build, served from edge cache.
// The featured video's interactive bits hydrate client-side after load.
export const dynamic = 'force-static';

export default function MediaPage() {
  return (
    <>
      {/*
        FeaturedVideo expects a YouTube video ID. Until you have a real video,
        the placeholder ID below shows YouTube's "video unavailable" thumbnail.
        Replace with your actual upload's ID (the bit after `?v=` in the URL).
      */}
      <FeaturedVideo
        videoId="dQw4w9WgXcQ"
        title="A day at Badiang National High School"
        caption="Get a feel for our campus, classrooms, and community in under three minutes."
      />
      <Testimonials />
      <PhotoGallery />
      <Achievements />
      <FinalCTA />
    </>
  );
}
