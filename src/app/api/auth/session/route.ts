import { NextResponse } from 'next/server';
import { createSessionCookie, SESSION_COOKIE_NAME } from '@/services/auth.service';

/**
 * POST /api/auth/session
 *
 * Body: { idToken: string }
 *
 * Client signs in with Firebase Auth → gets ID token → POSTs it here.
 * Server verifies it and sets an HttpOnly cookie. From this point on,
 * all server-side requests use the cookie (not the ID token).
 *
 * Why this dance?
 *   - Client SDK gives us an ID token (1 hour lifetime)
 *   - Session cookies live longer (5 days here) and survive refresh
 *   - HttpOnly = JS can't read it = XSS can't steal it
 */
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[POST /api/auth/session]', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (sign out).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
