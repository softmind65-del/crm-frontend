import React, { forwardRef, useId } from "react";


export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly placeholder?: string;
  readonly containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      helperText,
      placeholder,
      id,
      disabled,
      required,
      className = "",
      containerClassName = "",
      children,
      defaultValue,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hasError = Boolean(error);
    const errorId = hasError ? `${selectId}-error` : undefined;
    const helperId = !hasError && helperText ? `${selectId}-helper` : undefined;
    const describedBy = errorId ?? helperId;

    // When placeholder is provided and component is uncontrolled without defaultValue,
    // default to empty string so placeholder is initially selected.
    const computedDefaultValue =
      defaultValue !== undefined
        ? defaultValue
        : placeholder !== undefined && props.value === undefined
        ? ""
        : undefined;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            defaultValue={computedDefaultValue}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={`w-full h-10 appearance-none rounded-lg text-sm text-foreground-dark bg-white border pl-3.5 pr-10 transition-colors focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
              hasError
                ? "border-red-500 focus:border-red-500"
                : "border-border-subtle focus:border-brand"
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <div
            className="absolute right-3.5 flex items-center pointer-events-none text-muted-foreground"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
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

Select.displayName = "Select";
