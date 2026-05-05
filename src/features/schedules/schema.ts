import { z } from 'zod';

export const DAYS_OF_WEEK = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

export const DayOfWeekSchema = z.enum(DAYS_OF_WEEK);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Schedule schema.
 *
 * The on-disk shape (ScheduleSchema) keeps `classId` and `facultyId` as
 * denormalized fields for query performance. But the input shape for
 * createSchedule (CreateScheduleInputSchema) does NOT include them — they
 * are derived from the subject in the service layer.
 *
 * Audit fix A10: this guarantees Schedule.classId always matches
 * Subject.classId and Schedule.facultyId always matches Subject.facultyId.
 * Before, three independent inputs allowed inconsistency.
 */

/** What's stored in Firestore. */
export const ScheduleSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  facultyId: z.string().min(1),
  dayOfWeek: DayOfWeekSchema,
  startTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
  endTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
  room: z.string().max(40).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Input for creating a single schedule. classId/facultyId are derived from
 * the subject — caller does NOT provide them.
 */
export const CreateScheduleInputSchema = z
  .object({
    subjectId: z.string().min(1),
    dayOfWeek: DayOfWeekSchema,
    startTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
    endTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
    room: z.string().max(40).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

/**
 * Input for the repeat-schedule feature (audit fix #5 in brief, our
 * issue A5). Admin selects a subject, time, room ONCE and picks the days
 * — service fans out into N create calls inside a single conflict-aware
 * transaction.
 */
export const CreateScheduleBatchInputSchema = z
  .object({
    subjectId: z.string().min(1),
    daysOfWeek: z.array(DayOfWeekSchema).min(1, 'Select at least one day'),
    startTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
    endTime: z.string().regex(HHMM, 'Use HH:MM (24h)'),
    room: z.string().max(40).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data) => new Set(data.daysOfWeek).size === data.daysOfWeek.length,
    {
      message: 'Day list contains duplicates',
      path: ['daysOfWeek'],
    }
  );

/**
 * Input for updating a schedule. Note: subjectId is intentionally not
 * updatable — if you want a different subject, delete and recreate. Allowing
 * subject change would silently move classId/facultyId, which is too magical.
 */
export const UpdateScheduleInputSchema = z
  .object({
    dayOfWeek: DayOfWeekSchema.optional(),
    startTime: z.string().regex(HHMM, 'Use HH:MM (24h)').optional(),
    endTime: z.string().regex(HHMM, 'Use HH:MM (24h)').optional(),
    room: z.string().max(40).optional(),
  })
  .refine(
    (data) => {
      // If both times are provided, the end-after-start rule applies.
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// Re-export the legacy CreateScheduleSchema for backward compat with code
// that hasn't migrated. New code should use CreateScheduleInputSchema.
export const CreateScheduleSchema = ScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const UpdateScheduleSchema = UpdateScheduleInputSchema;
