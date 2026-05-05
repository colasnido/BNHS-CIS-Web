import type { z } from 'zod';
import type { ClassSchema, CreateClassSchema, UpdateClassSchema } from './schema';

export type ClassRecord = z.infer<typeof ClassSchema>;
export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;
