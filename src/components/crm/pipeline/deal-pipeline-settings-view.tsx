"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { resolveStageColor } from "@/lib/utils/stage-colors";
import { StageColorPicker } from "@/components/crm/pipeline/stage-color-picker";
import {
  DealPipeline,
  DealPipelineStage,
  DealPipelineStageSummary,
} from "@/types/deal";
import { StageColorKey } from "@/types/pipeline";

export interface DealPipelineSettingsViewProps {
  readonly initialPipeline: DealPipeline;
  readonly initialSummaries?: readonly DealPipelineStageSummary[];
}

export function DealPipelineSettingsView({
  initialPipeline,
  initialSummaries = [],
}: DealPipelineSettingsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [pipeline, setPipeline] = useState<DealPipeline>(initialPipeline);
  const [summaries, setSummaries] = useState<readonly DealPipelineStageSummary[]>(initialSummaries);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [stageToEdit, setStageToEdit] = useState<DealPipelineStage | null>(null);
  const [stageToArchive, setStageToArchive] = useState<DealPipelineStage | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Reorder state
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);

  // Stage segmentation
  const openStages = useMemo(
    () => pipeline.stages.filter((s) => !s.is_system_won && !s.is_system_lost),
    [pipeline.stages]
  );
  const wonStage = useMemo(
    () => pipeline.stages.find((s) => s.is_system_won),
    [pipeline.stages]
  );
  const lostStage = useMemo(
    () => pipeline.stages.find((s) => s.is_system_lost),
    [pipeline.stages]
  );

  const refreshPipeline = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/crm/deal-pipeline"),
        fetch("/api/crm/deal-pipeline/summary"),
      ]);
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPipeline(pJson.data);
      }
      if (sRes.ok) {
        const sJson = await sRes.json();
        setSummaries(sJson.data ?? []);
      }
      router.refresh();
    } catch {
      // Non-fatal
    }
  };

  const handle409Conflict = async () => {
    toast({
      variant: "warning",
      title: "Version conflict",
      description: "Pipeline changed elsewhere. Latest configuration has been reloaded.",
    });
    await refreshPipeline();
  };

  // Reordering handlers among open stages (Won and Lost excluded)
  const handleMoveOpenStage = async (currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    if (targetIndex < 0 || targetIndex >= openStages.length) return;

    const reordered = [...openStages];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const stageIds = reordered.map((s) => s.id);

    try {
      const response = await fetch("/api/crm/deal-pipeline/stages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_ids: stageIds,
          version: pipeline.version,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to reorder stages",
          description: extractErrorMessage(result, "Reorder failed."),
        });
        await refreshPipeline();
        return;
      }

      setPipeline(result.data);
      toast({
        variant: "success",
        title: "Stages reordered",
        description: "Stage display sequence was updated.",
      });
      router.refresh();
    } catch {
      toast({
        variant: "error",
        title: "Unable to reorder stages",
        description: "Please check your network connection and try again.",
      });
      await refreshPipeline();
    }
  };

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
      handleMoveOpenStage(draggedStageIndex, targetIndex);
    }
    setDraggedStageIndex(null);
  };

  // Set Entry Stage
  const handleSetEntryStage = async (stageToSet: DealPipelineStage) => {
    if (stageToSet.is_entry_stage) return;

    try {
      const response = await fetch(
        `/api/crm/deal-pipeline/stages/${encodeURIComponent(stageToSet.id)}/set-entry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: pipeline.version,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to set entry stage",
          description: extractErrorMessage(result, "Could not update entry stage."),
        });
        return;
      }

      setPipeline(result.data);
      toast({
        variant: "success",
        title: "Entry stage updated",
        description: `"${stageToSet.name}" is now the entry stage for newly created deals.`,
      });
      router.refresh();
    } catch {
      toast({
        variant: "error",
        title: "Unable to set entry stage",
        description: "Please check your network connection and try again.",
      });
    }
  };

  // Add stage
  const handleAddStage = async (
    name: string,
    colorKey: StageColorKey,
    customHex: string | null
  ) => {
    try {
      const response = await fetch("/api/crm/deal-pipeline/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color_key: colorKey,
          custom_color_hex: customHex,
          version: pipeline.version,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to add stage",
          description: extractErrorMessage(result, "Could not add stage."),
        });
        return;
      }

      setPipeline(result.data);
      await refreshPipeline();
      toast({
        variant: "success",
        title: "Stage added",
        description: `Stage "${name}" was added to your pipeline.`,
      });
      setIsAddOpen(false);
    } catch {
      toast({
        variant: "error",
        title: "Unable to add stage",
        description: "Please check your network connection and try again.",
      });
    }
  };

  // Edit stage
  const handleEditStage = async (
    stageId: string,
    newName: string,
    newColorKey: StageColorKey,
    newCustomHex: string | null
  ) => {
    try {
      const response = await fetch(
        `/api/crm/deal-pipeline/stages/${encodeURIComponent(stageId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName,
            color_key: newColorKey,
            custom_color_hex: newCustomHex,
            version: pipeline.version,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to update stage",
          description: extractErrorMessage(result, "Could not update stage."),
        });
        return;
      }

      setPipeline(result.data);
      toast({
        variant: "success",
        title: "Stage updated",
        description: `Stage "${newName}" was updated successfully.`,
      });
      setStageToEdit(null);
      router.refresh();
    } catch {
      toast({
        variant: "error",
        title: "Unable to update stage",
        description: "Please check your network connection and try again.",
      });
    }
  };

  // Archive stage
  const handleArchiveStage = async (
    stageId: string,
    destinationStageId: string | null
  ) => {
    try {
      const response = await fetch(
        `/api/crm/deal-pipeline/stages/${encodeURIComponent(stageId)}/archive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination_stage_id: destinationStageId,
            version: pipeline.version,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to archive stage",
          description: extractErrorMessage(result, "Could not archive stage."),
        });
        return;
      }

      setPipeline(result.data);
      await refreshPipeline();
      toast({
        variant: "success",
        title: "Stage archived",
        description: "Stage was archived successfully.",
      });
      setStageToArchive(null);
    } catch {
      toast({
        variant: "error",
        title: "Unable to archive stage",
        description: "Please check your network connection and try again.",
      });
    }
  };

  // Reset to default pipeline
  const handleConfirmReset = async () => {
    try {
      const response = await fetch("/api/crm/deal-pipeline/reset-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: pipeline.version,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        await handle409Conflict();
        setIsResetOpen(false);
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to reset pipeline",
          description: extractErrorMessage(result, "Could not reset pipeline."),
        });
        setIsResetOpen(false);
        return;
      }

      setPipeline(result.data);
      await refreshPipeline();
      setIsResetOpen(false);
      toast({
        variant: "success",
        title: "Pipeline reset to defaults",
        description: "Restored default stages and colors. New is the entry stage.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Unable to reset pipeline",
        description: "Please check your network connection and try again.",
      });
      setIsResetOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Deal Pipeline"
        description="Customize the stages used to manage sales opportunities."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setIsResetOpen(true)}
              leftIcon={
                <svg
                  className="w-4 h-4 shrink-0 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              }
            >
              Reset to Default
            </Button>
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
          </div>
        }
      />

      {/* Summary Box (Version is NOT shown as per Section 23) */}
      <div className="bg-white border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground-dark">
            Active Stages ({pipeline.stages.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Stages determine the commercial lifecycle and deal qualification steps for your sales pipeline.
          </p>
        </div>
      </div>

      {/* Main Ordered Stage List */}
      <div className="bg-white border border-border-subtle rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-border-subtle flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Stage Sequence</span>
          <span>Actions</span>
        </div>

        <ul role="list" className="divide-y divide-border-subtle">
          {/* Open / Customizable Stages */}
          {openStages.map((stage, index) => {
            const resolved = resolveStageColor(stage.color_key, stage.custom_color_hex);
            const summary = summaries.find((s) => s.stage_id === stage.id);
            const dealCount = summary ? summary.deal_count : 0;
            const isDragging = draggedStageIndex === index;

            return (
              <li
                key={stage.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 transition-colors ${
                  isDragging ? "bg-blue-50/60 opacity-60" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 -ml-1 transition-colors flex items-center justify-center shrink-0"
                    title="Drag to reorder stage"
                    aria-label={`Drag ${stage.name} to reorder`}
                  >
                    <svg
                      className="w-4 h-4 text-slate-400"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="5" cy="3.5" r="1.3" />
                      <circle cx="11" cy="3.5" r="1.3" />
                      <circle cx="5" cy="8" r="1.3" />
                      <circle cx="11" cy="8" r="1.3" />
                      <circle cx="5" cy="12.5" r="1.3" />
                      <circle cx="11" cy="12.5" r="1.3" />
                    </svg>
                  </div>

                  {/* Stage Color Swatch */}
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white ${
                      resolved.isCustom ? "" : resolved.dotClass
                    }`}
                    style={resolved.isCustom ? resolved.dotStyle : undefined}
                    title={`Color: ${resolved.label}`}
                    aria-hidden="true"
                  />

                  {/* Stage Name & Badges */}
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <span className="text-sm font-semibold text-foreground-dark truncate">
                      {stage.name}
                    </span>

                    {/* Entry Stage Badge */}
                    {stage.is_entry_stage && (
                      <Badge
                        variant="success"
                        dot={true}
                        className="border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-brand border-blue-300 shadow-2xs"
                      >
                        Entry Stage
                      </Badge>
                    )}

                    {/* Active Deal Count Pill */}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/70">
                      {dealCount} deal{dealCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Right Area: Stage Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* Set as Entry Stage Button */}
                  {!stage.is_entry_stage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetEntryStage(stage)}
                      className="text-xs"
                    >
                      Set as Entry
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

                  {/* Archive Stage Button (disabled / hidden for entry stage) */}
                  {!stage.is_entry_stage && (
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

          {/* Terminal Won Stage (Pinned Second-Last) */}
          {wonStage && (
            <li className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 bg-emerald-50/20 border-t border-dashed border-emerald-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Pinned Lock Indicator */}
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-100/70 border border-emerald-200 text-emerald-700 shrink-0"
                  title="System Won Stage (Protected)"
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
                  const resolved = resolveStageColor(wonStage.color_key, wonStage.custom_color_hex);
                  return (
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white ${
                        resolved.isCustom ? "" : resolved.dotClass
                      }`}
                      style={resolved.isCustom ? resolved.dotStyle : undefined}
                      title={`Color: ${resolved.label}`}
                      aria-hidden="true"
                    />
                  );
                })()}

                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className="text-sm font-semibold text-foreground-dark truncate">
                    {wonStage.name}
                  </span>
                  <Badge
                    variant="success"
                    dot={false}
                    className="border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300/80"
                  >
                    Terminal Won Stage
                  </Badge>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                    {(summaries.find((s) => s.stage_id === wonStage.id)?.deal_count ?? 0)} deals
                  </span>
                </div>
              </div>

              {/* Won stage allows renaming/color */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStageToEdit(wonStage)}
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

          {/* Terminal Lost Stage (Pinned Last) */}
          {lostStage && (
            <li className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 bg-red-50/20 border-t border-dashed border-red-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Pinned Lock Indicator */}
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-red-100/70 border border-red-200 text-red-700 shrink-0"
                  title="System Lost Stage (Protected)"
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
                  const resolved = resolveStageColor(lostStage.color_key, lostStage.custom_color_hex);
                  return (
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white ${
                        resolved.isCustom ? "" : resolved.dotClass
                      }`}
                      style={resolved.isCustom ? resolved.dotStyle : undefined}
                      title={`Color: ${resolved.label}`}
                      aria-hidden="true"
                    />
                  );
                })()}

                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className="text-sm font-semibold text-foreground-dark truncate">
                    {lostStage.name}
                  </span>
                  <Badge
                    variant="danger"
                    dot={false}
                    className="border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-800 border-red-300/80"
                  >
                    Terminal Lost Stage
                  </Badge>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                    {(summaries.find((s) => s.stage_id === lostStage.id)?.deal_count ?? 0)} deals
                  </span>
                </div>
              </div>

              {/* Lost stage allows renaming/color */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStageToEdit(lostStage)}
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
      <DealStageAddDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={handleAddStage}
      />

      {/* Edit Stage Modal */}
      {stageToEdit && (
        <DealStageEditDialog
          stage={stageToEdit}
          open={Boolean(stageToEdit)}
          onOpenChange={(open) => !open && setStageToEdit(null)}
          onSave={(newName, newColorKey, newCustomHex) => {
            handleEditStage(stageToEdit.id, newName, newColorKey, newCustomHex);
          }}
        />
      )}

      {/* Archive Stage Modal */}
      {stageToArchive && (
        <DealStageArchiveDialog
          stage={stageToArchive}
          open={Boolean(stageToArchive)}
          eligibleDestinations={openStages.filter((s) => s.id !== stageToArchive.id)}
          dealCount={
            summaries.find((s) => s.stage_id === stageToArchive.id)?.deal_count ?? 0
          }
          onOpenChange={(open) => !open && setStageToArchive(null)}
          onArchive={(destinationStageId) => {
            handleArchiveStage(stageToArchive.id, destinationStageId);
          }}
        />
      )}

      {/* Reset to Default Confirm Dialog */}
      <ConfirmDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        title="Reset Deal Pipeline to Defaults?"
        description="This will restore the standard Deal Pipeline stages (New, Proposal, Negotiation, Won, Lost) with their default colors and order. New will become the Entry stage. Any custom stages will be removed, and their active deals reassigned to Proposal."
        confirmLabel="Reset to Default"
        variant="danger"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Dialog Subcomponents
// ----------------------------------------------------------------------

interface DealStageAddDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAdd: (
    name: string,
    colorKey: StageColorKey,
    customColorHex: string | null
  ) => void;
}

function DealStageAddDialog({
  open,
  onOpenChange,
  onAdd,
}: DealStageAddDialogProps) {
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState<StageColorKey>("blue");
  const [customColorHex, setCustomColorHex] = useState<string | null>(null);
  const [isColorValid, setIsColorValid] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    setName("");
    setColorKey("blue");
    setCustomColorHex(null);
    setIsColorValid(true);
    setError(undefined);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Stage name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (trimmed.length > 100) {
      setError("Stage name cannot exceed 100 characters.");
      nameInputRef.current?.focus();
      return;
    }
    if (!isColorValid) return;

    onAdd(trimmed, colorKey, customColorHex);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title="Add Pipeline Stage"
      description="Add a new stage to your commercial deal pipeline."
      size="md"
      initialFocusRef={nameInputRef}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="add-deal-stage-form"
            disabled={!name.trim() || !isColorValid}
          >
            Add Stage
          </Button>
        </div>
      }
    >
      <form id="add-deal-stage-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Stage Name"
          placeholder="e.g. Solution Review, Technical Evaluation"
          required
          maxLength={100}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
        />

        <StageColorPicker
          value={colorKey}
          customColorHex={customColorHex}
          onChange={(newKey, newHex) => {
            setColorKey(newKey);
            setCustomColorHex(newHex);
          }}
          onValidityChange={setIsColorValid}
          previewName={name}
        />
      </form>
    </Modal>
  );
}

interface DealStageEditDialogProps {
  readonly stage: DealPipelineStage;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (
    newName: string,
    newColorKey: StageColorKey,
    newCustomHex: string | null
  ) => void;
}

function DealStageEditDialog({
  stage,
  open,
  onOpenChange,
  onSave,
}: DealStageEditDialogProps) {
  const [name, setName] = useState(stage.name);
  const [colorKey, setColorKey] = useState<StageColorKey>(stage.color_key);
  const [customColorHex, setCustomColorHex] = useState<string | null>(
    stage.custom_color_hex ?? null
  );
  const [isColorValid, setIsColorValid] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    setError(undefined);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Stage name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (trimmed.length > 100) {
      setError("Stage name cannot exceed 100 characters.");
      nameInputRef.current?.focus();
      return;
    }
    if (!isColorValid) return;

    onSave(trimmed, colorKey, customColorHex);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title={`Edit Stage: ${stage.name}`}
      description="Update stage name and visual color assignment."
      size="md"
      initialFocusRef={nameInputRef}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="edit-deal-stage-form"
            disabled={!name.trim() || !isColorValid}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-deal-stage-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Stage Name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
        />

        <StageColorPicker
          value={colorKey}
          customColorHex={customColorHex}
          onChange={(newKey, newHex) => {
            setColorKey(newKey);
            setCustomColorHex(newHex);
          }}
          onValidityChange={setIsColorValid}
          previewName={name}
        />
      </form>
    </Modal>
  );
}

interface DealStageArchiveDialogProps {
  readonly stage: DealPipelineStage;
  readonly eligibleDestinations: readonly DealPipelineStage[];
  readonly dealCount: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onArchive: (destinationStageId: string | null) => void;
}

function DealStageArchiveDialog({
  stage,
  eligibleDestinations,
  dealCount,
  open,
  onOpenChange,
  onArchive,
}: DealStageArchiveDialogProps) {
  const [destinationStageId, setDestinationStageId] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const requiresDestination = dealCount > 0;

  const handleClose = () => {
    setDestinationStageId("");
    setError(undefined);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (requiresDestination && !destinationStageId) {
      setError("Please select a destination stage to reassign active deals.");
      return;
    }
    onArchive(destinationStageId || null);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title={`Archive Stage: ${stage.name}`}
      description="Remove this stage from active pipeline views."
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Archive Stage
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-foreground-dark">
        {requiresDestination ? (
          <>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
              There {dealCount === 1 ? "is" : "are"} currently{" "}
              <strong>
                {dealCount} active deal{dealCount === 1 ? "" : "s"}
              </strong>{" "}
              in this stage. Please select an open destination stage to reassign them before archiving.
            </div>

            <Select
              label="Reassign Deals To"
              required
              value={destinationStageId}
              onChange={(e) => {
                setDestinationStageId(e.target.value);
                if (error) setError(undefined);
              }}
              error={error}
              placeholder="Select destination stage..."
            >
              {eligibleDestinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name}
                </option>
              ))}
            </Select>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            This stage currently has no active deals. Are you sure you want to archive it?
          </p>
        )}
      </div>
    </Modal>
  );
}
