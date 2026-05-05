import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { CreateAnnouncementSchema } from '@/features/announcements/schema';
import type {
  Announcement,
  CreateAnnouncementInput,
} from '@/features/announcements/types';

const ANNOUNCEMENT_PRIORITIES = ['low', 'medium', 'high'] as const;

function isPriority(value: unknown): value is Announcement['priority'] {
  return (
    typeof value === 'string' &&
    ANNOUNCEMENT_PRIORITIES.includes(value as Announcement['priority'])
  );
}

function toISO(value: unknown, fallback?: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();

  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') {
      const date = toDate();
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return fallback ?? new Date().toISOString();
}

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot
): Announcement {
  const data = doc.data();
  if (!data) throw new Error(`Announcement ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const priority = isPriority(data.priority) ? data.priority : 'medium';
  const title = typeof data.title === 'string' ? data.title : 'Untitled announcement';
  const summary =
    typeof data.summary === 'string'
      ? data.summary
      : typeof data.description === 'string'
        ? data.description
        : '';

  return {
    id: doc.id,
    title,
    summary,
    priority,
    published: Boolean(data.published),
    linkUrl: typeof data.linkUrl === 'string' ? data.linkUrl : undefined,
    createdAt,
    updatedAt,
  };
}

export async function listAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await collections
      .announcements()
      .where('published', '==', true)
      .get();

    const announcements = snapshot.docs.map(fromFirestore);
    return announcements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    const err = error as { code?: number; message?: string };
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      console.warn('[listAnnouncements] "announcements" collection is empty or missing.');
      return [];
    }
    throw error;
  }
}

export async function listRecentAnnouncements(limit = 3): Promise<Announcement[]> {
  const all = await listAnnouncements();
  return all.slice(0, limit);
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    const doc = await collections.announcements().doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    const err = error as { code?: number };
    if (err.code === 5) return null;
    throw error;
  }
}

export async function createAnnouncement(input: unknown): Promise<Announcement> {
  const parsed = CreateAnnouncementSchema.parse(input);

  const now = Timestamp.now();
  const docData = {
    title: parsed.title,
    summary: parsed.summary,
    priority: parsed.priority,
    published: parsed.published,
    linkUrl: parsed.linkUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await collections.announcements().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

export async function updateAnnouncement(
  id: string,
  input: Partial<CreateAnnouncementInput>
): Promise<Announcement> {
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (input.title !== undefined) updates.title = input.title;
  if (input.summary !== undefined) updates.summary = input.summary;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.published !== undefined) updates.published = input.published;
  if (input.linkUrl !== undefined) updates.linkUrl = input.linkUrl;

  await collections.announcements().doc(id).update(updates);
  const updated = await collections.announcements().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await collections.announcements().doc(id).delete();
}
