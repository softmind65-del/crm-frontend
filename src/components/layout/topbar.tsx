import React from "react";
import Link from "next/link";
import { BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { TopbarGreeting } from "@/components/layout/topbar-greeting";
import { DevUserMenu } from "@/components/auth/dev-user-menu";

export interface TopbarProps {
  readonly variant?: "dashboard" | "page";
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly userName?: string;
  readonly onOpenMobileMenu?: () => void;
}

export function Topbar({
  variant = "dashboard",
  breadcrumbs = [],
  userName,
  onOpenMobileMenu,
}: TopbarProps) {
  return (
    <header className="bg-white border border-border-subtle rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-h-[52px]">
      {/* Left side: Hamburger button + Page Context or Dynamic Greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground-dark hover:bg-slate-50 transition-colors lg:hidden cursor-pointer shrink-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-slate-100"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div className="min-w-0 flex-1">
          {variant === "page" ? (
            <nav aria-label="Page navigation" className="flex items-center gap-1.5 text-sm min-w-0">
              {breadcrumbs.length > 0 ? (
                breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  const key = crumb.ariaLabel || (typeof crumb.label === "string" ? crumb.label : `crumb-${idx}`);
                  return (
                    <React.Fragment key={key}>
                      {idx > 0 && (
                        <svg
                          className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          aria-label={crumb.ariaLabel}
                          className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:text-brand rounded"
                        >
                          {crumb.icon}
                          {crumb.label && (
                            <span className="truncate max-w-[100px] sm:max-w-[160px]">
                              {crumb.label}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span
                          className="font-medium text-foreground-dark inline-flex items-center gap-1.5 shrink-0 max-w-[120px] sm:max-w-[200px]"
                          aria-current={isLast ? "page" : undefined}
                          aria-label={crumb.ariaLabel}
                        >
                          {crumb.icon}
                          {crumb.label && (
                            <span className="truncate">
                              {crumb.label}
                            </span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <span className="font-medium text-foreground-dark">AccDoo CRM</span>
              )}
            </nav>
          ) : (
            <TopbarGreeting userName={userName} />
          )}
        </div>
      </div>

      {/* Right side: Info icon, Notification bell, User profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
        {/* Info Icon Button */}
        <button
          type="button"
          aria-label="System Information"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground-dark hover:bg-slate-50 transition-colors hidden sm:inline-flex cursor-pointer shrink-0"
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>

        {/* Notification Bell with unclipped red badge strictly isolated to the bell */}
        <button
          type="button"
          aria-label="Notifications (3 unread)"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground-dark hover:bg-slate-50 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none pointer-events-none shadow-xs">
            3
          </span>
        </button>

        {/* User Identity Area / Dev Session Profile Menu */}
        {userName ? (
          <DevUserMenu userName={userName} />
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="h-8 w-8 rounded-full bg-brand text-white font-semibold text-xs flex items-center justify-center ring-1 ring-border-subtle shrink-0"
              aria-hidden="true"
            >
              U
            </div>
            <span className="text-sm font-medium text-foreground-dark hidden sm:inline-block">
              User
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
