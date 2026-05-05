import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import { CreateClassSchema, UpdateClassSchema } from '@/features/classes/schema';
import type { ClassRecord } from '@/features/classes/types';
import {
  normalizeSectionName,
  normalizeShortText,
} from '@/lib/normalize';

/**
 * Class service.
 *
 * Audit fixes applied:
 *   - #1 (normalization): `name` and `section` normalized at write
 *   - #3 (duplication): uniqueness check on (name, section, schoolYear)
 */

function fromFirestore(
  doc:
    | FirebaseFirestore.QueryDocumentSnapshot
    | FirebaseFirestore.DocumentSnapshot
): ClassRecord {
  const data = doc.data();
  if (!data) throw new Error(`Class ${doc.id} has no data`);

  const createdAt = toISO(data.createdAt);
  const updatedAt = toISO(data.updatedAt, createdAt);

  return {
    id: doc.id,
    name: data.name ?? 'Untitled class',
    gradeLevel: typeof data.gradeLevel === 'number' ? data.gradeLevel : 7,
    section: data.section ?? '',
    schoolYear: data.schoolYear ?? '',
    adviserId: typeof data.adviserId === 'string' ? data.adviserId : undefined,
    createdAt,
    updatedAt,
  };
}

export async function listClasses(): Promise<ClassRecord[]> {
  try {
    const snapshot = await collections.classes().get();
    return snapshot.docs
      .map(fromFirestore)
      .sort((a, b) => {
        if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function getClass(id: string): Promise<ClassRecord | null> {
  try {
    const doc = await collections.classes().doc(id).get();
    if (!doc.exists) return null;
    return fromFirestore(doc);
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function listClassesByAdviser(adviserId: string): Promise<ClassRecord[]> {
  try {
    const snapshot = await collections
      .classes()
      .where('adviserId', '==', adviserId)
      .get();
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

/**
 * Create a class. Enforces uniqueness on (name, section, schoolYear).
 *
 * Why this tuple: same school year can have "St. Augustine A" and
 * "St. Augustine B" (different sections). But "St. Augustine A" twice
 * in the same school year is a duplicate.
 *
 * Different school years can repeat names — "St. Augustine A" exists in
 * 2025-2026 AND 2026-2027 as separate records. Expected.
 */
export async function createClass(input: unknown): Promise<ClassRecord> {
  const normalized = normalizeClassInput(input);
  const parsed = CreateClassSchema.parse(normalized);

  // Uniqueness check
  const existing = await listClasses();
  const dupe = existing.find(
    (c) =>
      normalizeSectionName(c.name) === parsed.name &&
      normalizeSectionName(c.section) === parsed.section &&
      c.schoolYear === parsed.schoolYear
  );
  if (dupe) {
    throw new Error(
      `Class "${parsed.name}" section "${parsed.section}" already exists for school year ${parsed.schoolYear} (id: ${dupe.id})`
    );
  }

  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    name: parsed.name,
    gradeLevel: parsed.gradeLevel,
    section: parsed.section,
    schoolYear: parsed.schoolYear,
    createdAt: now,
    updatedAt: now,
  };
  if (parsed.adviserId) docData.adviserId = parsed.adviserId;

  const ref = await collections.classes().add(docData);
  const created = await ref.get();
  return fromFirestore(created);
}

export async function updateClass(
  id: string,
  input: unknown
): Promise<ClassRecord> {
  const normalized = normalizeClassInput(input);
  const parsed = UpdateClassSchema.parse(normalized);

  // If name/section/schoolYear is changing, re-check uniqueness against
  // the would-be merged values.
  if (
    parsed.name !== undefined ||
    parsed.section !== undefined ||
    parsed.schoolYear !== undefined
  ) {
    const current = await getClass(id);
    if (!current) throw new Error(`Class ${id} not found`);

    const checkName = parsed.name ?? current.name;
    const checkSection = parsed.section ?? current.section;
    const checkYear = parsed.schoolYear ?? current.schoolYear;

    const others = (await listClasses()).filter((c) => c.id !== id);
    const dupe = others.find(
      (c) =>
        normalizeSectionName(c.name) === normalizeSectionName(checkName) &&
        normalizeSectionName(c.section) === normalizeSectionName(checkSection) &&
        c.schoolYear === checkYear
    );
    if (dupe) {
      throw new Error(
        `Class "${checkName}" section "${checkSection}" already exists for school year ${checkYear}`
      );
    }
  }

  const updates = buildUpdate(parsed);
  await collections.classes().doc(id).update(updates);
  const updated = await collections.classes().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteClass(id: string): Promise<void> {
  await collections.classes().doc(id).delete();
}

function normalizeClassInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) return input;
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };
  if (typeof obj.name === 'string') {
    out.name = normalizeSectionName(obj.name);
  }
  if (typeof obj.section === 'string') {
    out.section = normalizeSectionName(obj.section);
  }
  if (typeof obj.schoolYear === 'string') {
    // School year is a fixed format YYYY-YYYY, just trim.
    out.schoolYear = obj.schoolYear.trim();
  }
  if (typeof obj.adviserId === 'string') {
    const cleaned = normalizeShortText(obj.adviserId);
    if (cleaned === '') {
      // Empty adviser → drop, otherwise schema rejects empty string.
      delete out.adviserId;
    } else {
      out.adviserId = cleaned;
    }
  }
  return out;
}
