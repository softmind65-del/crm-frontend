"use client";

import React, { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ContactListItem, ContactStatus } from "@/types/contact";
import { ContactToolbar } from "@/components/crm/contacts/contact-toolbar";
import {
  ContactFilters,
  ContactFilterValues,
} from "@/components/crm/contacts/contact-filters";
import { ContactTable } from "@/components/crm/contacts/contact-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ToastFlushBridge } from "@/components/ui/toast";
import { ContactDeleteDialog } from "@/components/crm/contacts/contact-delete-dialog";
import { CustomerPickerOption } from "@/components/forms/customer-picker";

export interface ContactListViewProps {
  readonly initialContacts: readonly ContactListItem[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly currentSearch?: string;
  readonly currentCustomerId?: string;
  readonly currentStatus?: ContactStatus;
  readonly currentIsPrimary?: boolean;
  readonly initialCustomerOption?: CustomerPickerOption | null;
}

export function ContactListView({
  initialContacts,
  meta,
  currentSearch = "",
  currentCustomerId,
  currentStatus,
  currentIsPrimary,
  initialCustomerOption,
}: ContactListViewProps) {
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
  const [draftFilters, setDraftFilters] = useState<ContactFilterValues>({
    customer_id: currentCustomerId ?? "",
    status: currentStatus ?? "all",
    is_primary:
      currentIsPrimary === true
        ? "true"
        : currentIsPrimary === false
        ? "false"
        : "all",
  });

  const [contactToDelete, setContactToDelete] = useState<ContactListItem | null>(null);

  const handleDeleteSuccess = () => {
    setContactToDelete(null);
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
    if (currentCustomerId) count += 1;
    if (currentStatus) count += 1;
    if (typeof currentIsPrimary === "boolean") count += 1;
    return count;
  }, [currentCustomerId, currentStatus, currentIsPrimary]);

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
        customer_id: currentCustomerId ?? "",
        status: currentStatus ?? "all",
        is_primary:
          currentIsPrimary === true
            ? "true"
            : currentIsPrimary === false
            ? "false"
            : "all",
      });
      setIsFilterOpen(true);
    } else {
      setIsFilterOpen(false);
    }
  };

  const handleFilterClear = () => {
    setDraftFilters({
      customer_id: "",
      status: "all",
      is_primary: "all",
    });
  };

  const handleFilterCancel = () => {
    setDraftFilters({
      customer_id: currentCustomerId ?? "",
      status: currentStatus ?? "all",
      is_primary:
        currentIsPrimary === true
          ? "true"
          : currentIsPrimary === false
          ? "false"
          : "all",
    });
    setIsFilterOpen(false);
  };

  const handleFilterApply = () => {
    const custValue =
      draftFilters.customer_id.trim() ? draftFilters.customer_id.trim() : null;
    const statusValue =
      draftFilters.status !== "all" ? draftFilters.status : null;
    const primaryValue =
      draftFilters.is_primary !== "all" ? draftFilters.is_primary : null;

    updateUrl({
      customer_id: custValue,
      status: statusValue,
      is_primary: primaryValue,
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
      customer_id: "",
      status: "all",
      is_primary: "all",
    });
    setIsFilterOpen(false);

    updateUrl({
      search: null,
      customer_id: null,
      status: null,
      is_primary: null,
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

  const emptyContactIcon = (
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
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
      <ContactToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        isFilterOpen={isFilterOpen}
        onToggleFilter={handleToggleFilter}
        activeFilterCount={activeFilterCount}
      />

      <ContactFilters
        open={isFilterOpen}
        draftFilters={draftFilters}
        initialCustomerOption={initialCustomerOption}
        onDraftChange={setDraftFilters}
        onClear={handleFilterClear}
        onCancel={handleFilterCancel}
        onApply={handleFilterApply}
      />

      <div className="relative" aria-busy={isPending}>
        {isPending ? (
          <>
            <span className="sr-only" role="status">
              Loading contacts...
            </span>
            <DataTableSkeleton
              columns={7}
              rows={meta.pageSize || 5}
              showPagination={true}
            />
          </>
        ) : meta.total === 0 && !hasActiveFiltersOrSearch ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              icon={emptyContactIcon}
              title="No contacts yet"
              description="Add people associated with your customers to start managing relationships."
              action={
                <Link href="/contacts/new">
                  <Button variant="primary">Add Contact</Button>
                </Link>
              }
              className="border-none py-14"
            />
          </div>
        ) : meta.total === 0 ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              icon={searchFilterIcon}
              title="No matching contacts"
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
            <ContactTable
              contacts={initialContacts}
              onDelete={setContactToDelete}
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

      <ContactDeleteDialog
        contact={contactToDelete}
        open={Boolean(contactToDelete)}
        onOpenChange={(open) => {
          if (!open) setContactToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
