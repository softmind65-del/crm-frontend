import React from "react";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
  readonly dot?: boolean;
  readonly children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
  info: "bg-blue-50 text-brand border-blue-200/80",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const dotStyles: Record<BadgeVariant, string> = {
  neutral: "bg-slate-400",
  info: "bg-brand",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
