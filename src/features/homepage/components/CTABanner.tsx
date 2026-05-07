import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";

export function CTABanner() {
  return (
    <section
      className="relative bg-gradient-to-b from-[#0a1428] to-[#0f1f3a]"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a85c]/40 to-transparent"
      />
      <Container>
        <div className="flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
              Come see us
            </p>
            <h2
              id="cta-heading"
              className="mt-3 font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl"
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
            className="inline-flex shrink-0 items-center gap-2 bg-gradient-to-b from-[#d4b674] via-[#c8a85c] to-[#a8893d] px-6 py-3 text-sm font-semibold text-[#0f1f3a] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all hover:from-[#dcc084] hover:via-[#d4b674] hover:to-[#b89a4a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Plan a Visit
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
