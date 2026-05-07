'use client';

import { useEffect, useState, useMemo } from 'react';
import { RollingDigit } from './RollingDigit';

/**
 * RollingNumber — animates a formatted number string onto the page using
 * per-digit rolling.
 *
 * Accepts strings like "381", "1,234", "82%", "20+". The numeric portion
 * gets the rolling animation per digit. Suffixes (%, +) and thousands
 * separators (,) appear instantly as static characters.
 *
 * Rolling-digit logic:
 *
 *   1. Split the formatted string into characters
 *   2. For each digit (0–9): render a <RollingDigit> with that digit
 *      as the target
 *   3. For each non-digit (",", "%", "+", letters): render as a static span
 *
 * Stagger:
 *   The leftmost digit starts first; subsequent digits start ~80ms later.
 *   This is what gives the "odometer" feel — digits spin into place
 *   sequentially rather than all at once. A real odometer's ones place
 *   moves last (it has the most distance to travel since it cycles
 *   through 0-9 fastest), but for this animation we want a calm, ordered
 *   reveal — the leftmost digit anchors first, then the rest fall in.
 *
 * Reduced motion:
 *   If the user has prefers-reduced-motion enabled, we skip the rolling
 *   and just render the final string statically.
 */

interface RollingNumberProps {
  /** The final formatted value, e.g. "381", "1,234", "82%". */
  formatted: string;
}

const PER_DIGIT_DELAY_MS = 80;
const ROLL_DURATION_MS = 1100;

export function RollingNumber({ formatted }: RollingNumberProps) {
  // SSR-safe: we render the static value during SSR and then upgrade to
  // the rolling version on client mount. This avoids hydration mismatches
  // (the server can't run animations) and means non-JS users see the
  // correct final value.
  const [hasMounted, setHasMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      setReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    }
  }, []);

  // Pre-split characters and compute each digit's stagger delay. Memoized
  // so we only do this work when the formatted string changes.
  const characters = useMemo(() => {
    let digitIndex = 0;
    return formatted.split('').map((char) => {
      if (/\d/.test(char)) {
        const item = {
          char,
          isDigit: true as const,
          digitIndex,
        };
        digitIndex++;
        return item;
      }
      return { char, isDigit: false as const };
    });
  }, [formatted]);

  // SSR or reduced-motion: render the static formatted value. tabular-nums
  // keeps the layout stable if the parent reserves width for the
  // animated version.
  if (!hasMounted || reducedMotion) {
    return <span className="tabular-nums">{formatted}</span>;
  }

  return (
    // Inline-flex so the digits and static chars sit on a single baseline.
    // tabular-nums on the wrapper ensures any non-rolling chars (commas,
    // suffixes) align consistently with the digit columns.
    <span className="inline-flex items-baseline tabular-nums">
      {characters.map((item, i) => {
        if (item.isDigit) {
          return (
            <RollingDigit
              key={i}
              digit={parseInt(item.char, 10)}
              duration={ROLL_DURATION_MS}
              delay={item.digitIndex * PER_DIGIT_DELAY_MS}
            />
          );
        }
        // Non-digit characters (commas, %, +) — render plain. These appear
        // immediately, which is intentional: a "%" sliding doesn't make
        // sense, and a comma sliding looks like a glitch.
        return (
          <span key={i} aria-hidden="true">
            {item.char}
          </span>
        );
      })}
      {/* Screen-reader text — the visual digits are aria-hidden because
          they read as "0123456789" which is gibberish. This sr-only span
          gives the actual value to assistive tech. */}
      <span className="sr-only">{formatted}</span>
    </span>
  );
}
