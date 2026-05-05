import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createSubject } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';
import {
  resolveClassFromList,
  resolveFacultyFromList,
  formatResolutionError,
} from '@/services/resolver';

interface ImportRow {
  name?: string;
  class_section?: string;
  faculty_name?: string;
  description?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/subjects/import
 *
 * CSV format (audit fixes #5, #6):
 *   name, class_section, faculty_name, description
 *
 * Replaces the previous (code, name, class_name, faculty_email) format.
 * Audit fix #5: code field gone. Audit fix #6: faculty referenced by name.
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

    const [classes, faculty] = await Promise.all([
      listClasses(),
      listUsersByRole('faculty'),
    ]);

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        if (!row.class_section?.trim()) {
          throw new Error('class_section is required');
        }
        const classResult = resolveClassFromList(row.class_section, classes);
        if (!classResult.ok) {
          throw new Error(
            formatResolutionError(row.class_section, classResult, 'classes')
          );
        }

        if (!row.faculty_name?.trim()) {
          throw new Error('faculty_name is required');
        }
        const facultyResult = resolveFacultyFromList(row.faculty_name, faculty);
        if (!facultyResult.ok) {
          throw new Error(
            formatResolutionError(row.faculty_name, facultyResult, 'faculty')
          );
        }

        await createSubject({
          name: row.name,
          classId: classResult.record.id,
          facultyId: facultyResult.record.uid,
          description: row.description,
        });
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
      `[POST /api/subjects/import] ${created} created, ${errors.length} failed by ${admin.uid}`
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
    console.error('[POST /api/subjects/import]', error);
    return NextResponse.json(
      { error: 'Failed to import subjects' },
      { status: 500 }
    );
  }
}
