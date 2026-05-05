import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  listAnnouncements,
  createAnnouncement,
} from '@/services/announcement.service';
import { requireRole } from '@/services/auth.service';

/**
 * GET /api/announcements
 * Public endpoint — returns all announcements.
 */
export async function GET() {
  try {
    const announcements = await listAnnouncements();
    return NextResponse.json({ data: announcements });
  } catch (error) {
    console.error('[GET /api/announcements]', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Protected — requires faculty or admin role.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['faculty', 'admin']);

    const body = await request.json();
    const announcement = await createAnnouncement(body);

    console.log(`[POST /api/announcements] Created ${announcement.id} by ${user.uid}`);
    return NextResponse.json({ data: announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

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

    console.error('[POST /api/announcements]', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
