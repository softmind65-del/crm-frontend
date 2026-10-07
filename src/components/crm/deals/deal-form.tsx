"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Deal } from "@/types/deal";
import { FormSection } from "@/components/forms/form-section";
import { CustomerPicker, CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPicker, ContactPickerOption } from "@/components/forms/contact-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";

interface CreateDealFormProps {
  readonly mode?: "create";
  readonly dealId?: never;
  readonly initialDeal?: never;
  readonly initialCustomerOption?: never;
  readonly initialContactOption?: never;
}

interface EditDealFormProps {
  readonly mode: "edit";
  readonly dealId: string;
  readonly initialDeal: Deal;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly initialContactOption?: ContactPickerOption | null;
}

export type DealFormProps = CreateDealFormProps | EditDealFormProps;

export function DealForm(props: DealFormProps) {
  const isEdit = props.mode === "edit";
  const router = useRouter();
  const { toast } = useToast();

  const [customerId, setCustomerId] = useState(
    isEdit ? props.initialDeal.customer_id : ""
  );
  const [contactId, setContactId] = useState(
    isEdit ? props.initialDeal.contact_id ?? "" : ""
  );
  const [title, setTitle] = useState(
    isEdit ? props.initialDeal.title : ""
  );
  const [value, setValue] = useState(
    isEdit && props.initialDeal.value !== null && props.initialDeal.value !== undefined
      ? String(props.initialDeal.value)
      : ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    isEdit ? props.initialDeal.expected_close_date ?? "" : ""
  );
  const [notes, setNotes] = useState(
    isEdit ? props.initialDeal.notes ?? "" : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleCustomerChange = (val: string | null) => {
    const nextId = val ?? "";
    setCustomerId(nextId);
    setContactId("");
    if (errors.customerId) {
      setErrors((prev) => ({ ...prev, customerId: "" }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!customerId.trim()) {
      newErrors.customerId = "Customer / Company selection is required.";
    }
    if (!title.trim()) {
      newErrors.title = "Deal title is required.";
    }
    if (value !== "" && Number(value) < 0) {
      newErrors.value = "Deal value cannot be negative.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setApiError(null);
    setIsSubmitting(true);

    try {
      const endpoint = isEdit
        ? `/api/crm/deals/${encodeURIComponent(props.dealId)}`
        : "/api/crm/deals";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          customer_id: customerId.trim(),
          contact_id: contactId.trim() || null,
          value: value !== "" ? Number(value) : null,
          expected_close_date: expectedCloseDate.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMsg = extractErrorMessage(
          result,
          isEdit
            ? "Unable to update deal. Please try again."
            : "Unable to create deal. Please try again."
        );
        setApiError(errorMsg);
        toast({
          variant: "error",
          title: isEdit ? "Unable to update deal" : "Unable to create deal",
          description: errorMsg,
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        variant: "success",
        title: isEdit ? "Deal updated" : "Deal created",
        description: isEdit
          ? `Deal "${title.trim()}" updated successfully.`
          : `Deal "${title.trim()}" created successfully.`,
      });

      if (isEdit) {
        router.push(`/deals/${props.dealId}`);
      } else {
        router.push("/deals");
      }
      router.refresh();
    } catch {
      const errorMsg = "Unable to connect to the service. Please try again.";
      setApiError(errorMsg);
      toast({
        variant: "error",
        title: "Connection error",
        description: errorMsg,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {apiError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2.5"
        >
          <svg
            className="w-5 h-5 text-red-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* SECTION 1: Customer Relationship */}
      <FormSection
        title="Customer & Contact Association"
        description="Select an existing customer account and optional designated contact."
      >
        <div className="space-y-4 max-w-xl">
          <CustomerPicker
            label="Customer / Company"
            required
            placeholder="Search or select a customer..."
            initialOption={props.initialCustomerOption}
            value={customerId || null}
            onChange={handleCustomerChange}
            error={errors.customerId}
            disabled={isSubmitting}
          />

          <ContactPicker
            label="Primary Contact"
            placeholder={
              !customerId
                ? "Select a customer first"
                : "Select a contact (optional)..."
            }
            customerId={customerId || null}
            initialOption={props.initialContactOption}
            disabled={!customerId || isSubmitting}
            value={contactId || null}
            onChange={(val) => setContactId(val ?? "")}
            helperText={
              customerId
                ? "Showing contacts for the selected customer."
                : undefined
            }
          />
        </div>
      </FormSection>

      {/* SECTION 2: Deal Information */}
      <FormSection
        title="Deal Information"
        description="Commercial opportunity details and timeline."
      >
        <div className="space-y-4">
          <Input
            label="Deal Title"
            required
            placeholder="e.g. Enterprise Cloud Migration or POS Rollout"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            error={errors.title}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Deal Value (LKR)"
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 1850000"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (errors.value) setErrors((prev) => ({ ...prev, value: "" }));
              }}
              error={errors.value}
              helperText="Estimated deal value in Sri Lankan Rupees."
              disabled={isSubmitting}
            />

            <Input
              label="Expected Close Date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Textarea
            label="Internal Notes"
            rows={3}
            placeholder="Add relevant opportunity requirements, milestones, or discussion summaries..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </FormSection>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={isEdit ? `/deals/${props.dealId}` : "/deals"}>
          <Button variant="secondary" type="button" disabled={isSubmitting}>
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          loadingText={isEdit ? "Saving changes..." : "Creating deal..."}
          disabled={isSubmitting}
        >
          {isEdit ? "Save Changes" : "Create Deal"}
        </Button>
      </div>
    </form>
  );
}
