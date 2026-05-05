import { z } from 'zod';

export const SubjectSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2).max(20), // e.g. "MATH-11"
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  classId: z.string().min(1),
  facultyId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateSubjectSchema = SubjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();
