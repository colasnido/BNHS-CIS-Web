import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ScheduleGrid } from "@/components/dashboard/ScheduleGrid";
import { requirePageRole } from "@/services/auth.guards";
import { listSchedulesByFaculty } from "@/services/schedule.service";
import { listSubjectsByFaculty } from "@/services/subject.service";
import { listClasses } from "@/services/class.service";
import { listUsersByRole } from "@/services/user.service";

export const metadata = { title: "My schedule" };
export const dynamic = "force-dynamic";

export default async function FacultySchedulePage() {
  const auth = await requirePageRole(["faculty"]);

  const [schedules, subjects, classes, faculty] = await Promise.all([
    listSchedulesByFaculty(auth.uid),
    listSubjectsByFaculty(auth.uid),
    listClasses(),
    listUsersByRole("faculty"),
  ]);

  return (
    <>
      <DashboardPageHeader
        title="My schedule"
        description="Your weekly teaching schedule across all assigned classes."
      />

      <div className="p-6 sm:p-8">
        {schedules.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-serif text-lg text-slate-700">No schedule yet</p>
            <p className="mt-1 text-sm text-slate-500">
              You haven&apos;t been assigned any teaching slots yet. Please
              contact the school administrator.
            </p>
          </div>
        ) : (
          // secondaryLabel="class" — students see the teacher; faculty see which class
          <ScheduleGrid
            schedules={schedules}
            subjects={subjects}
            faculty={faculty}
            classes={classes}
            secondaryLabel="class"
          />
        )}
      </div>
    </>
  );
}
