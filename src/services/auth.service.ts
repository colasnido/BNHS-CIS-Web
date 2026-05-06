import 'server-only';

import { cookies } from 'next/headers';
import { adminAuth } from '@/services/firebase.admin';
import { collections } from '@/services/firestore';

/**
 * Auth service. The single source of truth for "who is this user and what
 * can they do."
 *
 * Roles are stored as Firebase custom claims, set via setRole() below.
 * Reading a role costs 0 extra DB reads — it's inside the verified token.
 *
 * mustChangePassword is stored in the Firestore user doc, NOT in claims,
 * because it changes frequently and we don't want to force token refresh
 * every time a user changes their password. It's loaded on session-aware
 * page loads via the cookie path below; API requests check it explicitly
 * when needed.
 */

export type Role = 'admin' | 'faculty' | 'student';

export interface AuthUser {
  uid: string;
  email: string;
  role: Role | null;
  /**
   * If true, the user has been issued an admin-assigned password and must
   * change it before accessing any normal route. Loaded from Firestore on
   * cookie-based session lookup (getCurrentUser).
   *
   * For requests authenticated only by Bearer token (no cookie), this is
   * `false` — caller is expected to check separately if they care.
   */
  mustChangePassword: boolean;
}

const SESSION_COOKIE = 'session';

/**
 * Verify the session cookie and return the authenticated user.
 * Returns null if no session or invalid.
 *
 * Performs ONE Firestore read to get mustChangePassword. Acceptable because
 * this is called on dashboard pages where Firestore reads are routine.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);

    // Load mustChangePassword from Firestore. One read per page nav is
    // acceptable; if it becomes a hot path we can move the flag to a
    // custom claim and refresh the token on flip.
    const userDoc = await collections.users().doc(decoded.uid).get();
    const mustChangePassword = userDoc.exists
      ? userDoc.data()?.mustChangePassword === true
      : false;

    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      role: (decoded.role as Role) ?? null,
      mustChangePassword,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a request's auth header (Bearer ID token) and return the user.
 * Used by API routes that don't have access to cookies in the same way.
 */
export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  // Try cookie first
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(
      new RegExp(`${SESSION_COOKIE}=([^;]+)`)
    );
    if (match) {
      try {
        const decoded = await adminAuth.verifySessionCookie(match[1], true);

        // Cookie path: load mustChangePassword (consistent with getCurrentUser)
        const userDoc = await collections.users().doc(decoded.uid).get();
        const mustChangePassword = userDoc.exists
          ? userDoc.data()?.mustChangePassword === true
          : false;

        return {
          uid: decoded.uid,
          email: decoded.email ?? '',
          role: (decoded.role as Role) ?? null,
          mustChangePassword,
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
      // Bearer path: skip the Firestore read for performance.
      // Caller should explicitly check mustChangePassword if needed.
      return {
        uid: decoded.uid,
        email: decoded.email ?? '',
        role: (decoded.role as Role) ?? null,
        mustChangePassword: false,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Throw if the user isn't authenticated or doesn't have one of the allowed
 * roles. Used inside API routes — caller catches the thrown error.
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
 * Admin helper: assign a role to a user.
 */
export async function setRole(uid: string, role: Role): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}

/**
 * Create a session cookie from an ID token (used by login flow).
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
