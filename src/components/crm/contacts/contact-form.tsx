"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormSection } from "@/components/forms/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CustomerPicker } from "@/components/forms/customer-picker";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import {
  Contact,
  ContactStatus,
  CreateContactInput,
  UpdateContactInput,
} from "@/types/contact";
import {
  CONTACT_NAME_MAX_LENGTH,
  JOB_TITLE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  MOBILE_MAX_LENGTH,
  validateCustomerId,
  validateContactName,
  validateJobTitle,
  validateEmail,
  validatePhone,
  validateMobile,
  validateContactStatus,
  validateContactForm,
  ContactFormErrors,
} from "@/lib/validation/contact";

export interface ContactFormData {
  customer_id: string;
  is_primary: boolean;
  name: string;
  job_title: string;
  email: string;
  phone: string;
  mobile: string;
  status: ContactStatus;
}

export type FormTouched = Partial<Record<keyof ContactFormData, boolean>>;

interface CreateContactFormProps {
  readonly mode?: "create";
  readonly contactId?: never;
  readonly initialValues?: never;
  readonly customerName?: never;
}

interface EditContactFormProps {
  readonly mode: "edit";
  readonly contactId: string;
  readonly initialValues: Contact;
  readonly customerName?: string;
}

export type ContactFormProps =
  | CreateContactFormProps
  | EditContactFormProps;

const DEFAULT_FORM_DATA: ContactFormData = {
  customer_id: "",
  is_primary: false,
  name: "",
  job_title: "",
  email: "",
  phone: "",
  mobile: "",
  status: "active",
};

interface NormalizedContactValues {
  name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: ContactStatus;
  is_primary: boolean;
}

function normalizeFormData(data: ContactFormData): NormalizedContactValues {
  return {
    name: data.name.trim(),
    job_title: data.job_title.trim() || null,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
    mobile: data.mobile.trim() || null,
    status: data.status,
    is_primary: data.is_primary,
  };
}

function normalizeContact(contact: Contact): NormalizedContactValues {
  return {
    name: contact.name.trim(),
    job_title: contact.job_title?.trim() || null,
    email: contact.email?.trim() || null,
    phone: contact.phone?.trim() || null,
    mobile: contact.mobile?.trim() || null,
    status: contact.status,
    is_primary: contact.is_primary,
  };
}

function getInitialFormData(initialContact?: Contact): ContactFormData {
  if (!initialContact) {
    return DEFAULT_FORM_DATA;
  }
  return {
    customer_id: initialContact.customer_id ?? "",
    is_primary: initialContact.is_primary ?? false,
    name: initialContact.name ?? "",
    job_title: initialContact.job_title ?? "",
    email: initialContact.email ?? "",
    phone: initialContact.phone ?? "",
    mobile: initialContact.mobile ?? "",
    status: initialContact.status ?? "active",
  };
}

export function ContactForm(props: ContactFormProps) {
  const router = useRouter();
  const { toast, queueToast } = useToast();
  const mode = props.mode ?? "create";
  const isEditMode = mode === "edit";
  const contactId = isEditMode ? props.contactId : undefined;
  const initialValues = isEditMode ? props.initialValues : undefined;
  const customerName = isEditMode ? props.customerName : undefined;

  const [formData, setFormData] = useState<ContactFormData>(() =>
    getInitialFormData(initialValues)
  );
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field refs for ordered error focusing
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const statusSelectRef = useRef<HTMLSelectElement | null>(null);

  // Normalized initial state snapshot for edit dirty comparison
  const initialSnapshot = useMemo<NormalizedContactValues | null>(() => {
    if (isEditMode && initialValues) {
      return normalizeContact(initialValues);
    }
    return null;
  }, [isEditMode, initialValues]);

  // Changed fields calculation for partial PATCH updates
  const changedFields = useMemo<UpdateContactInput>(() => {
    if (!isEditMode || !initialSnapshot) {
      return {};
    }
    const current = normalizeFormData(formData);
    const patch: Record<string, unknown> = {};

    if (current.name !== initialSnapshot.name) {
      patch.name = current.name;
    }
    if (current.job_title !== initialSnapshot.job_title) {
      patch.job_title = current.job_title;
    }
    if (current.email !== initialSnapshot.email) {
      patch.email = current.email;
    }
    if (current.phone !== initialSnapshot.phone) {
      patch.phone = current.phone;
    }
    if (current.mobile !== initialSnapshot.mobile) {
      patch.mobile = current.mobile;
    }
    if (current.status !== initialSnapshot.status) {
      patch.status = current.status;
    }
    if (current.is_primary !== initialSnapshot.is_primary) {
      patch.is_primary = current.is_primary;
    }

    return patch as UpdateContactInput;
  }, [isEditMode, initialSnapshot, formData]);

  const hasChanges = isEditMode
    ? Object.keys(changedFields).length > 0
    : true;

  const validateField = (
    field: keyof ContactFormData,
    value: unknown
  ): string | undefined => {
    switch (field) {
      case "customer_id":
        return !isEditMode ? validateCustomerId(value) : undefined;
      case "name":
        return validateContactName(value);
      case "job_title":
        return validateJobTitle(value);
      case "email":
        return validateEmail(value);
      case "phone":
        return validatePhone(value);
      case "mobile":
        return validateMobile(value);
      case "status":
        return validateContactStatus(value);
      default:
        return undefined;
    }
  };

  const handleChange = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof ContactFormData) => {
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

    const allTouched: FormTouched = {
      customer_id: true,
      name: true,
      job_title: true,
      email: true,
      phone: true,
      mobile: true,
      status: true,
      is_primary: true,
    };
    setTouched(allTouched);

    const validationErrors = validateContactForm(formData, isEditMode);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.name) {
        nameInputRef.current?.focus();
      } else if (validationErrors.job_title) {
        jobTitleInputRef.current?.focus();
      } else if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.phone) {
        phoneInputRef.current?.focus();
      } else if (validationErrors.mobile) {
        mobileInputRef.current?.focus();
      } else if (validationErrors.status) {
        statusSelectRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    if (isEditMode) {
      if (!contactId) {
        toast({
          variant: "error",
          title: "Unable to update contact",
          description: "Contact ID is missing.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/crm/contacts/${encodeURIComponent(contactId)}`,
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
            title: "Unable to update contact",
            description: extractErrorMessage(result, "Please try again."),
          });
          setIsSubmitting(false);
          return;
        }

        queueToast({
          variant: "success",
          title: "Contact updated",
          description: "Contact changes were saved successfully.",
        });

        router.push(`/contacts/${contactId}`);
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Unable to update contact",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    } else {
      const payload: CreateContactInput = {
        customer_id: formData.customer_id.trim(),
        name: formData.name.trim(),
        job_title: formData.job_title.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        mobile: formData.mobile.trim() || null,
        status: formData.status,
        is_primary: formData.is_primary,
      };

      try {
        const response = await fetch("/api/crm/contacts", {
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
            title: "Unable to create contact",
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
          title: "Contact created",
          description: "The contact was added successfully.",
        });

        router.push(createdId ? `/contacts/${createdId}` : "/contacts");
      } catch {
        toast({
          variant: "error",
          title: "Unable to create contact",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    }
  };

  const cancelHref = isEditMode
    ? `/contacts/${contactId}`
    : "/contacts";

  const isSaveDisabled =
    isSubmitting ||
    (isEditMode && !hasChanges) ||
    (!isEditMode && !formData.customer_id.trim()) ||
    !formData.name.trim() ||
    Object.values(errors).some(Boolean);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* SECTION 1: Customer Relationship */}
      <FormSection
        title="Customer Relationship"
        description="Link this contact to an existing customer."
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
                Customer relationship cannot be changed after creation.
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

          <div className="pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-foreground-dark">
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) => handleChange("is_primary", e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span>Mark as primary contact</span>
            </label>
          </div>
        </div>
      </FormSection>

      {/* SECTION 2: Contact Information */}
      <FormSection
        title="Contact Information"
        description="Personal and communication details for this contact."
      >
        <div className="space-y-4">
          {/* Contact Name (Full width) */}
          <div>
            <Input
              ref={nameInputRef}
              label="Contact Name"
              required
              maxLength={CONTACT_NAME_MAX_LENGTH}
              placeholder="e.g. Jhon Perera"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              error={touched.name ? errors.name : undefined}
            />
          </div>

          {/* Job Title (Full width) */}
          <div>
            <Input
              ref={jobTitleInputRef}
              label="Job Title"
              maxLength={JOB_TITLE_MAX_LENGTH}
              placeholder="e.g. Director or Operations Manager"
              value={formData.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              onBlur={() => handleBlur("job_title")}
              error={touched.job_title ? errors.job_title : undefined}
            />
          </div>

          {/* Email (Full width) */}
          <div>
            <Input
              ref={emailInputRef}
              label="Email"
              type="email"
              maxLength={EMAIL_MAX_LENGTH}
              placeholder="e.g. @example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : undefined}
            />
          </div>

          {/* Phone and Mobile (Desktop side-by-side, mobile stacked) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              ref={phoneInputRef}
              label="Phone"
              type="tel"
              maxLength={PHONE_MAX_LENGTH}
              placeholder="e.g. 011 234 5678"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              error={touched.phone ? errors.phone : undefined}
            />

            <Input
              ref={mobileInputRef}
              label="Mobile"
              type="tel"
              maxLength={MOBILE_MAX_LENGTH}
              placeholder="e.g. +94 77 123 4567"
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              onBlur={() => handleBlur("mobile")}
              error={touched.mobile ? errors.mobile : undefined}
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 3: Status */}
      <FormSection
        title="Status"
        description="Set the current lifecycle status for this contact."
      >
        <div className="max-w-xs">
          <Select
            ref={statusSelectRef}
            label="Status"
            required
            value={formData.status}
            onChange={(e) =>
              handleChange("status", e.target.value as ContactStatus)
            }
            onBlur={() => handleBlur("status")}
            error={touched.status ? errors.status : undefined}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
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
          loadingText={isEditMode ? "Saving changes..." : "Adding contact..."}
          disabled={isSaveDisabled}
        >
          {isEditMode ? "Save Changes" : "Add Contact"}
        </Button>
      </div>
    </form>
  );
}
