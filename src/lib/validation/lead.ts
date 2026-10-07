/**
 * Shared Lead Validation Module
 *
 * Central source of truth for Lead validation constants, normalization,
 * and field validation rules. Safe for both Client Component and BFF Route Handler usage.
 * Does NOT import React, Next.js server APIs, or external libraries.
 */

import { LeadSource, LeadStatus } from "@/types/lead";
import { isValidUUID } from "@/lib/utils/uuid";

export const LEAD_TITLE_MAX_LENGTH = 255;
export const DEAL_TITLE_MAX_LENGTH = 255;
export const LEAD_NOTES_MAX_LENGTH = 2000;

export const VALID_LEAD_SOURCES: readonly LeadSource[] = [
  "website",
  "facebook",
  "linkedin",
  "referral",
  "email",
  "phone_call",
  "walk_in",
  "event",
  "whatsapp",
  "other",
] as const;

export const VALID_NORMAL_LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
] as const;

export const ALL_LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
] as const;

// Decimal(18, 2) non-negative regex: integer part up to 16 digits + optional 1-2 decimal digits, or up to 18 digits without decimals
// Total digits <= 18, maximum 2 decimal places, non-negative
const DECIMAL_STRING_REGEX = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
const DATE_YYYY_MM_DD_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export function normalizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates customer relationship UUID (required on Create).
 */
export function validateCustomerId(value: unknown): string | undefined {
  if (!value || typeof value !== "string") {
    return "Customer is required.";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "Customer is required.";
  }
  if (!isValidUUID(trimmed)) {
    return "Please select a valid customer.";
  }
  return undefined;
}

/**
 * Validates contact relationship UUID (optional).
 */
export function validateContactId(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return "Please select a valid contact.";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!isValidUUID(trimmed)) {
    return "Please select a valid contact.";
  }
  return undefined;
}

/**
 * Validates lead title (required, 1–255 characters).
 */
export function validateLeadTitle(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return "Lead title is required.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Lead title is required.";
  }
  if (trimmed.length > LEAD_TITLE_MAX_LENGTH) {
    return `Lead title cannot exceed ${LEAD_TITLE_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates lead source (required, must be one of allowed sources).
 */
export function validateLeadSource(value: unknown): string | undefined {
  if (!value || typeof value !== "string") {
    return "Lead source is required.";
  }
  const trimmed = value.trim() as LeadSource;
  if (!VALID_LEAD_SOURCES.includes(trimmed)) {
    return "Please select a valid lead source.";
  }
  return undefined;
}

/**
 * Validates normal lead status (required, new/contacted/qualified/unqualified).
 * Explicitly rejects converted status during standard create and edit.
 */
export function validateNormalLeadStatus(value: unknown): string | undefined {
  if (!value || typeof value !== "string") {
    return "Lead status is required.";
  }
  const trimmed = value.trim() as LeadStatus;
  if (trimmed === "converted") {
    return "Leads can only become converted through the Convert to Deal action.";
  }
  if (!VALID_NORMAL_LEAD_STATUSES.includes(trimmed)) {
    return "Please select a valid lead status.";
  }
  return undefined;
}

/**
 * Validates estimated value or deal value according to NUMERIC(18,2) precision.
 * Must be non-negative, max 2 decimal places, and max 18 total digits.
 */
export function validateEstimatedValue(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const strValue = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : null;
  if (!strValue) {
    return undefined;
  }

  // Reject negative numbers
  if (strValue.startsWith("-")) {
    return "Value cannot be negative.";
  }

  // Check format: digits with optional up to 2 decimal places
  if (!DECIMAL_STRING_REGEX.test(strValue)) {
    if (strValue.includes(".")) {
      const parts = strValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        return "Value cannot have more than 2 decimal places.";
      }
      if (parts[0] && parts[0].length > 16) {
        return "Value exceeds maximum allowed digits.";
      }
    }
    return "Enter a valid numeric amount.";
  }

  // Count total digits (excluding decimal point)
  const digitsOnly = strValue.replace(".", "");
  if (digitsOnly.length > 18) {
    return "Value exceeds maximum allowed digits.";
  }

  return undefined;
}

/**
 * Parses and normalizes estimated value into a clean number or null for API transmission.
 */
export function parseEstimatedValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Validates lead notes (optional, max 2000 characters).
 */
export function validateNotes(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > LEAD_NOTES_MAX_LENGTH) {
    return `Notes cannot exceed ${LEAD_NOTES_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates expected close date (optional, YYYY-MM-DD).
 */
export function validateExpectedCloseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return "Enter a valid date in YYYY-MM-DD format.";
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!DATE_YYYY_MM_DD_REGEX.test(trimmed)) {
    return "Enter a valid date in YYYY-MM-DD format.";
  }

  const [yearStr, monthStr, dayStr] = trimmed.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return "Enter a valid calendar date.";
  }

  return undefined;
}

/**
 * Validates lead pipeline stage UUID (required when using dynamic pipeline).
 */
export function validateLeadStageId(value: unknown): string | undefined {
  if (!value || typeof value !== "string" || !value.trim()) {
    return "Stage is required.";
  }
  if (!isValidUUID(value.trim())) {
    return "Please select a valid stage.";
  }
  return undefined;
}

export interface LeadFormValidationValues {
  customer_id?: string;
  contact_id?: string | null;
  title: string;
  source: LeadSource | string;
  status?: LeadStatus | string;
  stage_id?: string;
  estimated_value?: string | number | null;
  notes?: string | null;
}

export type LeadFormErrors = Partial<Record<keyof LeadFormValidationValues, string>>;

/**
 * Validates a lead form payload.
 * When isEdit is false, customer_id validation is enforced.
 */
export function validateLeadForm(
  data: LeadFormValidationValues,
  isEdit = false
): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (!isEdit) {
    const customerError = validateCustomerId(data.customer_id);
    if (customerError) errors.customer_id = customerError;
  }

  const contactError = validateContactId(data.contact_id);
  if (contactError) errors.contact_id = contactError;

  const titleError = validateLeadTitle(data.title);
  if (titleError) errors.title = titleError;

  const sourceError = validateLeadSource(data.source);
  if (sourceError) errors.source = sourceError;

  if (data.stage_id !== undefined) {
    const stageError = validateLeadStageId(data.stage_id);
    if (stageError) errors.stage_id = stageError;
  } else if (data.status !== undefined) {
    const statusError = validateNormalLeadStatus(data.status);
    if (statusError) errors.status = statusError;
  }

  const valueError = validateEstimatedValue(data.estimated_value);
  if (valueError) errors.estimated_value = valueError;

  const notesError = validateNotes(data.notes);
  if (notesError) errors.notes = notesError;

  return errors;
}

export interface DealConversionValidationValues {
  title: string;
  value?: string | number | null;
  expected_close_date?: string | null;
  notes?: string | null;
}

export type DealConversionErrors = Partial<Record<keyof DealConversionValidationValues, string>>;

/**
 * Validates deal conversion inputs from modal form or conversion BFF.
 */
export function validateDealConversionForm(
  data: DealConversionValidationValues
): DealConversionErrors {
  const errors: DealConversionErrors = {};

  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.title = "Deal title is required.";
  } else if (data.title.trim().length > DEAL_TITLE_MAX_LENGTH) {
    errors.title = `Deal title cannot exceed ${DEAL_TITLE_MAX_LENGTH} characters.`;
  }

  const valueError = validateEstimatedValue(data.value);
  if (valueError) errors.value = valueError;

  const dateError = validateExpectedCloseDate(data.expected_close_date);
  if (dateError) errors.expected_close_date = dateError;

  const notesError = validateNotes(data.notes);
  if (notesError) errors.notes = notesError;

  return errors;
}
