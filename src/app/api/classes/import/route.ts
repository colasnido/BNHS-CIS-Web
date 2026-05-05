import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRole } from '@/services/auth.service';
import { createClass } from '@/services/class.service';
import { listUsersByRole } from '@/services/user.service';

interface ImportRow {
  name?: string;
  grade_level?: string;
  section?: string;
  school_year?: string;
  /** Adviser is referenced by email (admin-friendly), not UID */
  adviser_email?: string;
}

interface ImportRequest {
  rows: ImportRow[];
}

/**
 * POST /api/classes/import
 *
 * Notable: the CSV uses adviser_email (not adviser_id) because admins paste
 * data from spreadsheets where they've typed faculty emails, not opaque
 * Firestore UIDs. We resolve email → UID server-side once at the start of
 * the import.
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

    // One-time lookup: build email → UID map for adviser resolution
    const faculty = await listUsersByRole('faculty');
    const facultyByEmail = new Map(
      faculty.map((f) => [f.email.toLowerCase(), f.uid])
    );

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNumber = i + 2;

      try {
        const input: Record<string, unknown> = {
          name: row.name?.trim(),
          gradeLevel: Number(row.grade_level),
          section: row.section?.trim(),
          schoolYear: row.school_year?.trim(),
        };

        if (row.adviser_email?.trim()) {
          const uid = facultyByEmail.get(row.adviser_email.trim().toLowerCase());
          if (!uid) {
            throw new Error(
              `No faculty found with email "${row.adviser_email.trim()}"`
            );
          }
          input.adviserId = uid;
        }

        await createClass(input);
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
      `[POST /api/classes/import] ${created} created, ${errors.length} failed by ${admin.uid}`
    );

    return NextResponse.json({ created, failed: errors.length, errors });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('[POST /api/classes/import]', error);
    return NextResponse.json({ error: 'Failed to import classes' }, { status: 500 });
  }
}
