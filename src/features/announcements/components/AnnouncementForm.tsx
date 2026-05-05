'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  FormActions,
  FormErrorBanner,
} from '@/components/dashboard/Field';
import type { Announcement } from '@/features/announcements/types';

interface AnnouncementFormProps {
  announcement?: Announcement;
}

const PRIORITIES = ['low', 'medium', 'high'] as const;

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const isEdit = Boolean(announcement);
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
      title: String(formData.get('title') ?? '').trim(),
      summary: String(formData.get('summary') ?? '').trim(),
      priority: String(formData.get('priority')),
      published: formData.get('published') === 'on',
      linkUrl: String(formData.get('linkUrl') ?? '').trim() || undefined,
    };

    try {
      const endpoint = isEdit
        ? `/api/announcements/${announcement!.id}`
        : '/api/announcements';
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

      router.push('/dashboard/admin/announcements');
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormErrorBanner error={formError} />

      <Field label="Title" htmlFor="title" required error={fieldErrors.title}>
        <TextInput
          id="title"
          name="title"
          required
          defaultValue={announcement?.title}
          placeholder="e.g. Schedule adjustment for graduating students"
        />
      </Field>

      <Field
        label="Summary"
        htmlFor="summary"
        required
        error={fieldErrors.summary}
        hint="Keep it concise — this shows on the public announcements page."
      >
        <TextArea
          id="summary"
          name="summary"
          rows={5}
          required
          defaultValue={announcement?.summary}
          placeholder="Briefly describe the announcement."
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Priority"
          htmlFor="priority"
          required
          error={fieldErrors.priority}
        >
          <Select
            id="priority"
            name="priority"
            required
            defaultValue={announcement?.priority ?? 'medium'}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Link URL"
          htmlFor="linkUrl"
          hint="Optional. Where 'Read more' should go."
          error={fieldErrors.linkUrl}
        >
          <TextInput
            id="linkUrl"
            name="linkUrl"
            type="url"
            defaultValue={announcement?.linkUrl}
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <Checkbox
          id="published"
          name="published"
          label="Visible on the public site"
          defaultChecked={announcement?.published ?? true}
        />
      </div>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create announcement'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/announcements"
      />
    </form>
  );
}
