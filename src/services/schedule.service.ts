import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import {
  CreateScheduleInputSchema,
  CreateScheduleBatchInputSchema,
  UpdateScheduleInputSchema,
  DayOfWeekSchema,
  DAYS_OF_WEEK,
} from '@/features/schedules/schema';
import type { Schedule, DayOfWeek } from '@/features/schedules/types';
import { getSubject } from '@/services/subject.service';
import {
  assertNoScheduleConflict,
  detectConflicts,
  ScheduleConflictError,
  type CandidateSchedule,
} from '@/services/scheduling.validator';
import { normalizeRoomLabel, normalizeTime24 } from '@/lib/normalize';

/**
 * Schedule service.
 *
 * Audit fixes applied:
 *   - #2 (conflict detection): every create/update runs assertNoScheduleConflict
 *   - #4 (subject overload): same subject on same day for same class → blocked
 *   - #5 (repeat schedule): createScheduleBatch creates N rows atomically
 *   - A1 (normalization): room and time normalized at write
 *   - A10 (consistency): classId/facultyId derived from subject, never accepted from caller
 */

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

function sortSchedules(items: Schedule[]): Schedule[] {
  return [...items].sort((a, b) => {
    const dayDiff =
      DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

// ---------------------------------------------------------------------------
// Read paths
// ---------------------------------------------------------------------------

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

/**
 * Read all schedules for a single weekday. Used by the conflict checker —
 * cross-day conflicts are impossible, so we skip ~85% of the data.
 */
export async function listSchedulesByDay(
  dayOfWeek: DayOfWeek
): Promise<Schedule[]> {
  try {
    const snapshot = await collections
      .schedules()
      .where('dayOfWeek', '==', dayOfWeek)
      .get();
    return sortSchedules(snapshot.docs.map(fromFirestore));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Write paths
// ---------------------------------------------------------------------------

/**
 * Build a normalized + validated CandidateSchedule from raw single-row input.
 * Shared by createSchedule and createScheduleBatch.
 *
 * Throws if normalization fails (bad time format), if input fails schema
 * validation, or if the referenced subject doesn't exist.
 */
async function buildCandidate(
  rawInput: unknown
): Promise<{ candidate: CandidateSchedule; subjectId: string }> {
  // Normalize time and room first. Time normalization throws on invalid
  // input, which gives a clearer error than the schema's regex failure.
  const normalized = normalizeScheduleInput(rawInput);
  const parsed = CreateScheduleInputSchema.parse(normalized);

  const subject = await getSubject(parsed.subjectId);
  if (!subject) {
    throw new Error(`Subject with id "${parsed.subjectId}" does not exist`);
  }

  const candidate: CandidateSchedule = {
    subjectId: subject.id,
    classId: subject.classId,
    facultyId: subject.facultyId,
    dayOfWeek: parsed.dayOfWeek,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    room: parsed.room,
  };

  return { candidate, subjectId: subject.id };
}

/**
 * Create a single schedule row.
 *
 * The caller passes only `{ subjectId, dayOfWeek, startTime, endTime, room? }`.
 * We derive classId and facultyId from the subject doc — they are not
 * accepted from the caller (audit A10).
 */
export async function createSchedule(input: unknown): Promise<Schedule> {
  const { candidate } = await buildCandidate(input);

  // Read only same-day schedules — cross-day conflicts can't exist.
  const existingSameDay = await listSchedulesByDay(candidate.dayOfWeek);
  assertNoScheduleConflict(candidate, existingSameDay);

  return persistSchedule(candidate);
}

/**
 * Create multiple schedule rows in one shot — the "repeat schedule" feature.
 *
 * Atomicity guarantee: if ANY row would conflict, the WHOLE batch is rejected.
 * This matches user expectation ("I want Math on Mon/Wed/Fri at 8 AM, please")
 * — partial success would leave the schedule in a confusing half-applied state.
 *
 * Conflict checking includes intra-batch conflicts. If admin asks for the same
 * subject on Monday twice (same time), one of the days will be flagged.
 */
export async function createScheduleBatch(
  input: unknown
): Promise<Schedule[]> {
  const normalized = normalizeBatchScheduleInput(input);
  const parsed = CreateScheduleBatchInputSchema.parse(normalized);

  const subject = await getSubject(parsed.subjectId);
  if (!subject) {
    throw new Error(`Subject with id "${parsed.subjectId}" does not exist`);
  }

  // Build candidates for each requested day.
  const candidates: CandidateSchedule[] = parsed.daysOfWeek.map((day) => ({
    subjectId: subject.id,
    classId: subject.classId,
    facultyId: subject.facultyId,
    dayOfWeek: day,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    room: parsed.room,
  }));

  // Group existing schedules by day for efficient lookup. We could fetch
  // each day separately, but a single full read is simpler and our schedule
  // collection size is bounded by ~weekly slots × classes (<5k rows even
  // for a large school).
  const allExisting = await listSchedules();
  const existingByDay = new Map<DayOfWeek, Schedule[]>();
  for (const s of allExisting) {
    const list = existingByDay.get(s.dayOfWeek) ?? [];
    list.push(s);
    existingByDay.set(s.dayOfWeek, list);
  }

  // Check each candidate against existing AND against earlier candidates in
  // this same batch (intra-batch). Build accepted list as we go.
  const accepted: CandidateSchedule[] = [];
  const allConflicts: { day: DayOfWeek; conflicts: ReturnType<typeof detectConflicts> }[] =
    [];

  for (const c of candidates) {
    const sameDayExisting = existingByDay.get(c.dayOfWeek) ?? [];
    // Intra-batch: convert previously-accepted candidates to Schedule-shape
    // for the conflict checker. We use placeholder ids that won't collide
    // with real Firestore IDs.
    const intraBatch: Schedule[] = accepted
      .filter((a) => a.dayOfWeek === c.dayOfWeek)
      .map((a, i) => ({
        ...a,
        id: `__pending_${i}`,
        room: a.room,
        createdAt: '',
        updatedAt: '',
      }));
    const fullExisting = [...sameDayExisting, ...intraBatch];
    const conflicts = detectConflicts(c, fullExisting);
    if (conflicts.length > 0) {
      allConflicts.push({ day: c.dayOfWeek, conflicts });
      // Don't add to accepted — but keep checking other days so we report
      // ALL conflicts in one shot, not just the first.
    } else {
      accepted.push(c);
    }
  }

  if (allConflicts.length > 0) {
    // Flatten and surface all conflicts. Each conflict already has a day
    // baked into its message (via intervalsOverlap context), but we wrap with
    // the candidate's day for clarity.
    const flat = allConflicts.flatMap((bucket) =>
      bucket.conflicts.map((c) => ({
        ...c,
        message: `[${bucket.day}] ${c.message}`,
      }))
    );
    throw new ScheduleConflictError(flat);
  }

  // Persist everything. We use a Firestore batch for atomicity at the DB
  // level too — though by this point we've already proven there are no
  // conflicts, so the real win here is one round-trip vs N.
  return persistScheduleBatch(accepted);
}

/**
 * Update an existing schedule.
 *
 * What's editable: dayOfWeek, startTime, endTime, room. NOT subjectId — see
 * UpdateScheduleInputSchema rationale. If admin needs a different subject,
 * delete and recreate.
 *
 * Conflict checking: re-fetch same-day existing schedules for the NEW day
 * (or current day if dayOfWeek isn't changing), exclude this row's id, run
 * conflict detection against the would-be-merged record.
 */
export async function updateSchedule(
  id: string,
  input: unknown
): Promise<Schedule> {
  const normalized = normalizeScheduleInput(input);
  const parsed = UpdateScheduleInputSchema.parse(normalized);

  const current = await getSchedule(id);
  if (!current) throw new Error(`Schedule ${id} not found`);

  // Apply the update to a copy and check conflicts on the merged result.
  const merged: CandidateSchedule = {
    subjectId: current.subjectId,
    classId: current.classId,
    facultyId: current.facultyId,
    dayOfWeek: parsed.dayOfWeek ?? current.dayOfWeek,
    startTime: parsed.startTime ?? current.startTime,
    endTime: parsed.endTime ?? current.endTime,
    // For room: allow explicit clear via empty string → undefined. If the
    // field is in `parsed` at all, that's the new value (including empty).
    room: 'room' in parsed
      ? parsed.room === '' || parsed.room === undefined
        ? undefined
        : parsed.room
      : current.room,
  };

  // Re-validate end-after-start on merged values, since each side may come
  // from a different source (current vs parsed).
  if (merged.startTime >= merged.endTime) {
    throw new Error('End time must be after start time');
  }

  const existingSameDay = await listSchedulesByDay(merged.dayOfWeek);
  assertNoScheduleConflict(merged, existingSameDay, id);

  // Build the actual Firestore update payload. We update only fields the
  // caller provided, plus handle room-clearing.
  const updates = buildUpdate({
    dayOfWeek: parsed.dayOfWeek,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    room: 'room' in parsed ? parsed.room : undefined,
  });

  await collections.schedules().doc(id).update(updates);
  const updated = await collections.schedules().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteSchedule(id: string): Promise<void> {
  await collections.schedules().doc(id).delete();
}

// ---------------------------------------------------------------------------
// Internal persistence
// ---------------------------------------------------------------------------

async function persistSchedule(c: CandidateSchedule): Promise<Schedule> {
  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    subjectId: c.subjectId,
    classId: c.classId,
    facultyId: c.facultyId,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    createdAt: now,
    updatedAt: now,
  };
  if (c.room) docData.room = c.room;

  const ref = await collections.schedules().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

async function persistScheduleBatch(
  candidates: CandidateSchedule[]
): Promise<Schedule[]> {
  if (candidates.length === 0) return [];

  // Use Firestore batch for atomicity — either all rows are created or none
  // (in case of mid-write Firestore failure).
  const db = collections.schedules().firestore;
  const batch = db.batch();
  const now = Timestamp.now();
  const refs: FirebaseFirestore.DocumentReference[] = [];

  for (const c of candidates) {
    const ref = collections.schedules().doc();
    refs.push(ref);
    const docData: Record<string, unknown> = {
      subjectId: c.subjectId,
      classId: c.classId,
      facultyId: c.facultyId,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      createdAt: now,
      updatedAt: now,
    };
    if (c.room) docData.room = c.room;
    batch.set(ref, docData);
  }

  await batch.commit();

  // Read back what we just wrote. We could construct Schedule objects from
  // the candidates + refs, but reading guarantees the timestamps are real.
  const reads = await Promise.all(refs.map((r) => r.get()));
  return reads.map(fromFirestore);
}

// ---------------------------------------------------------------------------
// Normalization helpers — local because they handle input shape, not the
// general string normalization which is in lib/normalize.ts
// ---------------------------------------------------------------------------

function normalizeScheduleInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };

  if (typeof obj.startTime === 'string') {
    try {
      out.startTime = normalizeTime24(obj.startTime);
    } catch {
      // Leave for schema to reject with a clear regex error.
      out.startTime = obj.startTime;
    }
  }
  if (typeof obj.endTime === 'string') {
    try {
      out.endTime = normalizeTime24(obj.endTime);
    } catch {
      out.endTime = obj.endTime;
    }
  }
  if (typeof obj.room === 'string') {
    const cleaned = normalizeRoomLabel(obj.room);
    if (cleaned === '') {
      // Empty room → drop. Optional field; presence with empty string is
      // semantically the same as absence.
      delete out.room;
    } else {
      out.room = cleaned;
    }
  }
  return out;
}

function normalizeBatchScheduleInput(input: unknown): unknown {
  // Same as single, plus the daysOfWeek field is left alone (Zod handles enum
  // validation per element).
  return normalizeScheduleInput(input);
}
