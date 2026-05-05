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
import type { Event, CreateEventInput } from '@/features/events/types';

interface EventFormProps {
  /** If provided, form is in edit mode */
  event?: Event;
}

const CATEGORIES: ReadonlyArray<CreateEventInput['category']> = [
  'academic',
  'sports',
  'arts',
  'assembly',
  'community',
  'other',
];

const STATUSES: ReadonlyArray<CreateEventInput['status']> = [
  'draft',
  'published',
  'archived',
];

/** Convert ISO → datetime-local input value (YYYY-MM-DDTHH:MM in local TZ). */
function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const isEdit = Boolean(event);
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
      description: String(formData.get('description') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim(),
      startDate: new Date(String(formData.get('startDate'))).toISOString(),
      endDate: new Date(String(formData.get('endDate'))).toISOString(),
      isAllDay: formData.get('isAllDay') === 'on',
      category: String(formData.get('category')),
      status: String(formData.get('status')),
      published: formData.get('published') === 'on',
      imageUrl: String(formData.get('imageUrl') ?? '').trim() || undefined,
    };

    try {
      const endpoint = isEdit ? `/api/events/${event!.id}` : '/api/events';
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

      router.push('/dashboard/admin/events');
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
        label="Title"
        htmlFor="title"
        required
        error={fieldErrors.title}
      >
        <TextInput
          id="title"
          name="title"
          required
          defaultValue={event?.title}
          placeholder="e.g. Founders Day Celebration"
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        required
        error={fieldErrors.description}
      >
        <TextArea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={event?.description}
          placeholder="Describe what's happening at this event."
        />
      </Field>

      <Field
        label="Location"
        htmlFor="location"
        required
        error={fieldErrors.location}
      >
        <TextInput
          id="location"
          name="location"
          required
          defaultValue={event?.location}
          placeholder="e.g. Main Auditorium"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Start date & time"
          htmlFor="startDate"
          required
          error={fieldErrors.startDate}
        >
          <TextInput
            id="startDate"
            name="startDate"
            type="datetime-local"
            required
            defaultValue={
              event ? toLocalDateTimeInput(event.startDate) : undefined
            }
          />
        </Field>

        <Field
          label="End date & time"
          htmlFor="endDate"
          required
          error={fieldErrors.endDate}
        >
          <TextInput
            id="endDate"
            name="endDate"
            type="datetime-local"
            required
            defaultValue={event ? toLocalDateTimeInput(event.endDate) : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Category"
          htmlFor="category"
          required
          error={fieldErrors.category}
        >
          <Select
            id="category"
            name="category"
            required
            defaultValue={event?.category ?? 'other'}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Status"
          htmlFor="status"
          required
          error={fieldErrors.status}
        >
          <Select
            id="status"
            name="status"
            required
            defaultValue={event?.status ?? 'published'}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Image URL"
        htmlFor="imageUrl"
        hint="Optional. Use a Firebase Storage URL or an absolute https URL."
        error={fieldErrors.imageUrl}
      >
        <TextInput
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={event?.imageUrl}
          placeholder="https://..."
        />
      </Field>

      <div className="space-y-3 border-t border-slate-200 pt-6">
        <Checkbox
          id="isAllDay"
          name="isAllDay"
          label="All-day event"
          defaultChecked={event?.isAllDay ?? false}
        />
        <Checkbox
          id="published"
          name="published"
          label="Visible on the public site"
          defaultChecked={event?.published ?? true}
        />
      </div>

      <FormActions
        submitLabel={isEdit ? 'Save changes' : 'Create event'}
        isSubmitting={isSubmitting}
        cancelHref="/dashboard/admin/events"
      />
    </form>
  );
}
