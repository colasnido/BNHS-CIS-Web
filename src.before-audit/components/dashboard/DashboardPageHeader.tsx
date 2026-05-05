import type { ReactNode } from 'react';

interface DashboardPageHeaderProps {
  title: string;
  /** Optional context line below title — use sparingly, only when it adds info */
  description?: string;
  /** Right-side actions (buttons, etc.) */
  actions?: ReactNode;
}

/**
 * Page header for dashboard pages. Compact (less vertical padding than v1)
 * to maximize content area. The description is now optional and should be
 * used only when it adds genuinely new information — generic text like
 * "Manage your X" is removed across the redesign.
 */
export function DashboardPageHeader({
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
