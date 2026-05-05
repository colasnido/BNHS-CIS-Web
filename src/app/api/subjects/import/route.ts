import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createSubject } from '@/services/subject.service';
import { listClasses } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

interface ImportRow {
  code?: string;
  name?: string;
  description?: string;
  class_name?: string;
  faculty_email?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/subjects/import
 *
 * Like classes import: CSV references class by name (admin-friendly) and
 * faculty by email. We resolve both to IDs before creating subjects.
 *
 * Edge case handled: multiple classes can have the same name across grade
 * levels (e.g. "Section A" exists for grade 7 AND grade 8). When that
 * happens, the import errors on that row asking for clarification — admin
 * should use a more specific name or use the standard form to disambiguate.
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

    const facultyByEmail = new Map(
      faculty.map((f) => [f.email.toLowerCase(), f.uid])
    );

    // Group classes by lowercased name for ambiguity detection
    const classesByName = new Map<string, typeof classes>();
    for (const c of classes) {
      const key = c.name.toLowerCase();
      const existing = classesByName.get(key) ?? [];
      classesByName.set(key, [...existing, c]);
    }

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        // Resolve class
        const matches = classesByName.get(row.class_name?.trim().toLowerCase() ?? '');
        if (!matches || matches.length === 0) {
          throw new Error(`No class found with name "${row.class_name}"`);
        }
        if (matches.length > 1) {
          throw new Error(
            `Class name "${row.class_name}" is ambiguous (matches ${matches.length} classes). Use a unique name or create via form.`
          );
        }
        const classId = matches[0].id;

        // Resolve faculty
        const facultyId = facultyByEmail.get(
          row.faculty_email?.trim().toLowerCase() ?? ''
        );
        if (!facultyId) {
          throw new Error(`No faculty with email "${row.faculty_email}"`);
        }

        const input: Record<string, unknown> = {
          code: row.code?.trim(),
          name: row.name?.trim(),
          classId,
          facultyId,
        };
        if (row.description?.trim()) input.description = row.description.trim();

        await createSubject(input);
        created++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          message:
            err instanceof ZodError
              ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('[POST /api/subjects/import]', error);
    return NextResponse.json({ error: 'Failed to import subjects' }, { status: 500 });
  }
}
