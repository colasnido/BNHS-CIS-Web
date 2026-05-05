import { Container } from '@/components/ui/Container';

export function Testimonial() {
  return (
    <section className="border-y border-slate-200 bg-slate-50" aria-labelledby="testimonial-heading">
      <Container>
        <div className="py-16 sm:py-20">
          <h2 id="testimonial-heading" className="sr-only">
            Community voice
          </h2>
          <figure className="mx-auto max-w-3xl text-center">
            <span
              aria-hidden="true"
              className="font-serif text-7xl leading-none text-[#c8a85c]"
            >
              &ldquo;
            </span>
            <blockquote className="mt-2 font-serif text-2xl leading-snug text-slate-900 sm:text-3xl">
              The teachers here genuinely invest in their students. My daughter
              came in shy and unsure — she&apos;s leaving as a confident young
              leader ready for university.
            </blockquote>
            <figcaption className="mt-8 text-sm">
              <span className="font-semibold text-slate-900">Maria Santos</span>
              <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-600">Parent, Class of 2025</span>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
