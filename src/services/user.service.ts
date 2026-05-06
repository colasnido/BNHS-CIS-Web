import "server-only";

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
} from "@/features/users/schema";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
} from "@/features/users/types";
import {
  normalizeEmail,
  normalizePersonName,
  normalizeShortText,
  normalizeFreeText,
} from "@/lib/normalize";

/**
 * User service. Owns the users collection AND user-related Firebase Auth ops.
 *
 * Audit fix #1 (normalization) applied at every write boundary:
 *   - email lowercased (Firebase Auth treats them case-insensitively, but
 *     our Firestore queries don't — we standardize)
 *   - displayName trimmed and title-cased
 *   - studentNumber trimmed
 *   - department trimmed and whitespace-collapsed
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

export async function createUser(input: unknown): Promise<User> {
  const normalized = normalizeUserInput(input);
  const parsed: CreateUserInput = CreateUserSchema.parse(normalized);

  // 1. Firebase Auth user. Email is already normalized.
  const authUser = await adminAuth.createUser({
    email: parsed.email,
    password: parsed.password,
    displayName: parsed.displayName,
  });

  try {
    // 2. Custom claim for role
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
    await adminAuth.deleteUser(authUser.uid).catch(() => undefined);
    throw error;
  }
}

export async function updateUser(uid: string, input: unknown): Promise<User> {
  const normalized = normalizeUserInput(input);
  const parsed: UpdateUserInput = UpdateUserSchema.parse(normalized);

  if (parsed.role) {
    await adminAuth.setCustomUserClaims(uid, { role: parsed.role });
  }

  // If displayName is changing, also update the Firebase Auth record so the
  // two sides stay in sync. (Otherwise admin renames a user in our DB but
  // Auth still shows the old name.)
  const authUpdate: { displayName?: string } = {};
  if (parsed.displayName !== undefined)
    authUpdate.displayName = parsed.displayName;
  if (Object.keys(authUpdate).length > 0) {
    await adminAuth.updateUser(uid, authUpdate);
  }

  const updates = buildUpdate(parsed);
  await collections.users().doc(uid).update(updates);

  const updated = await collections.users().doc(uid).get();
  return fromFirestore(updated);
}

export async function deleteUser(uid: string): Promise<void> {
  await collections.users().doc(uid).delete();
  await adminAuth.deleteUser(uid).catch(() => undefined);
}

/**
 * Normalize incoming user input. Applied to both create and update paths.
 *
 * For nullable fields (classId, studentNumber, etc.), an explicit `null`
 * passes through — that's how the update path expresses "clear this field".
 */
function normalizeUserInput(input: unknown): unknown {
  if (typeof input !== "object" || input === null) return input;
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };

  if (typeof obj.email === "string") {
    out.email = normalizeEmail(obj.email);
  }
  if (typeof obj.displayName === "string") {
    out.displayName = normalizePersonName(obj.displayName);
  }
  if (typeof obj.studentNumber === "string") {
    const cleaned = normalizeShortText(obj.studentNumber);
    if (cleaned === "") {
      delete out.studentNumber;
    } else {
      out.studentNumber = cleaned;
    }
  }
  if (typeof obj.department === "string") {
    const cleaned = normalizeFreeText(obj.department);
    if (cleaned === "") {
      delete out.department;
    } else {
      out.department = cleaned;
    }
  }
  if (typeof obj.classId === "string") {
    const cleaned = normalizeShortText(obj.classId);
    if (cleaned === "") {
      // Empty classId from form → drop, otherwise schema rejects.
      // Caller can use null to explicitly clear.
      delete out.classId;
    } else {
      out.classId = cleaned;
    }
  }
  return out;
}
