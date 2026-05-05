import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import { CreateClassSchema, UpdateClassSchema } from '@/features/classes/schema';
import type { ClassRecord } from '@/features/classes/types';

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

export async function createClass(input: unknown): Promise<ClassRecord> {
  const parsed = CreateClassSchema.parse(input);
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
  const parsed = UpdateClassSchema.parse(input);
  const updates = buildUpdate(parsed);
  await collections.classes().doc(id).update(updates);
  const updated = await collections.classes().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteClass(id: string): Promise<void> {
  await collections.classes().doc(id).delete();
}
