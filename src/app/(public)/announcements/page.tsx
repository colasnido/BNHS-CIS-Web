import { Container } from '@/components/ui/Container';
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
      <section className="border-b border-slate-200 bg-[#f8f7f3]">
        <Container>
          <div className="py-12 sm:py-16">
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
                School Dispatch
              </p>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-[#c8a85c]/50 via-[#c8a85c]/20 to-transparent"
              />
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Announcements
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              The latest news, advisories, and important updates from the
              school administration.
            </p>
          </div>
        </Container>
      </section>
      <Container>
        <div className="py-12">
          <AnnouncementList announcements={announcements} />
        </div>
      </Container>
    </>
  );
}
