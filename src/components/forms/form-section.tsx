import React from "react";

export interface FormSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function FormSection({
  title,
  description,
  action,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section
      className={`bg-white border border-border-subtle rounded-xl p-6 space-y-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-border-subtle">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground-dark">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {action}
          </div>
        )}
      </div>

      <div>{children}</div>
    </section>
  );
}
