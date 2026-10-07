"use client";

import React, { useId } from "react";
import { Button } from "@/components/ui/button";

export interface FilterPanelProps {
  readonly id?: string;
  readonly open?: boolean;
  readonly title?: React.ReactNode;
  readonly children: React.ReactNode;

  readonly onClear?: () => void;
  readonly onCancel?: () => void;
  readonly onApply?: () => void;

  readonly clearLabel?: string;
  readonly cancelLabel?: string;
  readonly applyLabel?: string;

  readonly clearDisabled?: boolean;
  readonly applyDisabled?: boolean;
  readonly isApplying?: boolean;

  readonly className?: string;
}

export function FilterPanel({
  id,
  open = true,
  title = "Filters",
  children,
  onClear,
  onCancel,
  onApply,
  clearLabel = "Clear all",
  cancelLabel = "Cancel",
  applyLabel = "Apply filters",
  clearDisabled = false,
  applyDisabled = false,
  isApplying = false,
  className = "",
}: FilterPanelProps) {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const titleId = `${panelId}-title`;

  if (!open) {
    return null;
  }

  const hasFooter = Boolean(onCancel || onApply);

  return (
    <section
      id={panelId}
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? "Filters" : undefined}
      className={`bg-white border border-border-subtle rounded-xl p-5 sm:p-6 space-y-4 shadow-xs ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-muted-foreground shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          {title && (
            <h3
              id={titleId}
              className="text-sm font-semibold text-foreground-dark"
            >
              {title}
            </h3>
          )}
        </div>

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled || isApplying}
            className="text-xs font-medium text-muted-foreground hover:text-foreground-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 focus-visible:text-foreground-dark rounded-md px-1.5 py-0.5 cursor-pointer"
          >
            {clearLabel}
          </button>
        )}
      </div>

      {/* Filter Fields Content Area */}
      <div>{children}</div>

      {/* Footer Actions */}
      {hasFooter && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          {onCancel && (
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="px-4"
            >
              {cancelLabel}
            </Button>
          )}
          {onApply && (
            <Button
              variant="primary"
              size="md"
              onClick={onApply}
              isLoading={isApplying}
              disabled={applyDisabled || isApplying}
              leftIcon={
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
              }
              className="px-4"
            >
              {applyLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
