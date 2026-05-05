import type { z } from 'zod';
import type {
  ScheduleSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  DayOfWeekSchema,
} from './schema';

export type Schedule = z.infer<typeof ScheduleSchema>;
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
