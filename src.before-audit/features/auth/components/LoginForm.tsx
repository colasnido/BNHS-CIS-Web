'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase.client';
import type { Role } from '@/services/auth.service';

interface LoginFormProps {
  role: Role;
  /** Where to redirect after successful sign-in */
  redirectTo: string;
}

const roleLabels: Record<Role, { label: string; subtitle: string; color: string }> = {
  admin: {
    label: 'Administrator Login',
    subtitle: 'Full access to dashboard and content management',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  faculty: {
    label: 'Faculty Login',
    subtitle: 'Manage events, announcements, and media',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  student: {
    label: 'Student Login',
    subtitle: 'Access your portal and resources',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export function LoginForm({ role, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meta = roleLabels[role];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Sign in with Firebase client SDK
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      // 2. Verify the user's role matches by reading custom claims from the token
      // Force refresh so new role claims are picked up right after assignment.
      const idTokenResult = await credential.user.getIdTokenResult(true);
      const idToken = idTokenResult.token;
      const userRole = idTokenResult.claims.role as Role | undefined;
      const resolvedRole = userRole ?? (role === 'student' ? 'student' : undefined);

      if (resolvedRole !== role) {
        await firebaseAuth.signOut();
        const detail = userRole
          ? `This account is registered as ${userRole}.`
          : `This account does not have a role assigned yet.`;
        throw new Error(
          `${detail} Please use the correct login page or ask an admin to assign your role.`
        );
      }

      // 3. Exchange ID token for an HttpOnly session cookie
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error('Failed to create session');
      }

      // 4. Redirect to the role's destination
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()
          : 'Sign in failed';
      setError(message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <span
          className={`inline-block border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${meta.color}`}
        >
          {role}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-slate-900">
          {meta.label}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{meta.subtitle}</p>
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
            <label htmlFor="email" className="block text-sm font-medium text-slate-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
              placeholder="you@bnhs.edu.ph"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-900">
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
        Wrong page?{' '}
        <Link href="/" className="font-medium text-[#0f1f3a] hover:underline">
          Return home
        </Link>
      </p>
    </div>
  );
}
