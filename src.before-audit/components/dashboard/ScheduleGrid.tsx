import type { Schedule, DayOfWeek } from '@/features/schedules/types';
import type { Subject } from '@/features/subjects/types';
import type { User } from '@/features/users/types';
import type { ClassRecord } from '@/features/classes/types';

interface ScheduleGridProps {
  schedules: Schedule[];
  subjects: Subject[];
  faculty: User[];
  /** Optional class lookup — used in faculty view to show which class each slot is for */
  classes?: ClassRecord[];
  /**
   * Which extra label to show under the subject name:
   *   'teacher'  → faculty member (use on student schedule)
   *   'class'    → class name (use on faculty schedule)
   *   'none'     → no extra label
   */
  secondaryLabel?: 'teacher' | 'class' | 'none';
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Format an HH:MM time string with 12-hour display.
 * "08:00" → "8:00 AM", "14:30" → "2:30 PM"
 */
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Weekly schedule view: groups schedule items by day, renders cards.
 *
 * Empty days are still shown so the structure is consistent and students
 * can see at a glance which days they have no classes (e.g. weekends).
 */
export function ScheduleGrid({
  schedules,
  subjects,
  faculty,
  classes = [],
  secondaryLabel = 'teacher',
}: ScheduleGridProps) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  // Hide weekends if there's no schedule on Sat/Sun (most common case)
  const hasWeekend = schedules.some(
    (s) => s.dayOfWeek === 'sat' || s.dayOfWeek === 'sun'
  );
  const visibleDays = hasWeekend ? DAY_ORDER : DAY_ORDER.slice(0, 5);

  // Group schedules by day
  const byDay = new Map<DayOfWeek, Schedule[]>();
  for (const day of visibleDays) {
    byDay.set(
      day,
      schedules
        .filter((s) => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {visibleDays.map((day) => {
        const items = byDay.get(day) ?? [];
        const isWeekend = day === 'sat' || day === 'sun';
        return (
          <section
            key={day}
            aria-label={DAY_LABELS[day]}
            className={`border border-slate-200 bg-white ${
              isWeekend ? 'lg:col-span-1' : ''
            }`}
          >
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                {DAY_LABELS[day]}
              </h3>
            </header>

            <div className="p-3">
              {items.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No classes
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => {
                    const subject = subjectMap.get(item.subjectId);
                    const teacher = facultyMap.get(item.facultyId);
                    const cls = classMap.get(item.classId);

                    return (
                      <li
                        key={item.id}
                        className="border-l-2 border-[#c8a85c] bg-slate-50 p-2.5"
                      >
                        <p className="font-mono text-[11px] font-medium text-slate-600">
                          {formatTime(item.startTime)} – {formatTime(item.endTime)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {subject?.name ?? 'Unknown subject'}
                        </p>
                        {subject?.code && (
                          <p className="text-[11px] font-mono text-slate-500">
                            {subject.code}
                          </p>
                        )}
                        {secondaryLabel === 'teacher' && teacher && (
                          <p className="mt-1 text-xs text-slate-600">
                            {teacher.displayName}
                          </p>
                        )}
                        {secondaryLabel === 'class' && cls && (
                          <p className="mt-1 text-xs text-slate-600">
                            Grade {cls.gradeLevel} - {cls.name}
                          </p>
                        )}
                        {item.room && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {item.room}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
