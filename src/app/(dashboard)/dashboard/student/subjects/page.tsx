import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';
import { getClass } from '@/services/class.service';
import { listSubjectsByClass } from '@/services/subject.service';
import { listSchedulesByClass } from '@/services/schedule.service';
import { listUsersByRole } from '@/services/user.service';
import type { DayOfWeek } from '@/features/schedules/types';

export const metadata = { title: 'My subjects' };
export const dynamic = 'force-dynamic';

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default async function StudentSubjectsPage() {
  const auth = await requirePageRole(['student']);
  const profile = await getUser(auth.uid);

  if (!profile?.classId) {
    return (
      <>
        <DashboardPageHeader title="My subjects" />
        <div className="p-6 sm:p-8">
          <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">No class assigned</p>
            <p className="mt-2">
              Subjects are assigned by class. Please contact the school
              administrator to assign you to a class.
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

  const [classRecord, subjects, schedules, faculty] = await Promise.all([
    getClass(profile.classId),
    listSubjectsByClass(profile.classId),
    listSchedulesByClass(profile.classId),
    listUsersByRole('faculty'),
  ]);

  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  // Build a map: subjectId → ordered list of meeting days
  // (so each subject card can show "Mon · Wed · Fri" of its meeting days)
  const meetingDaysBySubject = new Map<string, DayOfWeek[]>();
  for (const slot of schedules) {
    const days = meetingDaysBySubject.get(slot.subjectId) ?? [];
    if (!days.includes(slot.dayOfWeek)) {
      days.push(slot.dayOfWeek);
      meetingDaysBySubject.set(slot.subjectId, days);
    }
  }
  // Sort days within each subject by week order
  for (const [, days] of meetingDaysBySubject) {
    days.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  }

  return (
    <>
      <DashboardPageHeader
        title="My subjects"
        description={
          classRecord
            ? `${subjects.length} subjects in Grade ${classRecord.gradeLevel} - ${classRecord.name}`
            : `${subjects.length} subjects`
        }
      />

      <div className="p-6 sm:p-8">
        {subjects.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">
              No subjects assigned yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your class subjects haven&apos;t been added yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const teacher = facultyMap.get(subject.facultyId);
              const meetingDays = meetingDaysBySubject.get(subject.id) ?? [];

              return (
                <article
                  key={subject.id}
                  className="border border-slate-200 bg-white p-5"
                >
                  {/* Audit fix #5: subject.code removed */}
                  <h3 className="font-serif text-lg font-semibold text-slate-900">
                    {subject.name}
                  </h3>

                  {subject.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Teacher
                      </p>
                      <p className="text-sm text-slate-900">
                        {teacher?.displayName ?? 'Not assigned'}
                      </p>
                    </div>

                    {meetingDays.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Meets
                        </p>
                        <p className="text-sm text-slate-900">
                          {meetingDays.map((d) => DAY_SHORT[d]).join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
