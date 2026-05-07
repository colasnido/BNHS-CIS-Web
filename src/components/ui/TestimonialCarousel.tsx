'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface TestimonialItem {
  description: string;
  name: string;
  role: string;
}

interface Props {
  data: TestimonialItem[];
  intervalMs?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TestimonialCarousel({ data, intervalMs = 6000 }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused || data.length <= 1) return;
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % data.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [data.length, intervalMs, paused]);

  // Keyboard nav: arrow keys cycle, Home/End jump. Convention for ARIA
  // tablist patterns; without it the dots are only reachable by tabbing
  // through every one.
  function handleTabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % data.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + data.length) % data.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = data.length - 1;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* aria-live announces the active testimonial when it changes
          (auto-rotate or user click). Inactive figures are aria-hidden so
          SR users only hear the active one. */}
      <div className="grid" aria-live="polite" aria-atomic="true">
        {data.map((t, i) => {
          const isActive = i === active;
          return (
            <figure
              key={i}
              aria-hidden={!isActive}
              className={`col-start-1 row-start-1 text-center motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-out ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <span
                aria-hidden="true"
                className="font-serif text-7xl leading-none text-[#c8a85c]"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 font-serif text-2xl leading-snug text-slate-900 sm:text-3xl">
                {t.description}
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center bg-[#0f1f3a] font-serif text-sm font-semibold text-[#c8a85c]"
                >
                  {getInitials(t.name)}
                </span>
                <span className="text-left">
                  <span className="block font-semibold text-slate-900">
                    {t.name}
                  </span>
                  <span className="block text-slate-600">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div
        className="mt-10 flex justify-center gap-1"
        role="tablist"
        aria-label="Select testimonial"
      >
        {data.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show testimonial from ${t.name}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => handleTabKey(e, i)}
              className="group flex h-11 w-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
            >
              <span
                aria-hidden="true"
                className={`block h-2 motion-safe:transition-all ${
                  isActive
                    ? 'w-8 bg-gradient-to-r from-[#d4b674] via-[#c8a85c] to-[#a8893d]'
                    : 'w-2 bg-slate-300 group-hover:bg-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
