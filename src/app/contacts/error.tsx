"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ContactsErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ContactsError({ reset }: ContactsErrorProps) {
  useEffect(() => {
    // Error boundary active; no console.log or raw error leakage per enterprise security guidelines
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-14 bg-white border border-border-subtle rounded-xl shadow-xs">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mb-4 shrink-0"
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
        Unable to load contacts
      </h2>

      <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
        We couldn&apos;t load contact data. Check the backend connection and try again.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
