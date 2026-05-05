import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createClass } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';
import {
  resolveFacultyFromList,
  formatResolutionError,
} from '@/services/resolver';

interface ImportRow {
  name?: string;
  grade_level?: string;
  section?: string;
  school_year?: string;
  adviser_name?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/classes/import
 *
 * CSV format (audit fix #6):
 *   name, grade_level, section, school_year, adviser_name
 *
 * Replaces the previous adviser_email column. The resolver supports partial
 * names (e.g. "Cruz" matches "Jose Cruz" if unambiguous).
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

    const faculty = await listUsersByRole('faculty');

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        const input: Record<string, unknown> = {
          name: row.name,
          gradeLevel: Number(row.grade_level),
          section: row.section,
          schoolYear: row.school_year,
        };

        // Adviser is optional. If provided, resolve by name.
        if (row.adviser_name?.trim()) {
          const result = resolveFacultyFromList(row.adviser_name, faculty);
          if (!result.ok) {
            throw new Error(
              formatResolutionError(row.adviser_name, result, 'faculty')
            );
          }
          input.adviserId = result.record.uid;
        }

        await createClass(input);
        created++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          message:
            err instanceof ZodError
              ? err.issues
                  .map((i) => `${i.path.join('.')}: ${i.message}`)
                  .join('; ')
              : err instanceof Error
                ? err.message
                : 'Unknown error',
        });
      }
    }

    console.log(
      `[POST /api/classes/import] ${created} created, ${errors.length} failed by ${admin.uid}`
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
    console.error('[POST /api/classes/import]', error);
    return NextResponse.json(
      { error: 'Failed to import classes' },
      { status: 500 }
    );
  }
}
