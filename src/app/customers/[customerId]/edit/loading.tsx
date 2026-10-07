import React from "react";

export default function CustomerEditLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading customer edit form">
      <div className="space-y-2 pb-4 border-b border-border-subtle">
        <div className="h-7 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded" />
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-44 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="max-w-md space-y-2">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-44 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="h-5 w-44 bg-slate-200 rounded pb-3 border-b border-border-subtle" />
          <div className="max-w-xs space-y-2">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <div className="h-10 w-20 bg-slate-100 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
