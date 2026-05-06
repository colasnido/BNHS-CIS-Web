import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createUser } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import { CreateUserSchema } from '@/features/users/schema';

/**
 * POST /api/csv-import/users
 *
 * Body: { rows: [{ role, displayName, password, ... }] }
 *
 * The browser has already done CSV parsing and column mapping. Each row in
 * the request body has canonical field names. Our job is:
 *
 *   1. Verify caller is admin
 *   2. For each row:
 *      a. Resolve classSection name → classId (if provided)
 *      b. Validate the full input via CreateUserSchema (the discriminated
 *         union from the auth-redesign package — enforces per-role required
 *         fields)
 *      c. Call createUser() — which handles Firebase Auth + Firestore +
 *         mustChangePassword=true
 *
 *   3. Collect per-row errors. One bad row doesn't halt the batch.
 *
 *   4. Return { created, failed, errors[] }
 */

// What the client sends. Loose schema — full validation happens via
// CreateUserSchema after we resolve classSection → classId.
const ClientRowSchema = z.object({
  role: z.enum(['admin', 'faculty', 'student']),
  displayName: z.string(),
  password: z.string(),
  email: z.string().optional(),
  studentNumber: z.string().optional(),
  classSection: z.string().optional(),
  gradeLevel: z.number().optional(),
  department: z.string().optional(),
});

const BodySchema = z.object({
  rows: z.array(ClientRowSchema).min(1).max(2000),
});

export async function POST(request: Request) {
  // ---------- 1. Auth ----------
  try {
    await requireRole(request, ['admin']);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ---------- 2. Validate body ----------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? 'Invalid rows' },
      { status: 400 }
    );
  }

  const { rows } = parsedBody.data;

  // ---------- 3. Pre-load classes for section→id resolution ----------
  // Single read; reuse for every row.
  const classes = await listClasses();
  const sectionLookup = new Map(
    classes.map((c) => [c.section.trim().toLowerCase(), c])
  );
  // Also try a "name + section" combined match for cases where the CSV uses
  // a more descriptive identifier
  for (const c of classes) {
    const combined = `${c.name} ${c.section}`.trim().toLowerCase();
    if (!sectionLookup.has(combined)) sectionLookup.set(combined, c);
  }

  // ---------- 4. Process rows ----------
  const errors: { row: number; message: string }[] = [];
  let created = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    // CSV row numbers (1=header, data starts at 2).
    const rowNumber = i + 2;
    const clientRow = rows[i];

    try {
      // Build the createUser input per role.
      const baseInput: Record<string, unknown> = {
        role: clientRow.role,
        displayName: clientRow.displayName,
        password: clientRow.password,
      };

      if (clientRow.role === 'student') {
        baseInput.studentNumber = clientRow.studentNumber;

        // Resolve class section → classId if given
        if (clientRow.classSection) {
          const cls = sectionLookup.get(
            clientRow.classSection.trim().toLowerCase()
          );
          if (!cls) {
            throw new Error(
              `Class "${clientRow.classSection}" not found. Create it first or check spelling.`
            );
          }
          baseInput.classId = cls.id;
          // If gradeLevel wasn't given, inherit from class
          if (clientRow.gradeLevel === undefined) {
            baseInput.gradeLevel = cls.gradeLevel;
          } else {
            baseInput.gradeLevel = clientRow.gradeLevel;
          }
        } else if (clientRow.gradeLevel !== undefined) {
          baseInput.gradeLevel = clientRow.gradeLevel;
        }
      } else if (clientRow.role === 'faculty') {
        baseInput.email = clientRow.email;
        if (clientRow.department) baseInput.department = clientRow.department;
      } else {
        // admin
        baseInput.email = clientRow.email;
      }

      // Validate the full shape via the same schema the form uses
      const validated = CreateUserSchema.parse(baseInput);

      await createUser(validated);
      created++;
    } catch (error) {
      failed++;
      const message =
        error instanceof z.ZodError
          ? error.issues
              .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
              .join('; ')
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      errors.push({ row: rowNumber, message });
    }
  }

  return NextResponse.json({ created, failed, errors });
}
