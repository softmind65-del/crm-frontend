"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DevUserMenuProps {
  readonly userName?: string;
}

export function DevUserMenu({ userName = "User" }: DevUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  // Handle outside click, Escape key, and window resize
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/dev-session", {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Unable to log out. Please try again.");
        setIsLoggingOut(false);
        return;
      }

      // Hard navigation to /setup clears in-memory state and re-triggers route guard
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/setup");
    } catch {
      setError("Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative inline-block text-left shrink-0">
      {/* Interactive Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Profile options for ${userName}`}
        className="flex items-center gap-2 p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100 cursor-pointer select-none"
      >
        {/* Avatar Bubble */}
        <div
          className="h-8 w-8 rounded-full bg-brand text-white font-semibold text-xs flex items-center justify-center ring-1 ring-border-subtle shrink-0"
          aria-hidden="true"
        >
          {initial}
        </div>

        {/* User Name */}
        <span className="text-sm font-medium text-foreground-dark hidden sm:inline-block max-w-[140px] truncate">
          {userName}
        </span>

        {/* Small Chevron Indicator */}
        <svg
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 hidden sm:inline-block shrink-0 ${
            isOpen ? "rotate-180 text-foreground-dark" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Profile Popup Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Development user profile"
          className="absolute right-0 top-full mt-2 z-50 w-60 rounded-xl bg-white border border-border-subtle p-2 shadow-lg focus:outline-none focus:ring-0"
        >
          {/* User Details Header */}
          <div className="px-2.5 py-2 select-none">
            <p className="text-sm font-semibold text-foreground-dark truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Development profile
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border-subtle my-1" role="separator" />

          {/* Inline Error Message */}
          {error && (
            <div
              role="alert"
              className="px-2.5 py-1.5 mb-1 text-xs text-red-600 bg-red-50 rounded-lg leading-normal"
            >
              {error}
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 hover:text-red-600 hover:bg-red-50/70 active:bg-red-100 transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-red-50 focus-visible:text-red-600"
          >
            <svg
              className="w-4 h-4 shrink-0 text-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
