import type { z } from 'zod';
import type {
  SubjectSchema,
  CreateSubjectSchema,
  UpdateSubjectSchema,
} from './schema';

export type Subject = z.infer<typeof SubjectSchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
