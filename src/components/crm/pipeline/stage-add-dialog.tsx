"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StageColorPicker } from "@/components/crm/pipeline/stage-color-picker";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadPipeline, StageColorKey } from "@/types/pipeline";

export interface StageAddDialogProps {
  readonly open: boolean;
  readonly pipeline: LeadPipeline;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: (updatedPipeline: LeadPipeline) => void;
  readonly onConflict?: () => void;
}

export function StageAddDialog({
  open,
  pipeline,
  onOpenChange,
  onSuccess,
  onConflict,
}: StageAddDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState<StageColorKey>("blue");
  const [customColorHex, setCustomColorHex] = useState<string | null>(null);
  const [isColorValid, setIsColorValid] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setName("");
    setColorKey("blue");
    setCustomColorHex(null);
    setIsColorValid(true);
    setError(undefined);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !isColorValid) return;

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

    try {
      const response = await fetch("/api/crm/lead-pipeline/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          color_key: colorKey,
          custom_color_hex: customColorHex,
          version: pipeline.version,
        }),
      });

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
          title: "Unable to add stage",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsSubmitting(false);
        return;
      }

      const resObj = result as { data: LeadPipeline };
      toast({
        variant: "success",
        title: "Stage added",
        description: `Stage "${trimmedName}" was added to your pipeline.`,
      });

      setIsSubmitting(false);
      handleClose();
      onSuccess(resObj.data);
    } catch {
      toast({
        variant: "error",
        title: "Unable to add stage",
        description: "Please check your network connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      title="Add Pipeline Stage"
      description="Add a new stage before the terminal Converted stage."
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
            form="add-stage-form"
            isLoading={isSubmitting}
            loadingText="Adding..."
            disabled={isSubmitting || !name.trim() || !isColorValid}
          >
            Add Stage
          </Button>
        </div>
      }
    >
      <form id="add-stage-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Stage Name"
          required
          maxLength={100}
          placeholder="e.g. Demo Scheduled, Solution Review"
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
