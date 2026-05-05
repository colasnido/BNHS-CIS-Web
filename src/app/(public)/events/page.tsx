import { Container } from '@/components/ui/Container';
import { listEvents } from '@/services/event.service';
import { EventList } from '@/features/events/components/EventList';

export const metadata = {
  title: 'Events',
  description: 'Upcoming events at Badiang National High School',
};

// Revalidate every 60s — events change daily, not by-the-minute.
export const revalidate = 60;

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <Container>
          <div className="py-12 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
              School Calendar
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Events
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Upcoming activities, performances, and key dates throughout the
              academic year.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-12">
          <EventList events={events} />
        </div>
      </Container>
    </>
  );
}
