"use client";

import React from "react";

export interface TablePaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalRecords?: number;
  readonly pageSize?: number;
  readonly pageSizeOptions?: readonly number[];
  readonly onPageChange?: (page: number) => void;
  readonly onPageSizeChange?: (pageSize: number) => void;
  readonly className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 20, 50];

function getPaginationRange(
  currentPage: number,
  totalPages: number
): readonly (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export function TablePagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  className = "",
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, safeTotalPages));
  const pages = getPaginationRange(safeCurrentPage, safeTotalPages);

  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeTotalPages;

  let summaryText = `Page ${safeCurrentPage} of ${safeTotalPages}`;
  if (totalRecords === 0) {
    summaryText = "0 results";
  } else if (totalRecords !== undefined && pageSize !== undefined && pageSize > 0) {
    const fromRecord = (safeCurrentPage - 1) * pageSize + 1;
    const toRecord = Math.min(safeCurrentPage * pageSize, totalRecords);
    if (fromRecord <= toRecord) {
      summaryText = `Showing ${fromRecord}–${toRecord} of ${totalRecords} results`;
    } else {
      summaryText = `${totalRecords} results`;
    }
  } else if (totalRecords !== undefined) {
    summaryText = `${totalRecords} total results`;
  }

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border-subtle bg-white ${className}`}
    >
      {/* Record Summary */}
      <div className="text-xs text-muted-foreground select-none">
        {summaryText}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Controlled Page Size Selector */}
        {pageSize !== undefined && (
          <div className="relative inline-flex items-center mr-1">
            <select
              value={pageSize}
              disabled={!onPageSizeChange}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              aria-label="Records per page"
              className="appearance-none h-8 pl-2.5 pr-7 text-xs font-medium text-foreground-dark bg-white border border-border-subtle rounded-lg cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} page
                </option>
              ))}
            </select>
            <div
              className="absolute right-2 pointer-events-none text-muted-foreground flex items-center"
              aria-hidden="true"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        )}

        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Previous page"
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-white text-foreground-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Mobile Page Indicator */}
        <span className="sm:hidden text-xs font-medium text-foreground-dark px-1.5 select-none">
          {safeCurrentPage} / {safeTotalPages}
        </span>

        {/* Desktop Numbered Page Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="h-8 w-7 flex items-center justify-center text-xs text-muted-foreground select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = item === safeCurrentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange?.(item)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 cursor-pointer ${
                  isCurrent
                    ? "bg-brand text-white border border-brand shadow-xs focus-visible:bg-brand-hover"
                    : "bg-white text-foreground-dark border border-border-subtle hover:bg-slate-50 focus-visible:bg-slate-100"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-white text-foreground-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
