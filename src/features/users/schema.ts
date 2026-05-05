import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'faculty', 'student']);

/**
 * Single user document, keyed by Firebase Auth UID.
 *
 * Shape is the same for all roles — role-specific fields are optional and
 * the UI/service layer only reads them when role matches. This avoids the
 * complexity of discriminated unions while keeping queries simple.
 */
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
  role: RoleSchema,
  photoUrl: z.string().url().optional(),

  // Student-only
  classId: z.string().optional(),
  studentNumber: z.string().optional(),
  gradeLevel: z.number().int().min(7).max(12).optional(),

  // Faculty-only
  department: z.string().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for creating a user via admin UI.
 * The uid comes from Firebase Auth (after createUser), not from input.
 */
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(120),
  role: RoleSchema,
  classId: z.string().optional(),
  studentNumber: z.string().optional(),
  gradeLevel: z.number().int().min(7).max(12).optional(),
  department: z.string().optional(),
});

/**
 * Schema for updating an existing user. Email/password not changed here —
 * those go through Firebase Auth admin APIs separately if needed.
 */
export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  role: RoleSchema.optional(),
  classId: z.string().optional().nullable(),
  studentNumber: z.string().optional().nullable(),
  gradeLevel: z.number().int().min(7).max(12).optional().nullable(),
  department: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});
