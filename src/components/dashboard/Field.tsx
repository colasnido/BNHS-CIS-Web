'use client';

import type { ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

/**
 * Form primitives — drop-in replacement for the previous Field.tsx.
 *
 * What changed from the previous version:
 *   - Removed `rounded-md` and `shadow-sm` to match the public site's
 *     squared, low-decoration aesthetic. Now the dashboard and the public
 *     site share one visual language.
 *   - Replaced blue (`focus:border-blue-500`, `bg-blue-600`) with navy
 *     (#0f1f3a) and a gold focus ring (#c8a85c).
 *   - FormActions now uses the shared <Button> component instead of
 *     inline classes — one source of truth for button visuals.
 *
 * What stayed the same:
 *   - Component names and props. <Field>, <TextInput>, <TextArea>,
 *     <Select>, <Checkbox>, <FormActions>, <FormErrorBanner>. Every
 *     existing form continues to work without changes.
 */

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

const inputClass =
  'mt-1.5 block w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#0f1f3a] focus:outline-2 focus:outline-offset-2 focus:outline-[#c8a85c] disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-rose-400 aria-invalid:focus:outline-rose-500';

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
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-900"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-rose-600">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
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

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        // Custom focus ring uses gold to match the rest of the system.
        // Note: the checkbox itself stays small slate-styled — checking it
        // green would clash with the destructive=rose convention.
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
  /** When true, the submit button uses destructive (rose) styling. Use for
   *  irreversible actions like deletion forms. */
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
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
      )}
      <Button
        type="submit"
        variant={destructive ? 'destructive' : 'primary'}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
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
