import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { AnnouncementForm } from '@/features/announcements/components/AnnouncementForm';

export const metadata = { title: 'New announcement' };

export default function NewAnnouncementPage() {
  return (
    <>
      <DashboardPageHeader
        title="New announcement"
        description="Post a new school-wide announcement."
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <AnnouncementForm />
        </div>
      </div>
    </>
  );
}
