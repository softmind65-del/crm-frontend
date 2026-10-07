import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly leadingIcon?: React.ReactNode;
  readonly trailingContent?: React.ReactNode;
  readonly containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leadingIcon,
    trailingContent,
    id,
    disabled,
    required,
    className = "",
    containerClassName = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(error);
  const errorId = hasError ? `${inputId}-error` : undefined;
  const helperId = !hasError && helperText ? `${inputId}-helper` : undefined;
  const describedBy = errorId ?? helperId;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground-dark mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <div
            className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground"
            aria-hidden="true"
          >
            {leadingIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={`w-full h-10 rounded-lg text-sm text-foreground-dark placeholder-muted-foreground bg-white border transition-colors focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            leadingIcon ? "pl-10" : "pl-3.5"
          } ${trailingContent ? "pr-10" : "pr-3.5"} ${
            hasError
              ? "border-red-500 focus:border-red-500"
              : "border-border-subtle focus:border-brand"
          } ${className}`}
          {...props}
        />
        {trailingContent && (
          <div className="absolute right-3.5 flex items-center text-muted-foreground">
            {trailingContent}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
