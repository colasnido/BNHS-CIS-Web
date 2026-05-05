import { notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { AnnouncementForm } from '@/features/announcements/components/AnnouncementForm';
import { getAnnouncement } from '@/services/announcement.service';

export const metadata = { title: 'Edit announcement' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: PageProps) {
  const { id } = await params;
  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();

  return (
    <>
      <DashboardPageHeader title="Edit announcement" description={announcement.title} />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <AnnouncementForm announcement={announcement} />
        </div>
      </div>
    </>
  );
}
