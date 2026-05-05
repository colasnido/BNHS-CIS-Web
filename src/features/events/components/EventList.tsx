import type { Event } from '../types';
import { EventCard } from './EventCard';

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="font-serif text-lg text-slate-700">No events scheduled</p>
        <p className="mt-2 text-sm text-slate-500">
          Check back soon for upcoming activities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
