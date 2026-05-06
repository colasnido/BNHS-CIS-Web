'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase.client';

interface ChangePasswordFormProps {
  /** Current user's email (real or synthetic) — needed to re-authenticate */
  userEmail: string;
  /** True if user was redirected here by mustChangePassword. Shown as a banner. */
  wasForcedHere: boolean;
}

/**
 * Change-password form.
 *
 * Two-step verification:
 *   1. Re-authenticate the user CLIENT-SIDE with Firebase using their current
 *      password. This proves the person at the keyboard knows the password,
 *      not just that they're holding a stale session cookie.
 *   2. Send the new password to /api/auth/password. Server uses the Admin SDK
 *      to update Firebase Auth and clear the mustChangePassword flag in
 *      Firestore atomically.
 *
 * Why re-auth client-side instead of server-side: Firebase Admin SDK has no
 * "verify password" endpoint. The only way to prove someone knows a password
 * is to attempt a sign-in with it. Doing this client-side is the standard
 * Firebase pattern.
 */
export function ChangePasswordForm({
  userEmail,
  wasForcedHere,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation — same rules as server
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('New password must contain at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: re-authenticate to prove the user knows their current password.
      const user = firebaseAuth.currentUser;
      if (!user) {
        throw new Error('You are not signed in. Please sign in again.');
      }
      const credential = EmailAuthProvider.credential(
        userEmail,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Step 2: server updates the password and clears the flag.
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to change password');
      }

      // Step 3: success. The server revoked existing sessions, so we need
      // to sign back in. Easiest path: sign out client-side, then redirect
      // to the login page.
      setSuccess(true);

      // Sign out and clear the cookie so the user has a clean re-login.
      await fetch('/api/auth/session', { method: 'DELETE' });
      await firebaseAuth.signOut();

      // Brief delay to show the success message, then redirect.
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      const raw =
        err instanceof Error
          ? err.message
              .replace('Firebase: ', '')
              .replace(/\(auth\/.*?\)/, '')
              .trim()
          : 'Failed to change password';

      const isWrongCurrent =
        /invalid-credential|wrong-password|invalid-login/i.test(raw);
      setError(
        isWrongCurrent
          ? 'Your current password is incorrect.'
          : raw || 'Failed to change password'
      );
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="font-serif text-xl font-semibold text-emerald-900">
            Password changed
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            For your security, you&apos;ve been signed out. Redirecting to the
            home page so you can sign in with your new password…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
          Change Password
        </h1>
        {wasForcedHere ? (
          <p className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>First-time login.</strong> Please set a new password before
            continuing. You won&apos;t see this prompt again.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Update your account password.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-slate-200 bg-white p-8"
      >
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
              htmlFor="current-password"
              className="block text-sm font-medium text-slate-900"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-slate-900"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters, with at least one letter and one number.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-slate-900"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center bg-[#0f1f3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
