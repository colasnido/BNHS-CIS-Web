import { z } from 'zod';

export const ClassSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80), // e.g. "St. Augustine"
  gradeLevel: z.number().int().min(7).max(12),
  section: z.string().min(1).max(40), // e.g. "A", "Diamond"
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  adviserId: z.string().optional(), // FK → users (faculty)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateClassSchema = ClassSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateClassSchema = CreateClassSchema.partial();
