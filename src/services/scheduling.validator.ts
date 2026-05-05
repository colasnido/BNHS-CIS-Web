import 'server-only';

import type { Schedule, DayOfWeek } from '@/features/schedules/types';

/**
 * Schedule conflict validator.
 *
 * Pure, stateless. Called by:
 *   - createSchedule (single row from form/API)
 *   - updateSchedule (single row, with ignoreId)
 *   - schedules import API (each row, against working set + previously
 *     accepted rows of same import)
 *
 * Why pure: conflict detection has to be testable in isolation. A bug here
 * means double-booked teachers in production, so "deterministic given inputs"
 * is non-negotiable.
 */

/** Information about one specific way a schedule conflicts with another. */
export interface ConflictDetail {
  kind:
    | 'teacher_busy' // same facultyId, overlapping time
    | 'class_busy' // same classId, overlapping time (= student overlap)
    | 'room_busy' // same room, overlapping time
    | 'subject_duplicated'; // same subject for same class on same day
  conflictingScheduleId: string;
  /** Human-readable description for error messages. */
  message: string;
}

/**
 * The minimum input needed to check for conflicts. `room` is already
 * normalized by the caller (or undefined).
 */
export interface CandidateSchedule {
  subjectId: string;
  classId: string;
  facultyId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM, normalized
  endTime: string; // HH:MM, normalized
  room?: string; // already normalized
}

/**
 * Half-open interval overlap: [aStart, aEnd) intersects [bStart, bEnd).
 *
 * Why half-open: a class ending at 09:00 and another starting at 09:00
 * should NOT conflict — that's just back-to-back periods. Closed intervals
 * would treat that as a 1-minute overlap.
 *
 * String comparison is safe here because HH:MM with leading-zero padding
 * is lexicographically ordered ("08:30" < "09:00" by character). The
 * normalizer enforces leading-zero, so we don't need to parse to numbers.
 */
export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Detect every conflict between a candidate schedule and an existing list.
 *
 * Returns an empty array if no conflict. Returns ALL conflicts (not just the
 * first) so the UI can show "this slot conflicts on three counts: teacher
 * busy, room busy, class busy" in one go instead of iterating fix-then-retry.
 *
 * @param candidate - The schedule we're trying to write
 * @param existing - All existing schedules to check against
 * @param ignoreId - When updating, exclude the row being edited (don't
 *                   conflict with yourself)
 */
export function detectConflicts(
  candidate: CandidateSchedule,
  existing: readonly Schedule[],
  ignoreId?: string
): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];

  for (const s of existing) {
    if (s.id === ignoreId) continue;
    if (s.dayOfWeek !== candidate.dayOfWeek) continue;

    const overlap = intervalsOverlap(
      candidate.startTime,
      candidate.endTime,
      s.startTime,
      s.endTime
    );

    // Subject duplicated for same class on same day — checked even if times
    // don't overlap, because (per #4 in brief) we block ALL same-day duplicates
    // for the same class+subject pair, not just overlapping ones.
    if (s.subjectId === candidate.subjectId && s.classId === candidate.classId) {
      conflicts.push({
        kind: 'subject_duplicated',
        conflictingScheduleId: s.id,
        message: `This subject is already scheduled for this class on ${candidate.dayOfWeek}`,
      });
    }

    // The remaining checks all require time overlap.
    if (!overlap) continue;

    if (s.facultyId === candidate.facultyId) {
      conflicts.push({
        kind: 'teacher_busy',
        conflictingScheduleId: s.id,
        message: `Teacher is already scheduled ${s.startTime}–${s.endTime} on ${candidate.dayOfWeek}`,
      });
    }

    if (s.classId === candidate.classId) {
      conflicts.push({
        kind: 'class_busy',
        conflictingScheduleId: s.id,
        message: `Class already has another subject ${s.startTime}–${s.endTime} on ${candidate.dayOfWeek}`,
      });
    }

    if (candidate.room && s.room && s.room === candidate.room) {
      conflicts.push({
        kind: 'room_busy',
        conflictingScheduleId: s.id,
        message: `Room "${candidate.room}" is occupied ${s.startTime}–${s.endTime} on ${candidate.dayOfWeek}`,
      });
    }
  }

  return conflicts;
}

/**
 * Custom error thrown by service-layer schedule operations when conflicts
 * are detected. API routes catch this specifically and return HTTP 409.
 */
export class ScheduleConflictError extends Error {
  readonly conflicts: ConflictDetail[];

  constructor(conflicts: ConflictDetail[]) {
    const summary = conflicts.map((c) => c.message).join('; ');
    super(`Schedule conflict: ${summary}`);
    this.name = 'ScheduleConflictError';
    this.conflicts = conflicts;
  }
}

/**
 * Helper: assert no conflicts, throw if any. The "right" way to call this
 * from a service function — never silently ignore a conflict result.
 */
export function assertNoScheduleConflict(
  candidate: CandidateSchedule,
  existing: readonly Schedule[],
  ignoreId?: string
): void {
  const conflicts = detectConflicts(candidate, existing, ignoreId);
  if (conflicts.length > 0) {
    throw new ScheduleConflictError(conflicts);
  }
}
