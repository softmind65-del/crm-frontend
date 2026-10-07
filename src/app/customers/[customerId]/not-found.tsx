import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-14 bg-white border border-border-subtle rounded-xl shadow-xs my-6">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-4 shrink-0"
        aria-hidden="true"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="text-base font-semibold text-foreground-dark">
        Customer not found
      </h2>

      <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
        This customer may have been removed or you may not have access to it.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/customers">
          <Button variant="primary">Back to Customers</Button>
        </Link>
      </div>
    </div>
  );
}
