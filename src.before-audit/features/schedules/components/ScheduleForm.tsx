'use client';

import { useState, type FormEvent } from 'react';
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
  schedule?: Schedule;
  /** Pre-fetched lookups so the form is one component, not 3 nested selects */
  subjects: Subject[];
  classes: ClassRecord[];
  faculty: User[];
}

const DAYS: ReadonlyArray<{ value: DayOfWeek; label: string }> = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

export function ScheduleForm({
  schedule,
  subjects,
  classes,
  faculty,
}: ScheduleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(schedule);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When subject changes, classId and facultyId are derived automatically.
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    schedule?.subjectId ?? subjects[0]?.id ?? ''
  );
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const classMap = new Map(classes.map((c) => [c.id, c]));
  const facultyMap = new Map(faculty.map((f) => [f.uid, f]));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const subjectId = String(formData.get('subjectId') ?? '');
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) {
      setFormError('Please select a subject.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      subjectId,
      classId: subject.classId, // derived from subject
      facultyId: subject.facultyId, // derived from subject
      dayOfWeek: String(formData.get('dayOfWeek')),
      startTime: String(formData.get('startTime') ?? '').trim(),
      endTime: String(formData.get('endTime') ?? '').trim(),
      room: String(formData.get('room') ?? '').trim() || undefined,
    };

    try {
      const endpoint = isEdit
        ? `/api/schedules/${schedule!.id}`
        : '/api/schedules';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.issues) {
          const errs: Record<string, string> = {};
          for (const issue of body.issues as { path: string; message: string }[]) {
            errs[issue.path] = issue.message;
          }
          setFieldErrors(errs);
        }
        throw new Error(body.error || 'Save failed');
      }

      router.push('/dashboard/admin/schedules');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setIsSubmitting(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-medium">Setup required</p>
        <p className="mt-2">
          Schedules need at least one subject to assign a meeting time to.
        </p>
        <p className="mt-2">
          <a
            href="/dashboard/admin/subjects/new"
            className="font-medium underline"
          >
            Create a subject
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const derivedClass = selectedSubject
    ? classMap.get(selectedSubject.classId)
    : null;
  const derivedFaculty = selectedSubject
    ? facultyMap.get(selectedSubject.facultyId)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormErrorBanner error={formError} />

      <Field
        label="Subject"
        htmlFor="subjectId"
        required
        error={fieldErrors.subjectId}
        hint="Class and teacher are auto-filled from the subject."
      >
        <Select
          id="subjectId"
          name="subjectId"
          required
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
        >
          <option value="" disabled>
            — Select a subject —
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* Read-only derived info */}
      {selectedSubject && (
        <div className="grid gap-4 border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {derivedClass
                ? `Grade ${derivedClass.gradeLevel} - ${derivedClass.name} (${derivedClass.section})`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teacher
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {derivedFaculty?.displayName ?? '—'}
            </p>
          </div>
        </div>
      )}

      <Field
        label="Day of week"
        htmlFor="dayOfWeek"
        required
        error={fieldErrors.dayOfWeek}
      >
        <Select
          id="dayOfWeek"
          name="dayOfWeek"
          required
          defaultValue={schedule?.dayOfWeek ?? 'mon'}
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Start time"
          htmlFor="startTime"
          required
          error={fieldErrors.startTime}
          hint="24-hour format (HH:MM)"
        >
          <TextInput
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue={schedule?.startTime ?? '08:00'}
          />
        </Field>

        <Field
          label="End time"
          htmlFor="endTime"
          required
          error={fieldErrors.endTime}
          hint="Must be after start time"
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
        error={fieldErrors.room}
        hint="Optional. Where this meeting takes place."
      >
        <TextInput
          id="room"
          name="room"
          defaultValue={schedule?.room}
          placeholder="e.g. Room 201"
        />
      </Field>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create schedule'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/schedules"
      />
    </form>
  );
}
