import React from "react";

export function CustomerDetailSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading customer details"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border-subtle">
        <div className="h-7 w-48 bg-slate-200 rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-slate-100 rounded" />
          <div className="h-4 w-2 bg-slate-200 rounded-full" />
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
      </div>

      {/* 4 Section Skeletons */}
      <div className="space-y-5">
        {/* Section 1: Customer Information */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-44 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-44 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>

        {/* Section 3: Address */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-20 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-slate-100 rounded" />
            <div className="h-4 w-72 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Section 4: Record Information */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-36 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
