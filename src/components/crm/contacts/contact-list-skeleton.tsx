import React from "react";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export function ContactListSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading contacts"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-pulse">
        <div className="h-10 flex-1 bg-slate-100 rounded-lg border border-border-subtle" />
        <div className="h-10 w-24 bg-slate-100 rounded-lg border border-border-subtle shrink-0" />
      </div>

      <DataTableSkeleton columns={7} rows={5} showPagination={true} />
    </div>
  );
}
