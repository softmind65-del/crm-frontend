"use client";

import React, { useState, useEffect } from "react";

export interface TopbarGreetingProps {
  readonly userName?: string;
}

export function TopbarGreeting({ userName = "User" }: TopbarGreetingProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(new Date());

    updateNow();

    const intervalId = window.setInterval(updateNow, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const hour = now?.getHours();

  let timeGreeting = "Good Day";
  if (hour !== undefined) {
    if (hour < 12) {
      timeGreeting = "Good Morning";
    } else if (hour < 18) {
      timeGreeting = "Good Afternoon";
    } else {
      timeGreeting = "Good Evening";
    }
  }

  const greeting = `${timeGreeting}, ${userName}`;
  const isEvening = hour !== undefined ? (hour >= 18 || hour < 6) : false;

  const formattedDate = now
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(now)
    : "";

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="text-sm font-semibold text-foreground-dark truncate"
          suppressHydrationWarning
        >
          {greeting}
        </span>
        {isEvening ? (
          <svg
            className="w-4 h-4 text-amber-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-amber-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </div>

      <span className="h-4 w-px bg-border-subtle hidden sm:block shrink-0" aria-hidden="true" />

      <span
        className="text-xs text-muted-foreground hidden sm:inline-block shrink-0"
        suppressHydrationWarning
      >
        {formattedDate}
      </span>
    </div>
  );
}
