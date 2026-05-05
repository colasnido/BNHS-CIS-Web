'use client';

import Image, { type StaticImageData } from 'next/image';
import { useState } from 'react';

interface LogoProps {
  /** Path to image in /public, or remote URL. If missing/fails, falls back to text. */
  src?: string | StaticImageData;
  /** Initials/text shown when image is unavailable. */
  fallbackText?: string;
  /** Inverted color scheme (for dark backgrounds). */
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { px: 32, className: 'h-8 w-8' },
  md: { px: 36, className: 'h-9 w-9' },
  lg: { px: 48, className: 'h-12 w-12' },
};

export function Logo({
  src,
  fallbackText = 'B',
  inverted = false,
  size = 'md',
}: LogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions = sizeMap[size];

  const showImage = src && !imageFailed;

  if (showImage) {
    return (
      <span className={`relative inline-block ${dimensions.className}`}>
        <Image
          src={src}
          alt=""
          width={dimensions.px}
          height={dimensions.px}
          className="h-full w-full object-contain"
          priority
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  // Fallback: stylized letter mark
  const colorClass = inverted
    ? 'bg-[#c8a85c] text-[#0f1f3a]'
    : 'bg-[#0f1f3a] text-white';

  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center font-serif font-bold ${dimensions.className} ${colorClass}`}
    >
      {fallbackText}
    </span>
  );
}
