import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { getEvent } from '@/services/event.service';
import { ROUTES } from '@/constants/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Match the listing page's revalidation cadence so detail pages stay in
 * sync. Events change daily at most.
 */
export const revalidate = 60;

/**
 * generateMetadata — per-event title/description for SEO and browser tabs.
 * Falls back gracefully if the event doesn't exist (handled in page below).
 */
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Event not found' };

  return {
    title: event.title,
    // Description is used in social preview cards. Keep it short — most
    // platforms show ~155 chars. We don't truncate here; we let the
    // platform handle it.
    description: event.description,
  };
}

function formatDateRange(startISO: string, endISO: string, isAllDay: boolean) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startValid = !Number.isNaN(start.getTime());
  const endValid = !Number.isNaN(end.getTime());

  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };

  if (!startValid && !endValid) return 'Date to be announced';

  if (startValid && !endValid) {
    const date = start.toLocaleDateString('en-US', dateOpts);
    return isAllDay
      ? `${date} · All day`
      : `${date} · ${start.toLocaleTimeString('en-US', timeOpts)}`;
  }

  if (!startValid && endValid) {
    return `Ends ${end.toLocaleDateString('en-US', dateOpts)}`;
  }

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const date = start.toLocaleDateString('en-US', dateOpts);
    if (isAllDay) return `${date} · All day`;
    return `${date} · ${start.toLocaleTimeString('en-US', timeOpts)} – ${end.toLocaleTimeString('en-US', timeOpts)}`;
  }

  return `${start.toLocaleDateString('en-US', dateOpts)} – ${end.toLocaleDateString('en-US', dateOpts)}`;
}

const categoryLabels: Record<string, string> = {
  academic: 'Academic',
  sports: 'Sports',
  arts: 'Arts',
  assembly: 'Assembly',
  community: 'Community',
  other: 'Other',
};

/**
 * EventDetailPage — full event view at /events/[id].
 *
 * Layout: 2-col on desktop with a metadata sidebar; stacked on mobile.
 *
 * Notes:
 *   - Description renders with `whitespace-pre-wrap` so admin newlines
 *     survive (Firestore stores plain text).
 *   - We do NOT use dangerouslySetInnerHTML here. If you ever add a rich
 *     text editor, sanitize first (DOMPurify or similar).
 *   - The page is statically generated when possible (revalidate: 60).
 */
export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  // Hide unpublished events from public view. Admins can preview via the
  // dashboard. (event.published is the publish flag from the schema.)
  if (!event.published) notFound();

  const dateLabel = formatDateRange(
    event.startDate,
    event.endDate,
    event.isAllDay
  );
  const location = event.location?.trim() || 'To be announced';
  const categoryLabel = categoryLabels[event.category] ?? event.category;

  return (
    <>
      {/* Hero — title and category badge over a slate-50 band */}
      <section className="border-b border-slate-200 bg-slate-50">
        <Container>
          <div className="py-12 sm:py-16">
            <Link
              href={ROUTES.EVENTS}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#0f1f3a]"
            >
              <span aria-hidden="true">←</span> All events
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
              {categoryLabel}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {event.title}
            </h1>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-3 lg:gap-12">
          {/* Main content */}
          <article className="lg:col-span-2">
            {event.imageUrl && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={event.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/*
              `whitespace-pre-wrap` preserves admin-entered line breaks
              while still wrapping at word boundaries. `break-words`
              prevents an ultra-long URL or token from overflowing.
            */}
            <div className="prose prose-slate max-w-none text-base leading-relaxed text-slate-800">
              <p className="whitespace-pre-wrap break-words">
                {event.description}
              </p>
            </div>
          </article>

          {/* Sidebar — when, where, share */}
          <aside className="lg:col-span-1">
            <div className="border border-slate-200 bg-white p-6">
              <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#c8a85c]">
                Event details
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    When
                  </dt>
                  <dd className="mt-1 text-slate-900">{dateLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Where
                  </dt>
                  <dd className="mt-1 text-slate-900">{location}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Category
                  </dt>
                  <dd className="mt-1 text-slate-900">{categoryLabel}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
