"use client";

import React, { useState, useRef, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LeadListItem, LeadStatus, LeadSource } from "@/types/lead";
import { formatLeadStatus } from "@/lib/utils/lead-format";
import { LeadTable } from "@/components/crm/leads/lead-table";
import { LeadToolbar } from "@/components/crm/leads/lead-toolbar";
import {
  LeadFilters,
  LeadFilterValues,
} from "@/components/crm/leads/lead-filters";
import { TablePagination } from "@/components/data-table/table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useToast, ToastFlushBridge } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadDeleteDialog } from "@/components/crm/leads/lead-delete-dialog";
import { LeadConvertDialog } from "@/components/crm/leads/lead-convert-dialog";
import { LeadPipeline } from "@/components/crm/leads/lead-pipeline";
import { LeadPipelineSkeleton } from "@/components/crm/leads/lead-pipeline-skeleton";
import { LeadViewMode } from "@/components/crm/leads/lead-view-switch";
import { CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { LeadPipeline as LeadPipelineType, LeadPipelineStageSummary } from "@/types/pipeline";

export interface LeadListViewProps {
  readonly initialLeads: readonly LeadListItem[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly currentSearch?: string;
  readonly currentCustomerId?: string;
  readonly currentContactId?: string;
  readonly currentStatus?: LeadStatus;
  readonly currentSource?: LeadSource;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly initialContactOption?: ContactPickerOption | null;
  readonly defaultView?: LeadViewMode;
  readonly allowViewSwitch?: boolean;
  readonly pipeline?: LeadPipelineType;
  readonly stageSummaries?: readonly LeadPipelineStageSummary[];
}

export function LeadListView({
  initialLeads,
  meta,
  currentSearch = "",
  currentCustomerId,
  currentContactId,
  currentStatus,
  currentSource,
  initialCustomerOption,
  initialContactOption,
  defaultView = "table",
  allowViewSwitch = true,
  pipeline,
  stageSummaries,
}: LeadListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isNavigating, startNavigationTransition] = useTransition();

  // View switch: table or pipeline
  const [view, setView] = useState<LeadViewMode>(defaultView);

  // Synchronize local leads state directly during render when server initialLeads changes
  const [leads, setLeads] = useState<readonly LeadListItem[]>(initialLeads);
  const [prevInitialLeads, setPrevInitialLeads] = useState(initialLeads);
  if (prevInitialLeads !== initialLeads) {
    setPrevInitialLeads(initialLeads);
    setLeads(initialLeads);
  }

  // Track pending mutation lead IDs to prevent duplicate rapid drops
  const [pendingStatusLeadIds, setPendingStatusLeadIds] = useState<Set<string>>(new Set());

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

  // Filter panel state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<LeadFilterValues>({
    customer_id: currentCustomerId ?? "",
    contact_id: currentContactId ?? "",
    status: currentStatus ?? "all",
    source: currentSource ?? "all",
  });

  // Dialog states
  const [leadToDelete, setLeadToDelete] = useState<LeadListItem | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<LeadListItem | null>(null);

  // Synchronize local search state during render when URL search param changes
  const [prevSearch, setPrevSearch] = useState(currentSearch);
  if (prevSearch !== currentSearch) {
    setPrevSearch(currentSearch);
    setSearchQuery(currentSearch);
  }

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCustomerId) count += 1;
    if (currentContactId) count += 1;
    if (currentStatus) count += 1;
    if (currentSource) count += 1;
    return count;
  }, [currentCustomerId, currentContactId, currentStatus, currentSource]);

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
        status: currentStatus ?? "all",
        source: currentSource ?? "all",
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
      status: "all",
      source: "all",
    });
  };

  const handleFilterCancel = () => {
    setDraftFilters({
      customer_id: currentCustomerId ?? "",
      contact_id: currentContactId ?? "",
      status: currentStatus ?? "all",
      source: currentSource ?? "all",
    });
    setIsFilterOpen(false);
  };

  const handleFilterApply = () => {
    const custValue = draftFilters.customer_id.trim() ? draftFilters.customer_id.trim() : null;
    const contactValue = draftFilters.contact_id.trim() ? draftFilters.contact_id.trim() : null;
    const statusValue = draftFilters.status !== "all" ? draftFilters.status : null;
    const sourceValue = draftFilters.source !== "all" ? draftFilters.source : null;

    updateUrl({
      customer_id: custValue,
      contact_id: contactValue,
      status: statusValue,
      source: sourceValue,
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
      status: "all",
      source: "all",
    });
    setIsFilterOpen(false);

    updateUrl({
      search: null,
      customer_id: null,
      contact_id: null,
      status: null,
      source: null,
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

  // Real pipeline status PATCH mutation with optimistic rollback
  const handleLeadStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    if (newStatus === "converted") {
      toast({
        variant: "warning",
        title: "Status cannot be changed",
        description: "Leads can only become converted through the Convert to Deal action.",
      });
      return;
    }

    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead) return;

    if (currentLead.status === "converted") {
      toast({
        variant: "warning",
        title: "Converted lead is read-only",
        description: "Converted leads cannot be moved to another status.",
      });
      return;
    }

    if (currentLead.status === newStatus) return;

    // Prevent repeated status requests while this lead is already mutating
    if (pendingStatusLeadIds.has(leadId)) return;

    const previousStatus = currentLead.status;

    // Optimistically update visual state
    setPendingStatusLeadIds((prev) => new Set(prev).add(leadId));
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      })
    );

    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        // Rollback state
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id !== leadId) return lead;
            return { ...lead, status: previousStatus };
          })
        );

        toast({
          variant: "error",
          title: "Unable to update lead status",
          description: extractErrorMessage(result, "Please try again."),
        });
        return;
      }

      toast({
        variant: "success",
        title: "Lead status updated",
        description: `The lead was moved to ${formatLeadStatus(newStatus)}.`,
      });

      router.refresh();
    } catch {
      // Rollback on network error
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return { ...lead, status: previousStatus };
        })
      );

      toast({
        variant: "error",
        title: "Unable to update lead status",
        description: "Please check your connection and try again.",
      });
    } finally {
      setPendingStatusLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  // Lead pipeline stage PATCH mutation with optimistic rollback
  const handleLeadStageChange = async (leadId: string, targetStageId: string) => {
    const targetStage = pipeline?.stages.find((s) => s.id === targetStageId);
    if (targetStage?.is_system_converted) {
      toast({
        variant: "warning",
        title: "Stage cannot be selected manually",
        description: "Leads can only become converted through the Convert to Deal action.",
      });
      return;
    }

    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead) return;

    if (currentLead.status === "converted") {
      toast({
        variant: "warning",
        title: "Converted lead is read-only",
        description: "Converted leads cannot be moved to another stage.",
      });
      return;
    }

    if (currentLead.pipeline_stage_id === targetStageId) return;
    if (pendingStatusLeadIds.has(leadId)) return;

    const previousStageId = currentLead.pipeline_stage_id;
    const previousStatus = currentLead.status;

    // Optimistically update visual state
    setPendingStatusLeadIds((prev) => new Set(prev).add(leadId));
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          pipeline_stage_id: targetStageId,
          status: targetStage?.is_conversion_stage ? "qualified" : lead.status,
          updated_at: new Date().toISOString(),
        };
      })
    );

    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage_id: targetStageId }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        // Rollback state
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id !== leadId) return lead;
            return {
              ...lead,
              pipeline_stage_id: previousStageId,
              status: previousStatus,
            };
          })
        );

        toast({
          variant: "error",
          title: "Unable to move lead stage",
          description: extractErrorMessage(result, "Please try again."),
        });
        return;
      }

      const resObj = result as { data: { pipeline_stage_id?: string; status?: LeadStatus; updated_at?: string } };
      // Authoritative state sync
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            pipeline_stage_id: resObj.data.pipeline_stage_id ?? targetStageId,
            status: resObj.data.status ?? lead.status,
            updated_at: resObj.data.updated_at ?? new Date().toISOString(),
          };
        })
      );

      toast({
        variant: "success",
        title: "Lead stage updated",
        description: `The lead was moved to ${targetStage?.name ?? "the new stage"}.`,
      });

      router.refresh();
    } catch {
      // Rollback on network error
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            pipeline_stage_id: previousStageId,
            status: previousStatus,
          };
        })
      );

      toast({
        variant: "error",
        title: "Unable to move lead stage",
        description: "Please check your network connection and try again.",
      });
    } finally {
      setPendingStatusLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  const handleInvalidDrop = (reason: "into_converted") => {
    if (reason === "into_converted") {
      toast({
        variant: "warning",
        title: "Status cannot be changed",
        description: "Leads can only become converted through the Convert to Deal action.",
      });
    }
  };

  const handleInvalidDrag = (reason: "drag_converted") => {
    if (reason === "drag_converted") {
      toast({
        variant: "warning",
        title: "Converted lead is read-only",
        description: "Converted leads cannot be moved to another status.",
      });
    }
  };

  const handleDeleteSuccess = () => {
    setLeadToDelete(null);
    startNavigationTransition(() => {
      router.refresh();
    });
  };

  const handleConvertSuccess = () => {
    setLeadToConvert(null);
    startNavigationTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <ToastFlushBridge />
      {/* Search, Filter, and View Switch Toolbar */}
      <LeadToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        isFilterOpen={isFilterOpen}
        onToggleFilter={handleToggleFilter}
        activeFilterCount={activeFilterCount}
        view={view}
        onViewChange={setView}
        showViewSwitch={allowViewSwitch}
      />

      {/* Expandable Filter Panel */}
      <LeadFilters
        open={isFilterOpen}
        draftFilters={draftFilters}
        initialCustomerOption={initialCustomerOption}
        initialContactOption={initialContactOption}
        onDraftChange={setDraftFilters}
        onClear={handleFilterClear}
        onCancel={handleFilterCancel}
        onApply={handleFilterApply}
      />

      {/* View Content: Table or Pipeline */}
      <div className="relative" aria-busy={isNavigating}>
        {isNavigating ? (
          view === "pipeline" ? (
            <>
              <span className="sr-only" role="status">
                Loading leads pipeline...
              </span>
              <LeadPipelineSkeleton showToolbar={false} />
            </>
          ) : (
            <>
              <span className="sr-only" role="status">
                Loading leads...
              </span>
              <DataTableSkeleton
                columns={8}
                rows={meta.pageSize || 10}
                showPagination={true}
              />
            </>
          )
        ) : meta.total === 0 && !hasActiveFiltersOrSearch ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              title="No leads yet"
              description="Add potential sales opportunities and track them through qualification."
              action={
                <Link href="/leads/new">
                  <Button variant="primary">Add Lead</Button>
                </Link>
              }
              className="border-none py-14"
            />
          </div>
        ) : meta.total === 0 ? (
          <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              title="No matching leads"
              description="Try adjusting your search or filters."
              action={
                <Button variant="secondary" onClick={handleResetAll}>
                  Clear filters
                </Button>
              }
              className="border-none py-14"
            />
          </div>
        ) : view === "table" ? (
          <div className="bg-white border border-border-subtle rounded-xl shadow-xs overflow-hidden">
            <LeadTable
              leads={leads}
              onDelete={(lead) => setLeadToDelete(lead)}
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
        ) : (
          <LeadPipeline
            pipeline={pipeline}
            stageSummaries={stageSummaries}
            leads={leads}
            pendingStatusLeadIds={pendingStatusLeadIds}
            onLeadStatusChange={handleLeadStatusChange}
            onLeadStageChange={handleLeadStageChange}
            onInvalidDrop={handleInvalidDrop}
            onInvalidDrag={handleInvalidDrag}
            onConvertClick={(lead) => setLeadToConvert(lead)}
            onDeleteClick={(lead) => setLeadToDelete(lead)}
          />
        )}
      </div>

      {/* Convert Lead to Deal Dialog */}
      <LeadConvertDialog
        lead={leadToConvert}
        open={Boolean(leadToConvert)}
        onOpenChange={(open) => !open && setLeadToConvert(null)}
        onSuccess={handleConvertSuccess}
      />

      {/* Delete Lead Confirmation Dialog */}
      <LeadDeleteDialog
        lead={leadToDelete}
        open={Boolean(leadToDelete)}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
        onSuccess={handleDeleteSuccess}
        willNavigate={false}
      />
    </div>
  );
}
