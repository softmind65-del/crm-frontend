"use client";

import React, { useState } from "react";
import { Deal, DealPipelineStage, DealPipelineStageSummary } from "@/types/deal";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { DealPipelineCard } from "@/components/crm/deals/deal-pipeline-card";
import { resolveStageColor } from "@/lib/utils/stage-colors";

export interface DealPipelineColumnProps {
  readonly stage: DealPipelineStage;
  readonly stageSummary?: DealPipelineStageSummary;
  readonly availableStages?: readonly DealPipelineStage[];
  readonly deals: readonly Deal[];
  readonly draggingDealId?: string | null;
  readonly onDragStart?: (dealId: string) => void;
  readonly onDragEnd?: () => void;
  readonly onDropDealToStage: (dealId: string, targetStageId: string) => void;
  readonly onMoveStage?: (dealId: string, targetStageId: string) => void;
  readonly onReopenClick?: (deal: Deal) => void;
  readonly onDeleteClick?: (deal: Deal) => void;
}

export function DealPipelineColumn({
  stage,
  stageSummary,
  availableStages = [],
  deals,
  draggingDealId,
  onDragStart,
  onDragEnd,
  onDropDealToStage,
  onMoveStage,
  onReopenClick,
  onDeleteClick,
}: DealPipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const resolved = resolveStageColor(stage.color_key, stage.custom_color_hex);

  // Use backend summary if available, fallback to visible cards calculation
  const totalValue = stageSummary !== undefined
    ? stageSummary.total_value
    : deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const dealCount = stageSummary !== undefined
    ? stageSummary.deal_count
    : deals.length;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    onDropDealToStage(dealId, stage.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[320px] min-w-[320px] shrink-0 flex flex-col rounded-xl border transition-all duration-150 p-3.5 min-h-[540px] ${
        resolved.columnContainerClass
      } ${isDragOver ? resolved.columnDragOverClass : ""}`}
      style={{
        ...resolved.columnContainerStyle,
        ...(isDragOver ? resolved.columnDragOverStyle : {}),
      }}
    >
      {/* Column Header */}
      <div
        className={`pb-3 border-b shrink-0 ${resolved.headerBorderClass}`}
        style={resolved.headerBorderStyle}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: Stage Badge & Count Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant={resolved.badgeVariant}
              dot={false}
              className={`border px-2.5 py-0.5 text-xs font-semibold truncate ${resolved.badgeClass}`}
              style={resolved.isCustom ? resolved.badgeStyle : undefined}
            >
              {stage.name}
            </Badge>
            <span
              className={resolved.countPillClass}
              style={resolved.isCustom ? resolved.countPillStyle : undefined}
              aria-label={`${dealCount} deals`}
            >
              {dealCount}
            </span>
          </div>

          {/* Right: Total Value */}
          <span
            className="text-xs font-semibold text-foreground-dark shrink-0"
            title={`Total Value: ${formatCurrency(totalValue)}`}
          >
            {formatCurrency(totalValue)}
          </span>
        </div>

        {/* Semantic Subtitle / Flags */}
        {stage.is_entry_stage ? (
          <div className="mt-2 text-[11px] text-brand flex items-center gap-1.5 font-medium">
            <svg
              className="w-3.5 h-3.5 text-brand shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>Configured Entry Stage</span>
          </div>
        ) : stage.is_system_won ? (
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
            <svg
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Closed Won</span>
          </div>
        ) : stage.is_system_lost ? (
          <div className="mt-2 text-[11px] text-red-700 flex items-center gap-1.5 font-medium">
            <svg
              className="w-3.5 h-3.5 text-red-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Closed Lost</span>
          </div>
        ) : stage.description ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground truncate">
            {stage.description}
          </p>
        ) : null}
      </div>

      {/* Cards Scrollable Body */}
      <div className="flex-1 py-3 space-y-3 overflow-y-auto">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <DealPipelineCard
              key={deal.id}
              deal={deal}
              stage={stage}
              availableStages={availableStages}
              isDragging={draggingDealId === deal.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMoveStage={onMoveStage}
              onReopenClick={onReopenClick}
              onDeleteClick={onDeleteClick}
            />
          ))
        ) : (
          <div
            className={`min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-xs text-muted-foreground text-center p-4 select-none transition-colors ${
              isDragOver
                ? "border-brand/60 bg-white/90 text-brand font-medium shadow-xs"
                : "border-slate-200/90 bg-white/40"
            }`}
          >
            <svg
              className="w-5 h-5 text-slate-300 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>No deals in {stage.name.toLowerCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
