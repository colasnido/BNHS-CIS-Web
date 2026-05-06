import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { getAnnouncement } from '@/services/announcement.service';
import { ROUTES } from '@/constants/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

const priorityStyles: Record<'low' | 'medium' | 'high', string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-700 border-slate-200',
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const announcement = await getAnnouncement(id);
  if (!announcement) return { title: 'Announcement not found' };

  return {
    title: announcement.title,
    description: announcement.summary,
  };
}

function formatFullDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Date unknown';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * AnnouncementDetailPage — full announcement view.
 *
 * Same conventions as the event detail page:
 *   - Server component, statically generated with 60s revalidate.
 *   - Description rendered as plain text with whitespace-pre-wrap to
 *     preserve admin-entered line breaks.
 *   - No dangerouslySetInnerHTML.
 *   - 404 if the announcement doesn't exist OR isn't published.
 *   - External `linkUrl` rendered as a clearly-labeled outbound link.
 */
export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();
  if (!announcement.published) notFound();

  const priorityClass =
    priorityStyles[announcement.priority] ?? priorityStyles.medium;
  const dateLabel = formatFullDate(announcement.createdAt);

  return (
    <>
      {/* Hero band */}
      <section className="border-b border-slate-200 bg-slate-50">
        <Container>
          <div className="py-12 sm:py-16">
            <Link
              href={ROUTES.ANNOUNCEMENTS}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#0f1f3a]"
            >
              <span aria-hidden="true">←</span> All announcements
            </Link>

            <div className="mt-6 flex items-center gap-3">
              <span
                className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}
              >
                {announcement.priority}
              </span>
              <span className="text-xs text-slate-500">{dateLabel}</span>
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {announcement.title}
            </h1>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-12">
          <article className="mx-auto max-w-3xl">
            {/*
              Full summary. Plain text, line breaks preserved, ultra-long
              tokens broken at word boundaries.
            */}
            <div className="text-base leading-relaxed text-slate-800">
              <p className="whitespace-pre-wrap break-words">
                {announcement.summary}
              </p>
            </div>

            {/*
              External link if the announcement points to a related URL.
              We use rel="noopener noreferrer" because target="_blank"
              opens a new tab — without those rel values, the new tab can
              navigate the original tab via window.opener (a small but
              real attack on uncontrolled outbound links).
            */}
            {announcement.linkUrl && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Related link
                </p>
                <a
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#0f1f3a] hover:underline"
                >
                  {announcement.linkUrl}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </article>
        </div>
      </Container>
    </>
  );
}
