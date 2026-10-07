import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
  readonly loadingText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-active border border-transparent shadow-xs focus-visible:bg-brand-hover",
  secondary:
    "bg-white text-foreground-dark hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 border border-border-subtle shadow-xs focus-visible:bg-slate-100 focus-visible:text-foreground-dark",
  ghost:
    "bg-transparent text-foreground-dark hover:bg-slate-100 hover:text-brand active:bg-slate-200/70 border border-transparent focus-visible:bg-slate-100 focus-visible:text-brand",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent shadow-xs focus-visible:bg-red-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm font-medium rounded-lg",
  lg: "h-12 px-5 text-base font-medium rounded-lg",
};

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    type = "button",
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    disabled,
    className = "",
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const gapClass = size === "sm" ? "gap-1.5" : size === "lg" ? "gap-2.5" : "gap-2";

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      className={`relative inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span
        className={`inline-flex items-center justify-center ${gapClass} ${
          isLoading ? "invisible select-none" : ""
        }`}
        aria-hidden={isLoading ? true : undefined}
      >
        {leftIcon && (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{children}</span>
        {rightIcon && (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </span>
      {isLoading && (
        <span
          className={`absolute inset-0 flex items-center justify-center ${gapClass}`}
        >
          <LoadingSpinner />
          {loadingText ? (
            <span>{loadingText}</span>
          ) : (
            <span className="sr-only">Loading</span>
          )}
        </span>
      )}
    </button>
  );
});

Button.displayName = "Button";
