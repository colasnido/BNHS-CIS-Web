import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { listUpcomingEvents } from '@/services/event.service';
import { listRecentAnnouncements } from '@/services/announcement.service';
import { AnnouncementList } from '@/features/announcements/components/AnnouncementList';

function formatEventDateParts(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return { month: 'TBD', day: '--' };
  }

  return {
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

/**
 * NewsAndEvents — homepage section showing upcoming events and recent
 * announcements side by side.
 *
 * Update notes:
 *   - Each event item now links to /events/[id] (was: ROUTES.EVENTS — the
 *     index page, which made every item a duplicate link).
 *   - Each event item now shows a 2-line description preview (was: not
 *     rendered at all).
 *   - Announcement column unchanged structurally; AnnouncementCard's
 *     compact variant now displays summary preview internally.
 */
export async function NewsAndEvents() {
  const [upcomingEvents, recentAnnouncements] = await Promise.all([
    listUpcomingEvents(3),
    listRecentAnnouncements(3),
  ]);

  return (
    <section className="bg-white" aria-labelledby="news-events-heading">
      <Container>
        <div className="py-16 sm:py-20">
          <h2 id="news-events-heading" className="sr-only">
            News and upcoming events
          </h2>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Events */}
            <div>
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                  Upcoming events
                </h3>
                <Link
                  href={ROUTES.EVENTS}
                  className="text-sm font-medium text-[#0f1f3a] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                >
                  View all →
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No upcoming events yet.
                </div>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {upcomingEvents.map((event) => {
                    const dateParts = formatEventDateParts(event.startDate);

                    return (
                      <li key={event.id}>
                        <Link
                          href={`/events/${event.id}`}
                          className="group flex items-start gap-5 py-5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c8a85c]"
                        >
                          {/* Date block — distinctive, scannable */}
                          <div className="flex w-16 shrink-0 flex-col items-center border border-slate-200 bg-white px-2 py-2 text-center">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c8a85c]">
                              {dateParts.month}
                            </span>
                            <span className="font-serif text-xl font-semibold text-slate-900">
                              {dateParts.day}
                            </span>
                          </div>
                          <div className="flex-1 pt-1 min-w-0">
                            {/* min-w-0 on parent + here lets line-clamp work
                                inside flex children — flex items default
                                to min-width:auto which prevents shrinking
                                below content width and breaks truncation. */}
                            <p className="font-medium text-slate-900 group-hover:text-[#0f1f3a]">
                              {event.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                              {event.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {event.location}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Announcements — uses AnnouncementCard compact variant which
                now shows summary preview internally. */}
            <div>
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-4">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                  Recent announcements
                </h3>
                <Link
                  href={ROUTES.ANNOUNCEMENTS}
                  className="text-sm font-medium text-[#0f1f3a] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                >
                  View all →
                </Link>
              </div>

              <AnnouncementList
                announcements={recentAnnouncements}
                variant="compact"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
