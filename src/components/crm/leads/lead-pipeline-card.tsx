"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LeadListItem, LeadStatus } from "@/types/lead";
import { formatCurrency } from "@/lib/utils/format";
import { formatLeadSource, formatLeadStatus, LEAD_NORMAL_STATUSES } from "@/lib/utils/lead-format";
import { Button } from "@/components/ui/button";

import { LeadPipelineStage } from "@/types/pipeline";
import { getStageColorStyle } from "@/lib/utils/stage-colors";

export interface LeadPipelineCardProps {
  readonly lead: LeadListItem;
  readonly isDragging?: boolean;
  readonly isMutating?: boolean;
  readonly isConvertedStage?: boolean;
  readonly isConversionStage?: boolean;
  readonly availableStages?: readonly LeadPipelineStage[];
  readonly onDragStart?: (leadId: string) => void;
  readonly onDragEnd?: () => void;
  readonly onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
  readonly onStageChange?: (leadId: string, newStageId: string) => void;
  readonly onInvalidDrag?: (reason: "drag_converted") => void;
  readonly onConvertClick?: (lead: LeadListItem) => void;
  readonly onDeleteClick?: (lead: LeadListItem) => void;
}

export function LeadPipelineCard({
  lead,
  isDragging = false,
  isMutating = false,
  isConvertedStage,
  isConversionStage,
  availableStages,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onStageChange,
  onInvalidDrag,
  onConvertClick,
  onDeleteClick,
}: LeadPipelineCardProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const isConverted = isConvertedStage !== undefined ? isConvertedStage : lead.status === "converted";
  const isQualified = isConversionStage !== undefined ? isConversionStage : lead.status === "qualified";

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isConverted) {
      e.preventDefault();
      onInvalidDrag?.("drag_converted");
      return;
    }
    if (isMutating) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(lead.id);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const availableStatusDestinations = LEAD_NORMAL_STATUSES.filter(
    (s) => s !== lead.status
  );

  const availableStageDestinations = availableStages
    ? availableStages.filter(
        (s) => s.id !== lead.pipeline_stage_id && !s.is_system_converted
      )
    : [];

  return (
    <div
      draggable={!isConverted && !isMutating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-busy={isMutating}
      className={`group relative bg-white border rounded-xl p-3.5 select-none transition-all duration-150 ease-out motion-reduce:transition-none motion-reduce:hover:transform-none ${
        isConverted
          ? "cursor-default bg-slate-50/70 opacity-90 border-slate-200/70"
          : isMutating
          ? "opacity-60 cursor-wait pointer-events-none ring-1 ring-brand/30 border-slate-200"
          : "cursor-grab active:cursor-grabbing border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
      } ${
        isDragging
          ? "opacity-65 scale-[1.015] shadow-lg ring-2 ring-brand/40 border-brand/50 z-20 cursor-grabbing"
          : ""
      }`}
    >
      {/* Header: Title & Contextual Action Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          {isMutating && (
            <svg
              className="w-3.5 h-3.5 text-brand animate-spin shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-label="Updating status..."
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          )}
          <Link
            href={`/leads/${lead.id}`}
            title={lead.title}
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-foreground-dark hover:text-brand transition-colors line-clamp-2 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-xs"
          >
            {lead.title}
          </Link>
        </div>

        {/* Action Menu (3-dots) & Drag Grip Handle for Non-converted leads */}
        {!isConverted && (
          <div className="flex items-center gap-0.5 shrink-0 -mr-1">
            {!isMutating && (
              <div
                className="text-slate-300 group-hover:text-slate-400 p-1 transition-colors cursor-grab active:cursor-grabbing flex items-center justify-center"
                title="Drag lead"
                aria-hidden="true"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3.5" r="1.2" />
                  <circle cx="11" cy="3.5" r="1.2" />
                  <circle cx="5" cy="8" r="1.2" />
                  <circle cx="11" cy="8" r="1.2" />
                  <circle cx="5" cy="12.5" r="1.2" />
                  <circle cx="11" cy="12.5" r="1.2" />
                </svg>
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                draggable={false}
                aria-label={`Actions for ${lead.title}`}
                aria-expanded={isActionsOpen}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionsOpen((prev) => !prev);
                }}
                onBlur={() => setTimeout(() => setIsActionsOpen(false), 150)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground-dark hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

            {isActionsOpen && (
              <div
                role="menu"
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-border-subtle rounded-lg shadow-lg py-1 z-30 text-xs divide-y divide-slate-100"
              >
                <div className="py-0.5">
                  <Link
                    href={`/leads/${lead.id}`}
                    role="menuitem"
                    className="flex items-center px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors"
                  >
                    View details
                  </Link>
                  <Link
                    href={`/leads/${lead.id}/edit`}
                    role="menuitem"
                    className="flex items-center px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors"
                  >
                    Edit lead
                  </Link>
                </div>

                {/* Keyboard / click-accessible stage moves */}
                {onStageChange && availableStageDestinations.length > 0 ? (
                  <div className="py-0.5">
                    <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Move to stage
                    </span>
                    {availableStageDestinations.map((destStage) => {
                      const dotStyle = getStageColorStyle(destStage.color_key);
                      return (
                        <button
                          key={destStage.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsActionsOpen(false);
                            onStageChange(lead.id, destStage.id);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${dotStyle.dotClass}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{destStage.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : onStatusChange && availableStatusDestinations.length > 0 ? (
                  <div className="py-0.5">
                    <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Move to
                    </span>
                    {availableStatusDestinations.map((destStatus) => (
                      <button
                        key={destStatus}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsActionsOpen(false);
                          onStatusChange(lead.id, destStatus);
                        }}
                        className="w-full text-left flex items-center px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {formatLeadStatus(destStatus)}
                      </button>
                    ))}
                  </div>
                ) : null}

                {onDeleteClick && (
                  <div className="py-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsActionsOpen(false);
                        onDeleteClick(lead);
                      }}
                      className="w-full text-left flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Delete lead
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Customer & Contact Relationship */}
      <div className="mt-2 space-y-1 text-xs">
        {/* Customer Row */}
        <div
          className="flex items-center gap-1.5 min-w-0 font-medium text-foreground-dark"
          title={`Customer: ${lead.customer_name}`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="sr-only">Customer: </span>
          <span className="truncate">{lead.customer_name}</span>
        </div>

        {/* Contact Row (omitted if no contact to keep cards clean and compact) */}
        {lead.contact_name && (
          <div
            className="flex items-center gap-1.5 min-w-0 text-muted-foreground text-[11.5px]"
            title={`Contact: ${lead.contact_name}`}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
              />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="sr-only">Contact: </span>
            <span className="truncate">{lead.contact_name}</span>
          </div>
        )}
      </div>

      {/* Value & Source Footer */}
      <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between gap-2 min-w-0">
        <span
          className="text-xs font-semibold text-foreground-dark shrink-0"
          title={`Estimated Value: ${formatCurrency(lead.estimated_value)}`}
        >
          {formatCurrency(lead.estimated_value)}
        </span>

        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 truncate max-w-[120px]"
          title={`Source: ${formatLeadSource(lead.source)}`}
        >
          <span className="truncate">{formatLeadSource(lead.source)}</span>
        </span>
      </div>

      {/* Qualified Status Action: Convert to Deal */}
      {isQualified && onConvertClick && (
        <div className="mt-2.5 pt-2 border-t border-border-subtle">
          <Button
            variant="secondary"
            size="sm"
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onConvertClick(lead)}
            className="w-full text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50/70 border-emerald-300 shadow-2xs hover:border-emerald-400 transition-colors"
            leftIcon={
              <svg
                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
          >
            Convert to Deal
          </Button>
        </div>
      )}

      {/* Converted Finalized Indicator */}
      {isConverted && (
        <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            <svg
              className="w-3 h-3 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Converted
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Read-only</span>
        </div>
      )}
    </div>
  );
}
