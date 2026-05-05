import { HeroSection } from '@/features/homepage/components/HeroSection';
import { QuickLinks } from '@/features/homepage/components/QuickLinks';
import { NewsAndEvents } from '@/features/homepage/components/NewsAndEvents';
import { Testimonial } from '@/features/homepage/components/Testimonial';
import { CTABanner } from '@/features/homepage/components/CTABanner';

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickLinks />
      <NewsAndEvents />
      <Testimonial />
      <CTABanner />
    </>
  );
}
