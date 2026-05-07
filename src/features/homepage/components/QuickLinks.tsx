import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";

const links = [
  {
    label: "Admissions",
    description: "Enrollment requirements and application process",
    href: ROUTES.ABOUT,
  },
  {
    label: "Academic Calendar",
    description: "Important dates, holidays, and schedules",
    href: ROUTES.EVENTS,
  },
  {
    label: "Announcements",
    description: "Latest news, advisories, and updates",
    href: ROUTES.ANNOUNCEMENTS,
  },
  {
    label: "School Gallery",
    description: "Photos and videos from school life",
    href: ROUTES.MEDIA,
  },
];

export function QuickLinks() {
  return (
    <section
      className="border-b border-slate-200 bg-[#f8f7f3]"
      aria-labelledby="quick-links-heading"
    >
      <Container>
        <div className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
            Resources
          </p>
          <h2
            id="quick-links-heading"
            className="mt-3 font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            Quick access
          </h2>

          <ul className="mt-8 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col bg-white p-6 transition-colors ring-1 ring-inset ring-transparent hover:bg-[#0f1f3a]/[0.02] hover:ring-[#c8a85c]/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c8a85c]"
                >
                  <span className="font-serif text-lg font-semibold text-slate-900 group-hover:text-[#0f1f3a]">
                    {link.label}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-slate-600">
                    {link.description}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-4 text-sm font-medium text-[#0f1f3a] transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
