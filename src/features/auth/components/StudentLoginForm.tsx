'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase.client';
import { studentIdToEmail } from '@/lib/student-id';

/**
 * Student login form. Identifies students by their 12-digit LRN
 * (Learner Reference Number) instead of email.
 *
 * Flow:
 *   1. User enters LRN + password
 *   2. Form derives synthetic email: {lrn}@students.bnhs.edu.ph
 *   3. Calls Firebase Auth with the synthetic email
 *   4. Verifies role is 'student' (defense-in-depth)
 *   5. Posts ID token to /api/auth/session for HttpOnly cookie
 *   6. If user has mustChangePassword flag set → redirects to /change-password
 *      else → redirects to dashboard
 *
 * Step 6 detail: we don't decode the JWT to check mustChangePassword (it's
 * not in claims). Instead we hit a small server endpoint that returns the
 * user's first-login status from Firestore. One extra round-trip on login.
 */
export function StudentLoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side LRN format check — same regex as the server-side schema
    const trimmed = studentId.trim();
    if (!/^\d{12}$/.test(trimmed)) {
      setError('Student number must be exactly 12 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Derive synthetic email from LRN
      const email = studentIdToEmail(trimmed);

      // 2. Sign in with Firebase
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      // 3. Verify role (force token refresh for fresh claims)
      const idTokenResult = await credential.user.getIdTokenResult(true);
      if (idTokenResult.claims.role !== 'student') {
        await firebaseAuth.signOut();
        throw new Error(
          'This account is not registered as a student. Please use the correct login page.'
        );
      }

      // 4. Exchange ID token for HttpOnly session cookie
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idTokenResult.token }),
      });
      if (!sessionRes.ok) {
        throw new Error('Failed to create session');
      }

      // 5. Check if user must change password before going to dashboard.
      //    /api/auth/me returns the current user's mustChangePassword flag.
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const me: { mustChangePassword?: boolean } = await meRes.json();
        if (me.mustChangePassword) {
          router.push('/change-password');
          router.refresh();
          return;
        }
      }

      // 6. Normal flow — go to dashboard
      router.push('/dashboard/student');
      router.refresh();
    } catch (err) {
      const raw =
        err instanceof Error
          ? err.message
              .replace('Firebase: ', '')
              .replace(/\(auth\/.*?\)/, '')
              .trim()
          : 'Sign in failed';

      // Generic message for credential errors — never reveal whether the
      // LRN exists vs the password is wrong (prevents enumeration attacks).
      const isCredentialError =
        /invalid-credential|user-not-found|wrong-password|invalid-login/i.test(
          raw
        );
      setError(
        isCredentialError
          ? 'Invalid student number or password.'
          : raw || 'Sign in failed'
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="inline-block border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Student
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900">
          Student Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your LRN (Learner Reference Number).
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-slate-200 bg-white p-8"
        aria-labelledby="login-heading"
      >
        <h2 id="login-heading" className="sr-only">
          Sign in form
        </h2>

        {error && (
          <div
            role="alert"
            className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="student-id"
              className="block text-sm font-medium text-slate-900"
            >
              Student Number (LRN)
            </label>
            <input
              id="student-id"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              required
              maxLength={12}
              value={studentId}
              onChange={(e) =>
                // Strip non-digits as user types — prevents accidental spaces
                // or letters from being pasted in.
                setStudentId(e.target.value.replace(/\D/g, ''))
              }
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm tracking-wider text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
              placeholder="117964180001"
            />
            <p className="mt-1 text-xs text-slate-500">
              12 digits. Ask your adviser if you don&apos;t know your LRN.
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-900"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center bg-[#0f1f3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Faculty?{' '}
        <Link
          href="/auth/faculty"
          className="font-medium text-[#0f1f3a] hover:underline"
        >
          Faculty login
        </Link>
        {' · '}
        <Link href="/" className="font-medium text-[#0f1f3a] hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
