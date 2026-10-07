"use client";

import React, { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Customer, CustomerStatus, CustomerType } from "@/types/customer";
import { CustomerToolbar } from "@/components/crm/customers/customer-toolbar";
import {
  CustomerFilters,
  CustomerFilterValues,
} from "@/components/crm/customers/customer-filters";
import { CustomerTable } from "@/components/crm/customers/customer-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ToastFlushBridge } from "@/components/ui/toast";
import { CustomerDeleteDialog } from "@/components/crm/customers/customer-delete-dialog";

export interface CustomerListViewProps {
  readonly initialCustomers: readonly Customer[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly currentSearch?: string;
  readonly currentStatus?: CustomerStatus;
  readonly currentCustomerType?: CustomerType;
}

export function CustomerListView({
  initialCustomers,
  meta,
  currentSearch = "",
  currentStatus,
  currentCustomerType,
}: CustomerListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear pending debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CustomerFilterValues>({
    customer_type: currentCustomerType ?? "all",
    status: currentStatus ?? "all",
  });

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleDeleteSuccess = () => {
    setCustomerToDelete(null);
    startTransition(() => {
      router.refresh();
    });
  };

  // Synchronize local search state during render when URL search param changes
  const [prevSearch, setPrevSearch] = useState(currentSearch);
  if (prevSearch !== currentSearch) {
    setPrevSearch(currentSearch);
    setSearchQuery(currentSearch);
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCustomerType) count += 1;
    if (currentStatus) count += 1;
    return count;
  }, [currentCustomerType, currentStatus]);

  const hasActiveFiltersOrSearch = Boolean(currentSearch || activeFilterCount > 0);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const newQuery = params.toString();
    const targetUrl = newQuery ? `${pathname}?${newQuery}` : pathname;

    startTransition(() => {
      router.replace(targetUrl, { scroll: false });
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = query.trim();
      const currentTrimmed = (currentSearch || "").trim();

      if (trimmed !== currentTrimmed) {
        updateUrl({
          search: trimmed || null,
          page: "1",
        });
      }
    }, 350);
  };

  const handleSearchClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery("");
    if (currentSearch) {
      updateUrl({
        search: null,
        page: "1",
      });
    }
  };

  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftFilters({
        customer_type: currentCustomerType ?? "all",
        status: currentStatus ?? "all",
      });
      setIsFilterOpen(true);
    } else {
      setIsFilterOpen(false);
    }
  };

  const handleFilterClear = () => {
    setDraftFilters({
      customer_type: "all",
      status: "all",
    });
  };

  const handleFilterCancel = () => {
    setDraftFilters({
      customer_type: currentCustomerType ?? "all",
      status: currentStatus ?? "all",
    });
    setIsFilterOpen(false);
  };

  const handleFilterApply = () => {
    const typeValue =
      draftFilters.customer_type !== "all" ? draftFilters.customer_type : null;
    const statusValue =
      draftFilters.status !== "all" ? draftFilters.status : null;

    updateUrl({
      customer_type: typeValue,
      status: statusValue,
      page: "1",
    });

    setIsFilterOpen(false);
  };

  const handleResetAll = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery("");
    setDraftFilters({
      customer_type: "all",
      status: "all",
    });
    setIsFilterOpen(false);

    updateUrl({
      search: null,
      customer_type: null,
      status: null,
      page: "1",
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({
      page: String(newPage),
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrl({
      page_size: String(newPageSize),
      page: "1",
    });
  };

  const emptyCustomerIcon = (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const searchFilterIcon = (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  return (
    <div className="space-y-4">
      <ToastFlushBridge />
      <CustomerToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        isFilterOpen={isFilterOpen}
        onToggleFilter={handleToggleFilter}
        activeFilterCount={activeFilterCount}
      />

      <CustomerFilters
        open={isFilterOpen}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onClear={handleFilterClear}
        onCancel={handleFilterCancel}
        onApply={handleFilterApply}
      />

      <div className="relative" aria-busy={isPending}>
        {isPending ? (
          <>
            <span className="sr-only" role="status">
              Loading customers...
            </span>
            <DataTableSkeleton columns={7} rows={meta.pageSize || 5} showPagination={true} />
          </>
        ) : meta.total === 0 && !hasActiveFiltersOrSearch ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              icon={emptyCustomerIcon}
              title="No customers yet"
              description="Add your first customer to start managing customer relationships."
              action={
                <Link href="/customers/new">
                  <Button variant="primary">Add Customer</Button>
                </Link>
              }
              className="border-none py-14"
            />
          </div>
        ) : meta.total === 0 ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              icon={searchFilterIcon}
              title="No matching customers"
              description="Try adjusting your search or filters."
              action={
                <Button variant="secondary" onClick={handleResetAll}>
                  Clear filters
                </Button>
              }
              className="border-none py-14"
            />
          </div>
        ) : (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <CustomerTable
              customers={initialCustomers}
              onDelete={setCustomerToDelete}
            />

            <TablePagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              totalRecords={meta.total}
              pageSize={meta.pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <CustomerDeleteDialog
        customer={customerToDelete}
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => {
          if (!open) setCustomerToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
