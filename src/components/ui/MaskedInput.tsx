"use client";

import { useId, type ChangeEvent } from "react";
import { TextInput } from "@/components/dashboard/Field";

/**
 * Input with built-in masking. Filters keystrokes at typing time so invalid
 * characters never enter the value.
 *
 * Why not regex on submit? Two reasons:
 *   1. The user typing a hyphen and seeing it disappear is a clearer
 *      signal than a validation error after submit ("oh, can't include
 *      hyphens — got it").
 *   2. Server-side normalizers still strip stray characters as a backstop.
 *      The mask is for UX; the normalizer is for safety.
 *
 * Accessibility: we don't add `inputMode` or `pattern` automatically beyond
 * what the mask requires — the underlying TextInput accepts those props
 * and they're forwarded. Set inputMode="numeric" on the consumer if you
 * want the mobile numeric keyboard.
 */

type MaskName = "lrn" | "phone-ph" | "date" | "digits";

interface MaskedInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  /**
   * Built-in mask preset.
   *   lrn      — 12-digit LRN: digits only, max length 12
   *   phone-ph — Philippine mobile: digits/spaces, max length 13 (e.g. 0917 123 4567)
   *   date     — ISO date: digits + dashes, max length 10 (YYYY-MM-DD); the
   *              dashes auto-insert as the user types
   *   digits   — generic: digits only, no length cap
   */
  mask: MaskName;
  value: string;
  onChange: (next: string) => void;
}

/**
 * Mask transforms. Each takes the raw input value and returns the masked
 * value. Pure functions — no side effects.
 */
const transforms: Record<MaskName, (raw: string) => string> = {
  lrn: (raw) => raw.replace(/\D/g, "").slice(0, 12),

  "phone-ph": (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    // Format as 0917 123 4567 — three groups, dynamic
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  },

  date: (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    // Auto-insert dashes: YYYY-MM-DD
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  },

  digits: (raw) => raw.replace(/\D/g, ""),
};

export function MaskedInput({
  mask,
  value,
  onChange,
  ...rest
}: MaskedInputProps) {
  const id = useId();
  const inputId = rest.id ?? id;

  const transform = transforms[mask];

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = transform(e.target.value);
    onChange(masked);
  }

  return (
    <TextInput
      {...rest}
      id={inputId}
      value={value}
      onChange={handleChange}
      // Sensible defaults that callers can still override
      inputMode={
        mask === "lrn" || mask === "digits" ? "numeric" : rest.inputMode
      }
      autoComplete={rest.autoComplete ?? "off"}
    />
  );
}
