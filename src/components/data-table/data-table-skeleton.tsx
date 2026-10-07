import React from "react";

export interface DataTableSkeletonProps {
  readonly columns?: number;
  readonly rows?: number;
  readonly showPagination?: boolean;
  readonly className?: string;
}

export function DataTableSkeleton({
  columns = 6,
  rows = 5,
  showPagination = true,
  className = "",
}: DataTableSkeletonProps) {
  return (
    <div
      className={`bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs animate-pulse ${className}`}
      aria-busy="true"
      aria-label="Loading table data"
    >
      <div className="border-b border-slate-200/90 px-4 py-3 bg-white flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === columns - 1;
          const widthClass = isFirst
            ? "w-28"
            : isLast
            ? "w-10 ml-auto"
            : idx % 2 === 0
            ? "w-20"
            : "w-24";
          const responsiveClass =
            idx > 4
              ? ""
              : idx > 3
              ? "hidden lg:block"
              : idx > 2
              ? "hidden md:block"
              : idx > 1
              ? "hidden sm:block"
              : "";

          return (
            <div
              key={idx}
              className={`h-4 bg-slate-200 rounded ${widthClass} ${responsiveClass}`}
            />
          );
        })}
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="px-4 py-3.5 flex items-center justify-between gap-4"
          >
            {Array.from({ length: columns }).map((_, colIdx) => {
              const isFirst = colIdx === 0;
              const isLast = colIdx === columns - 1;
              const responsiveClass =
                colIdx > 4
                  ? ""
                  : colIdx > 3
                  ? "hidden lg:block"
                  : colIdx > 2
                  ? "hidden md:block"
                  : colIdx > 1
                  ? "hidden sm:block"
                  : "";

              if (isFirst) {
                return (
                  <div key={colIdx} className="w-[20%] min-w-[140px] space-y-1.5">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                );
              }

              if (isLast) {
                return (
                  <div key={colIdx} className="w-[6%] min-w-[40px] flex justify-end">
                    <div className="h-5 w-5 bg-slate-100 rounded" />
                  </div>
                );
              }

              return (
                <div key={colIdx} className={`space-y-1 ${responsiveClass}`}>
                  <div className="h-3.5 w-24 bg-slate-100 rounded" />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showPagination && (
        <div className="px-4 py-3 border-t border-border-subtle bg-white flex items-center justify-between">
          <div className="h-3.5 w-36 bg-slate-100 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            <div className="h-8 w-8 bg-slate-100 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
