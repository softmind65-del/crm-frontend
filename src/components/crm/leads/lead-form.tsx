"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lead, LeadListItem, LeadSource, LeadStatus, CreateLeadInput, UpdateLeadInput } from "@/types/lead";
import { LeadPipelineStage } from "@/types/pipeline";
import { FormSection } from "@/components/forms/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CustomerPicker } from "@/components/forms/customer-picker";
import { ContactPicker, ContactPickerOption } from "@/components/forms/contact-picker";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import {
  LEAD_TITLE_MAX_LENGTH,
  LEAD_NOTES_MAX_LENGTH,
  validateCustomerId,
  validateContactId,
  validateLeadTitle,
  validateLeadSource,
  validateNormalLeadStatus,
  validateLeadStageId,
  validateEstimatedValue,
  parseEstimatedValue,
  validateNotes,
  validateLeadForm,
  LeadFormErrors,
} from "@/lib/validation/lead";

export interface LeadFormData {
  customer_id: string;
  contact_id: string;
  title: string;
  source: LeadSource;
  status: LeadStatus;
  stage_id: string;
  estimated_value: string;
  notes: string;
}

export type LeadFormTouched = Partial<Record<keyof LeadFormData, boolean>>;

interface CreateLeadFormProps {
  readonly mode?: "create";
  readonly leadId?: never;
  readonly initialLead?: never;
  readonly customerName?: never;
  readonly initialContactOption?: never;
  readonly stages?: readonly LeadPipelineStage[];
}

interface EditLeadFormProps {
  readonly mode: "edit";
  readonly leadId: string;
  readonly initialLead: Lead | LeadListItem;
  readonly customerName?: string;
  readonly initialContactOption?: ContactPickerOption | null;
  readonly stages?: readonly LeadPipelineStage[];
}

export type LeadFormProps = CreateLeadFormProps | EditLeadFormProps;

const DEFAULT_FORM_DATA: LeadFormData = {
  customer_id: "",
  contact_id: "",
  title: "",
  source: "website",
  status: "new",
  stage_id: "",
  estimated_value: "",
  notes: "",
};

interface NormalizedLeadValues {
  contact_id: string | null;
  title: string;
  source: LeadSource;
  status: LeadStatus;
  stage_id: string | null;
  estimated_value: number | null;
  notes: string | null;
}

function normalizeFormData(data: LeadFormData): NormalizedLeadValues {
  return {
    contact_id: data.contact_id.trim() || null,
    title: data.title.trim(),
    source: data.source,
    status: data.status,
    stage_id: data.stage_id.trim() || null,
    estimated_value: parseEstimatedValue(data.estimated_value),
    notes: data.notes.trim() || null,
  };
}

function normalizeLead(
  lead: Lead | LeadListItem,
  selectableStages: readonly LeadPipelineStage[] = []
): NormalizedLeadValues {
  let matchedStageId: string | null = null;
  if (lead.pipeline_stage_id && selectableStages.some((s) => s.id === lead.pipeline_stage_id)) {
    matchedStageId = lead.pipeline_stage_id;
  } else if (selectableStages.length > 0) {
    matchedStageId = selectableStages[0].id;
  }

  return {
    contact_id: lead.contact_id ?? null,
    title: lead.title.trim(),
    source: lead.source,
    status: lead.status,
    stage_id: matchedStageId,
    estimated_value: typeof lead.estimated_value === "number" ? lead.estimated_value : null,
    notes: lead.notes?.trim() || null,
  };
}

function getInitialFormData(
  initialLead?: Lead | LeadListItem | null,
  selectableStages: readonly LeadPipelineStage[] = []
): LeadFormData {
  if (!initialLead) {
    return {
      ...DEFAULT_FORM_DATA,
      stage_id: selectableStages[0]?.id ?? "",
    };
  }

  let matchedStageId = "";
  if (initialLead.pipeline_stage_id && selectableStages.some((s) => s.id === initialLead.pipeline_stage_id)) {
    matchedStageId = initialLead.pipeline_stage_id;
  } else if (selectableStages.length > 0) {
    matchedStageId = selectableStages[0].id;
  }

  return {
    customer_id: initialLead.customer_id ?? "",
    contact_id: initialLead.contact_id ?? "",
    title: initialLead.title ?? "",
    source: initialLead.source ?? "website",
    status:
      initialLead.status && initialLead.status !== "converted"
        ? initialLead.status
        : "new",
    stage_id: matchedStageId,
    estimated_value:
      initialLead.estimated_value !== null && initialLead.estimated_value !== undefined
        ? String(initialLead.estimated_value)
        : "",
    notes: initialLead.notes ?? "",
  };
}

export function LeadForm(props: LeadFormProps) {
  const router = useRouter();
  const { toast, queueToast } = useToast();
  const mode = props.mode ?? "create";
  const isEditMode = mode === "edit";
  const leadId = isEditMode ? props.leadId : undefined;
  const initialLead = isEditMode ? props.initialLead : undefined;
  const customerName = isEditMode ? props.customerName : undefined;
  const initialContactOption = isEditMode ? props.initialContactOption : undefined;
  const stages = props.stages;

  const selectableStages = useMemo(() => {
    if (!stages || stages.length === 0) return [];
    return stages
      .filter((s) => !s.is_system_converted)
      .sort((a, b) => a.position - b.position);
  }, [stages]);

  const hasCustomStages = selectableStages.length > 0;

  const isConverted = initialLead?.status === "converted";

  const [formData, setFormData] = useState<LeadFormData>(() =>
    getInitialFormData(initialLead, selectableStages)
  );



  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [touched, setTouched] = useState<LeadFormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field refs for ordered error focusing
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const sourceSelectRef = useRef<HTMLSelectElement | null>(null);
  const statusSelectRef = useRef<HTMLSelectElement | null>(null);
  const valueInputRef = useRef<HTMLInputElement | null>(null);
  const notesInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Normalized initial state snapshot for edit dirty comparison
  const initialSnapshot = useMemo<NormalizedLeadValues | null>(() => {
    if (isEditMode && initialLead) {
      return normalizeLead(initialLead, selectableStages);
    }
    return null;
  }, [isEditMode, initialLead, selectableStages]);

  // Changed fields calculation for partial PATCH updates
  const changedFields = useMemo<UpdateLeadInput>(() => {
    if (!isEditMode || !initialSnapshot) {
      return {};
    }
    const current = normalizeFormData(formData);
    const patch: Record<string, unknown> = {};

    if (current.contact_id !== initialSnapshot.contact_id) {
      patch.contact_id = current.contact_id;
    }
    if (current.title !== initialSnapshot.title) {
      patch.title = current.title;
    }
    if (current.source !== initialSnapshot.source) {
      patch.source = current.source;
    }

    if (hasCustomStages) {
      if (current.stage_id !== initialSnapshot.stage_id && current.stage_id) {
        patch.stage_id = current.stage_id;
      }
    } else {
      if (current.status !== initialSnapshot.status) {
        patch.status = current.status;
      }
    }

    if (current.estimated_value !== initialSnapshot.estimated_value) {
      patch.estimated_value = current.estimated_value;
    }
    if (current.notes !== initialSnapshot.notes) {
      patch.notes = current.notes;
    }

    return patch as UpdateLeadInput;
  }, [isEditMode, initialSnapshot, formData, hasCustomStages]);

  const hasChanges = isEditMode
    ? Object.keys(changedFields).length > 0
    : true;

  const validateField = (
    field: keyof LeadFormData,
    value: unknown
  ): string | undefined => {
    switch (field) {
      case "customer_id":
        return !isEditMode ? validateCustomerId(value) : undefined;
      case "contact_id":
        return validateContactId(value);
      case "title":
        return validateLeadTitle(value);
      case "source":
        return validateLeadSource(value);
      case "stage_id":
        return hasCustomStages ? validateLeadStageId(value) : undefined;
      case "status":
        return !hasCustomStages ? validateNormalLeadStatus(value) : undefined;
      case "estimated_value":
        return validateEstimatedValue(value);
      case "notes":
        return validateNotes(value);
      default:
        return undefined;
    }
  };

  const handleChange = <K extends keyof LeadFormData>(
    field: K,
    value: LeadFormData[K]
  ) => {
    setFormData((prev) => {
      // If customer changed, clear contact
      if (field === "customer_id" && value !== prev.customer_id) {
        return { ...prev, customer_id: value, contact_id: "" };
      }
      return { ...prev, [field]: value };
    });

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof LeadFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (isEditMode && !hasChanges) {
      return;
    }

    const allTouched: LeadFormTouched = {
      customer_id: true,
      contact_id: true,
      title: true,
      source: true,
      status: true,
      stage_id: true,
      estimated_value: true,
      notes: true,
    };
    setTouched(allTouched);

    const validationErrors = validateLeadForm(
      {
        ...formData,
        stage_id: hasCustomStages ? formData.stage_id : undefined,
        status: hasCustomStages ? undefined : formData.status,
      },
      isEditMode
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.title) {
        titleInputRef.current?.focus();
      } else if (validationErrors.source) {
        sourceSelectRef.current?.focus();
      } else if (validationErrors.stage_id || validationErrors.status) {
        statusSelectRef.current?.focus();
      } else if (validationErrors.estimated_value) {
        valueInputRef.current?.focus();
      } else if (validationErrors.notes) {
        notesInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    if (isEditMode) {
      if (!leadId) {
        toast({
          variant: "error",
          title: "Unable to update lead",
          description: "Lead ID is missing.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/crm/leads/${encodeURIComponent(leadId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(changedFields),
          }
        );

        const result: unknown = await response.json();

        if (!response.ok) {
          toast({
            variant: "error",
            title: "Unable to update lead",
            description: extractErrorMessage(result, "Please try again."),
          });
          setIsSubmitting(false);
          return;
        }

        queueToast({
          variant: "success",
          title: "Lead updated",
          description: "Lead changes were saved successfully.",
        });

        router.push(`/leads/${leadId}`);
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Unable to update lead",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    } else {
      let payload: CreateLeadInput;
      if (hasCustomStages && formData.stage_id) {
        payload = {
          customer_id: formData.customer_id.trim(),
          contact_id: formData.contact_id.trim() ? formData.contact_id.trim() : null,
          title: formData.title.trim(),
          source: formData.source,
          stage_id: formData.stage_id,
          estimated_value: parseEstimatedValue(formData.estimated_value),
          notes: formData.notes.trim() ? formData.notes.trim() : null,
        };
      } else {
        payload = {
          customer_id: formData.customer_id.trim(),
          contact_id: formData.contact_id.trim() ? formData.contact_id.trim() : null,
          title: formData.title.trim(),
          source: formData.source,
          status: formData.status,
          estimated_value: parseEstimatedValue(formData.estimated_value),
          notes: formData.notes.trim() ? formData.notes.trim() : null,
        };
      }

      try {
        const response = await fetch("/api/crm/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result: unknown = await response.json();

        if (!response.ok) {
          toast({
            variant: "error",
            title: "Unable to create lead",
            description: extractErrorMessage(result, "Please try again."),
          });
          setIsSubmitting(false);
          return;
        }

        let createdId: string | null = null;
        if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          result.data &&
          typeof result.data === "object" &&
          "id" in result.data &&
          typeof (result.data as { id: unknown }).id === "string"
        ) {
          createdId = (result.data as { id: string }).id;
        }

        queueToast({
          variant: "success",
          title: "Lead created",
          description: "The lead was added successfully.",
        });

        router.push(createdId ? `/leads/${createdId}` : "/leads");
      } catch {
        toast({
          variant: "error",
          title: "Unable to create lead",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    }
  };


  const cancelHref = isEditMode && leadId
    ? `/leads/${leadId}`
    : "/leads";

  // If lead is converted, render finalized read-only view
  if (isConverted && initialLead) {
    return (
      <div className="bg-white border border-border-subtle rounded-xl p-6 sm:p-8 space-y-4 max-w-2xl">
        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg p-4">
          <svg
            className="w-5 h-5 shrink-0 text-amber-600"
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
          <div>
            <h3 className="text-sm font-semibold">Converted Lead (Finalized)</h3>
            <p className="text-xs text-amber-700/90 mt-0.5">
              This lead was converted into a deal and is now historical source data. Converted leads cannot be modified.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link href={`/leads/${initialLead.id}`}>
            <Button variant="secondary">
              Back to Lead Details
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSaveDisabled =
    isSubmitting ||
    (isEditMode && !hasChanges) ||
    (!isEditMode && !formData.customer_id.trim()) ||
    !formData.title.trim() ||
    (hasCustomStages && !formData.stage_id.trim()) ||
    Object.values(errors).some(Boolean);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* SECTION 1: Customer Relationship */}
      <FormSection
        title="Customer Relationship"
        description="Link this opportunity to an existing customer and contact."
      >
        <div className="space-y-4 max-w-xl">
          {isEditMode ? (
            <div className="space-y-1">
              <span className="block text-sm font-medium text-foreground-dark">
                Customer
              </span>
              <div className="h-10 px-3.5 flex items-center rounded-lg bg-slate-50 border border-border-subtle text-sm text-foreground-dark font-medium">
                {customerName || "Customer"}
              </div>
              <p className="text-xs text-muted-foreground">
                This lead is linked to this customer. The customer cannot be changed here.
              </p>
            </div>
          ) : (
            <CustomerPicker
              label="Customer"
              required
              placeholder="Search or select a customer..."
              value={formData.customer_id || null}
              onChange={(val) => handleChange("customer_id", val ?? "")}
              error={touched.customer_id ? errors.customer_id : undefined}
            />
          )}

          {/* Contact Picker (Dependent on Customer) */}
          <ContactPicker
            label="Contact"
            placeholder={
              !formData.customer_id
                ? "Select a customer first"
                : "Select a contact (optional)..."
            }
            customerId={formData.customer_id || null}
            initialOption={initialContactOption}
            value={formData.contact_id || null}
            onChange={(val) => handleChange("contact_id", val ?? "")}
            helperText={
              formData.customer_id
                ? "Showing contacts for the selected customer."
                : undefined
            }
            error={touched.contact_id ? errors.contact_id : undefined}
          />
        </div>
      </FormSection>

      {/* SECTION 2: Lead Information */}
      <FormSection
        title="Lead Information"
        description="Opportunity qualification and valuation details."
      >
        <div className="space-y-4">
          {/* Lead Title */}
          <Input
            ref={titleInputRef}
            label="Lead Title"
            required
            maxLength={LEAD_TITLE_MAX_LENGTH}
            placeholder="e.g. ERP Cloud Migration or POS Rollout"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
            error={touched.title ? errors.title : undefined}
          />

          {/* Source and Status / Stage (Side-by-side on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              ref={sourceSelectRef}
              label="Source"
              required
              value={formData.source}
              onChange={(e) => handleChange("source", e.target.value as LeadSource)}
              onBlur={() => handleBlur("source")}
              error={touched.source ? errors.source : undefined}
            >
              <option value="website">Website</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="referral">Referral</option>
              <option value="email">Email</option>
              <option value="phone_call">Phone Call</option>
              <option value="walk_in">Walk-in</option>
              <option value="event">Event</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Other</option>
            </Select>

            {hasCustomStages ? (
              <Select
                ref={statusSelectRef}
                label="Stage"
                required
                value={formData.stage_id}
                onChange={(e) => handleChange("stage_id", e.target.value)}
                onBlur={() => handleBlur("stage_id")}
                error={touched.stage_id ? errors.stage_id : undefined}
              >
                {selectableStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                ref={statusSelectRef}
                label="Status"
                required
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value as LeadStatus)}
                onBlur={() => handleBlur("status")}
                error={touched.status ? errors.status : undefined}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
              </Select>
            )}
          </div>

          {/* Estimated Value */}
          <Input
            ref={valueInputRef}
            label="Estimated Value (LKR)"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 1500000"
            value={formData.estimated_value}
            onChange={(e) => handleChange("estimated_value", e.target.value)}
            onBlur={() => handleBlur("estimated_value")}
            error={touched.estimated_value ? errors.estimated_value : undefined}
            helperText="Enter estimated deal potential in Sri Lankan Rupees."
          />

          {/* Notes */}
          <Textarea
            ref={notesInputRef}
            label="Notes"
            rows={3}
            maxLength={LEAD_NOTES_MAX_LENGTH}
            placeholder="Add relevant opportunity requirements, qualification criteria, or discussion summaries..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            error={touched.notes ? errors.notes : undefined}
          />
        </div>
      </FormSection>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {isEditMode && !hasChanges && !isSubmitting && (
          <span className="text-xs text-muted-foreground select-none">
            No unsaved changes
          </span>
        )}
        <Link href={cancelHref}>
          <Button variant="secondary" type="button" disabled={isSubmitting}>
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          loadingText={isEditMode ? "Saving changes..." : "Adding lead..."}
          disabled={isSaveDisabled}
        >
          {isEditMode ? "Save Changes" : "Add Lead"}
        </Button>
      </div>
    </form>
  );
}
