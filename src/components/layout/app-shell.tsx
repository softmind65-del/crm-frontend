"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BreadcrumbItem, HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import {
  BreadcrumbsProvider,
  useBreadcrumbs,
} from "@/components/layout/breadcrumbs-context";

export interface AppShellProps {
  readonly children: React.ReactNode;
  readonly topbarVariant?: "dashboard" | "page";
  readonly topbarBreadcrumbs?: readonly BreadcrumbItem[];
  readonly userName?: string;
}

function AppShellInner({
  children,
  topbarVariant = "dashboard",
  topbarBreadcrumbs,
  userName,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const breadcrumbsContext = useBreadcrumbs();

  // Reset mobile drawer during render when pathname changes (official React state-adjustment pattern)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Handle Escape key & lock body scroll while drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Determine active breadcrumbs: explicit prop > context > route fallback
  const effectiveBreadcrumbs =
    topbarBreadcrumbs ??
    (breadcrumbsContext?.breadcrumbs && breadcrumbsContext.breadcrumbs.length > 0
      ? breadcrumbsContext.breadcrumbs
      : pathname.startsWith("/customers")
      ? [HOME_BREADCRUMB_ITEM, { label: "Customers" }]
      : pathname.startsWith("/contacts")
      ? [HOME_BREADCRUMB_ITEM, { label: "Contacts" }]
      : pathname.startsWith("/leads")
      ? [HOME_BREADCRUMB_ITEM, { label: "Leads" }]
      : pathname.startsWith("/deals")
      ? [HOME_BREADCRUMB_ITEM, { label: "Deals" }]
      : pathname.startsWith("/settings")
      ? [HOME_BREADCRUMB_ITEM, { label: "Settings" }]
      : []);

  return (
    <div className="flex min-h-screen bg-surface-soft text-foreground-dark overflow-x-hidden">
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64 h-screen">
        <Sidebar className="h-full" />
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <Sidebar
          onClose={() => setIsMobileMenuOpen(false)}
          onNavigate={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <div className="w-full px-4 sm:px-6 pt-2.5 sm:pt-3 lg:pt-4 pb-8 space-y-4 sm:space-y-5 lg:space-y-2.5">
          <Topbar
            variant={topbarVariant}
            breadcrumbs={effectiveBreadcrumbs}
            userName={userName}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <main className="space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <BreadcrumbsProvider defaultBreadcrumbs={props.topbarBreadcrumbs}>
      <AppShellInner {...props} />
    </BreadcrumbsProvider>
  );
}
