'use client';

import { RollingNumber } from './RollingNumber';

/**
 * AnimatedCount — drop-in replacement that now uses true rolling-digit
 * animation instead of the simpler tween-the-value-up approach.
 *
 * The export name and prop shape are preserved so HeroSection (and any
 * other call sites) don't need to change. Internally this delegates to
 * RollingNumber, which renders each digit as its own column that slides
 * vertically into place — the classic odometer effect.
 *
 * If you ever want to swap back to the simple tween version (e.g., for
 * a context where the rolling effect is too showy), just change the
 * RollingNumber import back to the previous useCountUp-based code.
 */

interface Props {
  /** Final value as string. May contain commas, percent, plus signs. */
  formatted: string;
}

export function AnimatedCount({ formatted }: Props) {
  return <RollingNumber formatted={formatted} />;
}
