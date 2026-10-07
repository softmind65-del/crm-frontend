import React from "react";

export interface DealPipelineSkeletonProps {
  readonly showToolbar?: boolean;
}

export function DealPipelineSkeleton({ showToolbar = true }: DealPipelineSkeletonProps = {}) {
  const columnHeaders = ["Stage 1", "Stage 2", "Stage 3", "Won", "Lost"];

  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading deals pipeline"
    >
      {/* Toolbar Skeleton */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex-1 max-w-md h-10 bg-slate-100 rounded-lg border border-border-subtle" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-slate-100 rounded-lg border border-border-subtle" />
            <div className="h-10 w-28 bg-slate-100 rounded-lg border border-border-subtle" />
          </div>
        </div>
      )}

      {/* Summary Bar Skeleton */}
      <div className="h-10 bg-slate-100 rounded-xl border border-border-subtle animate-pulse" />

      {/* Columns Pipeline Skeleton */}
      <div className="w-full overflow-x-auto pb-6 pt-1 scrollbar-thin">
        <div className="inline-flex items-start gap-4 min-w-full animate-pulse">
          {columnHeaders.map((title, idx) => (
            <div
              key={title}
              className="w-[320px] min-w-[320px] shrink-0 flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 min-h-[540px]"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    <div className="h-5 w-6 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              </div>

              {/* Cards Body */}
              <div className="flex-1 py-3 space-y-2.5">
                {Array.from({ length: idx === 0 ? 3 : idx === 1 ? 2 : 1 }).map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-white border border-border-subtle rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-4 w-4 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-4 w-14 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
