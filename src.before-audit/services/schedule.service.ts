import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  DayOfWeekSchema,
  DAYS_OF_WEEK,
} from '@/features/schedules/schema';
import type { Schedule, DayOfWeek } from '@/features/schedules/types';

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot
): Schedule {
  const data = doc.data();
  if (!data) throw new Error(`Schedule ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const dayOfWeek: DayOfWeek = DayOfWeekSchema.safeParse(data.dayOfWeek).success
    ? (data.dayOfWeek as DayOfWeek)
    : 'mon';

  return {
    id: doc.id,
    subjectId: data.subjectId ?? '',
    classId: data.classId ?? '',
    facultyId: data.facultyId ?? '',
    dayOfWeek,
    startTime: data.startTime ?? '00:00',
    endTime: data.endTime ?? '00:00',
    room: typeof data.room === 'string' ? data.room : undefined,
    createdAt,
    updatedAt,
  };
}

/** Sort by day-of-week then start time. */
function sortSchedules(items: Schedule[]): Schedule[] {
  return [...items].sort((a, b) => {
    const dayDiff =
      DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function listSchedules(): Promise<Schedule[]> {
  try {
    const snapshot = await collections.schedules().get();
    return sortSchedules(snapshot.docs.map(fromFirestore));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function getSchedule(id: string): Promise<Schedule | null> {
  try {
    const doc = await collections.schedules().doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function listSchedulesByClass(classId: string): Promise<Schedule[]> {
  try {
    const snapshot = await collections
      .schedules()
      .where('classId', '==', classId)
      .get();
    return sortSchedules(snapshot.docs.map(fromFirestore));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function listSchedulesByFaculty(facultyId: string): Promise<Schedule[]> {
  try {
    const snapshot = await collections
      .schedules()
      .where('facultyId', '==', facultyId)
      .get();
    return sortSchedules(snapshot.docs.map(fromFirestore));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function createSchedule(input: unknown): Promise<Schedule> {
  const parsed = CreateScheduleSchema.parse(input);
  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    subjectId: parsed.subjectId,
    classId: parsed.classId,
    facultyId: parsed.facultyId,
    dayOfWeek: parsed.dayOfWeek,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    createdAt: now,
    updatedAt: now,
  };
  if (parsed.room) docData.room = parsed.room;

  const ref = await collections.schedules().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

export async function updateSchedule(
  id: string,
  input: unknown
): Promise<Schedule> {
  const parsed = UpdateScheduleSchema.parse(input);
  const updates = buildUpdate(parsed);
  await collections.schedules().doc(id).update(updates);
  const updated = await collections.schedules().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteSchedule(id: string): Promise<void> {
  await collections.schedules().doc(id).delete();
}
