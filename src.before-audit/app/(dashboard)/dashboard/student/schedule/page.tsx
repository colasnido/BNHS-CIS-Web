import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ScheduleGrid } from '@/components/dashboard/ScheduleGrid';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';
import { getClass } from '@/services/class.service';
import { listSchedulesByClass } from '@/services/schedule.service';
import { listSubjectsByClass } from '@/services/subject.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'My schedule' };
export const dynamic = 'force-dynamic';

export default async function StudentSchedulePage() {
  const auth = await requirePageRole(['student']);
  const profile = await getUser(auth.uid);

  if (!profile?.classId) {
    return (
      <>
        <DashboardPageHeader title="My schedule" />
        <div className="p-6 sm:p-8">
          <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">No class assigned</p>
            <p className="mt-2">
              You need to be assigned to a class before your schedule shows up.
              Please contact the school administrator.
            </p>
            <Link
              href="/dashboard/student"
              className="mt-3 inline-block text-xs font-medium text-amber-900 underline"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </>
    );
  }

  const [classRecord, schedules, subjects, faculty] = await Promise.all([
    getClass(profile.classId),
    listSchedulesByClass(profile.classId),
    listSubjectsByClass(profile.classId),
    listUsersByRole('faculty'),
  ]);

  return (
    <>
      <DashboardPageHeader
        title="My schedule"
        description={
          classRecord
            ? `Grade ${classRecord.gradeLevel} - ${classRecord.name} · ${classRecord.schoolYear}`
            : 'Your weekly class schedule'
        }
      />

      <div className="p-6 sm:p-8">
        {schedules.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">
              Schedule not yet posted
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your class schedule hasn&apos;t been added yet. Check back soon.
            </p>
          </div>
        ) : (
          <ScheduleGrid
            schedules={schedules}
            subjects={subjects}
            faculty={faculty}
            secondaryLabel="teacher"
          />
        )}
      </div>
    </>
  );
}
