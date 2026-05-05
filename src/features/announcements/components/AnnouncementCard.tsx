import type { Announcement } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  variant?: 'compact' | 'detailed';
}

const priorityStyles: Record<Announcement['priority'], string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-700 border-slate-200',
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AnnouncementCard({
  announcement,
  variant = 'detailed',
}: AnnouncementCardProps) {
  const dateLabel = formatDate(announcement.createdAt);
  const priorityClass = priorityStyles[announcement.priority] ?? priorityStyles.medium;

  if (variant === 'compact') {
    return (
      <div className="group block py-5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c8a85c]">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}
          >
            {announcement.priority}
          </span>
          <span className="text-xs text-slate-500">{dateLabel}</span>
        </div>
        <p className="mt-2 font-medium text-slate-900 group-hover:text-[#0f1f3a]">
          {announcement.title}
        </p>
      </div>
    );
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}
        >
          {announcement.priority}
        </span>
        <span className="text-xs text-slate-500">{dateLabel}</span>
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-slate-900">
        {announcement.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {announcement.summary}
      </p>
      {announcement.linkUrl && (
        <a
          href={announcement.linkUrl}
          className="mt-3 inline-flex text-sm font-medium text-[#0f1f3a] hover:underline"
        >
          Read more
        </a>
      )}
    </article>
  );
}
