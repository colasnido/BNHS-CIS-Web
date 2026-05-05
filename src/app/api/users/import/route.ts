import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createUser } from '@/services/user.service';
import { listClasses } from '@/services/class.service';
import {
  resolveClassFromList,
  formatResolutionError,
} from '@/services/resolver';

interface ImportRow {
  display_name?: string;
  email?: string;
  password?: string;
  role?: string;
  class_section?: string;
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
 * CSV format (audit fix #1, #6):
 *   display_name, email, password, role, class_section, student_number,
 *   grade_level, department
 *
 * Changes from prior version:
 *   - class_id replaced with class_section (admin-readable, resolved by name)
 *   - All fields normalized at write time (handled by createUser)
 *   - Email kept as direct field (it's the user's login credential, not a
 *     reference to another record — see audit #6 rationale)
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    const body = (await request.json()) as ImportRequest;

    if (!Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: 'Expected `rows` array' },
        { status: 400 }
      );
    }

    const classes = await listClasses();

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        const role = row.role?.trim();
        const input: Record<string, unknown> = {
          email: row.email,
          password: row.password,
          displayName: row.display_name,
          role,
        };

        if (role === 'student') {
          if (row.class_section?.trim()) {
            const result = resolveClassFromList(row.class_section, classes);
            if (!result.ok) {
              throw new Error(
                formatResolutionError(row.class_section, result, 'classes')
              );
            }
            input.classId = result.record.id;
            // gradeLevel: prefer the value from the resolved class for
            // consistency. If admin typed a different grade_level, it's
            // probably a typo — we trust the class.
            input.gradeLevel = result.record.gradeLevel;
          } else if (row.grade_level?.trim()) {
            const grade = Number(row.grade_level);
            if (!Number.isNaN(grade)) input.gradeLevel = grade;
          }
          if (row.student_number?.trim()) {
            input.studentNumber = row.student_number.trim();
          }
        }

        if (role === 'faculty' && row.department?.trim()) {
          input.department = row.department.trim();
        }

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

    return NextResponse.json({ created, failed: errors.length, errors });
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

function extractErrorMessage(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
  }
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string };
    if (e.code?.startsWith('auth/')) {
      return e.message?.replace('Firebase: ', '') ?? e.code;
    }
    if (e.message) return e.message;
  }
  return 'Unknown error';
}
