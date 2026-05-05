import "server-only";

import { adminDb } from "@/services/firebase.admin";

/**
 * Centralized collection references. If a collection name ever changes,
 * it changes in exactly one place.
 */
export const collections = {
  events: () => adminDb.collection("events"),
  announcements: () => adminDb.collection("announcements"),
  media: () => adminDb.collection("media"),
  users: () => adminDb.collection("users"),
  classes: () => adminDb.collection("classes"),
  subjects: () => adminDb.collection("subjects"),
  schedules: () => adminDb.collection("schedules"),
} as const;
