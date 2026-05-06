import Image from 'next/image';
import Link from 'next/link';
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

/**
 * EventCard — single event tile shown in event grid lists.
 *
 * Update notes:
 *   - Whole card is now a <Link>. Description preview can be 3 lines and
 *     anyone wanting to read more just clicks anywhere on the card.
 *   - Removed shadow-sm + relied on border alone for cleaner look.
 *   - Description uses line-clamp-3 to keep card heights uniform across the grid.
 *   - The "Read more →" hint at the bottom appears on hover, signaling
 *     the card is interactive without taking up space at rest.
 */
export function EventCard({ event }: EventCardProps) {
  const dateBlock = formatDateBlock(event.startDate);
  const dateLabel = formatDateRange(
    event.startDate,
    event.endDate,
    event.isAllDay
  );
  const location = event.location?.trim() || 'TBA';

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex h-full flex-col overflow-hidden border border-slate-200 bg-white transition-colors hover:border-[#0f1f3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
    >
      <article className="flex h-full flex-col">
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
            <h3 className="font-serif text-lg font-semibold leading-tight text-slate-900 group-hover:text-[#0f1f3a]">
              {event.title}
            </h3>
            {/*
              line-clamp-3 keeps preview to 3 lines. CSS-only truncation,
              ellipsis added automatically. If description is shorter than
              3 lines, the clamp doesn't fire and the text shows in full.
            */}
            <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
              {event.description}
            </p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <div>
                <span className="font-semibold text-slate-600">When:</span>{' '}
                {dateLabel}
              </div>
              <div>
                <span className="font-semibold text-slate-600">Where:</span>{' '}
                {location}
              </div>
            </div>

            {/*
              "Read more" affordance. Visible at rest as subtle gold text;
              brightens on hover. Tells the user the card is clickable
              without the visual noise of a button.
            */}
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#c8a85c] group-hover:gap-2">
              Read more
              <span aria-hidden="true" className="transition-all">
                →
              </span>
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
