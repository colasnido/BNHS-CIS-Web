import { NextResponse } from 'next/server';
import { requireRole } from '@/services/auth.service';
import { getUser, resetUserPassword } from '@/services/user.service';

/**
 * POST /api/users/[id]/reset-password
 *
 * Admin-only. Generates a new temporary password for the target user,
 * forces them to change it on next login, revokes their existing sessions,
 * and returns the temp password to the admin as a one-time response.
 *
 * The admin is responsible for delivering the temp password to the user
 * (in person, on paper, etc.) — we do NOT have email infrastructure to
 * send it automatically (and students don't have real emails anyway).
 *
 * Response shape:
 *   200 → { tempPassword: string, displayName: string }
 *   401 → not authenticated
 *   403 → not admin
 *   404 → target user doesn't exist
 *   500 → unexpected error (rolled back as much as possible)
 *
 * The endpoint logs the action (admin UID + target UID + timestamp) so
 * we have an audit trail. It does NOT log the temp password itself.
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, ctx: RouteContext) {
  let admin;
  try {
    admin = await requireRole(request, ['admin']);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;

  // Self-reset guard: an admin shouldn't reset their OWN password through
  // this admin-action route (it would force them to log out + change). If
  // they want to change their own password they should use /change-password.
  // The /change-password flow proves identity via current password; this
  // route bypasses that. Allowing self-use here would let a compromised
  // admin session reset itself silently.
  if (id === admin.uid) {
    return NextResponse.json(
      {
        error:
          "Use the change-password page to change your own password. The admin reset is for other users' accounts.",
      },
      { status: 400 }
    );
  }

  const targetUser = await getUser(id);
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const tempPassword = await resetUserPassword(id);

    // Audit log — admin UID, target UID, target role, timestamp.
    // We deliberately do NOT log the temp password itself.
    console.log(
      `[POST /api/users/${id}/reset-password] Reset by admin=${admin.uid} target=${id} role=${targetUser.role}`
    );

    return NextResponse.json({
      tempPassword,
      displayName: targetUser.displayName,
    });
  } catch (error) {
    console.error(`[POST /api/users/${id}/reset-password]`, error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
