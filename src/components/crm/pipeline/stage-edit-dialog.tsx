"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StageColorPicker } from "@/components/crm/pipeline/stage-color-picker";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadPipeline, LeadPipelineStage, StageColorKey } from "@/types/pipeline";

export interface StageEditDialogProps {
  readonly stage: LeadPipelineStage | null;
  readonly pipeline: LeadPipeline;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: (updatedPipeline: LeadPipeline) => void;
  readonly onConflict?: () => void;
}

export function StageEditDialog({
  stage,
  pipeline,
  open,
  onOpenChange,
  onSuccess,
  onConflict,
}: StageEditDialogProps) {
  if (!stage) return null;

  return (
    <StageEditDialogInner
      key={`${stage.id}-${pipeline.version}-${stage.name}-${stage.color_key}-${stage.custom_color_hex ?? ""}`}
      stage={stage}
      pipeline={pipeline}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      onConflict={onConflict}
    />
  );
}

function StageEditDialogInner({
  stage,
  pipeline,
  open,
  onOpenChange,
  onSuccess,
  onConflict,
}: {
  readonly stage: LeadPipelineStage;
  readonly pipeline: LeadPipeline;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: (updatedPipeline: LeadPipeline) => void;
  readonly onConflict?: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(stage.name);
  const [colorKey, setColorKey] = useState<StageColorKey>(stage.color_key);
  const [customColorHex, setCustomColorHex] = useState<string | null>(stage.custom_color_hex ?? null);
  const [isColorValid, setIsColorValid] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const hasNameChanged = name.trim() !== stage.name;
  const hasColorKeyChanged = colorKey !== stage.color_key;
  const hasCustomHexChanged = (customColorHex ?? null) !== (stage.custom_color_hex ?? null);
  const hasColorChanged = hasColorKeyChanged || hasCustomHexChanged;
  const hasChanges = hasNameChanged || hasColorChanged;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(undefined);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges || !isColorValid) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Stage name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (trimmedName.length > 100) {
      setError("Stage name cannot exceed 100 characters.");
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const payload: Record<string, unknown> = {
      version: pipeline.version,
    };
    if (hasNameChanged) payload.name = trimmedName;
    if (hasColorChanged) {
      payload.color_key = colorKey;
      payload.custom_color_hex = customColorHex;
    }

    try {
      const response = await fetch(
        `/api/crm/lead-pipeline/stages/${encodeURIComponent(stage.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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
          title: "Unable to update stage",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsSubmitting(false);
        return;
      }

      const resObj = result as { data: LeadPipeline };
      toast({
        variant: "success",
        title: "Stage updated",
        description: `Stage "${trimmedName}" was updated successfully.`,
      });

      setIsSubmitting(false);
      handleClose();
      onSuccess(resObj.data);
    } catch {
      toast({
        variant: "error",
        title: "Unable to update stage",
        description: "Please check your network connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title={`Edit Stage: ${stage.name}`}
      description="Update stage display name and semantic color."
      size="md"
      initialFocusRef={nameInputRef}
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
            type="submit"
            form="edit-stage-form"
            isLoading={isSubmitting}
            loadingText="Saving..."
            disabled={isSubmitting || !hasChanges || !name.trim() || !isColorValid}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-stage-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Stage Name"
          required
          maxLength={100}
          placeholder="Stage display name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
          disabled={isSubmitting}
        />

        <StageColorPicker
          value={colorKey}
          customColorHex={customColorHex}
          onChange={(newKey, newHex) => {
            setColorKey(newKey);
            setCustomColorHex(newHex);
          }}
          onValidityChange={setIsColorValid}
          disabled={isSubmitting}
          previewName={name}
        />
      </form>
    </Modal>
  );
}
