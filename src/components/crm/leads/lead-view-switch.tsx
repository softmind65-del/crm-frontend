"use client";

import React from "react";

export type LeadViewMode = "table" | "pipeline";

export interface LeadViewSwitchProps {
  readonly view: LeadViewMode;
  readonly onViewChange: (view: LeadViewMode) => void;
  readonly className?: string;
}

export function LeadViewSwitch({
  view,
  onViewChange,
  className = "",
}: LeadViewSwitchProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={`inline-flex items-center p-1 bg-slate-100 border border-border-subtle rounded-lg text-xs font-medium shrink-0 ${className}`}
    >
      <button
        type="button"
        aria-pressed={view === "table"}
        onClick={() => onViewChange("table")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand ${
          view === "table"
            ? "bg-white text-foreground-dark shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground-dark"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M3 14h18m-9-4v8m-9-4h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z"
          />
        </svg>
        <span>Table</span>
      </button>

      <button
        type="button"
        aria-pressed={view === "pipeline"}
        onClick={() => onViewChange("pipeline")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand ${
          view === "pipeline"
            ? "bg-white text-brand shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground-dark"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <span>Pipeline</span>
      </button>
    </div>
  );
}
