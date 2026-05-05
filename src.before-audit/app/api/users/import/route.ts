import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createUser } from '@/services/user.service';

interface ImportRow {
  email?: string;
  password?: string;
  display_name?: string;
  role?: string;
  class_id?: string;
  student_number?: string;
  grade_level?: string;
  department?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/users/import
 *
 * Bulk-creates users from parsed CSV rows. Each row is processed independently
 * so a single bad row doesn't fail the whole import.
 *
 * Returns:
 *   {
 *     created: <count>,
 *     failed: <count>,
 *     errors: [{ row: <1-based row number>, message: <text> }]
 *   }
 *
 * Why per-row processing instead of a Firestore batch:
 *   1. createUser does Firebase Auth ops which can't go in a Firestore batch
 *   2. We want partial success — getting 47/50 students imported is better
 *      than rejecting all 50 because one had a bad email
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    const body = (await request.json()) as ImportRequest;

    if (!Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: 'Expected `rows` array in request body' },
        { status: 400 }
      );
    }

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    // Process sequentially to avoid hammering Firebase Auth (rate limits)
    // and to give predictable per-row error reporting.
    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2; // +1 for 1-based, +1 for header row

      try {
        const input = transformRow(row);
        await createUser(input);
        created++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          message: extractErrorMessage(err),
        });
      }
    }

    console.log(
      `[POST /api/users/import] ${created} created, ${errors.length} failed by ${admin.uid}`
    );

    return NextResponse.json({
      created,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    console.error('[POST /api/users/import]', error);
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    );
  }
}

/**
 * Transform a CSV row into the createUser input shape.
 *
 * The CSV uses lowercase_underscore headers (display_name, class_id, etc.)
 * because that's what `csvToObjects` produces. The user schema uses camelCase
 * (displayName, classId), so this is where we convert.
 *
 * Empty strings become undefined so optional fields don't show up in the
 * Firestore doc as empty strings.
 */
function transformRow(row: ImportRow): Record<string, unknown> {
  const role = row.role?.trim();
  const input: Record<string, unknown> = {
    email: row.email?.trim(),
    password: row.password,
    displayName: row.display_name?.trim(),
    role,
  };

  if (role === 'student') {
    if (row.class_id?.trim()) input.classId = row.class_id.trim();
    if (row.student_number?.trim()) {
      input.studentNumber = row.student_number.trim();
    }
    if (row.grade_level?.trim()) {
      const grade = Number(row.grade_level);
      if (!Number.isNaN(grade)) input.gradeLevel = grade;
    }
  }

  if (role === 'faculty' && row.department?.trim()) {
    input.department = row.department.trim();
  }

  return input;
}

/**
 * Extract a user-friendly error message from various error shapes that
 * createUser can throw (Zod, Firebase Auth, generic Error).
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
  }
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string };
    // Firebase Auth errors come as "auth/email-already-exists" style
    if (e.code?.startsWith('auth/')) {
      return e.message?.replace('Firebase: ', '') ?? e.code;
    }
    if (e.message) return e.message;
  }
  return 'Unknown error';
}
