import { listEvents } from '@/services/event.service';
import { EventsAdminClient } from '@/features/events/components/EventsAdminClient';

export const metadata = { title: 'Events' };
export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await listEvents();
  return <EventsAdminClient events={events} />;
}
