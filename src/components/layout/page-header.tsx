import React from "react";

export interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border-subtle ${className}`}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground-dark">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 shrink-0">
          {action}
        </div>
      )}
    </header>
  );
}
