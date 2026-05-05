import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';

const links = [
  {
    label: 'Admissions',
    description: 'Enrollment requirements and application process',
    href: ROUTES.ABOUT,
  },
  {
    label: 'Academic Calendar',
    description: 'Important dates, holidays, and schedules',
    href: ROUTES.EVENTS,
  },
  {
    label: 'Announcements',
    description: 'Latest news, advisories, and updates',
    href: ROUTES.ANNOUNCEMENTS,
  },
  {
    label: 'School Gallery',
    description: 'Photos and videos from school life',
    href: ROUTES.MEDIA,
  },
];

export function QuickLinks() {
  return (
    <section className="border-b border-slate-200 bg-slate-50" aria-labelledby="quick-links-heading">
      <Container>
        <div className="py-12 sm:py-16">
          <div className="flex items-baseline justify-between">
            <h2
              id="quick-links-heading"
              className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              Quick access
            </h2>
            <span aria-hidden="true" className="text-xs uppercase tracking-wider text-slate-500">
              Jump to a section
            </span>
          </div>

          <ul className="mt-8 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col bg-white p-6 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c8a85c]"
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
