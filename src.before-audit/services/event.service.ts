import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { CreateEventSchema } from '@/features/events/schema';
import type { Event, CreateEventInput } from '@/features/events/types';

/**
 * Event service. The ONLY place that reads/writes the events collection.
 *
 * Pages and API routes call these functions — they never call Firestore directly.
 * This boundary makes it easy to:
 *   - Add caching, logging, or analytics in one place
 *   - Swap data sources without touching UI
 *   - Test data logic in isolation
 */

const COLLECTION = 'events';

const EVENT_CATEGORIES = [
  'academic',
  'sports',
  'arts',
  'assembly',
  'community',
  'other',
] as const;

const EVENT_STATUSES = ['draft', 'published', 'archived'] as const;

function isEventCategory(value: unknown): value is Event['category'] {
  return (
    typeof value === 'string' &&
    EVENT_CATEGORIES.includes(value as Event['category'])
  );
}

function isEventStatus(value: unknown): value is Event['status'] {
  return (
    typeof value === 'string' &&
    EVENT_STATUSES.includes(value as Event['status'])
  );
}

/**
 * Convert Firestore document → Event type (ISO date strings).
 * Keeps the rest of the app free of Firestore-specific types.
 */
function fromFirestore(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
): Event {
  const data = doc.data();
  if (!data) throw new Error(`Event ${doc.id} has no data`);

  const toISO = (v: unknown, fallback?: string): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();

    if (v && typeof v === 'object' && 'toDate' in v) {
      const toDate = (v as { toDate?: () => Date }).toDate;
      if (typeof toDate === 'function') {
        const date = toDate();
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
    }

    if (typeof v === 'string') {
      const parsed = new Date(v);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    return fallback ?? new Date().toISOString();
  };

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const rawStartDate = data.startDate ?? data.date;
  const rawEndDate = data.endDate ?? data.date;
  const startDate = toISO(rawStartDate, createdAt);
  const endDate = toISO(rawEndDate, startDate);
  const category = isEventCategory(data.category) ? data.category : 'other';
  const status = isEventStatus(data.status) ? data.status : 'published';
  const location =
    typeof data.location === 'string' && data.location.trim()
      ? data.location
      : 'TBA';

  return {
    id: doc.id,
    title: data.title ?? '',
    description: data.description ?? '',
    location,
    startDate,
    endDate,
    isAllDay: Boolean(data.isAllDay),
    category,
    status,
    published: Boolean(data.published),
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    createdAt,
    updatedAt,
  };
}

/**
 * Get all events, sorted by date (soonest first).
 * Sorts in memory to avoid composite index requirements.
 */
export async function listEvents(): Promise<Event[]> {
  try {
    const snapshot = await collections
      .events()
      .where('published', '==', true)
      .get();
    const events = snapshot.docs.map(fromFirestore);
    return events.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  } catch (error) {
    const err = error as { code?: number; message?: string };
    // Collection doesn't exist yet — return empty array
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      console.warn(`[listEvents] "${COLLECTION}" collection is empty or missing.`);
      return [];
    }
    throw error;
  }
}

/**
 * Get a single event by ID. Returns null if not found.
 */
export async function getEvent(id: string): Promise<Event | null> {
  try {
    const doc = await collections.events().doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    const err = error as { code?: number };
    if (err.code === 5) return null;
    throw error;
  }
}

/**
 * Get upcoming events (endDate >= now).
 */
export async function listUpcomingEvents(limit = 3): Promise<Event[]> {
  const now = Timestamp.now();
  const snapshot = await collections
    .events()
    .where('published', '==', true)
    .where('endDate', '>=', now)
    .get();

  const events = snapshot.docs.map(fromFirestore);

  return events
    .sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, limit);
}

/**
 * Create an event. Validates with Zod before writing.
 * Throws ZodError on invalid input.
 */
export async function createEvent(input: unknown): Promise<Event> {
  const parsed = CreateEventSchema.parse(input);

  const now = Timestamp.now();
  const docData = {
    title: parsed.title,
    description: parsed.description,
    location: parsed.location,
    startDate: Timestamp.fromDate(new Date(parsed.startDate)),
    endDate: Timestamp.fromDate(new Date(parsed.endDate)),
    isAllDay: parsed.isAllDay,
    category: parsed.category,
    status: parsed.status,
    published: parsed.published,
    imageUrl: parsed.imageUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await collections.events().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

/**
 * Update an event. Only provided fields are touched.
 */
export async function updateEvent(
  id: string,
  input: Partial<CreateEventInput>
): Promise<Event> {
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.location !== undefined) updates.location = input.location;
  if (input.startDate !== undefined) {
    updates.startDate = Timestamp.fromDate(new Date(input.startDate));
  }
  if (input.endDate !== undefined) {
    updates.endDate = Timestamp.fromDate(new Date(input.endDate));
  }
  if (input.isAllDay !== undefined) updates.isAllDay = input.isAllDay;
  if (input.category !== undefined) updates.category = input.category;
  if (input.status !== undefined) updates.status = input.status;
  if (input.published !== undefined) updates.published = input.published;
  if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;

  await collections.events().doc(id).update(updates);
  const updated = await collections.events().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteEvent(id: string): Promise<void> {
  await collections.events().doc(id).delete();
}
