import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { requirePageRole } from '@/services/auth.guards';
import { getUser } from '@/services/user.service';
import { getClass } from '@/services/class.service';

export const metadata = { title: 'My adviser' };
export const dynamic = 'force-dynamic';

export default async function StudentAdviserPage() {
  const auth = await requirePageRole(['student']);
  const profile = await getUser(auth.uid);

  if (!profile?.classId) {
    return (
      <>
        <DashboardPageHeader title="My adviser" />
        <div className="p-6 sm:p-8">
          <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">No class assigned</p>
            <p className="mt-2">
              You haven&apos;t been assigned to a homeroom yet, so we
              can&apos;t show your adviser. Please contact the school
              administrator.
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

  const classRecord = await getClass(profile.classId);
  const adviser = classRecord?.adviserId
    ? await getUser(classRecord.adviserId)
    : null;

  if (!classRecord) {
    return (
      <>
        <DashboardPageHeader title="My adviser" />
        <div className="p-6 sm:p-8">
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              Class information not found.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!adviser) {
    return (
      <>
        <DashboardPageHeader
          title="My adviser"
          description={`Grade ${classRecord.gradeLevel} - ${classRecord.name}`}
        />
        <div className="p-6 sm:p-8">
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">
              No adviser assigned yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your homeroom adviser hasn&apos;t been assigned. Check back soon.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Take the first letter of the displayName for an avatar fallback
  const initials = adviser.displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <DashboardPageHeader
        title="My adviser"
        description={`Grade ${classRecord.gradeLevel} - ${classRecord.name} · ${classRecord.schoolYear}`}
      />

      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          {/* Profile card */}
          <div className="overflow-hidden border border-slate-200 bg-white">
            {/* Banner with adviser name */}
            <div className="bg-[#0f1f3a] px-6 py-8 text-white sm:px-8">
              <div className="flex items-start gap-4 sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#c8a85c] font-serif text-xl font-semibold text-[#0f1f3a] sm:h-20 sm:w-20 sm:text-2xl">
                  {initials || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Homeroom adviser
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
                    {adviser.displayName}
                  </h2>
                  {adviser.department && (
                    <p className="mt-0.5 text-sm text-slate-300">
                      {adviser.department}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="border-t border-slate-200 px-6 py-6 sm:px-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Contact
              </h3>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${adviser.email}`}
                      className="text-sm text-[#0f1f3a] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
                    >
                      {adviser.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Class info */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your class
              </h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Grade & section</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">
                    Grade {classRecord.gradeLevel} - {classRecord.name} ({classRecord.section})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">School year</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">
                    {classRecord.schoolYear}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              For urgent matters, please reach out via email or speak to your
              adviser at school.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
