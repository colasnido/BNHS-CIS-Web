'use client';

import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

const inputClass =
  'mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c] disabled:bg-slate-50 disabled:text-slate-500';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-900">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-rose-600">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** override default styling if needed */
  className?: string;
}

export function TextInput({ className = '', ...props }: TextInputProps) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function TextArea({ className = '', ...props }: TextAreaProps) {
  return <textarea className={`${inputClass} ${className}`} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: ReactNode;
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 border-slate-300 text-[#0f1f3a] focus:ring-2 focus:ring-[#c8a85c] focus:ring-offset-1"
        {...props}
      />
      <span className="text-sm text-slate-900">{label}</span>
    </label>
  );
}

interface FormActionsProps {
  submitLabel: string;
  isSubmitting: boolean;
  cancelHref?: string;
  destructive?: boolean;
}

export function FormActions({
  submitLabel,
  isSubmitting,
  cancelHref,
  destructive = false,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
      {cancelHref && (
        <a
          href={cancelHref}
          className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
        >
          Cancel
        </a>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c] disabled:cursor-not-allowed disabled:bg-slate-400 ${
          destructive
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-[#0f1f3a] hover:bg-[#1a2f5a]'
        }`}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

export function FormErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {error}
    </div>
  );
}
