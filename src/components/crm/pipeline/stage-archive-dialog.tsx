"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadPipeline, LeadPipelineStage, LeadPipelineStageSummary } from "@/types/pipeline";

export interface StageArchiveDialogProps {
  readonly stage: LeadPipelineStage | null;
  readonly pipeline: LeadPipeline;
  readonly stageSummaries?: readonly LeadPipelineStageSummary[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: (updatedPipeline: LeadPipeline) => void;
  readonly onConflict?: () => void;
}

export function StageArchiveDialog({
  stage,
  pipeline,
  stageSummaries = [],
  open,
  onOpenChange,
  onSuccess,
  onConflict,
}: StageArchiveDialogProps) {
  const { toast } = useToast();
  const [destinationStageId, setDestinationStageId] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!stage) return null;

  // Find eligible destination stages:
  // Must be active, different from source, not system Converted
  const eligibleDestinations = pipeline.stages.filter(
    (s) => s.id !== stage.id && !s.is_system_converted
  );

  // Check lead count for this stage from authoritative summary
  const summary = stageSummaries.find((s) => s.stage_id === stage.id);
  const leadCount = summary ? summary.lead_count : 0;
  const requiresDestination = leadCount > 0;

  const handleClose = () => {
    if (isSubmitting) return;
    setDestinationStageId("");
    setError(undefined);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (requiresDestination && !destinationStageId) {
      setError("Please select a destination stage to reassign leads.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch(
        `/api/crm/lead-pipeline/stages/${encodeURIComponent(stage.id)}/archive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination_stage_id: destinationStageId.trim() ? destinationStageId.trim() : null,
            version: pipeline.version,
          }),
        }
      );

      const result: unknown = await response.json();

      if (response.status === 409) {
        toast({
          variant: "warning",
          title: "Version conflict",
          description: "The pipeline was updated elsewhere. Refreshing latest data...",
        });
        setIsSubmitting(false);
        handleClose();
        onConflict?.();
        return;
      }

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to archive stage",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsSubmitting(false);
        return;
      }

      const resObj = result as { data: LeadPipeline };
      toast({
        variant: "success",
        title: "Stage archived",
        description: `Stage "${stage.name}" has been removed from the pipeline.`,
      });

      setIsSubmitting(false);
      handleClose();
      onSuccess(resObj.data);
    } catch {
      toast({
        variant: "error",
        title: "Unable to archive stage",
        description: "Please check your network connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title={`Archive Stage: ${stage.name}`}
      description="Remove this stage from your active lead pipeline."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="secondary"
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            isLoading={isSubmitting}
            loadingText="Archiving..."
            disabled={isSubmitting || (requiresDestination && !destinationStageId)}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-transparent"
          >
            Archive Stage
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-lg flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="text-xs text-red-900 space-y-1">
            <p className="font-semibold">
              Archiving removes this stage from board columns and dropdowns.
            </p>
            {leadCount > 0 ? (
              <p className="text-red-800/90 leading-relaxed">
                There are currently <strong>{leadCount} lead{leadCount === 1 ? "" : "s"}</strong> in this stage.
                You must select a destination stage to reassign these leads.
              </p>
            ) : (
              <p className="text-red-800/90 leading-relaxed">
                This stage contains no active leads. You can archive it directly or select a fallback destination.
              </p>
            )}
          </div>
        </div>

        {/* Destination stage selector */}
        {eligibleDestinations.length > 0 && (
          <div className="space-y-2">
            <Select
              label={
                requiresDestination
                  ? "Reassign leads to (Required)"
                  : "Reassign leads to (Optional)"
              }
              required={requiresDestination}
              value={destinationStageId}
              onChange={(e) => {
                setDestinationStageId(e.target.value);
                if (error) setError(undefined);
              }}
              error={error}
              disabled={isSubmitting}
            >
              <option value="">
                {requiresDestination ? "Select destination stage..." : "None (No leads to reassign)"}
              </option>
              {eligibleDestinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name} {dest.is_conversion_stage ? "(Conversion Stage)" : ""}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              All referencing leads (including soft-deleted records) will have their stage updated atomically.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
