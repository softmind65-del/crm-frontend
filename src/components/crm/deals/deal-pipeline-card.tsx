"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Deal, DealPipelineStage } from "@/types/deal";
import { formatCurrency } from "@/lib/utils/format";
import { formatDealCloseDate } from "@/lib/utils/deal-format";
import { resolveStageColor } from "@/lib/utils/stage-colors";

export interface DealPipelineCardProps {
  readonly deal: Deal;
  readonly stage?: DealPipelineStage;
  readonly isDragging?: boolean;
  readonly availableStages?: readonly DealPipelineStage[];
  readonly onDragStart?: (dealId: string) => void;
  readonly onDragEnd?: () => void;
  readonly onMoveStage?: (dealId: string, targetStageId: string) => void;
  readonly onReopenClick?: (deal: Deal) => void;
  readonly onDeleteClick?: (deal: Deal) => void;
}

export function DealPipelineCard({
  deal,
  stage,
  isDragging = false,
  availableStages = [],
  onDragStart,
  onDragEnd,
  onMoveStage,
  onReopenClick,
  onDeleteClick,
}: DealPipelineCardProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Terminal check: Won or Lost stages are terminal
  const isWon = stage ? stage.is_system_won : deal.stage === "won";
  const isLost = stage ? stage.is_system_lost : deal.stage === "lost";
  const isTerminal = isWon || isLost;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isTerminal) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", deal.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(deal.id);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const availableDestinations = availableStages.filter(
    (s) => s.id !== deal.pipeline_stage_id && s.legacy_stage_key !== deal.stage
  );

  return (
    <div
      draggable={!isTerminal}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative bg-white border rounded-xl p-3.5 select-none transition-all duration-150 ease-out ${
        isTerminal
          ? "cursor-default bg-slate-50/70 opacity-90 border-slate-200/70"
          : "cursor-grab active:cursor-grabbing border-slate-200/90 shadow-2xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
      } ${
        isDragging
          ? "opacity-60 scale-[1.015] shadow-lg ring-2 ring-brand/40 border-brand/50 z-20 cursor-grabbing"
          : ""
      }`}
    >
      {/* 1. Header: Deal Title & Action Controls */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/deals/${deal.id}`}
            title={deal.title}
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-foreground-dark hover:text-brand transition-colors line-clamp-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-xs"
          >
            {deal.title}
          </Link>
        </div>

        {/* Action Menu (3-dots) & Drag Grip */}
        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
          {!isTerminal && (
            <div
              className="text-slate-300 group-hover:text-slate-400 p-1 transition-colors cursor-grab active:cursor-grabbing flex items-center justify-center"
              title="Drag deal"
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
              aria-label={`Actions for ${deal.title}`}
              aria-expanded={isActionsOpen}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsActionsOpen((prev) => !prev);
              }}
              onBlur={() => setTimeout(() => setIsActionsOpen(false), 200)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground-dark hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer"
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
                    href={`/deals/${deal.id}`}
                    role="menuitem"
                    className="flex items-center px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors"
                  >
                    View details
                  </Link>
                </div>

                {/* Keyboard & click-accessible stage change (only for open deals) */}
                {!isTerminal && onMoveStage && availableDestinations.length > 0 && (
                  <div className="py-0.5">
                    <span className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Move to stage
                    </span>
                    {availableDestinations.map((destStage) => {
                      const resolved = resolveStageColor(
                        destStage.color_key,
                        destStage.custom_color_hex
                      );
                      return (
                        <button
                          key={destStage.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsActionsOpen(false);
                            onMoveStage(deal.id, destStage.id);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-foreground-dark hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${resolved.dotClass}`}
                            style={resolved.isCustom ? resolved.dotStyle : undefined}
                            aria-hidden="true"
                          />
                          <span className="truncate">{destStage.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isTerminal && onReopenClick && (
                  <div className="py-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsActionsOpen(false);
                        onReopenClick(deal);
                      }}
                      className="w-full text-left flex items-center px-3 py-1.5 text-brand hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Reopen deal
                    </button>
                  </div>
                )}

                {onDeleteClick && (
                  <div className="py-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsActionsOpen(false);
                        onDeleteClick(deal);
                      }}
                      className="w-full text-left flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Delete deal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Customer Relationship */}
      <div className="mt-2 space-y-1 text-xs">
        <div
          className="flex items-center gap-1.5 min-w-0 font-medium text-foreground-dark"
          title={`Customer: ${deal.customer_name}`}
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
          <span className="truncate">{deal.customer_name}</span>
        </div>

        {deal.contact_name && (
          <div
            className="flex items-center gap-1.5 min-w-0 text-muted-foreground text-[11.5px]"
            title={`Contact: ${deal.contact_name}`}
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
                d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"
              />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="sr-only">Contact: </span>
            <span className="truncate">{deal.contact_name}</span>
          </div>
        )}
      </div>

      {/* 3. Deal Value & Expected Close Date */}
      <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between gap-2 min-w-0">
        <span
          className="text-xs font-semibold text-foreground-dark shrink-0"
          title={`Deal Value: ${formatCurrency(deal.value)}`}
        >
          {formatCurrency(deal.value)}
        </span>

        {deal.expected_close_date && (
          <div
            className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium shrink-0"
            title={`Expected Close Date: ${formatDealCloseDate(deal.expected_close_date)}`}
          >
            <svg
              className="w-3 h-3 text-slate-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Close: {formatDealCloseDate(deal.expected_close_date)}</span>
          </div>
        )}
      </div>

      {/* 5. Terminal State Indicator */}
      {isTerminal && (
        <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
          {isWon ? (
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
              Won
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-800 font-semibold bg-red-50/80 border border-red-200/80 px-2 py-0.5 rounded-full">
              <svg
                className="w-3 h-3 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Lost
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium">Closed</span>
        </div>
      )}
    </div>
  );
}
