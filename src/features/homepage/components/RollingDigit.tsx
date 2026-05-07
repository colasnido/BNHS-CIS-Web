"use client";

import { useEffect, useState } from "react";

/**
 * RollingDigit — a single digit position. On mount, animates from 0 to the
 * target digit by translating a vertical strip of 0–9.
 *
 * How it works:
 *   - The visible "window" is a fixed-height div with overflow:hidden.
 *   - Inside is a flex column of <div>s containing 0,1,2,...9 stacked
 *     vertically. Each cell has the same height as the window.
 *   - We translateY the strip by `-target * 100%` so digit `target`
 *     lands in the visible window.
 *   - The CSS transition gives us the smooth slide for free — no JS
 *     timer, no requestAnimationFrame loop. The browser handles
 *     interpolation on the GPU.
 *
 * Why use CSS transitions instead of per-frame JS:
 *   - GPU-accelerated translateY is silky smooth at 60fps on any device,
 *     including phones that struggle with JS-driven animations
 *   - Browser auto-skips frames when the tab is backgrounded
 *   - One CSS rule, zero render thrash
 *
 * The digit value is the FINAL digit (0-9). A negative value means
 * "this position has no digit" (used to hide leading-zero positions).
 */

interface RollingDigitProps {
  /** The digit to settle on (0–9). */
  digit: number;
  /** Animation duration in ms. */
  duration: number;
  /** Animation start delay in ms. Used to stagger across multiple digits. */
  delay: number;
}

export function RollingDigit({ digit, duration, delay }: RollingDigitProps) {
  // We start at translateY(0) (showing digit 0) and animate to the target.
  // useState + useEffect ensures the initial render is at 0, then on mount
  // we trigger a re-render at the target. The CSS transition handles the
  // rest.
  const [animateTo, setAnimateTo] = useState(0);

  useEffect(() => {
    // Microtask delay so the browser registers the initial 0-state in the
    // DOM before we mutate to the target. Without this, the transition
    // wouldn't fire (browser would see only the final value).
    const id = window.setTimeout(() => setAnimateTo(digit), 16);
    return () => window.clearTimeout(id);
  }, [digit]);

  return (
    // Window: shows exactly one digit's worth of height.
    // `leading-none` removes line-height padding so the digit fills cleanly.
    // `tabular-nums` ensures every digit takes the same width.
    <span
      aria-hidden="true"
      className="relative inline-block h-[1em] overflow-hidden leading-none tabular-nums"
      // Width of one digit. `1ch` means "the width of the '0' character",
      // which for tabular-nums means every digit position is the same width.
      style={{ width: "1ch" }}
    >
      {/* The strip: 10 stacked digits. translateY moves it by -N*100% so
          digit N is visible in the window. transition handles the slide. */}
      <span
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{
          transform: `translateY(-${animateTo}em)`,
          transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          willChange: "transform",
        }}
      >
        {/* Render digits 0-9 as individual rows. Each row is 1em tall, so
            the strip is 10em total height. translateY(-N*100%) moves
            up by N rows. */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em] leading-none">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
