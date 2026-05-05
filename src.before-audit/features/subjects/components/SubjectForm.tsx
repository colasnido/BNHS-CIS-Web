'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Field,
  TextInput,
  TextArea,
  Select,
  FormActions,
  FormErrorBanner,
} from '@/components/dashboard/Field';
import type { Subject } from '@/features/subjects/types';
import type { ClassRecord } from '@/features/classes/types';
import type { User } from '@/features/users/types';

interface SubjectFormProps {
  subject?: Subject;
  classes: ClassRecord[];
  faculty: User[];
}

export function SubjectForm({ subject, classes, faculty }: SubjectFormProps) {
  const router = useRouter();
  const isEdit = Boolean(subject);
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
      code: String(formData.get('code') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      description:
        String(formData.get('description') ?? '').trim() || undefined,
      classId: String(formData.get('classId') ?? '').trim(),
      facultyId: String(formData.get('facultyId') ?? '').trim(),
    };

    try {
      const endpoint = isEdit
        ? `/api/subjects/${subject!.id}`
        : '/api/subjects';
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

      router.push('/dashboard/admin/subjects');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setIsSubmitting(false);
    }
  }

  if (classes.length === 0 || faculty.length === 0) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-medium">Setup required</p>
        <p className="mt-2">
          Subjects need at least one class and one faculty member to assign.
        </p>
        <p className="mt-2">
          {classes.length === 0 && (
            <>
              <a
                href="/dashboard/admin/classes/new"
                className="font-medium underline"
              >
                Create a class
              </a>
              {faculty.length === 0 && ' and '}
            </>
          )}
          {faculty.length === 0 && (
            <a
              href="/dashboard/admin/users/new"
              className="font-medium underline"
            >
              Create a faculty user
            </a>
          )}
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormErrorBanner error={formError} />

      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Subject code"
          htmlFor="code"
          required
          error={fieldErrors.code}
          hint="Short identifier"
        >
          <TextInput
            id="code"
            name="code"
            required
            defaultValue={subject?.code}
            placeholder="MATH-11"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Subject name"
            htmlFor="name"
            required
            error={fieldErrors.name}
          >
            <TextInput
              id="name"
              name="name"
              required
              defaultValue={subject?.name}
              placeholder="General Mathematics"
            />
          </Field>
        </div>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        error={fieldErrors.description}
        hint="Optional. Brief description of the course."
      >
        <TextArea
          id="description"
          name="description"
          rows={3}
          defaultValue={subject?.description}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Class"
          htmlFor="classId"
          required
          error={fieldErrors.classId}
          hint="Which section takes this subject"
        >
          <Select
            id="classId"
            name="classId"
            required
            defaultValue={subject?.classId ?? ''}
          >
            <option value="" disabled>
              — Select a class —
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Grade {c.gradeLevel} - {c.name} ({c.section})
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Faculty"
          htmlFor="facultyId"
          required
          error={fieldErrors.facultyId}
          hint="Teacher assigned to this subject"
        >
          <Select
            id="facultyId"
            name="facultyId"
            required
            defaultValue={subject?.facultyId ?? ''}
          >
            <option value="" disabled>
              — Select a teacher —
            </option>
            {faculty.map((f) => (
              <option key={f.uid} value={f.uid}>
                {f.displayName} {f.department ? `(${f.department})` : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create subject'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/subjects"
      />
    </form>
  );
}
