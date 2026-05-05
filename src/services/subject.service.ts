import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { collections } from '@/services/firestore';
import { toISO, buildUpdate, isNotFoundError } from '@/services/firestore.helpers';
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
} from '@/features/subjects/schema';
import type { Subject } from '@/features/subjects/types';

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
    code: data.code ?? '',
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
      .sort((a, b) => a.code.localeCompare(b.code));
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
      .sort((a, b) => a.code.localeCompare(b.code));
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
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

export async function createSubject(input: unknown): Promise<Subject> {
  const parsed = CreateSubjectSchema.parse(input);
  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    code: parsed.code,
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
  const parsed = UpdateSubjectSchema.parse(input);
  const updates = buildUpdate(parsed);
  await collections.subjects().doc(id).update(updates);
  const updated = await collections.subjects().doc(id).get();
  return fromFirestore(updated);
}

export async function deleteSubject(id: string): Promise<void> {
  await collections.subjects().doc(id).delete();
}
