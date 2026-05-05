import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { EventForm } from '@/features/events/components/EventForm';

export const metadata = { title: 'New event' };

export default function NewEventPage() {
  return (
    <>
      <DashboardPageHeader
        title="New event"
        description="Add a new event to the public calendar."
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <EventForm />
        </div>
      </div>
    </>
  );
}
