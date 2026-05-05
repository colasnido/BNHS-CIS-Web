import 'server-only';

import { cookies } from 'next/headers';
import { adminAuth } from '@/services/firebase.admin';

/**
 * Auth service. The single source of truth for "who is this user and what can they do."
 *
 * Role model:
 *   - 'admin'   → full access to admin dashboard, all CRUD
 *   - 'faculty' → can manage events, announcements, media
 *   - 'student' → read-only portal (future: grades, schedule, etc.)
 *   - undefined → unauthenticated public visitor
 *
 * Roles are stored as Firebase custom claims, set via setRole() below.
 * Reading a role costs 0 extra DB reads — it's inside the verified token.
 */

export type Role = 'admin' | 'faculty' | 'student';

export interface AuthUser {
  uid: string;
  email: string;
  role: Role | null;
}

const SESSION_COOKIE = 'session';

/**
 * Verify the session cookie and return the authenticated user.
 * Returns null if no session or invalid.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      role: (decoded.role as Role) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a request's auth header (Bearer ID token) and return the user.
 * Used by API routes that don't have access to cookies in the same way.
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  // Try cookie first
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    if (match) {
      try {
        const decoded = await adminAuth.verifySessionCookie(match[1], true);
        return {
          uid: decoded.uid,
          email: decoded.email ?? '',
          role: (decoded.role as Role) ?? null,
        };
      } catch {
        /* fall through to Bearer */
      }
    }
  }

  // Fall back to Authorization: Bearer <idToken>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email ?? '',
        role: (decoded.role as Role) ?? null,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Throw if the user isn't authenticated or doesn't have one of the allowed roles.
 * Used inside API routes — caller catches the thrown error.
 */
export async function requireRole(
  request: Request,
  allowed: Role[]
): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) throw new Error('UNAUTHORIZED');
  if (!user.role || !allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

/**
 * Admin helper: assign a role to a user. Call this from a one-off script
 * or an admin-only Server Action. Sets a Firebase custom claim that
 * propagates to all future tokens for that user.
 */
export async function setRole(uid: string, role: Role): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}

/**
 * Create a session cookie from an ID token (used by login flow).
 * The cookie expires after 5 days; client signs in again after that.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in ms
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
