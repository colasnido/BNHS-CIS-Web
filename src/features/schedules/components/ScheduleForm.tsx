'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Field,
  TextInput,
  Select,
  FormActions,
  FormErrorBanner,
} from '@/components/dashboard/Field';
import type { Schedule, DayOfWeek } from '@/features/schedules/types';
import type { Subject } from '@/features/subjects/types';
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface ScheduleFormProps {
  /** When provided, the form is in single-edit mode (no day picker, only PUT). */
  schedule?: Schedule;
  subjects: Subject[];
  classes: ClassRecord[];
  faculty: User[];
}

const DAYS: ReadonlyArray<{ value: DayOfWeek; label: string; short: string }> = [
  { value: 'mon', label: 'Monday', short: 'Mon' },
  { value: 'tue', label: 'Tuesday', short: 'Tue' },
  { value: 'wed', label: 'Wednesday', short: 'Wed' },
  { value: 'thu', label: 'Thursday', short: 'Thu' },
  { value: 'fri', label: 'Friday', short: 'Fri' },
  { value: 'sat', label: 'Saturday', short: 'Sat' },
  { value: 'sun', label: 'Sunday', short: 'Sun' },
];

interface BusyInterval {
  start: string;
  end: string;
  label: string;
}

interface AvailabilityResponse {
  teacherBusy: BusyInterval[];
  classBusy: BusyInterval[];
}

interface ConflictDetail {
  kind: string;
  message: string;
}

/**
 * Schedule form — handles both create (with multi-day picker for "repeat
 * schedule") and edit (single-day, no day picker).
 *
 * Audit fixes:
 *   - #5 (repeat schedule): multi-day checkbox group, single submit fans
 *     out via the batch endpoint
 *   - smart scheduling hint: when subject + first day is selected, fetches
 *     /api/schedules/availability and shows existing busy intervals
 *   - A10 (consistency): classId/facultyId never sent; derived server-side
 *
 * Behavior:
 *   - Create mode: select 1+ days, server creates one schedule per day
 *     atomically (all-or-nothing). If any day conflicts, the whole submit
 *     fails with a list of which days conflicted.
 *   - Edit mode: single day, only PUT, room/time/day editable.
 */
export function ScheduleForm({
  schedule,
  subjects,
  classes,
  faculty,
}: ScheduleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(schedule);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictDetail[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState(
    schedule?.subjectId ?? subjects[0]?.id ?? ''
  );
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    schedule ? [schedule.dayOfWeek] : ['mon']
  );
  const [startTime, setStartTime] = useState(schedule?.startTime ?? '08:00');

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));
  const klass = selectedSubject ? classMap.get(selectedSubject.classId) : null;
  const teacher = selectedSubject ? facultyMap.get(selectedSubject.facultyId) : null;

  // Availability hint — fetch when subject and first day are known
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null
  );
  useEffect(() => {
    if (!selectedSubjectId || selectedDays.length === 0) {
      setAvailability(null);
      return;
    }
    const day = selectedDays[0];
    const ctrl = new AbortController();
    fetch(
      `/api/schedules/availability?subjectId=${encodeURIComponent(
        selectedSubjectId
      )}&dayOfWeek=${day}`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAvailability(data);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [selectedSubjectId, selectedDays]);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setConflicts([]);
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const subjectId = String(formData.get('subjectId') ?? '');
    if (!subjectId) {
      setFormError('Please select a subject.');
      setIsSubmitting(false);
      return;
    }

    if (!isEdit && selectedDays.length === 0) {
      setFieldErrors({ daysOfWeek: 'Select at least one day' });
      setIsSubmitting(false);
      return;
    }

    const startTimeVal = String(formData.get('startTime') ?? '').trim();
    const endTimeVal = String(formData.get('endTime') ?? '').trim();
    const roomVal = String(formData.get('room') ?? '').trim() || undefined;

    try {
      let res: Response;

      if (isEdit) {
        // Edit: single day, PUT to specific schedule
        res = await fetch(`/api/schedules/${schedule!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: selectedDays[0],
            startTime: startTimeVal,
            endTime: endTimeVal,
            room: roomVal,
          }),
        });
      } else if (selectedDays.length === 1) {
        // Single-day create — use the basic shape
        res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            dayOfWeek: selectedDays[0],
            startTime: startTimeVal,
            endTime: endTimeVal,
            room: roomVal,
          }),
        });
      } else {
        // Multi-day create — use the batch shape
        res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            daysOfWeek: selectedDays,
            startTime: startTimeVal,
            endTime: endTimeVal,
            room: roomVal,
          }),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && Array.isArray(body.conflicts)) {
          setConflicts(body.conflicts);
        } else if (res.status === 400 && Array.isArray(body.issues)) {
          const errs: Record<string, string> = {};
          for (const issue of body.issues) {
            errs[issue.path] = issue.message;
          }
          setFieldErrors(errs);
        } else {
          setFormError(body.error ?? 'Save failed');
        }
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard/admin/schedules');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Network error');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 pb-10 sm:px-6">
      <FormErrorBanner error={formError} />

      {conflicts.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm"
        >
          <p className="mb-1.5 font-semibold text-rose-900">
            Schedule conflict — nothing was saved
          </p>
          <ul className="space-y-0.5 text-rose-800">
            {conflicts.map((c, i) => (
              <li key={i}>• {c.message}</li>
            ))}
          </ul>
        </div>
      )}

      <Field
        label="Subject"
        htmlFor="subjectId"
        required
        error={fieldErrors.subjectId}
      >
        <Select
          id="subjectId"
          name="subjectId"
          required
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={isEdit} // can't change subject on edit (would change class+teacher silently)
        >
          {subjects.length === 0 && <option value="">No subjects</option>}
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      {selectedSubject && klass && teacher && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <p>
            Teacher: <span className="font-medium text-slate-900">{teacher.displayName}</span>
            {' · '}
            Class: <span className="font-medium text-slate-900">Grade {klass.gradeLevel} - {klass.name}</span>
          </p>
        </div>
      )}

      {!isEdit && (
        <Field
          label="Days"
          htmlFor="daysOfWeek"
          required
          error={fieldErrors.daysOfWeek}
          hint="Select all weekdays this subject meets at this time. We'll create one schedule per day in one go."
        >
          <div
            id="daysOfWeek"
            className="mt-1.5 flex flex-wrap gap-2"
            role="group"
            aria-label="Days of week"
          >
            {DAYS.map((d) => {
              const checked = selectedDays.includes(d.value);
              return (
                <label
                  key={d.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    checked={checked}
                    onChange={() => toggleDay(d.value)}
                  />
                  <span className="font-medium">{d.short}</span>
                </label>
              );
            })}
          </div>
        </Field>
      )}

      {isEdit && (
        <Field label="Day" htmlFor="dayOfWeek" required>
          <Select
            id="dayOfWeek"
            value={selectedDays[0]}
            onChange={(e) => setSelectedDays([e.target.value as DayOfWeek])}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start time"
          htmlFor="startTime"
          required
          error={fieldErrors.startTime}
        >
          <TextInput
            id="startTime"
            name="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Field>
        <Field
          label="End time"
          htmlFor="endTime"
          required
          error={fieldErrors.endTime}
        >
          <TextInput
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue={schedule?.endTime ?? '09:00'}
          />
        </Field>
      </div>

      <Field
        label="Room"
        htmlFor="room"
        hint="Optional. Whitespace will be cleaned, but casing is preserved."
        error={fieldErrors.room}
      >
        <TextInput
          id="room"
          name="room"
          defaultValue={schedule?.room ?? ''}
          placeholder="e.g. Room 201"
        />
      </Field>

      {availability && (availability.teacherBusy.length > 0 || availability.classBusy.length > 0) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
          <p className="mb-1.5 font-semibold text-amber-900">
            Heads up — existing schedules on {DAYS.find((d) => d.value === selectedDays[0])?.label}
          </p>
          {availability.teacherBusy.length > 0 && (
            <p className="text-amber-800">
              {teacher?.displayName} is busy:{' '}
              {availability.teacherBusy
                .map((b) => `${b.start}–${b.end} (${b.label})`)
                .join(', ')}
            </p>
          )}
          {availability.classBusy.length > 0 && (
            <p className="text-amber-800">
              Class is busy:{' '}
              {availability.classBusy
                .map((b) => `${b.start}–${b.end} (${b.label})`)
                .join(', ')}
            </p>
          )}
        </div>
      )}

      <FormActions
        submitLabel={
          isEdit
            ? 'Update schedule'
            : selectedDays.length > 1
              ? `Create ${selectedDays.length} schedules`
              : 'Create schedule'
        }
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/schedules"
      />
    </form>
  );
}
