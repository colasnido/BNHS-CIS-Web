import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";

export function CTABanner() {
  return (
    <section className="bg-[#0f1f3a]" aria-labelledby="cta-heading">
      <Container>
        <div className="flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:py-16">
          <div>
            <h2
              id="cta-heading"
              className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Visit our campus
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-300">
              Schedule a tour, meet our faculty, and see why families across the
              region choose Badiang National High School.
            </p>
          </div>
          <Link
            href={ROUTES.ABOUT}
            className="inline-flex shrink-0 items-center gap-2 bg-[#c8a85c] px-6 py-3 text-sm font-semibold text-[#0f1f3a] transition-colors hover:bg-[#d4b76b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Plan a Visit
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
