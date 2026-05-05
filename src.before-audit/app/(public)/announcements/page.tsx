import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnnouncementList } from '@/features/announcements/components/AnnouncementList';
import { listAnnouncements } from '@/services/announcement.service';

export const metadata = {
  title: 'Announcements',
};

export const revalidate = 60;

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <>
      <Container>
        <PageHeader
          title="Announcements"
          description="The latest news and important updates from the school."
        />
      </Container>
      <Container>
        <div className="py-12">
          <AnnouncementList announcements={announcements} />
        </div>
      </Container>
    </>
  );
}
