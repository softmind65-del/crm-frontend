"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormSection } from "@/components/forms/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/api/error-extractor";
import {
  Customer,
  CustomerType,
  CustomerStatus,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/types/customer";
import {
  CUSTOMER_NAME_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  ADDRESS_MAX_LENGTH,
  validateCustomerType,
  validateCustomerName,
  validateCompanyName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateCustomerStatus,
  validateCustomerForm,
} from "@/lib/validation/customer";

export interface CustomerFormData {
  customer_type: CustomerType;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
}

export type FormErrors = Partial<Record<keyof CustomerFormData, string>>;
export type FormTouched = Partial<Record<keyof CustomerFormData, boolean>>;

interface CreateCustomerFormProps {
  readonly mode?: "create";
  readonly customerId?: never;
  readonly initialValues?: never;
}

interface EditCustomerFormProps {
  readonly mode: "edit";
  readonly customerId: string;
  readonly initialValues: Customer;
}

export type CustomerFormProps =
  | CreateCustomerFormProps
  | EditCustomerFormProps;

const DEFAULT_FORM_DATA: CustomerFormData = {
  customer_type: "company",
  name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  status: "active",
};

interface NormalizedCustomerValues {
  customer_type: CustomerType;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: CustomerStatus;
}

function normalizeFormData(data: CustomerFormData): NormalizedCustomerValues {
  return {
    customer_type: data.customer_type,
    name: data.name.trim(),
    company_name: data.company_name.trim() || null,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
    address: data.address.trim() || null,
    status: data.status,
  };
}

function normalizeCustomer(customer: Customer): NormalizedCustomerValues {
  return {
    customer_type: customer.customer_type,
    name: customer.name.trim(),
    company_name: customer.company_name?.trim() || null,
    email: customer.email?.trim() || null,
    phone: customer.phone?.trim() || null,
    address: customer.address?.trim() || null,
    status: customer.status,
  };
}

function getInitialFormData(
  initialCustomer?: Customer
): CustomerFormData {
  if (!initialCustomer) {
    return DEFAULT_FORM_DATA;
  }
  return {
    customer_type: initialCustomer.customer_type ?? "company",
    name: initialCustomer.name ?? "",
    company_name: initialCustomer.company_name ?? "",
    email: initialCustomer.email ?? "",
    phone: initialCustomer.phone ?? "",
    address: initialCustomer.address ?? "",
    status: initialCustomer.status ?? "active",
  };
}

export function CustomerForm(props: CustomerFormProps) {
  const router = useRouter();
  const { toast, queueToast } = useToast();
  const mode = props.mode ?? "create";
  const isEditMode = mode === "edit";
  const customerId = isEditMode ? props.customerId : undefined;
  const initialValues = isEditMode ? props.initialValues : undefined;

  const [formData, setFormData] = useState<CustomerFormData>(() =>
    getInitialFormData(initialValues)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field refs for ordered error focusing on invalid submit
  const typeSelectRef = useRef<HTMLSelectElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const companyInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const addressInputRef = useRef<HTMLTextAreaElement | null>(null);
  const statusSelectRef = useRef<HTMLSelectElement | null>(null);

  // Normalized initial state snapshot for edit dirty comparison
  const initialSnapshot = useMemo<NormalizedCustomerValues | null>(() => {
    if (isEditMode && initialValues) {
      return normalizeCustomer(initialValues);
    }
    return null;
  }, [isEditMode, initialValues]);

  // Changed fields calculation for partial PATCH updates
  const changedFields = useMemo<UpdateCustomerInput>(() => {
    if (!isEditMode || !initialSnapshot) {
      return {};
    }
    const current = normalizeFormData(formData);
    const patch: Record<string, unknown> = {};

    if (current.customer_type !== initialSnapshot.customer_type) {
      patch.customer_type = current.customer_type;
    }
    if (current.name !== initialSnapshot.name) {
      patch.name = current.name;
    }
    if (current.company_name !== initialSnapshot.company_name) {
      patch.company_name = current.company_name;
    }
    if (current.email !== initialSnapshot.email) {
      patch.email = current.email;
    }
    if (current.phone !== initialSnapshot.phone) {
      patch.phone = current.phone;
    }
    if (current.address !== initialSnapshot.address) {
      patch.address = current.address;
    }
    if (current.status !== initialSnapshot.status) {
      patch.status = current.status;
    }

    return patch as UpdateCustomerInput;
  }, [isEditMode, initialSnapshot, formData]);

  const hasChanges = isEditMode
    ? Object.keys(changedFields).length > 0
    : true;

  // Single field validation using centralized validators
  const validateField = (
    field: keyof CustomerFormData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "customer_type":
        return validateCustomerType(value);
      case "name":
        return validateCustomerName(value);
      case "company_name":
        return validateCompanyName(value);
      case "email":
        return validateEmail(value);
      case "phone":
        return validatePhone(value);
      case "address":
        return validateAddress(value);
      case "status":
        return validateCustomerStatus(value);
      default:
        return undefined;
    }
  };

  // Field change handler
  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // If already touched, re-validate actively to clear/update errors
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Field blur handler
  const handleBlur = (field: keyof CustomerFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    // In edit mode, prevent submission if no changes were made
    if (isEditMode && !hasChanges) {
      return;
    }

    // Mark all fields touched
    const allTouched: FormTouched = {
      customer_type: true,
      name: true,
      company_name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
    };
    setTouched(allTouched);

    const validationErrors = validateCustomerForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus first invalid field in specified order
      if (validationErrors.customer_type) {
        typeSelectRef.current?.focus();
      } else if (validationErrors.name) {
        nameInputRef.current?.focus();
      } else if (validationErrors.company_name) {
        companyInputRef.current?.focus();
      } else if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.phone) {
        phoneInputRef.current?.focus();
      } else if (validationErrors.address) {
        addressInputRef.current?.focus();
      } else if (validationErrors.status) {
        statusSelectRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    if (isEditMode) {
      if (!customerId) {
        toast({
          variant: "error",
          title: "Unable to update customer",
          description: "Customer ID is missing.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/crm/customers/${encodeURIComponent(customerId)}`,
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
            title: "Unable to update customer",
            description: extractErrorMessage(result, "Please try again."),
          });
          setIsSubmitting(false);
          return;
        }

        // Defer success notification until destination content resolves and renders
        queueToast({
          variant: "success",
          title: "Customer updated",
          description: "Customer changes were saved successfully.",
        });

        // Successful edit: redirect back to Customer Detail
        router.push(`/customers/${customerId}`);
        router.refresh();
      } catch {
        toast({
          variant: "error",
          title: "Unable to update customer",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    } else {
      // Create mode: company_name is optional string or null
      const payload: CreateCustomerInput = {
        customer_type: formData.customer_type,
        name: formData.name.trim(),
        company_name: formData.company_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status,
      };

      try {
        const response = await fetch("/api/crm/customers", {
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
            title: "Unable to create customer",
            description: extractErrorMessage(result, "Please try again."),
          });
          setIsSubmitting(false);
          return;
        }

        // Obtain created customer ID if available from backend response
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

        // Defer success notification until destination content resolves and renders
        queueToast({
          variant: "success",
          title: "Customer created",
          description: "The customer was added successfully.",
        });

        // Navigate to customer detail (or fallback to customer list)
        router.push(createdId ? `/customers/${createdId}` : "/customers");
      } catch {
        toast({
          variant: "error",
          title: "Unable to create customer",
          description: "Please check your connection and try again.",
        });
        setIsSubmitting(false);
      }
    }
  };

  const cancelHref = isEditMode
    ? `/customers/${customerId}`
    : "/customers";

  const isSaveDisabled =
    isSubmitting ||
    (isEditMode && !hasChanges) ||
    !formData.name.trim() ||
    Object.values(errors).some(Boolean);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* SECTION 1: General Information */}
      <FormSection
        title="General Information"
        description="Basic information used to identify this customer."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Type */}
            <Select
              ref={typeSelectRef}
              label="Customer Type"
              required
              value={formData.customer_type}
              onChange={(e) =>
                handleChange("customer_type", e.target.value as CustomerType)
              }
              onBlur={() => handleBlur("customer_type")}
              error={touched.customer_type ? errors.customer_type : undefined}
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </Select>

            {/* Customer Name */}
            <Input
              ref={nameInputRef}
              label="Customer Name"
              required
              maxLength={CUSTOMER_NAME_MAX_LENGTH}
              placeholder="e.g. ABC LLC or John Doe"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              error={touched.name ? errors.name : undefined}
            />
          </div>

          {/* Company Name (Optional) */}
          <div className="max-w-md">
            <Input
              ref={companyInputRef}
              label="Company Name"
              maxLength={COMPANY_NAME_MAX_LENGTH}
              placeholder="e.g. ABC Technologies Group"
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              onBlur={() => handleBlur("company_name")}
              error={touched.company_name ? errors.company_name : undefined}
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 2: Contact Information */}
      <FormSection
        title="Contact Information"
        description="Primary contact information for this customer."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <Input
              ref={emailInputRef}
              label="Email Address"
              type="email"
              maxLength={EMAIL_MAX_LENGTH}
              placeholder="e.g. contact@abc.example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : undefined}
            />

            {/* Phone */}
            <Input
              ref={phoneInputRef}
              label="Phone Number"
              type="tel"
              maxLength={PHONE_MAX_LENGTH}
              placeholder="e.g. 077 123 4567 or +94 77 123 4567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              error={touched.phone ? errors.phone : undefined}
            />
          </div>

          {/* Address */}
          <div>
            <Textarea
              ref={addressInputRef}
              label="Physical Address"
              maxLength={ADDRESS_MAX_LENGTH}
              placeholder="e.g. Level 14, World Trade Centre, Colombo 01"
              rows={3}
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              onBlur={() => handleBlur("address")}
              error={touched.address ? errors.address : undefined}
              helperText={`${formData.address.length} / ${ADDRESS_MAX_LENGTH}`}
            />
          </div>
        </div>
      </FormSection>

      {/* SECTION 3: Customer Status */}
      <FormSection
        title="Customer Status"
        description="Set the current lifecycle status of this customer."
      >
        <div className="max-w-xs">
          <Select
            ref={statusSelectRef}
            label="Status"
            required
            value={formData.status}
            onChange={(e) =>
              handleChange("status", e.target.value as CustomerStatus)
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
          <Button variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          loadingText={isEditMode ? "Saving changes..." : "Adding customer..."}
          disabled={isSaveDisabled}
        >
          {isEditMode ? "Save Changes" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
