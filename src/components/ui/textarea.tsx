import React, { forwardRef, useId } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      helperText,
      id,
      disabled,
      required,
      className = "",
      containerClassName = "",
      rows = 4,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hasError = Boolean(error);
    const errorId = hasError ? `${textareaId}-error` : undefined;
    const helperId = !hasError && helperText ? `${textareaId}-helper` : undefined;
    const describedBy = errorId ?? helperId;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={`w-full min-h-[96px] rounded-lg text-sm text-foreground-dark placeholder-muted-foreground bg-white border p-3.5 resize-y transition-colors focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            hasError
              ? "border-red-500 focus:border-red-500"
              : "border-border-subtle focus:border-brand"
          } ${className}`}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600"
          >
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
  }
);

Textarea.displayName = "Textarea";
