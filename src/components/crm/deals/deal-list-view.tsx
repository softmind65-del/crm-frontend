"use client";

import React, { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Deal, DealPipeline, DealFilterValues } from "@/types/deal";
import { CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { DealTable } from "@/components/crm/deals/deal-table";
import { DealToolbar } from "@/components/crm/deals/deal-toolbar";
import { DealFilters } from "@/components/crm/deals/deal-filters";
import { TablePagination } from "@/components/data-table/table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DealDeleteDialog } from "@/components/crm/deals/deal-delete-dialog";

export interface DealListViewProps {
  readonly initialDeals: readonly Deal[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly currentSearch?: string;
  readonly currentCustomerId?: string;
  readonly currentContactId?: string;
  readonly currentStageId?: string;
  readonly currentStage?: string;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly initialContactOption?: ContactPickerOption | null;
  readonly pipeline?: DealPipeline;
}

export function DealListView({
  initialDeals,
  meta,
  currentSearch = "",
  currentCustomerId,
  currentContactId,
  currentStageId,
  initialCustomerOption,
  initialContactOption,
  pipeline,
}: DealListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigationTransition] = useTransition();

  const [deals, setDeals] = useState<readonly Deal[]>(initialDeals);
  const [prevInitialDeals, setPrevInitialDeals] = useState(initialDeals);
  if (prevInitialDeals !== initialDeals) {
    setPrevInitialDeals(initialDeals);
    setDeals(initialDeals);
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [prevSearch, setPrevSearch] = useState(currentSearch);
  if (prevSearch !== currentSearch) {
    setPrevSearch(currentSearch);
    setSearchQuery(currentSearch);
  }

  // Filter panel state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DealFilterValues>({
    customer_id: currentCustomerId ?? "",
    contact_id: currentContactId ?? "",
    stage_id: currentStageId ?? "",
  });

  // Delete dialog state
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // Active filter count - represents active structured filters only (Customer, Contact, Stage)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCustomerId) count += 1;
    if (currentContactId) count += 1;
    if (currentStageId) count += 1;
    return count;
  }, [currentCustomerId, currentContactId, currentStageId]);

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

    startNavigationTransition(() => {
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
        contact_id: currentContactId ?? "",
        stage_id: currentStageId ?? "",
      });
      setIsFilterOpen(true);
    } else {
      setIsFilterOpen(false);
    }
  };

  const handleFilterClear = () => {
    setDraftFilters({
      customer_id: "",
      contact_id: "",
      stage_id: "",
    });
    setIsFilterOpen(false);
    updateUrl({
      customer_id: null,
      contact_id: null,
      stage_id: null,
      page: "1",
    });
  };

  const handleFilterCancel = () => {
    setDraftFilters({
      customer_id: currentCustomerId ?? "",
      contact_id: currentContactId ?? "",
      stage_id: currentStageId ?? "",
    });
    setIsFilterOpen(false);
  };

  const handleFilterApply = () => {
    updateUrl({
      customer_id: draftFilters.customer_id || null,
      contact_id: draftFilters.contact_id || null,
      stage_id: draftFilters.stage_id || null,
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
      contact_id: "",
      stage_id: "",
    });
    setIsFilterOpen(false);
    startNavigationTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const handleDeleteSuccess = () => {
    setDealToDelete(null);
    startNavigationTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      <DealToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        isFilterOpen={isFilterOpen}
        onToggleFilter={handleToggleFilter}
        activeFilterCount={activeFilterCount}
        view="table"
        onViewChange={(newView) => {
          if (newView === "pipeline") {
            router.push("/deals/pipeline");
          }
        }}
        showViewSwitch={true}
      />

      {/* Expandable Filter Panel */}
      <DealFilters
        open={isFilterOpen}
        stages={pipeline?.stages ?? []}
        draftFilters={draftFilters}
        initialCustomerOption={initialCustomerOption}
        initialContactOption={initialContactOption}
        onDraftChange={setDraftFilters}
        onClear={handleFilterClear}
        onCancel={handleFilterCancel}
        onApply={handleFilterApply}
      />

      {/* Table Content Area */}
      <div className="relative">
        {isNavigating && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs z-10 rounded-xl transition-all" />
        )}

        {deals.length > 0 ? (
          <div className="space-y-4">
            <DealTable
              deals={deals}
              stages={pipeline?.stages ?? []}
              onDelete={(d) => setDealToDelete(d)}
            />
            <TablePagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              pageSize={meta.pageSize}
              totalRecords={meta.total}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={(p) => updateUrl({ page: String(p) })}
              onPageSizeChange={(s) => updateUrl({ page_size: String(s), page: "1" })}
            />
          </div>
        ) : isNavigating ? (
          <DataTableSkeleton columns={7} rows={meta.pageSize || 10} showPagination={true} />
        ) : hasActiveFiltersOrSearch ? (
          <EmptyState
            title="No matching deals found"
            description="No commercial opportunities match your filter or search criteria. Try modifying your filters or clearing search terms."
            action={
              <Button variant="secondary" onClick={handleResetAll}>
                Reset all filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No deals created yet"
            description="Track opportunities, revenue projections, and close dates by adding your first deal."
            action={
              <Link href="/deals/new">
                <Button variant="primary">Add Deal</Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Delete Deal Confirmation Dialog */}
      <DealDeleteDialog
        deal={dealToDelete}
        open={Boolean(dealToDelete)}
        onOpenChange={(open) => {
          if (!open) setDealToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
