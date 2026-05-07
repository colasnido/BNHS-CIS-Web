import Link from "next/link";
import type { Announcement } from "../types";

interface AnnouncementCardProps {
  announcement: Announcement;
  variant?: "compact" | "detailed";
}

const priorityStyles: Record<Announcement["priority"], string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * AnnouncementCard — list/grid tile.
 *
 * Update notes:
 *   - Both variants are now wrapped in a <Link> to /announcements/[id].
 *   - Compact variant now shows summary preview (was missing before).
 *   - Detailed variant uses line-clamp-3 on summary to keep grid uniform.
 *   - Removed the inline `linkUrl` "Read more" anchor: external links from
 *     announcements were leaking out of the site. If an announcement has
 *     a related URL, that's now rendered on the detail page only, with a
 *     clear "External link" indicator (see /announcements/[id]/page.tsx).
 */
export function AnnouncementCard({
  announcement,
  variant = "detailed",
}: AnnouncementCardProps) {
  const dateLabel = formatDate(announcement.createdAt);
  const priorityClass =
    priorityStyles[announcement.priority] ?? priorityStyles.medium;
  const detailHref = `/announcements/${announcement.id}`;

  if (variant === "compact") {
    // Used on the homepage's "Recent announcements" list. Tighter spacing,
    // no card chrome, summary clamped to 2 lines for density.
    return (
      <Link
        href={detailHref}
        className="group block px-3 py-4 transition-colors ring-1 ring-inset ring-transparent hover:bg-[#0f1f3a]/[0.04] hover:ring-[#c8a85c]/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c8a85c]"
      >
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
        {/*
          Preview: 2-line clamp. If the summary fits in 2 lines, no
          truncation; if longer, the rest is one click away on the
          detail page.
        */}
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
          {announcement.summary}
        </p>
      </Link>
    );
  }

  // Detailed: full-page announcement grid (e.g., /announcements). Card
  // chrome, slightly more breathing room, "Read more →" affordance.
  return (
    <Link
      href={detailHref}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
    >
      <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 transition-colors group-hover:border-[#0f1f3a]">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}
          >
            {announcement.priority}
          </span>
          <span className="text-xs text-slate-500">{dateLabel}</span>
        </div>
        <h3 className="mt-3 font-serif text-lg font-semibold text-slate-900 group-hover:text-[#0f1f3a]">
          {announcement.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {announcement.summary}
        </p>

        <p className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#c8a85c] group-hover:gap-2">
          Read more
          <span aria-hidden="true" className="transition-all">
            →
          </span>
        </p>
      </article>
    </Link>
  );
}
