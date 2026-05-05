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
 * One scheduled meeting of a subject. Per-meeting docs (Mon Math 8-9 = one
 * doc, Tue Math 8-9 = another) — simple queries, easy holiday handling.
 */
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

export const CreateScheduleSchema = ScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const UpdateScheduleSchema = ScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
