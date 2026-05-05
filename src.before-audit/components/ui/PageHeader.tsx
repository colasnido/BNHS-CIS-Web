interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
