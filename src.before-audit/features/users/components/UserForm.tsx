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
import type { User, Role } from '@/features/users/types';
import type { ClassRecord } from '@/features/classes/types';

interface UserFormProps {
  user?: User;
  /** All classes — used for class select when role=student */
  classes: ClassRecord[];
}

const ROLES: ReadonlyArray<Role> = ['admin', 'faculty', 'student'];

export function UserForm({ user, classes }: UserFormProps) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const [role, setRole] = useState<Role>(user?.role ?? 'student');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const gradeLevelStr = String(formData.get('gradeLevel') ?? '').trim();
    const payload: Record<string, unknown> = {
      displayName: String(formData.get('displayName') ?? '').trim(),
      role: String(formData.get('role')),
      classId: String(formData.get('classId') ?? '').trim() || undefined,
      studentNumber: String(formData.get('studentNumber') ?? '').trim() || undefined,
      gradeLevel: gradeLevelStr ? Number(gradeLevelStr) : undefined,
      department: String(formData.get('department') ?? '').trim() || undefined,
    };

    if (!isEdit) {
      payload.email = String(formData.get('email') ?? '').trim();
      payload.password = String(formData.get('password') ?? '');
    }

    try {
      const endpoint = isEdit ? `/api/users/${user!.uid}` : '/api/users';
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

      router.push('/dashboard/admin/users');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormErrorBanner error={formError} />

      <Field
        label="Display name"
        htmlFor="displayName"
        required
        error={fieldErrors.displayName}
      >
        <TextInput
          id="displayName"
          name="displayName"
          required
          defaultValue={user?.displayName}
          placeholder="e.g. Maria Santos"
        />
      </Field>

      {!isEdit && (
        <>
          <Field label="Email" htmlFor="email" required error={fieldErrors.email}>
            <TextInput
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="user@bnhs.edu.ph"
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            error={fieldErrors.password}
            hint="Minimum 8 characters. Share with the user privately."
          >
            <TextInput
              id="password"
              name="password"
              type="password"
              required
              autoComplete="off"
              minLength={8}
            />
          </Field>
        </>
      )}

      <Field label="Role" htmlFor="role" required error={fieldErrors.role}>
        <Select
          id="role"
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </Select>
      </Field>

      {/* Conditional fields based on role */}
      {role === 'student' && (
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Class" htmlFor="classId" error={fieldErrors.classId}>
            <Select
              id="classId"
              name="classId"
              defaultValue={user?.classId ?? ''}
            >
              <option value="">— Unassigned —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Grade {c.gradeLevel} - {c.name} ({c.section})
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Grade level"
            htmlFor="gradeLevel"
            error={fieldErrors.gradeLevel}
          >
            <Select
              id="gradeLevel"
              name="gradeLevel"
              defaultValue={user?.gradeLevel ?? ''}
            >
              <option value="">—</option>
              {[7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Student number"
            htmlFor="studentNumber"
            error={fieldErrors.studentNumber}
          >
            <TextInput
              id="studentNumber"
              name="studentNumber"
              defaultValue={user?.studentNumber}
              placeholder="2025-0001"
            />
          </Field>
        </div>
      )}

      {role === 'faculty' && (
        <Field label="Department" htmlFor="department" error={fieldErrors.department}>
          <TextInput
            id="department"
            name="department"
            defaultValue={user?.department}
            placeholder="e.g. Mathematics"
          />
        </Field>
      )}

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create user'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/users"
      />
    </form>
  );
}
