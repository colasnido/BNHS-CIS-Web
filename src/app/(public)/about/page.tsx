import { AboutHero } from '@/features/about/components/AboutHero';
import { MissionVision } from '@/features/about/components/MissionVision';
import { CoreValues } from '@/features/about/components/CoreValues';
import { SchoolHistory } from '@/features/about/components/SchoolHistory';
import { FacultyOverview } from '@/features/about/components/FacultyOverview';
import { Facilities } from '@/features/about/components/Facilities';
import { Leadership } from '@/features/about/components/Leadership';
import { ContactSection } from '@/features/about/components/ContactSection';

/**
 * About page.
 *
 * This is a server component — purely presentational, no client interactivity,
 * so we get full server rendering, smaller bundle, and the page is fully
 * cacheable at the edge.
 *
 * The 8 sections are imported individually so each can be edited or replaced
 * without touching the others. Section order is fixed by the brief.
 *
 * Performance notes:
 *   - No "use client" anywhere on this page
 *   - No animation libraries
 *   - No third-party iframes (map is a static link, see ContactSection)
 *   - Images use next/image with proper `sizes` for automatic responsive
 *     loading. Photos are referenced from /public/images/about/ — drop the
 *     actual files in there to populate. See public/images/about/README.md.
 *
 * Accessibility:
 *   - Each section is a <section> with aria-labelledby pointing to its h2
 *   - Single h1 (in AboutHero), all section headings are h2
 *   - Lists use role="list" where Tailwind's reset removes default semantics
 *   - All interactive elements have visible focus states
 *   - Color contrast: slate-900 / slate-600 / slate-500 on white meet
 *     WCAG AA at the body sizes used here
 */
export const metadata = {
  title: 'About — Badiang National High School',
  description:
    'Learn about our mission, history, faculty, and facilities. Badiang National High School is a public secondary school serving Grades 7 through 12.',
};

// This page is fully static — no dynamic data fetching. Next.js will
// pre-render it at build time and serve it from the edge cache.
// `force-static` is the explicit form of "no dynamic, no revalidation".
export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <MissionVision />
      <CoreValues />
      <SchoolHistory />
      <FacultyOverview />
      <Facilities />
      <Leadership />
      <ContactSection />
    </>
  );
}
