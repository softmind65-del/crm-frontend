"use client";

import React, { useState, useMemo } from "react";
import { LeadListItem, LeadStatus } from "@/types/lead";
import { LEAD_PIPELINE_STATUSES } from "@/lib/utils/lead-format";
import { LeadPipelineColumn } from "@/components/crm/leads/lead-pipeline-column";
import { LeadPipeline as LeadPipelineType, LeadPipelineStageSummary } from "@/types/pipeline";

export interface LeadPipelineProps {
  readonly pipeline?: LeadPipelineType;
  readonly stageSummaries?: readonly LeadPipelineStageSummary[];
  readonly leads: readonly LeadListItem[];
  readonly pendingStatusLeadIds?: ReadonlySet<string>;
  readonly onLeadStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  readonly onLeadStageChange?: (leadId: string, targetStageId: string) => void;
  readonly onInvalidDrop?: (reason: "into_converted") => void;
  readonly onInvalidDrag?: (reason: "drag_converted") => void;
  readonly onConvertClick?: (lead: LeadListItem) => void;
  readonly onDeleteClick?: (lead: LeadListItem) => void;
}

export function LeadPipeline({
  pipeline,
  stageSummaries = [],
  leads,
  pendingStatusLeadIds,
  onLeadStatusChange,
  onLeadStageChange,
  onInvalidDrop,
  onInvalidDrag,
  onConvertClick,
  onDeleteClick,
}: LeadPipelineProps) {
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  // Group leads dynamically by stage ID when pipeline configuration is available
  const leadsByStageId = useMemo(() => {
    if (!pipeline || !pipeline.stages.length) return null;

    const map: Record<string, LeadListItem[]> = {};
    for (const stage of pipeline.stages) {
      map[stage.id] = [];
    }

    const conversionStage = pipeline.stages.find((s) => s.is_conversion_stage);
    const convertedStage = pipeline.stages.find((s) => s.is_system_converted);
    const firstStage = pipeline.stages[0];

    for (const lead of leads) {
      if (lead.pipeline_stage_id && map[lead.pipeline_stage_id]) {
        map[lead.pipeline_stage_id].push(lead);
      } else if (lead.status === "converted" && convertedStage) {
        map[convertedStage.id].push(lead);
      } else if (lead.status === "qualified" && conversionStage) {
        map[conversionStage.id].push(lead);
      } else if (firstStage) {
        map[firstStage.id].push(lead);
      }
    }

    return map;
  }, [pipeline, leads]);

  // Fallback: Group leads by legacy status when pipeline configuration is omitted
  const leadsByLegacyStatus = useMemo(() => {
    const map: Record<LeadStatus, LeadListItem[]> = {
      new: [],
      contacted: [],
      qualified: [],
      unqualified: [],
      converted: [],
    };

    for (const lead of leads) {
      if (map[lead.status]) {
        map[lead.status].push(lead);
      } else {
        map.new.push(lead);
      }
    }

    return map;
  }, [leads]);

  // If dynamic pipeline configuration is provided, render dynamic stages
  if (pipeline && pipeline.stages.length > 0 && leadsByStageId) {
    const sortedStages = [...pipeline.stages].sort((a, b) => a.position - b.position);

    return (
      <div className="w-full overflow-x-auto pb-6 pt-1 scrollbar-thin">
        <div className="inline-flex items-start gap-4 min-w-full">
          {sortedStages.map((stage) => {
            const summary = stageSummaries.find((s) => s.stage_id === stage.id);
            return (
              <LeadPipelineColumn
                key={stage.id}
                stage={stage}
                stageSummary={summary}
                availableStages={pipeline.stages}
                leads={leadsByStageId[stage.id] ?? []}
                draggingLeadId={draggingLeadId}
                pendingStatusLeadIds={pendingStatusLeadIds}
                onDragStart={(id) => setDraggingLeadId(id)}
                onDragEnd={() => setDraggingLeadId(null)}
                onDropLeadToStage={(id, targetStageId) => {
                  setDraggingLeadId(null);
                  if (onLeadStageChange) {
                    onLeadStageChange(id, targetStageId);
                  }
                }}
                onStageChange={onLeadStageChange}
                onConvertClick={onConvertClick}
                onDeleteClick={onDeleteClick}
                onInvalidDrop={onInvalidDrop}
                onInvalidDrag={onInvalidDrag}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback rendering using legacy static columns
  return (
    <div className="w-full overflow-x-auto pb-6 pt-1 scrollbar-thin">
      <div className="inline-flex items-start gap-4 min-w-full">
        {LEAD_PIPELINE_STATUSES.map((status) => (
          <LeadPipelineColumn
            key={status}
            status={status}
            leads={leadsByLegacyStatus[status] ?? []}
            draggingLeadId={draggingLeadId}
            pendingStatusLeadIds={pendingStatusLeadIds}
            onDragStart={(id) => setDraggingLeadId(id)}
            onDragEnd={() => setDraggingLeadId(null)}
            onDropLead={(id, targetStatus) => {
              setDraggingLeadId(null);
              onLeadStatusChange(id, targetStatus);
            }}
            onStatusChange={onLeadStatusChange}
            onConvertClick={onConvertClick}
            onDeleteClick={onDeleteClick}
            onInvalidDrop={onInvalidDrop}
            onInvalidDrag={onInvalidDrag}
          />
        ))}
      </div>
    </div>
  );
}
