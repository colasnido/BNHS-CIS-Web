import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth } from '@/services/firebase.admin';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import {
  CreateUserSchema,
  UpdateUserSchema,
  RoleSchema,
} from '@/features/users/schema';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
} from '@/features/users/types';

/**
 * User service. Owns the users collection AND user-related Firebase Auth ops.
 *
 * The complication: a "user" in this app is BOTH a Firebase Auth account
 * AND a Firestore doc. Creating one means doing both atomically (best-effort).
 */

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot
): User {
  const data = doc.data();
  if (!data) throw new Error(`User ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);
  const role = RoleSchema.safeParse(data.role).success
    ? (data.role as Role)
    : 'student';

  return {
    uid: doc.id,
    email: data.email ?? '',
    displayName: data.displayName ?? data.email ?? 'Unnamed user',
    role,
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
    classId: typeof data.classId === 'string' ? data.classId : undefined,
    studentNumber:
      typeof data.studentNumber === 'string' ? data.studentNumber : undefined,
    gradeLevel: typeof data.gradeLevel === 'number' ? data.gradeLevel : undefined,
    department:
      typeof data.department === 'string' ? data.department : undefined,
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
    const snapshot = await collections.users().where('role', '==', role).get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function listStudentsByClass(classId: string): Promise<User[]> {
  try {
    const snapshot = await collections
      .users()
      .where('role', '==', 'student')
      .where('classId', '==', classId)
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
 * Create a user end-to-end:
 *   1. Create Firebase Auth account (email/password)
 *   2. Set custom claim for role
 *   3. Write Firestore profile doc
 *
 * If step 3 fails after step 1 succeeds, we delete the auth account so
 * we don't leave an orphan with no profile (best-effort rollback).
 */
export async function createUser(input: unknown): Promise<User> {
  const parsed: CreateUserInput = CreateUserSchema.parse(input);

  // 1. Firebase Auth user
  const authUser = await adminAuth.createUser({
    email: parsed.email,
    password: parsed.password,
    displayName: parsed.displayName,
  });

  try {
    // 2. Custom claim for role (server-side gate uses this)
    await adminAuth.setCustomUserClaims(authUser.uid, { role: parsed.role });

    // 3. Firestore profile doc
    const now = Timestamp.now();
    const docData: Record<string, unknown> = {
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
      createdAt: now,
      updatedAt: now,
    };
    if (parsed.classId) docData.classId = parsed.classId;
    if (parsed.studentNumber) docData.studentNumber = parsed.studentNumber;
    if (parsed.gradeLevel !== undefined) docData.gradeLevel = parsed.gradeLevel;
    if (parsed.department) docData.department = parsed.department;

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
 */
export async function updateUser(
  uid: string,
  input: unknown
): Promise<User> {
  const parsed: UpdateUserInput = UpdateUserSchema.parse(input);

  if (parsed.role) {
    await adminAuth.setCustomUserClaims(uid, { role: parsed.role });
  }

  const updates = buildUpdate(parsed);
  // Convert nulls to FieldValue.delete? Keep simple: nulls clear fields by being stored as null.
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
