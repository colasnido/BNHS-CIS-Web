import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'faculty', 'student']);

/**
 * Student LRN — Learner Reference Number, exactly 12 digits.
 * Used as the login identifier for students (not email).
 */
export const StudentNumberSchema = z
  .string()
  .regex(/^\d{12}$/, 'Student number must be exactly 12 digits (LRN)');

/**
 * Password requirements for new passwords AND password changes:
 * minimum 8 characters, must contain at least one letter and one number.
 * Symbols allowed but not required.
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

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

  /**
   * If true, this user MUST change their password before they can access
   * the rest of the app. Set to true on initial creation by admin (for
   * student/faculty roles), cleared when the user successfully changes
   * their password via /change-password.
   *
   * Defaults to false for grandfathered accounts created before this field
   * existed — they continue to work without forced change.
   */
  mustChangePassword: z.boolean().default(false),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Create-user input. Discriminated by role so we can require different
 * fields per role at the type level.
 *
 * - Student: studentNumber required (used to derive synthetic email),
 *   email NOT accepted (always derived); password set by admin.
 * - Faculty: email required; password set by admin.
 * - Admin: email required; password set by admin (rarely used — admins
 *   are usually bootstrapped via Firebase Console).
 */
const CreateStudentSchema = z.object({
  role: z.literal('student'),
  studentNumber: StudentNumberSchema,
  password: PasswordSchema,
  displayName: z.string().min(1).max(120),
  classId: z.string().optional(),
  gradeLevel: z.number().int().min(7).max(12).optional(),
});

const CreateFacultySchema = z.object({
  role: z.literal('faculty'),
  email: z.string().email(),
  password: PasswordSchema,
  displayName: z.string().min(1).max(120),
  department: z.string().optional(),
});

const CreateAdminSchema = z.object({
  role: z.literal('admin'),
  email: z.string().email(),
  password: PasswordSchema,
  displayName: z.string().min(1).max(120),
});

export const CreateUserSchema = z.discriminatedUnion('role', [
  CreateStudentSchema,
  CreateFacultySchema,
  CreateAdminSchema,
]);

/**
 * Update-user input. Email/password are NOT changed via this path —
 * password goes through /change-password (user-driven), email changes
 * are not currently supported.
 *
 * Role can change but it's a sensitive operation — a student becoming
 * an admin needs explicit admin action. studentNumber can be set/cleared
 * (e.g. when fixing a typo) but not via the normal admin update flow.
 */
export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  role: RoleSchema.optional(),
  classId: z.string().optional().nullable(),
  studentNumber: StudentNumberSchema.optional().nullable(),
  gradeLevel: z.number().int().min(7).max(12).optional().nullable(),
  department: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

/**
 * Change-password input. Validated server-side AND client-side. The two
 * password fields are checked for equality on the client; the server only
 * needs the new password (and the current password for re-auth).
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
});
