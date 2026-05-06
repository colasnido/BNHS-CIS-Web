'use client';

import { useState } from 'react';

/**
 * Admin "Reset password" button + result modal.
 *
 * Three states:
 *   1. Idle — shows the button. Clicking opens a confirm dialog.
 *   2. Confirm — modal asks "Are you sure?" with a brief warning.
 *   3. Result — shows the new temp password, with a copy button. This is
 *      the ONLY time the admin will see this password; once they close the
 *      modal it's gone.
 *
 * Why a confirm step: a click in the wrong place shouldn't blow away a
 * user's password. The confirm makes the destructive nature explicit
 * (revokes their sessions, forces change on next login).
 */

interface Props {
  /** UID of the user whose password is being reset. */
  userId: string;
  /** Display name shown in confirmation copy ("Reset password for X?"). */
  userDisplayName: string;
}

type Phase = 'idle' | 'confirm' | 'submitting' | 'result' | 'error';

export function ResetPasswordButton({ userId, userDisplayName }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleConfirm() {
    setPhase('submitting');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
      });
      const data: { tempPassword?: string; error?: string } = await res.json();
      if (!res.ok || !data.tempPassword) {
        throw new Error(data.error || `Reset failed (${res.status})`);
      }
      setTempPassword(data.tempPassword);
      setPhase('result');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to reset password'
      );
      setPhase('error');
    }
  }

  async function handleCopy() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      // Reset the "Copied!" indicator after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on insecure contexts or older browsers.
      // The password is still visible in the modal; user can select+copy manually.
    }
  }

  function handleClose() {
    setPhase('idle');
    setTempPassword(null);
    setErrorMessage(null);
    setCopied(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPhase('confirm')}
        className="inline-flex items-center border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        Reset password
      </button>

      {/* Confirm dialog */}
      {phase === 'confirm' && (
        <Modal onClose={handleClose} ariaLabelledBy="reset-confirm-title">
          <h2
            id="reset-confirm-title"
            className="font-serif text-lg font-semibold text-slate-900"
          >
            Reset password for {userDisplayName}?
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            This will:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            <li>Generate a new temporary password</li>
            <li>Force the user to change it on their next login</li>
            <li>Sign them out of all current sessions</li>
          </ul>
          <p className="mt-3 text-sm font-medium text-slate-900">
            You&apos;ll see the temporary password on the next screen.
            <br />
            <strong>Write it down or copy it before closing — it won&apos;t be shown again.</strong>
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Yes, reset password
            </button>
          </div>
        </Modal>
      )}

      {/* Submitting */}
      {phase === 'submitting' && (
        <Modal onClose={() => undefined} ariaLabelledBy="reset-submitting-title">
          <h2 id="reset-submitting-title" className="font-serif text-lg font-semibold text-slate-900">
            Resetting password…
          </h2>
          <p className="mt-2 text-sm text-slate-600">Please wait.</p>
        </Modal>
      )}

      {/* Result with the temp password */}
      {phase === 'result' && tempPassword && (
        <Modal onClose={handleClose} ariaLabelledBy="reset-result-title">
          <h2
            id="reset-result-title"
            className="font-serif text-lg font-semibold text-slate-900"
          >
            Password reset
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            New temporary password for <strong>{userDisplayName}</strong>:
          </p>

          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 select-all border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-base tracking-wider text-slate-900">
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p>
              <strong>Give this to {userDisplayName} in person or on paper.</strong>
            </p>
            <p className="mt-1">
              They&apos;ll be required to set their own password the next time
              they log in. This screen will not show the password again — make
              sure you&apos;ve copied or written it down before closing.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#0f1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2f5a]"
            >
              I&apos;ve saved it — close
            </button>
          </div>
        </Modal>
      )}

      {/* Error */}
      {phase === 'error' && (
        <Modal onClose={handleClose} ariaLabelledBy="reset-error-title">
          <h2 id="reset-error-title" className="font-serif text-lg font-semibold text-rose-900">
            Couldn&apos;t reset password
          </h2>
          <p className="mt-3 text-sm text-rose-800">
            {errorMessage ?? 'An unexpected error occurred.'}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/**
 * Minimal modal wrapper. Single backdrop + centered card. Aria attributes
 * for screen readers; closes on backdrop click (unless onClose is no-op).
 */
function Modal({
  children,
  onClose,
  ariaLabelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  ariaLabelledBy: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={(e) => {
        // Only close on backdrop, not on inner card
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
