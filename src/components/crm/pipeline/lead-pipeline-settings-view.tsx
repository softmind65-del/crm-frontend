"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast, ToastFlushBridge } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { resolveStageColor } from "@/lib/utils/stage-colors";
import { LeadPipeline, LeadPipelineStage, LeadPipelineStageSummary } from "@/types/pipeline";
import { StageAddDialog } from "@/components/crm/pipeline/stage-add-dialog";
import { StageEditDialog } from "@/components/crm/pipeline/stage-edit-dialog";
import { StageSetConversionDialog } from "@/components/crm/pipeline/stage-set-conversion-dialog";
import { StageArchiveDialog } from "@/components/crm/pipeline/stage-archive-dialog";

export interface LeadPipelineSettingsViewProps {
  readonly initialPipeline: LeadPipeline;
  readonly initialSummaries?: readonly LeadPipelineStageSummary[];
}

export function LeadPipelineSettingsView({
  initialPipeline,
  initialSummaries = [],
}: LeadPipelineSettingsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [pipeline, setPipeline] = useState<LeadPipeline>(initialPipeline);
  const [summaries, setSummaries] = useState<readonly LeadPipelineStageSummary[]>(initialSummaries);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [stageToEdit, setStageToEdit] = useState<LeadPipelineStage | null>(null);
  const [stageToSetConversion, setStageToSetConversion] = useState<LeadPipelineStage | null>(null);
  const [stageToArchive, setStageToArchive] = useState<LeadPipelineStage | null>(null);

  // Reordering state
  const [isReordering, setIsReordering] = useState(false);
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);

  // Re-fetch pipeline from server (e.g. after conflict or for sync)
  const refreshPipeline = async () => {
    try {
      const res = await fetch("/api/crm/lead-pipeline");
      if (res.ok) {
        const json = (await res.json()) as { data: LeadPipeline };
        setPipeline(json.data);
      }
      const sumRes = await fetch("/api/crm/lead-pipeline/summary");
      if (sumRes.ok) {
        const sumJson = (await sumRes.json()) as { data: LeadPipelineStageSummary[] };
        setSummaries(sumJson.data);
      }
      router.refresh();
    } catch {
      // Background refresh failure is non-fatal
    }
  };

  const handlePipelineUpdated = (updatedPipeline: LeadPipeline) => {
    setPipeline(updatedPipeline);
    router.refresh();
  };

  // Reordering logic
  const normalStages = pipeline.stages.filter((s) => !s.is_system_converted);
  const convertedStage = pipeline.stages.find((s) => s.is_system_converted);

  const handleMoveStage = async (currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    if (targetIndex < 0 || targetIndex >= normalStages.length) return;

    const reorderedNormal = [...normalStages];
    const [moved] = reorderedNormal.splice(currentIndex, 1);
    reorderedNormal.splice(targetIndex, 0, moved);

    const stageIds = reorderedNormal.map((s) => s.id);
    setIsReordering(true);

    try {
      const response = await fetch("/api/crm/lead-pipeline/stages/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage_ids: stageIds,
          version: pipeline.version,
        }),
      });

      const result: unknown = await response.json();

      if (response.status === 409) {
        toast({
          variant: "warning",
          title: "Version conflict",
          description: "Pipeline was updated elsewhere. Refreshing latest data...",
        });
        await refreshPipeline();
        setIsReordering(false);
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to reorder stages",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsReordering(false);
        return;
      }

      const resObj = result as { data: LeadPipeline };
      toast({
        variant: "success",
        title: "Stages reordered",
        description: "Stage display positions were updated successfully.",
      });

      setPipeline(resObj.data);
      setIsReordering(false);
      router.refresh();
    } catch {
      toast({
        variant: "error",
        title: "Unable to reorder stages",
        description: "Please check your network connection and try again.",
      });
      setIsReordering(false);
    }
  };

  // Drag and drop reordering handlers
  const handleDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    setDraggedStageIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedStageIndex !== null && draggedStageIndex !== targetIndex) {
      handleMoveStage(draggedStageIndex, targetIndex);
    }
    setDraggedStageIndex(null);
  };

  return (
    <div className="space-y-6">
      <ToastFlushBridge />

      {/* Page Header */}
      <PageHeader
        title="Lead Pipeline"
        description="Customize your lead stages and deal conversion process."
        action={
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            leftIcon={
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Add Stage
          </Button>
        }
      />

      {/* Pipeline Summary / Invariant Badge Info */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground-dark">
            Active Stages ({pipeline.stages.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Stages determine the lifecycle and qualification steps for your sales opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Version: {pipeline.version}</span>
          </span>
        </div>
      </div>

      {/* Main Ordered Stage List */}
      <div className="bg-white border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-border-subtle flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Stage Sequence</span>
          <span>Actions</span>
        </div>

        <ul role="list" className="divide-y divide-border-subtle">
          {normalStages.map((stage, index) => {
            const resolved = resolveStageColor(stage.color_key, stage.custom_color_hex);
            const summary = summaries.find((s) => s.stage_id === stage.id);
            const leadCount = summary ? summary.lead_count : 0;
            const isDragging = draggedStageIndex === index;

            return (
              <li
                key={stage.id}
                draggable={!isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 transition-colors ${
                  isDragging ? "opacity-40 bg-slate-100" : "hover:bg-slate-50/80"
                }`}
              >
                {/* Left Area: Drag handle, Reorder stepper, Color swatch, Title & Badges */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Visual Drag Grip Handle */}
                  <div
                    className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 transition-colors hidden sm:flex items-center justify-center shrink-0"
                    title="Drag row to reorder"
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

                  {/* Reorder Stepper Controls */}
                  <div className="flex items-center gap-0.5 shrink-0 bg-slate-50 p-0.5 rounded-lg border border-slate-200/80">
                    <button
                      type="button"
                      aria-label={`Move ${stage.name} up`}
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMoveStage(index, index - 1)}
                      className="p-1 rounded text-slate-500 hover:text-foreground-dark hover:bg-white hover:shadow-2xs disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${stage.name} down`}
                      disabled={index === normalStages.length - 1 || isReordering}
                      onClick={() => handleMoveStage(index, index + 1)}
                      className="p-1 rounded text-slate-500 hover:text-foreground-dark hover:bg-white hover:shadow-2xs disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  {/* Color swatch dot with ring */}
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white ${
                      resolved.isCustom ? "" : resolved.dotClass
                    }`}
                    style={resolved.isCustom ? resolved.dotStyle : undefined}
                    title={`Color: ${resolved.label}`}
                    aria-hidden="true"
                  />

                  {/* Stage display name & badges */}
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <span className="text-sm font-semibold text-foreground-dark truncate">
                      {stage.name}
                    </span>

                    {/* Conversion Stage Badge */}
                    {stage.is_conversion_stage && (
                      <Badge
                        variant="success"
                        dot={true}
                        className="border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                      >
                        Deal Conversion Stage
                      </Badge>
                    )}

                    {/* Active Lead Count pill */}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/70">
                      {leadCount} lead{leadCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Right Area: Stage Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* Set Conversion Stage Action */}
                  {!stage.is_conversion_stage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStageToSetConversion(stage)}
                      className="text-xs"
                    >
                      Set as Conversion
                    </Button>
                  )}

                  {/* Edit Stage Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStageToEdit(stage)}
                    aria-label={`Edit ${stage.name}`}
                    leftIcon={
                      <svg
                        className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>

                  {/* Archive Stage Button */}
                  {!stage.is_conversion_stage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStageToArchive(stage)}
                      aria-label={`Archive ${stage.name}`}
                      className="text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50/50"
                      leftIcon={
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      }
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </li>
            );
          })}

          {/* Converted Terminal Stage (Always Pinned Last) */}
          {convertedStage && (
            <li className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 bg-slate-50/50 border-t border-dashed border-slate-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Pinned Lock Indicator */}
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-200/60 border border-slate-200 text-slate-400 shrink-0"
                  title="System Converted Stage (Locked)"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                {/* Color Swatch */}
                {(() => {
                  const resolvedConverted = resolveStageColor(
                    convertedStage.color_key,
                    convertedStage.custom_color_hex
                  );
                  return (
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white ${
                        resolvedConverted.isCustom ? "" : resolvedConverted.dotClass
                      }`}
                      style={resolvedConverted.isCustom ? resolvedConverted.dotStyle : undefined}
                      title={`Color: ${resolvedConverted.label}`}
                      aria-hidden="true"
                    />
                  );
                })()}

                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className="text-sm font-semibold text-foreground-dark truncate">
                    {convertedStage.name}
                  </span>
                  <Badge
                    variant="neutral"
                    dot={false}
                    className="border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border-slate-300/80"
                  >
                    Terminal Converted Stage
                  </Badge>
                  {/* Lead count */}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium border border-slate-200/60">
                    {(summaries.find((s) => s.stage_id === convertedStage.id)?.lead_count ?? 0)} leads
                  </span>
                </div>
              </div>

              {/* Converted stage can be renamed/recolored */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStageToEdit(convertedStage)}
                  leftIcon={
                    <svg
                      className="w-3.5 h-3.5 shrink-0 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  }
                >
                  Edit
                </Button>
                <span className="text-xs text-muted-foreground italic px-1 select-none">
                  Cannot be reordered or archived
                </span>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Add Stage Modal */}
      <StageAddDialog
        open={isAddOpen}
        pipeline={pipeline}
        onOpenChange={setIsAddOpen}
        onSuccess={handlePipelineUpdated}
        onConflict={refreshPipeline}
      />

      {/* Edit Stage Modal */}
      <StageEditDialog
        stage={stageToEdit}
        pipeline={pipeline}
        open={Boolean(stageToEdit)}
        onOpenChange={(open) => !open && setStageToEdit(null)}
        onSuccess={handlePipelineUpdated}
        onConflict={refreshPipeline}
      />

      {/* Set Conversion Stage Modal */}
      <StageSetConversionDialog
        stage={stageToSetConversion}
        pipeline={pipeline}
        open={Boolean(stageToSetConversion)}
        onOpenChange={(open) => !open && setStageToSetConversion(null)}
        onSuccess={handlePipelineUpdated}
        onConflict={refreshPipeline}
      />

      {/* Archive Stage Modal */}
      <StageArchiveDialog
        stage={stageToArchive}
        pipeline={pipeline}
        stageSummaries={summaries}
        open={Boolean(stageToArchive)}
        onOpenChange={(open) => !open && setStageToArchive(null)}
        onSuccess={handlePipelineUpdated}
        onConflict={refreshPipeline}
      />
    </div>
  );
}
