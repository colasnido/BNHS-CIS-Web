import type { ReactNode } from 'react';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  /** Right-side actions (e.g. "New event" button) */
  actions?: ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
