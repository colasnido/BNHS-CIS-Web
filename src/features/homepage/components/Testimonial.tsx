import { Container } from '@/components/ui/Container';
import {
  TestimonialCarousel,
  type TestimonialItem,
} from '@/components/ui/TestimonialCarousel';

const testimonials: TestimonialItem[] = [
  {
    description:
      "The teachers here genuinely invest in their students. My daughter came in shy and unsure — she's leaving as a confident young leader ready for university.",
    name: 'Maria Santos',
    role: 'Parent, Class of 2025',
  },
  {
    description:
      "The teachers push us to think bigger than we thought we could. I came in unsure of what I wanted to do; now I'm preparing applications for engineering programs.",
    name: 'Joshua Reyes',
    role: 'Grade 12 STEM',
  },
  {
    description:
      'Badiang gave me more than a diploma — it gave me a community I still lean on. The lessons I picked up here carried me through college and into my first job.',
    name: 'Ana Bautista',
    role: 'Alumna, Class of 2018',
  },
];

export function Testimonial() {
  return (
    <section
      className="border-y border-slate-200 bg-[#f8f7f3]"
      aria-labelledby="testimonial-heading"
    >
      <Container>
        <div className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
              From the community
            </p>
            <h2
              id="testimonial-heading"
              className="mt-3 font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              In their own words
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <TestimonialCarousel data={testimonials} />
          </div>
        </div>
      </Container>
    </section>
  );
}
