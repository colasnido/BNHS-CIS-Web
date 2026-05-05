import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { EventForm } from '@/features/events/components/EventForm';
import { getEvent } from '@/services/event.service';

export const metadata = { title: 'Edit event' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <DashboardPageHeader
        title="Edit event"
        description={event.title}
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <EventForm event={event} />
        </div>
      </div>
    </>
  );
}
