"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadPipeline, LeadPipelineStage } from "@/types/pipeline";

export interface StageSetConversionDialogProps {
  readonly stage: LeadPipelineStage | null;
  readonly pipeline: LeadPipeline;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: (updatedPipeline: LeadPipeline) => void;
  readonly onConflict?: () => void;
}

export function StageSetConversionDialog({
  stage,
  pipeline,
  open,
  onOpenChange,
  onSuccess,
  onConflict,
}: StageSetConversionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!stage) return null;

  const currentConversionStage = pipeline.stages.find((s) => s.is_conversion_stage);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/crm/lead-pipeline/stages/${encodeURIComponent(stage.id)}/set-conversion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
          title: "Unable to set conversion stage",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsSubmitting(false);
        return;
      }

      const resObj = result as { data: LeadPipeline };
      toast({
        variant: "success",
        title: "Conversion stage changed",
        description: `"${stage.name}" is now the deal conversion stage.`,
      });

      setIsSubmitting(false);
      handleClose();
      onSuccess(resObj.data);
    } catch {
      toast({
        variant: "error",
        title: "Unable to set conversion stage",
        description: "Please check your network connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title="Set Deal Conversion Stage"
      description="Designate this stage as the trigger for deal conversion."
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
            loadingText="Updating..."
            onClick={handleConfirm}
          >
            Confirm & Change
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-semibold">
              This changes Deal conversion rules across your CRM.
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              Leads in <strong>&ldquo;{stage.name}&rdquo;</strong> will now show the
              &ldquo;Convert to Deal&rdquo; button.
              {currentConversionStage && (
                <>
                  {" "}Leads currently in <strong>&ldquo;{currentConversionStage.name}&rdquo;</strong> will
                  no longer qualify directly for conversion until moved to &ldquo;{stage.name}&rdquo;.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-slate-50 border border-border-subtle rounded-lg p-3 space-y-1">
          <div className="flex justify-between">
            <span>Target Stage:</span>
            <span className="font-semibold text-foreground-dark">{stage.name}</span>
          </div>
          {currentConversionStage && (
            <div className="flex justify-between">
              <span>Current Conversion Source:</span>
              <span className="font-medium text-foreground-dark">
                {currentConversionStage.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
