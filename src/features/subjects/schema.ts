import { z } from 'zod';

/**
 * Subject schema.
 *
 * Audit fix #5: `code` field has been removed.
 *
 * Why: code was admin-typed, never enforced unique, and existed solely so
 * the schedule CSV could reference subjects by a short token. Now that the
 * CSV references by `(name, class_section)` instead — which is unique within
 * a class — code adds no value and creates a normalization problem
 * ("MATH-7" vs "math-7" vs "Math 7").
 *
 * The Subject schema enforces uniqueness of `(name, classId)` at the service
 * layer (see subject.service.ts createSubject).
 *
 * Legacy data: existing Firestore docs may have a `code` field. Reads ignore
 * it (Zod with `.passthrough()` would keep it; we omit `passthrough` so it
 * silently drops on parse — which is fine since nothing reads it). To clean
 * up: see migration note in INSTALL.md.
 */

export const SubjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  classId: z.string().min(1),
  facultyId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Input for createSubject. Note: still accepts the same set minus the
 * derived/timestamp fields. classId and facultyId remain required because
 * the Subject is the source of truth for that pairing — Schedule will
 * derive its values from Subject.
 */
export const CreateSubjectSchema = SubjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

export type Subject = z.infer<typeof SubjectSchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
