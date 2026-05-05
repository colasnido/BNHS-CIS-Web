import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { updateAnnouncement, deleteAnnouncement } from '@/services/announcement.service';
import { requireRole } from '@/services/auth.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const user = await requireRole(request, ['faculty', 'admin']);
    const { id } = await ctx.params;
    const body = await request.json();
    const announcement = await updateAnnouncement(id, body);
    console.log(`[PUT /api/announcements/${id}] Updated by ${user.uid}`);
    return NextResponse.json({ data: announcement });
  } catch (error) {
    return handleError(error, 'update');
  }
}

export async function DELETE(request: Request, ctx: RouteContext) {
  try {
    const user = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    await deleteAnnouncement(id);
    console.log(`[DELETE /api/announcements/${id}] Deleted by ${user.uid}`);
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
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
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
  console.error(`[/api/announcements/:id] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} announcement` }, { status: 500 });
}
