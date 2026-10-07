"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Deal,
  DealPipeline,
  DealPipelineStageSummary,
  DealFilterValues,
} from "@/types/deal";
import { formatCurrency } from "@/lib/utils/format";
import { DealToolbar } from "@/components/crm/deals/deal-toolbar";
import { DealFilters } from "@/components/crm/deals/deal-filters";
import { DealPipelineColumn } from "@/components/crm/deals/deal-pipeline-column";
import { DealDeleteDialog } from "@/components/crm/deals/deal-delete-dialog";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";

export interface DealPipelineViewProps {
  readonly initialPipeline?: DealPipeline;
  readonly initialSummaries?: readonly DealPipelineStageSummary[];
  readonly initialDealsByStage?: Record<string, readonly Deal[]>;
}

export function DealPipelineView({
  initialPipeline,
  initialSummaries = [],
  initialDealsByStage = {},
}: DealPipelineViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [pipeline] = useState<DealPipeline | undefined>(initialPipeline);
  const [summaries, setSummaries] = useState<readonly DealPipelineStageSummary[]>(initialSummaries);
  const [dealsByStage, setDealsByStage] = useState<Record<string, readonly Deal[]>>(initialDealsByStage);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DealFilterValues>({
    customer_id: "",
    contact_id: "",
    stage_id: "",
  });

  // Delete dialog state
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const stages = useMemo(() => {
    return pipeline ? [...pipeline.stages].sort((a, b) => a.position - b.position) : [];
  }, [pipeline]);

  // Fetch deal cards for a specific stage
  const fetchStageDeals = useCallback(async (stageId: string, search?: string) => {
    try {
      const params = new URLSearchParams();
      params.set("stage_id", stageId);
      params.set("page", "1");
      params.set("page_size", "20");
      if (search?.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/crm/deals?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return (json.data?.items as Deal[]) ?? [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Refresh pipeline board summary metrics
  const refreshSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/deal-pipeline/summary");
      if (res.ok) {
        const json = await res.json();
        setSummaries((json.data as DealPipelineStageSummary[]) ?? []);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // Reload all stages when search query changes
  const reloadAllStages = useCallback(async (query: string) => {
    if (!stages.length) return;
    const entries = await Promise.all(
      stages.map(async (stage) => {
        const stageDeals = await fetchStageDeals(stage.id, query);
        return [stage.id, stageDeals] as const;
      })
    );
    setDealsByStage(Object.fromEntries(entries));
  }, [stages, fetchStageDeals]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      reloadAllStages(val);
    }, 350);
  };

  const handleSearchClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery("");
    reloadAllStages("");
  };

  // Drag-and-drop handlers
  const handleDragStart = useCallback((id: string) => {
    setDraggingDealId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingDealId(null);
  }, []);

  const handleDropDealToStage = useCallback(
    async (dealId: string, targetStageId: string) => {
      setDraggingDealId(null);

      let sourceStageId = "";
      let targetDeal: Deal | undefined;

      for (const [sId, dList] of Object.entries(dealsByStage)) {
        const found = dList.find((d) => d.id === dealId);
        if (found) {
          sourceStageId = sId;
          targetDeal = found;
          break;
        }
      }

      if (!targetDeal || sourceStageId === targetStageId) return;

      const previousDealsByStage = { ...dealsByStage };

      // Optimistic update
      setDealsByStage((prev) => {
        const next = { ...prev };
        next[sourceStageId] = (next[sourceStageId] || []).filter((d) => d.id !== dealId);
        next[targetStageId] = [
          {
            ...targetDeal!,
            pipeline_stage_id: targetStageId,
            updated_at: new Date().toISOString(),
          },
          ...(next[targetStageId] || []),
        ];
        return next;
      });

      try {
        const response = await fetch(`/api/crm/deals/${encodeURIComponent(dealId)}/stage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stage_id: targetStageId }),
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          // Rollback to previous visual state
          setDealsByStage(previousDealsByStage);
          toast({
            variant: "error",
            title: "Unable to move deal stage",
            description: extractErrorMessage(
              result,
              "Deal transition was rejected by the server."
            ),
          });
          return;
        }

        const targetStage = stages.find((s) => s.id === targetStageId);
        toast({
          variant: "success",
          title: "Deal stage updated",
          description: `Moved "${targetDeal.title}" to ${targetStage?.name ?? "new stage"}.`,
        });

        // Refresh affected stages and pipeline summary from server
        await refreshSummary();
        const [refreshedSource, refreshedTarget] = await Promise.all([
          fetchStageDeals(sourceStageId, searchQuery),
          fetchStageDeals(targetStageId, searchQuery),
        ]);

        setDealsByStage((prev) => ({
          ...prev,
          [sourceStageId]: refreshedSource,
          [targetStageId]: refreshedTarget,
        }));
      } catch {
        setDealsByStage(previousDealsByStage);
        toast({
          variant: "error",
          title: "Unable to move deal stage",
          description: "Please check your network connection and try again.",
        });
      }
    },
    [dealsByStage, stages, searchQuery, fetchStageDeals, refreshSummary, toast]
  );

  const handleMoveStage = useCallback(
    (dealId: string, targetStageId: string) => {
      handleDropDealToStage(dealId, targetStageId);
    },
    [handleDropDealToStage]
  );

  const handleReopenDeal = useCallback(
    async (deal: Deal) => {
      try {
        const response = await fetch(`/api/crm/deals/${encodeURIComponent(deal.id)}/reopen`, {
          method: "POST",
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          toast({
            variant: "error",
            title: "Unable to reopen deal",
            description: extractErrorMessage(
              result,
              "Server rejected reopening this deal."
            ),
          });
          return;
        }

        toast({
          variant: "success",
          title: "Deal reopened",
          description: `"${deal.title}" was moved back to the entry stage.`,
        });

        // Refetch all active stage cards and summary metrics
        await refreshSummary();
        if (stages.length > 0) {
          const entries = await Promise.all(
            stages.map(async (s) => [s.id, await fetchStageDeals(s.id, searchQuery)] as const)
          );
          setDealsByStage(Object.fromEntries(entries));
        }
      } catch {
        toast({
          variant: "error",
          title: "Unable to reopen deal",
          description: "Please check your network connection and try again.",
        });
      }
    },
    [stages, searchQuery, fetchStageDeals, refreshSummary, toast]
  );



  // Official pipeline overview totals computed strictly from backend summaries
  const pipelineMetrics = useMemo(() => {
    const totalCount = summaries.reduce((sum, s) => sum + s.deal_count, 0);
    const totalValue = summaries.reduce((sum, s) => sum + s.total_value, 0);
    return { totalCount, totalValue };
  }, [summaries]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DealToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
        activeFilterCount={draftFilters.customer_id ? 1 : 0}
        view="pipeline"
        onViewChange={(newView) => {
          if (newView === "table") {
            router.push("/deals");
          }
        }}
        showViewSwitch={true}
      />

      {/* Filter Panel */}
      <DealFilters
        open={isFilterOpen}
        stages={stages}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onClear={() => {
          setDraftFilters({ customer_id: "", contact_id: "", stage_id: "" });
          setIsFilterOpen(false);
          reloadAllStages(searchQuery);
        }}
        onCancel={() => setIsFilterOpen(false)}
        onApply={() => {
          setIsFilterOpen(false);
          reloadAllStages(searchQuery);
        }}
      />

      {/* Pipeline Summary Bar (Authoritative backend summary values) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-border-subtle rounded-xl text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground-dark">Pipeline Overview:</span>
          <span>
            {pipelineMetrics.totalCount} active{" "}
            {pipelineMetrics.totalCount === 1 ? "opportunity" : "opportunities"}
          </span>
          <span aria-hidden="true">•</span>
          <span>
            Total Value:{" "}
            <strong className="text-foreground-dark font-semibold">
              {formatCurrency(pipelineMetrics.totalValue)}
            </strong>
          </span>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scrollable) */}
      <div
        className="w-full overflow-x-auto pb-6 pt-1 scrollbar-thin"
        aria-label="Deals Pipeline Kanban Board"
      >
        <div className="inline-flex items-start gap-4 min-w-full">
          {stages.map((stage) => {
            const summary = summaries.find((s) => s.stage_id === stage.id);
            return (
              <DealPipelineColumn
                key={stage.id}
                stage={stage}
                stageSummary={summary}
                availableStages={stages}
                deals={dealsByStage[stage.id] ?? []}
                draggingDealId={draggingDealId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDropDealToStage={handleDropDealToStage}
                onMoveStage={handleMoveStage}
                onReopenClick={handleReopenDeal}
                onDeleteClick={(d) => setDealToDelete(d)}
              />
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DealDeleteDialog
        deal={dealToDelete}
        open={Boolean(dealToDelete)}
        onOpenChange={(open) => {
          if (!open) setDealToDelete(null);
        }}
        onSuccess={() => {
          setDealToDelete(null);
          reloadAllStages(searchQuery);
        }}
      />
    </div>
  );
}
