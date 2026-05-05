import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
} from '@/features/subjects/schema';
import type { Subject } from '@/features/subjects/types';
import { getClass } from '@/services/class.service';
import { getUser } from '@/services/user.service';
import {
  normalizePersonName,
  normalizeFreeText,
  normalizeShortText,
} from '@/lib/normalize';

/**
 * Subject service.
 *
 * Audit fixes applied:
 *   - #1 (normalization): all string fields normalized at write boundaries
 *   - #3 (duplication): uniqueness check on (name, classId)
 *   - #5 (drop code): code field removed
 *   - A10 (consistency): classId and facultyId existence verified at create
 *
 * Read path is tolerant of legacy data: subjects written before the migration
 * may have a `code` field, which is silently dropped on read (Subject type
 * no longer includes it).
 */

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot
): Subject {
  const data = doc.data();
  if (!data) throw new Error(`Subject ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);

  return {
    id: doc.id,
    name: data.name ?? 'Untitled subject',
    description:
      typeof data.description === 'string' ? data.description : undefined,
    classId: data.classId ?? '',
    facultyId: data.facultyId ?? '',
    createdAt,
    updatedAt,
  };
}

export async function listSubjects(): Promise<Subject[]> {
  try {
    const snapshot = await collections.subjects().get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function getSubject(id: string): Promise<Subject | null> {
  try {
    const doc = await collections.subjects().doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function listSubjectsByClass(classId: string): Promise<Subject[]> {
  try {
    const snapshot = await collections
      .subjects()
      .where('classId', '==', classId)
      .get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function listSubjectsByFaculty(facultyId: string): Promise<Subject[]> {
  try {
    const snapshot = await collections
      .subjects()
      .where('facultyId', '==', facultyId)
      .get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

/**
 * Create a subject. Enforces:
 *   - Class exists
 *   - Faculty exists and has role 'faculty'
 *   - No other subject in the same class shares this name (after normalization)
 *
 * The name is normalized to title case, description has whitespace cleaned.
 */
export async function createSubject(input: unknown): Promise<Subject> {
  // Normalize first, validate second. This is the order described in
  // REDESIGN.md: schemas validate already-clean data so error messages
  // describe the user's input, not artifacts of normalization.
  const normalized = normalizeSubjectInput(input);
  const parsed = CreateSubjectSchema.parse(normalized);

  // Existence checks — fail fast before uniqueness check.
  const klass = await getClass(parsed.classId);
  if (!klass) {
    throw new Error(`Class with id "${parsed.classId}" does not exist`);
  }
  const faculty = await getUser(parsed.facultyId);
  if (!faculty || faculty.role !== 'faculty') {
    throw new Error(
      `Faculty user with id "${parsed.facultyId}" does not exist or is not a faculty member`
    );
  }

  // Uniqueness: same class can't have two subjects sharing a normalized name.
  // We re-normalize sibling names on read in case legacy data slipped through.
  const siblings = await listSubjectsByClass(parsed.classId);
  const targetName = parsed.name; // already normalized
  const conflict = siblings.find(
    (s) => normalizePersonName(s.name) === targetName
  );
  if (conflict) {
    throw new Error(
      `Subject "${targetName}" already exists for this class (id: ${conflict.id})`
    );
  }

  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    name: parsed.name,
    classId: parsed.classId,
    facultyId: parsed.facultyId,
    createdAt: now,
    updatedAt: now,
  };
  if (parsed.description) docData.description = parsed.description;

  const ref = await collections.subjects().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

export async function updateSubject(
  id: string,
  input: unknown
): Promise<Subject> {
  const normalized = normalizeSubjectInput(input);
  const parsed = UpdateSubjectSchema.parse(normalized);

  // If the caller is changing class or faculty, validate existence again.
  if (parsed.classId !== undefined) {
    const klass = await getClass(parsed.classId);
    if (!klass) {
      throw new Error(`Class with id "${parsed.classId}" does not exist`);
    }
  }
  if (parsed.facultyId !== undefined) {
    const faculty = await getUser(parsed.facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      throw new Error(
        `Faculty user with id "${parsed.facultyId}" does not exist or is not a faculty member`
      );
    }
  }

  // Re-check uniqueness if name or classId changed. We need the current doc
  // to know what stays the same.
  if (parsed.name !== undefined || parsed.classId !== undefined) {
    const current = await getSubject(id);
    if (!current) throw new Error(`Subject ${id} not found`);

    const checkName = parsed.name ?? current.name;
    const checkClassId = parsed.classId ?? current.classId;
    const siblings = await listSubjectsByClass(checkClassId);
    const target = normalizePersonName(checkName);
    const conflict = siblings.find(
      (s) => s.id !== id && normalizePersonName(s.name) === target
    );
    if (conflict) {
      throw new Error(
        `Subject "${checkName}" already exists for this class (id: ${conflict.id})`
      );
    }
  }

  const updates = buildUpdate(parsed);
  await collections.subjects().doc(id).update(updates);
  const updated = await collections.subjects().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteSubject(id: string): Promise<void> {
  await collections.subjects().doc(id).delete();
}

/**
 * Apply field-level normalization to subject input before schema validation.
 * Only touches string fields it knows about; passes through everything else.
 */
function normalizeSubjectInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };
  if (typeof obj.name === 'string') {
    out.name = normalizePersonName(obj.name);
  }
  if (typeof obj.description === 'string') {
    const cleaned = normalizeFreeText(obj.description);
    // Empty after normalization → drop the field, otherwise schema's optional
    // type still accepts empty strings as "I want this field to be empty".
    if (cleaned === '') {
      delete out.description;
    } else {
      out.description = cleaned;
    }
  }
  // classId and facultyId are opaque IDs — no normalization beyond trim.
  if (typeof obj.classId === 'string') {
    out.classId = normalizeShortText(obj.classId);
  }
  if (typeof obj.facultyId === 'string') {
    out.facultyId = normalizeShortText(obj.facultyId);
  }
  return out;
}
