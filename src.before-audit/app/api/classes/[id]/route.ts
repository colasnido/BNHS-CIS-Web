import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { updateClass, deleteClass } from '@/services/class.service';
import { requireRole } from '@/services/auth.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const admin = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    const body = await request.json();
    const cls = await updateClass(id, body);
    console.log(`[PUT /api/classes/${id}] Updated by ${admin.uid}`);
    return NextResponse.json({ data: cls });
  } catch (error) {
    return handleError(error, 'update');
  }
}

export async function DELETE(request: Request, ctx: RouteContext) {
  try {
    const admin = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    await deleteClass(id);
    console.log(`[DELETE /api/classes/${id}] Deleted by ${admin.uid}`);
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
  console.error(`[/api/classes/:id] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} class` }, { status: 500 });
}
