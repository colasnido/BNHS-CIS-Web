import { listAnnouncements } from '@/services/announcement.service';
import { AnnouncementsAdminClient } from '@/features/announcements/components/AnnouncementsAdminClient';

export const metadata = { title: 'Announcements' };
export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  const announcements = await listAnnouncements();
  return <AnnouncementsAdminClient announcements={announcements} />;
}
