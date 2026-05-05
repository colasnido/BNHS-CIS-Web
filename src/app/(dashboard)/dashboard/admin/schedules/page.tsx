import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DeleteButton } from '@/components/dashboard/DeleteButton';
import { listSchedules } from '@/services/schedule.service';
import { listSubjects } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

export const metadata = { title: 'Manage schedules' };
export const dynamic = 'force-dynamic';

const dayLabels: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export default async function AdminSchedulesPage() {
  const [schedules, subjects, classes, faculty] = await Promise.all([
    listSchedules(),
    listSubjects(),
    listClasses(),
    listUsersByRole('faculty'),
  ]);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  return (
    <>
      <DashboardPageHeader
        title="Schedules"
        description="Set weekly meeting times for each subject."
        actions={
          <Link
            href="/dashboard/admin/schedules/new"
            className="inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
          >
            New schedule
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {schedules.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No schedules yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add weekly meeting times after you have subjects set up.
            </p>
            <Link
              href="/dashboard/admin/schedules/new"
              className="mt-4 inline-flex items-center bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white"
            >
              New schedule
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Subject
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sm:table-cell">
                    Class
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 md:table-cell">
                    Teacher
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 lg:table-cell">
                    Room
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((s) => {
                  const subject = subjectMap.get(s.subjectId);
                  const cls = classMap.get(s.classId);
                  const teacher = facultyMap.get(s.facultyId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {dayLabels[s.dayOfWeek] ?? s.dayOfWeek}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-900">
                        {s.startTime}–{s.endTime}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {subject ? `${subject.code} — ${subject.name}` : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                        {cls ? `Grade ${cls.gradeLevel} - ${cls.name}` : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {teacher?.displayName ?? '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">
                        {s.room ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <Link
                          href={`/dashboard/admin/schedules/${s.id}/edit`}
                          className="text-[#0f1f3a] hover:underline"
                        >
                          Edit
                        </Link>
                        <span className="mx-2 text-slate-300">·</span>
                        <DeleteButton
                          endpoint={`/api/schedules/${s.id}`}
                          itemLabel={`${dayLabels[s.dayOfWeek]} ${s.startTime}–${s.endTime} ${subject?.code ?? ''}`.trim()}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
