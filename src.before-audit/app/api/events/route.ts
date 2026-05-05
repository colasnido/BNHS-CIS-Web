import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { listEvents, createEvent } from '@/services/event.service';
import { requireRole } from '@/services/auth.service';

/**
 * GET /api/events
 * Public endpoint — returns all events.
 */
export async function GET() {
  try {
    const events = await listEvents();
    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('[GET /api/events]', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Protected — requires faculty or admin role.
 *
 * Flow: parse body → require role → service handles Zod + write
 */
export async function POST(request: Request) {
  try {
    // Auth gate: faculty OR admin can create events
    const user = await requireRole(request, ['faculty', 'admin']);

    const body = await request.json();
    const event = await createEvent(body);

    console.log(`[POST /api/events] Created ${event.id} by ${user.uid}`);
    return NextResponse.json({ data: event }, { status: 201 });
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('[POST /api/events]', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
