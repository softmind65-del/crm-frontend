"use client";

import React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

export interface CustomerToolbarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onSearchClear?: () => void;
  readonly isFilterOpen: boolean;
  readonly onToggleFilter: () => void;
  readonly activeFilterCount?: number;
}

export function CustomerToolbar({
  searchQuery,
  onSearchChange,
  onSearchClear,
  isFilterOpen,
  onToggleFilter,
  activeFilterCount = 0,
}: CustomerToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search Input using available row width */}
      <div className="min-w-0 flex-1">
        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onSearchClear ?? (() => onSearchChange(""))}
          placeholder="Search by name, company, email or phone..."
        />
      </div>

      {/* Filter Toggle Button directly beside search */}
      <div className="shrink-0 self-end sm:self-auto">
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
          className={`h-10 ${activeFilterCount > 0 ? "border-brand/40 text-brand" : ""}`}
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-brand select-none">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

