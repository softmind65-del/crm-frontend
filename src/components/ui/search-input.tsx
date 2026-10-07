"use client";

import React, { forwardRef, useId } from "react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly onClear?: () => void;
  readonly containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      onClear,
      placeholder = "Search...",
      disabled = false,
      id,
      className = "",
      containerClassName = "",
      "aria-label": ariaLabel = "Search",
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasValue =
      value !== undefined && value !== null && String(value).length > 0;
    const showClearButton = Boolean(hasValue && onClear && !disabled);

    return (
      <div
        className={`relative flex items-center w-full ${containerClassName}`}
      >
        {/* Leading Search Icon */}
        <div
          className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground"
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Search Input Field */}
        <input
          ref={ref}
          id={inputId}
          type="search"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={`w-full h-10 rounded-lg text-sm text-foreground-dark placeholder-muted-foreground bg-white border border-border-subtle pl-10 ${
            showClearButton ? "pr-10" : "pr-3.5"
          } transition-colors focus:outline-none focus:ring-0 focus:border-brand disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${className}`}
          {...props}
        />

        {/* Clear Action Button */}
        {showClearButton && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-3 p-1 rounded-md text-muted-foreground hover:text-foreground-dark hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
