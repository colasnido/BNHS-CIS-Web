import type { Announcement } from "../types";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementListProps {
  announcements: Announcement[];
  variant?: "compact" | "detailed";
}

export function AnnouncementList({
  announcements,
  variant = "detailed",
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No announcements yet.
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <ul className="mt-2 divide-y divide-slate-100">
        {announcements.map((announcement) => (
          <li key={announcement.id}>
            <AnnouncementCard announcement={announcement} variant="compact" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}
