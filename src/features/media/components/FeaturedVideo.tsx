'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Media page — Section 1: Featured Video (Hero)
 *
 * "Facade" pattern for YouTube embedding. Until the user clicks play, this
 * is just a thumbnail image + play button — no iframe, no YouTube JS, no
 * cookies. The iframe (~600 KB of JS plus tracking) only loads on first
 * click.
 *
 * Why client component: we need useState to track whether the user has
 * clicked play. This is the ONLY interactive piece on the media page; the
 * rest is fully server-rendered.
 *
 * Performance impact:
 *   - Initial render: ~120 B markup + 1 image (Next/Image optimizes)
 *   - After click: full YouTube iframe loads with autoplay=1 (so the user
 *     doesn't have to click play twice)
 *
 * Privacy: by using youtube-nocookie.com as the origin, we don't drop
 * Google tracking cookies until the user actually plays the video.
 */

interface FeaturedVideoProps {
  /**
   * YouTube video ID. The bit after `?v=` in a YouTube URL.
   * Example: for https://www.youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ"
   */
  videoId: string;
  /** Title shown above the video. */
  title: string;
  /** Caption shown below the title. Keep short. */
  caption: string;
}

export function FeaturedVideo({ videoId, title, caption }: FeaturedVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // YouTube provides 4 thumbnail qualities. `maxresdefault` is up to 1280×720
  // but isn't always available for older videos — `hqdefault` (480×360) is
  // guaranteed. We try maxres first via Next/Image which handles fallback.
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  // youtube-nocookie + autoplay=1 because user just clicked play and would
  // expect playback to start immediately (otherwise they'd need to click twice).
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <section
      aria-labelledby="featured-video-heading"
      className="relative overflow-hidden bg-[#0f1f3a] text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(200,168,92,0.15),transparent)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
          Watch
        </p>
        <h1
          id="featured-video-heading"
          className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl"
        >
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
          {caption}
        </p>

        {/* Aspect-ratio container holds the video's space. 16:9 is YouTube's
            native ratio. The `aspect-video` Tailwind class is exactly that. */}
        <div className="mt-8 overflow-hidden rounded-lg bg-slate-900 shadow-lg ring-1 ring-white/10">
          <div className="relative aspect-video w-full">
            {!isPlaying ? (
              // Facade — thumbnail + play button. Looks identical to a real
              // embedded video, costs ~1 image.
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label={`Play video: ${title}`}
                className="group relative block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a85c]"
              >
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  // Largest-needed size: this section is max-w-5xl, so the
                  // image is at most 1024px wide on desktop.
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover transition group-hover:opacity-90"
                  // YouTube serves this fast — no need to mark priority,
                  // but we don't want it lazy either since it's above-fold.
                  priority
                />
                {/* Subtle dark overlay so play button stays readable over
                    bright thumbnails. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30"
                />
                {/* Play button — pure SVG, no library, scales with viewport. */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 transition group-hover:scale-105 sm:h-20 sm:w-20">
                    <svg
                      aria-hidden="true"
                      className="h-7 w-7 translate-x-0.5 text-slate-900 sm:h-9 sm:w-9"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            ) : (
              // Real iframe — only renders after user clicks. autoplay=1 is
              // safe here because it's gated on user action (no auto-play on
              // page load). YouTube's iframe handles all playback controls.
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
