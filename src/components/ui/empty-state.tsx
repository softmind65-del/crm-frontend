import React from "react";

export interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border-subtle bg-white ${className}`}
    >
      {icon && (
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-muted-foreground mb-4 shrink-0"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground-dark">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
