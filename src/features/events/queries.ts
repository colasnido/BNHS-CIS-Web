import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { collections } from "@/services/firestore";
import type { Event } from "./types";

const EVENT_CATEGORIES = [
  "academic",
  "sports",
  "arts",
  "assembly",
  "community",
  "other",
] as const;

const EVENT_STATUSES = ["draft", "published", "archived"] as const;

function isEventCategory(value: unknown): value is Event["category"] {
  return (
    typeof value === "string" &&
    EVENT_CATEGORIES.includes(value as Event["category"])
  );
}

function isEventStatus(value: unknown): value is Event["status"] {
  return (
    typeof value === "string" &&
    EVENT_STATUSES.includes(value as Event["status"])
  );
}

/**
 * Maps a Firestore document to our Event type. Firestore stores dates as
 * Timestamps; the rest of the app uses ISO strings (serializable across
 * the server/client boundary).
 */
function mapDocToEvent(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot,
): Event {
  const data = doc.data();
  if (!data) {
    throw new Error(`Event document ${doc.id} has no data`);
  }

  const toISO = (v: unknown, fallback?: string): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number") return new Date(v).toISOString();

    if (v && typeof v === "object" && "toDate" in v) {
      const toDate = (v as { toDate?: () => Date }).toDate;
      if (typeof toDate === "function") {
        const date = toDate();
        if (!Number.isNaN(date.getTime())) return date.toISOString();
      }
    }

    if (typeof v === "string") {
      const parsed = new Date(v);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    if (fallback) return fallback;
    throw new Error(`Invalid date field on event ${doc.id}`);
  };

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const rawStartDate = data.startDate ?? data.date;
  const rawEndDate = data.endDate ?? data.date;
  const category = isEventCategory(data.category) ? data.category : "other";
  const status = isEventStatus(data.status) ? data.status : "published";

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    location: data.location,
    startDate: toISO(rawStartDate, createdAt),
    endDate: toISO(rawEndDate, createdAt),
    isAllDay: Boolean(data.isAllDay),
    category,
    status,
    published: Boolean(data.published),
    createdAt,
    updatedAt,
  };
}

/**
 * Get all published events, sorted by start date.
 *
 * NOTE: Avoids composite index requirement by:
 * 1. Filtering in the query (published == true)
 * 2. Sorting in memory (no orderBy in the query itself)
 *
 * This works fine for small datasets (<1000 events).
 * If you later have thousands of events, you'll want:
 * - A composite index on (published, startDate)
 * - Then you can move the .orderBy() back into the query
 */
export async function getAllEvents(): Promise<Event[]> {
  const snapshot = await collections
    .events()
    .where("published", "==", true)
    .get();

  const events = snapshot.docs.map(mapDocToEvent);

  // Sort in memory instead of in the query
  return events.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export async function getEventById(id: string): Promise<Event | null> {
  const doc = await collections.events().doc(id).get();
  if (!doc.exists) return null;
  return mapDocToEvent(doc);
}

/**
 * Get upcoming events (endDate >= now), sorted by end date.
 *
 * Like getAllEvents(), this sorts in memory to avoid needing a composite index.
 */
export async function getUpcomingEvents(limit = 3): Promise<Event[]> {
  const now = Timestamp.now();
  const snapshot = await collections
    .events()
    .where("published", "==", true)
    .where("endDate", ">=", now)
    .get();

  const events = snapshot.docs.map(mapDocToEvent);

  return events
    .sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    )
    .slice(0, limit);
}
