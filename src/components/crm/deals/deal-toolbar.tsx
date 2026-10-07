"use client";

import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { DealViewSwitch, DealViewMode } from "@/components/crm/deals/deal-view-switch";

export interface DealToolbarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onSearchClear?: () => void;
  readonly isFilterOpen: boolean;
  readonly onToggleFilter: () => void;
  readonly activeFilterCount?: number;
  readonly view?: DealViewMode;
  readonly onViewChange?: (view: DealViewMode) => void;
  readonly showViewSwitch?: boolean;
}

export function DealToolbar({
  searchQuery,
  onSearchChange,
  onSearchClear,
  isFilterOpen,
  onToggleFilter,
  activeFilterCount = 0,
  view = "pipeline",
  onViewChange,
  showViewSwitch = false,
}: DealToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="min-w-0 flex-1">
        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onSearchClear ?? (() => onSearchChange(""))}
          placeholder="Search deals..."
        />
      </div>

      {/* Controls: Customize Pipeline, Filter Toggle and View Switch */}
      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
        {view === "pipeline" && (
          <Link href="/settings/deal-pipeline">
            <Button
              variant="secondary"
              size="md"
              leftIcon={
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
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
            >
              <span>Customize Pipeline</span>
            </Button>
          </Link>
        )}

        <Button
          variant="secondary"
          size="md"
          onClick={onToggleFilter}
          aria-expanded={isFilterOpen}
          leftIcon={
            <svg
              className={`w-4 h-4 transition-colors shrink-0 ${
                activeFilterCount > 0 ? "text-brand" : "text-muted-foreground"
              }`}
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
        >
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-brand text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {showViewSwitch && onViewChange && (
          <DealViewSwitch view={view} onViewChange={onViewChange} />
        )}
      </div>
    </div>
  );
}
