/**
 * Skeleton loaders.
 *
 * Two layers:
 *   1. PRIMITIVES — atomic shapes you compose into anything: <SkeletonLine>,
 *      <SkeletonBlock>, <SkeletonCircle>. Use these for one-off layouts.
 *   2. COMPOSED — ready-to-use page-level skeletons that mirror common
 *      layouts: <TablePageSkeleton>, <FormPageSkeleton>, <OverviewSkeleton>.
 *      Use these via Next.js `loading.tsx` files for instant feedback.
 *
 * Animation: a single CSS pulse via Tailwind's `animate-pulse`. No JS, no
 * library. Browser-native, GPU-friendly. The pulse is subtle enough not to
 * be distracting but visible enough that users see the page is loading.
 *
 * Color: slate-200 fill on white background. Doesn't draw attention to
 * itself the way a brightly-colored "skeleton" would. Looks like the page
 * just hasn't decided what to put there yet.
 */

// ─────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────

interface PrimitiveProps {
  className?: string;
}

/**
 * One line of placeholder text. Width controlled via className (e.g.,
 * `w-1/2`, `w-32`). Default width is 100% so it fills its container.
 */
export function SkeletonLine({ className = '' }: PrimitiveProps) {
  return (
    <div
      aria-hidden="true"
      className={`h-4 animate-pulse rounded bg-slate-200 ${className}`}
    />
  );
}

/**
 * A larger placeholder block. Used for image placeholders, card bodies,
 * stat numbers, etc. Sized via className.
 */
export function SkeletonBlock({ className = '' }: PrimitiveProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-slate-200 ${className}`}
    />
  );
}

/**
 * Circular placeholder, for avatars and icons. Default 40px.
 */
export function SkeletonCircle({ className = 'h-10 w-10' }: PrimitiveProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-full bg-slate-200 ${className}`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Composed — match real page shapes
// ─────────────────────────────────────────────────────────────────

/**
 * Skeleton for a table-based admin page (Users, Classes, Subjects, etc.).
 *
 * Mirrors the structure of those pages:
 *   - Page header with title + action button
 *   - Search bar + filters
 *   - Table with N rows
 *
 * The dimensions are deliberately approximate. The goal is "this rectangle
 * is roughly where data will be", not pixel-perfect mimicry.
 */
export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading table" className="p-6 sm:p-8">
      {/* Header — matches DashboardPageHeader */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex-1">
          <SkeletonLine className="h-7 w-48" />
          <SkeletonLine className="mt-2 h-4 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-10 w-full max-w-sm" />
        <SkeletonBlock className="h-10 w-32" />
        <SkeletonBlock className="h-10 w-32" />
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <SkeletonLine className="h-3 w-20" />
        </div>
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 p-4"
              // Slight delay per row makes the pulse feel less mechanical
              // — each row's pulse is a few ms offset from its neighbors.
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <SkeletonLine className="w-1/3" />
              <SkeletonLine className="w-1/4" />
              <SkeletonLine className="w-1/6" />
              <SkeletonLine className="w-1/6" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

/**
 * Skeleton for a form-based page (Edit user, New event, etc.).
 *
 * Centered max-width container, then a stack of label + input pairs.
 * Action row at the bottom.
 */
export function FormPageSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div role="status" aria-label="Loading form" className="p-6 sm:p-8">
      <div className="mb-8">
        <SkeletonLine className="h-7 w-56" />
        <SkeletonLine className="mt-2 h-4 w-72" />
      </div>
      <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="space-y-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
              <SkeletonLine className="h-4 w-24" />
              <SkeletonBlock className="mt-2 h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

/**
 * Skeleton for a dashboard overview page — stat cards on top, then content
 * below. Used for /dashboard/admin, /dashboard/faculty, etc.
 */
export function OverviewSkeleton({ statCards = 4 }: { statCards?: number }) {
  return (
    <div role="status" aria-label="Loading overview" className="p-6 sm:p-8">
      <div className="mb-8">
        <SkeletonLine className="h-7 w-48" />
        <SkeletonLine className="mt-2 h-4 w-80" />
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <div
            key={i}
            className="border border-slate-200 bg-white p-5"
          >
            <SkeletonLine className="h-3 w-20" />
            <SkeletonBlock className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Two-column section below */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-slate-200 bg-white p-6">
          <SkeletonLine className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-5/6" />
            <SkeletonLine className="w-4/6" />
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-6">
          <SkeletonLine className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-5/6" />
            <SkeletonLine className="w-4/6" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
