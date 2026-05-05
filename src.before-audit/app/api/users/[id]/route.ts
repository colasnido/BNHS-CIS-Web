import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { updateUser, deleteUser, getUser } from '@/services/user.service';
import { requireRole } from '@/services/auth.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: RouteContext) {
  try {
    await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    const user = await getUser(id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleError(error, 'fetch');
  }
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const admin = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    const body = await request.json();
    const user = await updateUser(id, body);
    console.log(`[PUT /api/users/${id}] Updated by ${admin.uid}`);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleError(error, 'update');
  }
}

export async function DELETE(request: Request, ctx: RouteContext) {
  try {
    const admin = await requireRole(request, ['admin']);
    const { id } = await ctx.params;
    if (id === admin.uid) {
      return NextResponse.json(
        { error: 'You cannot delete your own admin account.' },
        { status: 400 }
      );
    }
    await deleteUser(id);
    console.log(`[DELETE /api/users/${id}] Deleted by ${admin.uid}`);
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
  console.error(`[/api/users/:id] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} user` }, { status: 500 });
}
