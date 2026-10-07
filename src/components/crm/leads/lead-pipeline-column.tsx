"use client";

import React, { useState, useMemo } from "react";
import { LeadListItem, LeadStatus } from "@/types/lead";
import { formatCurrency } from "@/lib/utils/format";
import { formatLeadStatus } from "@/lib/utils/lead-format";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { LeadPipelineCard } from "@/components/crm/leads/lead-pipeline-card";
import { LeadPipelineStage, LeadPipelineStageSummary } from "@/types/pipeline";
import { getStageColorStyle, resolveStageColor } from "@/lib/utils/stage-colors";

interface StatusColumnStyle {
  readonly containerBg: string;
  readonly borderColor: string;
  readonly topAccent: string;
  readonly headerBorder: string;
  readonly badgeVariant: BadgeVariant;
  readonly badgeCustomClass?: string;
  readonly countPill: string;
  readonly dragOverStyle: string;
}

const STATUS_COLUMN_STYLES: Record<LeadStatus, StatusColumnStyle> = {
  new: {
    containerBg: "bg-blue-50/40",
    borderColor: "border-blue-100",
    topAccent: "border-t-4 border-t-blue-500",
    headerBorder: "border-blue-100/80",
    badgeVariant: "info",
    countPill: "bg-blue-100/80 text-blue-700",
    dragOverStyle: "border-blue-400 bg-blue-50/75 ring-2 ring-blue-400/40",
  },
  contacted: {
    containerBg: "bg-cyan-50/40",
    borderColor: "border-cyan-100",
    topAccent: "border-t-4 border-t-cyan-500",
    headerBorder: "border-cyan-100/80",
    badgeVariant: "info",
    badgeCustomClass: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    countPill: "bg-cyan-100/80 text-cyan-700",
    dragOverStyle: "border-cyan-400 bg-cyan-50/75 ring-2 ring-cyan-400/40",
  },
  qualified: {
    containerBg: "bg-emerald-50/40",
    borderColor: "border-emerald-100",
    topAccent: "border-t-4 border-t-emerald-500",
    headerBorder: "border-emerald-100/80",
    badgeVariant: "success",
    countPill: "bg-emerald-100/80 text-emerald-700",
    dragOverStyle: "border-emerald-400 bg-emerald-50/75 ring-2 ring-emerald-400/40",
  },
  unqualified: {
    containerBg: "bg-amber-50/35",
    borderColor: "border-amber-100/80",
    topAccent: "border-t-4 border-t-amber-500",
    headerBorder: "border-amber-100/80",
    badgeVariant: "warning",
    countPill: "bg-amber-100/80 text-amber-800",
    dragOverStyle: "border-amber-400 bg-amber-50/70 ring-2 ring-amber-400/40",
  },
  converted: {
    containerBg: "bg-slate-50/70",
    borderColor: "border-slate-200/90",
    topAccent: "border-t-4 border-t-emerald-600",
    headerBorder: "border-slate-200/80",
    badgeVariant: "success",
    badgeCustomClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    countPill: "bg-slate-200/80 text-slate-700",
    dragOverStyle: "",
  },
};

export interface LeadPipelineColumnProps {
  readonly stage?: LeadPipelineStage;
  readonly status?: LeadStatus;
  readonly stageSummary?: LeadPipelineStageSummary;
  readonly availableStages?: readonly LeadPipelineStage[];
  readonly leads: readonly LeadListItem[];
  readonly draggingLeadId?: string | null;
  readonly pendingStatusLeadIds?: ReadonlySet<string>;
  readonly onDragStart?: (leadId: string) => void;
  readonly onDragEnd?: () => void;
  readonly onDropLead?: (leadId: string, targetStatus: LeadStatus) => void;
  readonly onDropLeadToStage?: (leadId: string, targetStageId: string) => void;
  readonly onStatusChange?: (leadId: string, targetStatus: LeadStatus) => void;
  readonly onStageChange?: (leadId: string, targetStageId: string) => void;
  readonly onInvalidDrop?: (reason: "into_converted") => void;
  readonly onInvalidDrag?: (reason: "drag_converted") => void;
  readonly onConvertClick?: (lead: LeadListItem) => void;
  readonly onDeleteClick?: (lead: LeadListItem) => void;
}

export function LeadPipelineColumn({
  stage,
  status,
  stageSummary,
  availableStages,
  leads,
  draggingLeadId,
  pendingStatusLeadIds,
  onDragStart,
  onDragEnd,
  onDropLead,
  onDropLeadToStage,
  onStatusChange,
  onStageChange,
  onInvalidDrop,
  onInvalidDrag,
  onConvertClick,
  onDeleteClick,
}: LeadPipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Derive stage metadata or fallback to legacy status
  const isConverted = stage ? stage.is_system_converted : status === "converted";
  const isConversionStage = stage ? stage.is_conversion_stage : status === "qualified";
  const stageName = stage ? stage.name : status ? formatLeadStatus(status) : "Stage";

  const resolved = stage
    ? resolveStageColor(stage.color_key, stage.custom_color_hex)
    : null;

  const colStyle = stage
    ? getStageColorStyle(stage.color_key)
    : status
    ? STATUS_COLUMN_STYLES[status]
    : STATUS_COLUMN_STYLES.new;

  // Derive column total value from current leads collection if no summary is available
  const localTotalValue = useMemo(() => {
    return leads.reduce((sum, lead) => {
      const val = lead.estimated_value;
      const num = typeof val === "number" ? val : typeof val === "string" ? parseFloat(val) : 0;
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [leads]);

  // Display authoritative values when available, falling back to local counts
  const displayCount = stageSummary !== undefined ? stageSummary.lead_count : leads.length;
  const displayTotalValue =
    stageSummary !== undefined ? stageSummary.total_estimated_value : localTotalValue;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Converted column CANNOT be a drop target
    if (isConverted) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
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

    if (isConverted) {
      onInvalidDrop?.("into_converted");
      return;
    }

    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    if (stage && onDropLeadToStage) {
      onDropLeadToStage(leadId, stage.id);
    } else if (status && onDropLead) {
      onDropLead(leadId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[320px] min-w-[320px] shrink-0 flex flex-col rounded-xl border transition-all duration-150 p-3.5 min-h-[540px] ${
        resolved?.isCustom
          ? resolved.columnContainerClass
          : `${colStyle.containerBg} ${colStyle.borderColor} ${colStyle.topAccent}`
      } ${
        isDragOver && !isConverted
          ? resolved?.isCustom
            ? resolved.columnDragOverClass
            : colStyle.dragOverStyle
          : ""
      }`}
      style={{
        ...(resolved?.isCustom ? resolved.columnContainerStyle : {}),
        ...(isDragOver && !isConverted && resolved?.isCustom
          ? resolved.columnDragOverStyle
          : {}),
      }}
    >
      {/* Column Header */}
      <div
        className={`pb-3 border-b shrink-0 ${
          resolved?.isCustom ? resolved.headerBorderClass : colStyle.headerBorder
        }`}
        style={resolved?.isCustom ? resolved.headerBorderStyle : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant={resolved?.isCustom ? resolved.badgeVariant : colStyle.badgeVariant}
              dot={false}
              className={
                resolved?.isCustom
                  ? resolved.badgeClass
                  : `border px-2.5 py-0.5 text-xs font-semibold truncate ${colStyle.badgeCustomClass ?? ""}`
              }
              style={resolved?.isCustom ? resolved.badgeStyle : undefined}
            >
              {stageName}
            </Badge>
            <span
              className={
                resolved?.isCustom
                  ? resolved.countPillClass
                  : `inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] rounded-full text-xs font-semibold shrink-0 ${colStyle.countPill}`
              }
              style={resolved?.isCustom ? resolved.countPillStyle : undefined}
            >
              {displayCount}
            </span>
          </div>

          {/* Column total value */}
          <span className="text-xs font-semibold text-foreground-dark shrink-0">
            {formatCurrency(displayTotalValue)}
          </span>
        </div>

        {/* Informational helper for converted or conversion column */}
        {isConverted ? (
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Converted via Qualification</span>
          </div>
        ) : isConversionStage ? (
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
            <svg
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Deal Conversion Source</span>
          </div>
        ) : null}
      </div>

      {/* Cards Scrollable Body */}
      <div className="flex-1 py-3 space-y-3 overflow-y-auto">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadPipelineCard
              key={lead.id}
              lead={lead}
              isDragging={draggingLeadId === lead.id}
              isMutating={pendingStatusLeadIds?.has(lead.id)}
              isConvertedStage={isConverted}
              isConversionStage={isConversionStage}
              availableStages={availableStages}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onStatusChange={onStatusChange}
              onStageChange={onStageChange}
              onInvalidDrag={onInvalidDrag}
              onConvertClick={onConvertClick}
              onDeleteClick={onDeleteClick}
            />
          ))
        ) : (
          <div
            className={`min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-xs text-muted-foreground text-center p-4 select-none transition-colors ${
              isDragOver && !isConverted
                ? "border-brand/60 bg-white/90 text-brand font-medium shadow-xs"
                : "border-slate-200/90 bg-white/40"
            }`}
          >
            <span>No {stageName.toLowerCase()} leads</span>
          </div>
        )}
      </div>
    </div>
  );
}
