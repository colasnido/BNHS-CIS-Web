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
  'mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500';

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
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Cancel
        </a>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400 ${
          destructive
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-blue-600 hover:bg-blue-700'
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
      className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {error}
    </div>
  );
}
