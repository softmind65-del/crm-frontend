import React from "react";

export interface FormFieldProps {
  readonly label?: string;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly helperText?: string;
  readonly error?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Reusable semantic layout wrapper for custom or composed form controls.
 *
 * When `htmlFor` is supplied, helper and error elements are assigned stable IDs:
 * - Error: `${htmlFor}-error`
 * - Helper: `${htmlFor}-helper`
 *
 * This allows child inputs to link their `aria-describedby` attribute cleanly.
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  children,
  className = "",
}: FormFieldProps) {
  const hasError = Boolean(error);
  const errorId = hasError && htmlFor ? `${htmlFor}-error` : undefined;
  const helperId =
    !hasError && helperText && htmlFor ? `${htmlFor}-helper` : undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-foreground-dark"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1 select-none" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
