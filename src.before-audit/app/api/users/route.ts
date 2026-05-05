import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { listUsers, createUser } from '@/services/user.service';
import { requireRole } from '@/services/auth.service';

/**
 * GET /api/users — admin only.
 */
export async function GET(request: Request) {
  try {
    await requireRole(request, ['admin']);
    const users = await listUsers();
    return NextResponse.json({ data: users });
  } catch (error) {
    return handleError(error, 'fetch');
  }
}

/**
 * POST /api/users — admin only.
 * Creates Firebase Auth account + Firestore profile + sets role claim.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    const body = await request.json();
    const user = await createUser(body);
    console.log(`[POST /api/users] Created ${user.uid} by ${admin.uid}`);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleError(error, 'create');
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
  // Firebase auth-specific errors (duplicate email, weak password)
  const err = error as { code?: string; message?: string };
  if (err.code?.startsWith('auth/')) {
    return NextResponse.json(
      { error: err.message?.replace('Firebase: ', '') ?? 'Auth error' },
      { status: 400 }
    );
  }
  console.error(`[/api/users] ${action}`, error);
  return NextResponse.json({ error: `Failed to ${action} user` }, { status: 500 });
}
