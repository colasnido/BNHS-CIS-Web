import "server-only";

import { randomInt } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";
import { adminAuth } from "@/services/firebase.admin";
import { collections } from "@/services/firestore";
import {
  toISO,
  buildUpdate,
  isNotFoundError,
} from "@/services/firestore.helpers";
import {
  CreateUserSchema,
  UpdateUserSchema,
  RoleSchema,
  StudentNumberSchema,
} from "@/features/users/schema";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
} from "@/features/users/types";
import { studentIdToEmail } from "@/lib/student-id";
import {
  normalizeEmail,
  normalizePersonName,
  normalizeShortText,
  normalizeFreeText,
} from "@/lib/normalize";

/**
 * User service. Owns the users collection AND user-related Firebase Auth ops.
 *
 * Key change in this version: students are identified by LRN (studentNumber),
 * not email. createUser derives a synthetic email from the LRN for students.
 * Faculty and admin still use real email.
 */

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot,
): User {
  const data = doc.data();
  if (!data) throw new Error(`User ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const role = RoleSchema.safeParse(data.role).success
    ? (data.role as Role)
    : "student";

  return {
    uid: doc.id,
    email: data.email ?? "",
    displayName: data.displayName ?? data.email ?? "Unnamed user",
    role,
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : undefined,
    classId: typeof data.classId === "string" ? data.classId : undefined,
    studentNumber:
      typeof data.studentNumber === "string" ? data.studentNumber : undefined,
    gradeLevel:
      typeof data.gradeLevel === "number" ? data.gradeLevel : undefined,
    department:
      typeof data.department === "string" ? data.department : undefined,
    // Default false — accounts created before this field existed don't have
    // it stored, but we treat them as already-changed (grandfathering).
    mustChangePassword: data.mustChangePassword === true,
    createdAt,
    updatedAt,
  };
}

export async function listUsers(): Promise<User[]> {
  try {
    const snapshot = await collections.users().get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function listUsersByRole(role: Role): Promise<User[]> {
  try {
    const snapshot = await collections.users().where("role", "==", role).get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function countUsersByRole(role: Role): Promise<number> {
  try {
    const snapshot = await collections.users().where("role", "==", role).get();
    return snapshot.size;
  } catch (error) {
    if (isNotFoundError(error)) return 0;
    throw error;
  }
}

export async function listStudentsByClass(classId: string): Promise<User[]> {
  try {
    const snapshot = await collections
      .users()
      .where("role", "==", "student")
      .where("classId", "==", classId)
      .get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const doc = await collections.users().doc(uid).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

/**
 * Look up a student by their LRN. Used by the student login flow to verify
 * the LRN exists before attempting Firebase Auth.
 */
export async function getStudentByNumber(
  studentNumber: string,
): Promise<User | null> {
  try {
    const snapshot = await collections
      .users()
      .where("studentNumber", "==", studentNumber)
      .where("role", "==", "student")
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return fromFirestore(snapshot.docs[0]);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

/**
 * Create a user end-to-end:
 *   1. Validate per-role input (discriminated union)
 *   2. For students: check LRN uniqueness, derive synthetic email
 *   3. Create Firebase Auth account
 *   4. Set custom claim for role
 *   5. Write Firestore profile doc with mustChangePassword flag
 *
 * If any step after Firebase Auth creation fails, the auth account is
 * deleted (best-effort rollback).
 *
 * The mustChangePassword flag is set to TRUE for students and faculty
 * (they were given a password by admin and should change it on first login).
 * For admin, it defaults to FALSE because admins typically self-set their
 * password during initial Firebase Console bootstrap.
 */
export async function createUser(input: unknown): Promise<User> {
  const parsed: CreateUserInput = CreateUserSchema.parse(input);

  // ---------- 1. Normalize + derive email + uniqueness checks ----------
  let email: string;
  let displayName: string;
  const docFields: Record<string, unknown> = {};

  if (parsed.role === "student") {
    const lrn = parsed.studentNumber.trim();
    StudentNumberSchema.parse(lrn); // double-check after trim

    // LRN must be globally unique
    const existing = await getStudentByNumber(lrn);
    if (existing) {
      throw new Error(`Student number ${lrn} is already in use`);
    }

    email = studentIdToEmail(lrn);
    displayName = normalizePersonName(parsed.displayName);
    docFields.studentNumber = lrn;
    if (parsed.classId) docFields.classId = parsed.classId;
    if (parsed.gradeLevel !== undefined)
      docFields.gradeLevel = parsed.gradeLevel;
  } else if (parsed.role === "faculty") {
    email = normalizeEmail(parsed.email);
    displayName = normalizePersonName(parsed.displayName);
    if (parsed.department) {
      docFields.department = normalizeFreeText(parsed.department);
    }
  } else {
    // admin
    email = normalizeEmail(parsed.email);
    displayName = normalizePersonName(parsed.displayName);
  }

  // ---------- 2. Firebase Auth account ----------
  const authUser = await adminAuth.createUser({
    email,
    password: parsed.password,
    displayName,
  });

  try {
    // ---------- 3. Custom claim for role ----------
    await adminAuth.setCustomUserClaims(authUser.uid, { role: parsed.role });

    // ---------- 4. Firestore profile doc ----------
    const now = Timestamp.now();
    const docData: Record<string, unknown> = {
      ...docFields,
      email,
      displayName,
      role: parsed.role,
      // Force-change ON for student/faculty (admin-assigned passwords)
      // Force-change OFF for admin (they self-set their own)
      mustChangePassword: parsed.role !== "admin",
      createdAt: now,
      updatedAt: now,
    };

    await collections.users().doc(authUser.uid).set(docData);

    const created = await collections.users().doc(authUser.uid).get();
    return fromFirestore(created);
  } catch (error) {
    // Rollback: delete the orphan auth account
    await adminAuth.deleteUser(authUser.uid).catch(() => undefined);
    throw error;
  }
}

/**
 * Update profile fields. If role changes, the custom claim is updated too.
 * The user must sign out + back in for the new claim to take effect.
 *
 * Note: this path does NOT change email or password. Password changes go
 * through /change-password (user-driven, requires current password).
 * Student LRN changes are allowed but trigger a uniqueness re-check.
 */
export async function updateUser(uid: string, input: unknown): Promise<User> {
  const parsed: UpdateUserInput = UpdateUserSchema.parse(input);

  // If LRN is being changed, re-check uniqueness
  if (parsed.studentNumber) {
    const existing = await getStudentByNumber(parsed.studentNumber);
    if (existing && existing.uid !== uid) {
      throw new Error(
        `Student number ${parsed.studentNumber} is already in use`,
      );
    }
  }

  if (parsed.role) {
    await adminAuth.setCustomUserClaims(uid, { role: parsed.role });
  }

  // Normalize text fields if provided
  const updates = buildUpdate({
    ...parsed,
    displayName: parsed.displayName
      ? normalizePersonName(parsed.displayName)
      : parsed.displayName,
    department:
      parsed.department === null
        ? null
        : parsed.department
          ? normalizeFreeText(parsed.department)
          : parsed.department,
    studentNumber:
      parsed.studentNumber === null
        ? null
        : parsed.studentNumber
          ? parsed.studentNumber.trim()
          : parsed.studentNumber,
  });

  await collections.users().doc(uid).update(updates);

  const updated = await collections.users().doc(uid).get();
  return fromFirestore(updated);
}

/**
 * Delete: remove from Firestore AND Firebase Auth.
 */
export async function deleteUser(uid: string): Promise<void> {
  await collections.users().doc(uid).delete();
  await adminAuth.deleteUser(uid).catch(() => undefined);
}

/**
 * Update a user's password and clear the mustChangePassword flag.
 * Used by /api/auth/password — caller is responsible for verifying that
 * the user is who they say they are (by re-authenticating with the current
 * password client-side before calling).
 *
 * This is the ONLY function that should clear mustChangePassword. Everything
 * else treats it as immutable from the user-update path.
 */
export async function changeUserPassword(
  uid: string,
  newPassword: string,
): Promise<void> {
  // 1. Update password in Firebase Auth
  await adminAuth.updateUser(uid, { password: newPassword });

  // 2. Revoke existing sessions — anyone with the old session cookie
  //    must re-authenticate. Defends against a stolen session.
  await adminAuth.revokeRefreshTokens(uid);

  // 3. Clear the mustChangePassword flag in Firestore
  await collections.users().doc(uid).update({
    mustChangePassword: false,
    updatedAt: Timestamp.now(),
  });
}

export async function resetUserPassword(uid: string): Promise<string> {
  const tempPassword = generateTempPassword();

  await adminAuth.updateUser(uid, { password: tempPassword });
  await adminAuth.revokeRefreshTokens(uid);

  await collections.users().doc(uid).update({
    mustChangePassword: true,
    updatedAt: Timestamp.now(),
  });

  return tempPassword;
}

function generateTempPassword(length = 12): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = `${letters}${digits}`;

  const chars = [
    letters[randomInt(letters.length)],
    digits[randomInt(digits.length)],
  ];

  for (let i = chars.length; i < length; i++) {
    chars.push(all[randomInt(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
