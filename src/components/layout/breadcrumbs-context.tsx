"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { BreadcrumbItem } from "@/components/layout/breadcrumbs";

interface BreadcrumbsContextType {
  breadcrumbs: readonly BreadcrumbItem[];
  setBreadcrumbs: (crumbs: readonly BreadcrumbItem[]) => void;
}

const BreadcrumbsContext = createContext<BreadcrumbsContextType | null>(null);

export interface BreadcrumbsProviderProps {
  readonly children: React.ReactNode;
  readonly defaultBreadcrumbs?: readonly BreadcrumbItem[];
}

export function BreadcrumbsProvider({
  children,
  defaultBreadcrumbs = [],
}: BreadcrumbsProviderProps) {
  const [breadcrumbs, setBreadcrumbs] =
    useState<readonly BreadcrumbItem[]>(defaultBreadcrumbs);

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbs(): BreadcrumbsContextType | null {
  return useContext(BreadcrumbsContext);
}

/**
 * Client component that sets breadcrumbs for the current page in the persistent shell.
 */
export function PageBreadcrumbs({
  items,
}: {
  readonly items: readonly BreadcrumbItem[];
}) {
  const context = useBreadcrumbs();
  const setBreadcrumbs = context?.setBreadcrumbs;

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs(items);
    }
  }, [setBreadcrumbs, items]);

  return null;
}
