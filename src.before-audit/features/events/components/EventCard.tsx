import Image from 'next/image';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
}

function formatDateBlock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { month: 'TBD', day: '--' };
  }

  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate().toString(),
  };
}

function formatDateRange(startISO: string, endISO: string, isAllDay: boolean) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startValid = !Number.isNaN(start.getTime());
  const endValid = !Number.isNaN(end.getTime());

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };

  if (!startValid && !endValid) return 'Date TBD';

  if (startValid && !endValid) {
    const date = start.toLocaleDateString('en-US', dateOpts);
    if (isAllDay) return `${date} · All day`;
    return `${date} · ${start.toLocaleTimeString('en-US', timeOpts)}`;
  }

  if (!startValid && endValid) {
    return `Ends ${end.toLocaleDateString('en-US', dateOpts)}`;
  }

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const date = start.toLocaleDateString('en-US', dateOpts);
    if (isAllDay) return `${date} · All day`;
    return `${date} · ${start.toLocaleTimeString('en-US', timeOpts)}`;
  }

  return `${start.toLocaleDateString('en-US', dateOpts)} – ${end.toLocaleDateString(
    'en-US',
    dateOpts
  )}`;
}

export function EventCard({ event }: EventCardProps) {
  const dateBlock = formatDateBlock(event.startDate);
  const dateLabel = formatDateRange(
    event.startDate,
    event.endDate,
    event.isAllDay
  );
  const location = event.location?.trim() || 'TBA';

  return (
    <article className="group flex flex-col overflow-hidden border border-slate-200 bg-white transition-colors hover:border-[#0f1f3a]">
      {/* Optional cover image — lazy-loaded via Next.js Image */}
      {event.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-1 gap-4 p-6">
        {/* Date block */}
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border border-slate-200 bg-slate-50"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c8a85c]">
            {dateBlock.month}
          </span>
          <span className="font-serif text-2xl font-semibold text-slate-900">
            {dateBlock.day}
          </span>
        </div>

        <div className="flex flex-1 flex-col">
          <h3 className="font-serif text-lg font-semibold leading-tight text-slate-900">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
            {event.description}
          </p>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-600">When:</span> {dateLabel}
            </div>
            <div>
              <span className="font-semibold text-slate-600">Where:</span> {location}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
