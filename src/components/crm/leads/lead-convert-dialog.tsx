"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import { LeadListItem } from "@/types/lead";
import {
  DEAL_TITLE_MAX_LENGTH,
  validateDealConversionForm,
  DealConversionErrors,
  validateLeadTitle,
  validateEstimatedValue,
  validateExpectedCloseDate,
  validateNotes,
} from "@/lib/validation/lead";

export interface LeadConvertDialogProps {
  readonly lead: LeadListItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function LeadConvertDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: LeadConvertDialogProps) {
  if (!lead) return null;

  return (
    <LeadConvertModalInner
      key={lead.id}
      lead={lead}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}

function LeadConvertModalInner({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: {
  readonly lead: LeadListItem;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [dealTitle, setDealTitle] = useState(lead.title);
  const [dealValue, setDealValue] = useState(
    lead.estimated_value !== null && lead.estimated_value !== undefined
      ? String(lead.estimated_value)
      : ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [dealNotes, setDealNotes] = useState(lead.notes ?? "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<DealConversionErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "title") {
      setErrors((prev) => ({ ...prev, title: validateLeadTitle(dealTitle) }));
    } else if (field === "value") {
      setErrors((prev) => ({ ...prev, value: validateEstimatedValue(dealValue) }));
    } else if (field === "expected_close_date") {
      setErrors((prev) => ({ ...prev, expected_close_date: validateExpectedCloseDate(expectedCloseDate) }));
    } else if (field === "notes") {
      setErrors((prev) => ({ ...prev, notes: validateNotes(dealNotes) }));
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setTouched({
      title: true,
      value: true,
      expected_close_date: true,
      notes: true,
    });

    const validationErrors = validateDealConversionForm({
      title: dealTitle,
      value: dealValue,
      expected_close_date: expectedCloseDate,
      notes: dealNotes,
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.title) {
        titleInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/crm/leads/${encodeURIComponent(lead.id)}/convert-to-deal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: dealTitle.trim(),
            value: dealValue.trim() ? dealValue.trim() : null,
            expected_close_date: expectedCloseDate.trim() ? expectedCloseDate.trim() : null,
            notes: dealNotes.trim() ? dealNotes.trim() : null,
          }),
        }
      );

      const result: unknown = await response.json();

      if (!response.ok) {
        toast({
          variant: "error",
          title: "Unable to convert lead",
          description: extractErrorMessage(result, "Please try again."),
        });
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onOpenChange(false);

      toast({
        variant: "success",
        title: "Lead converted",
        description: "A new deal was created from this lead.",
      });

      onSuccess?.();
    } catch {
      toast({
        variant: "error",
        title: "Unable to convert lead",
        description: "Please check your connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
      title="Convert lead to deal"
      description="Create a new deal from this qualified lead."
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
            type="submit"
            form="convert-lead-form"
            isLoading={isSubmitting}
            loadingText="Converting..."
            disabled={isSubmitting || !dealTitle.trim()}
          >
            Convert to Deal
          </Button>
        </div>
      }
    >
      <form id="convert-lead-form" onSubmit={handleConvert} noValidate className="space-y-4">
        {/* Read-only Relationship Summary */}
        <div className="bg-slate-50 border border-border-subtle rounded-lg p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Lead:</span>
            <span className="font-semibold text-foreground-dark truncate max-w-[240px]">
              {lead.title}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Customer:</span>
            <span className="font-medium text-foreground-dark truncate max-w-[240px]">
              {lead.customer_name}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Contact:</span>
            <span className="font-medium text-foreground-dark truncate max-w-[240px]">
              {lead.contact_name ? lead.contact_name : "—"}
            </span>
          </div>
        </div>

        {/* Editable Deal Title */}
        <Input
          ref={titleInputRef}
          label="Deal Title"
          required
          maxLength={DEAL_TITLE_MAX_LENGTH}
          placeholder="Enter deal title..."
          value={dealTitle}
          onChange={(e) => {
            setDealTitle(e.target.value);
            if (touched.title) {
              setErrors((prev) => ({ ...prev, title: validateLeadTitle(e.target.value) }));
            }
          }}
          onBlur={() => handleBlur("title")}
          error={touched.title ? errors.title : undefined}
        />

        {/* Editable Deal Value */}
        <Input
          label="Deal Value (LKR)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 1500000"
          value={dealValue}
          onChange={(e) => {
            setDealValue(e.target.value);
            if (touched.value) {
              setErrors((prev) => ({ ...prev, value: validateEstimatedValue(e.target.value) }));
            }
          }}
          onBlur={() => handleBlur("value")}
          error={touched.value ? errors.value : undefined}
          helperText="Enter potential deal revenue in Sri Lankan Rupees."
        />

        {/* Editable Expected Close Date */}
        <Input
          label="Expected Close Date"
          type="date"
          value={expectedCloseDate}
          onChange={(e) => {
            setExpectedCloseDate(e.target.value);
            if (touched.expected_close_date) {
              setErrors((prev) => ({
                ...prev,
                expected_close_date: validateExpectedCloseDate(e.target.value),
              }));
            }
          }}
          onBlur={() => handleBlur("expected_close_date")}
          error={touched.expected_close_date ? errors.expected_close_date : undefined}
        />

        {/* Editable Notes */}
        <Textarea
          label="Deal Notes"
          rows={3}
          maxLength={2000}
          placeholder="Additional notes for the new deal..."
          value={dealNotes}
          onChange={(e) => {
            setDealNotes(e.target.value);
            if (touched.notes) {
              setErrors((prev) => ({ ...prev, notes: validateNotes(e.target.value) }));
            }
          }}
          onBlur={() => handleBlur("notes")}
          error={touched.notes ? errors.notes : undefined}
        />
      </form>
    </Modal>
  );
}
