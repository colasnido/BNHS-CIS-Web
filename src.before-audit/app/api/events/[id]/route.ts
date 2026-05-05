import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { updateEvent, deleteEvent } from '@/services/event.service';
import { requireRole } from '@/services/auth.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/events/:id
 * Protected — requires faculty or admin role.
 */
export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const user = await requireRole(request, ['faculty', 'admin']);
    const { id } = await ctx.params;
    const body = await request.json();
    const event = await updateEvent(id, body);
    console.log(`[PUT /api/events/${id}] Updated by ${user.uid}`);
    return NextResponse.json({ data: event });
  } catch (error) {
    return handleError(error, 'update');
  }
}

/**
 * DELETE /api/events/:id
 * Protected — requires admin role only (faculty can edit but not delete).
 */
export async function DELETE(request: Request, ctx: RouteContext) {
  try {
    const user = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    await deleteEvent(id);
    console.log(`[DELETE /api/events/${id}] Deleted by ${user.uid}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'delete');
  }
}

function handleError(error: unknown, action: string) {
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
  console.error(`[/api/events/:id] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} event` }, { status: 500 });
}
