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
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface ClassFormProps {
  classRecord?: ClassRecord;
  /** Faculty list — used for adviser select */
  faculty: User[];
}

export function ClassForm({ classRecord, faculty }: ClassFormProps) {
  const router = useRouter();
  const isEdit = Boolean(classRecord);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      gradeLevel: Number(formData.get('gradeLevel')),
      section: String(formData.get('section') ?? '').trim(),
      schoolYear: String(formData.get('schoolYear') ?? '').trim(),
      adviserId: String(formData.get('adviserId') ?? '').trim() || undefined,
    };

    try {
      const endpoint = isEdit
        ? `/api/classes/${classRecord!.id}`
        : '/api/classes';
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

      router.push('/dashboard/admin/classes');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setIsSubmitting(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const defaultSchoolYear = `${currentYear}-${currentYear + 1}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormErrorBanner error={formError} />

      <Field
        label="Class name"
        htmlFor="name"
        required
        error={fieldErrors.name}
        hint='e.g. "St. Augustine", "Diamond"'
      >
        <TextInput
          id="name"
          name="name"
          required
          defaultValue={classRecord?.name}
          placeholder="St. Augustine"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Grade level"
          htmlFor="gradeLevel"
          required
          error={fieldErrors.gradeLevel}
        >
          <Select
            id="gradeLevel"
            name="gradeLevel"
            required
            defaultValue={classRecord?.gradeLevel ?? 7}
          >
            {[7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Section"
          htmlFor="section"
          required
          error={fieldErrors.section}
        >
          <TextInput
            id="section"
            name="section"
            required
            defaultValue={classRecord?.section}
            placeholder="A"
          />
        </Field>

        <Field
          label="School year"
          htmlFor="schoolYear"
          required
          error={fieldErrors.schoolYear}
          hint="Format: YYYY-YYYY"
        >
          <TextInput
            id="schoolYear"
            name="schoolYear"
            required
            defaultValue={classRecord?.schoolYear ?? defaultSchoolYear}
            placeholder="2025-2026"
            pattern="\d{4}-\d{4}"
          />
        </Field>
      </div>

      <Field
        label="Adviser (homeroom teacher)"
        htmlFor="adviserId"
        error={fieldErrors.adviserId}
      >
        <Select
          id="adviserId"
          name="adviserId"
          defaultValue={classRecord?.adviserId ?? ''}
        >
          <option value="">— No adviser yet —</option>
          {faculty.map((f) => (
            <option key={f.uid} value={f.uid}>
              {f.displayName} {f.department ? `(${f.department})` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create class'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/classes"
      />
    </form>
  );
}
