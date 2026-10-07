/**
 * Shared Contact Validation Module
 *
 * Central source of truth for Contact validation constants, normalization,
 * and field validation rules. Safe for both Client Component and BFF Route Handler usage.
 * Does NOT import React, Next.js server APIs, or external libraries.
 */

import { ContactStatus } from "@/types/contact";
import { isValidUUID } from "@/lib/utils/uuid";



export const CONTACT_NAME_MAX_LENGTH = 255;
export const JOB_TITLE_MAX_LENGTH = 150;
export const EMAIL_MAX_LENGTH = 255;
export const PHONE_MAX_LENGTH = 50;
export const MOBILE_MAX_LENGTH = 50;

// Standard practical email regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Sri Lankan phone number regex: 9 digits after 0, 94, or +94
const LK_PHONE_REGEX = /^(?:0|94|\+94)[0-9]{9}$/;

// Characters allowed in phone inputs before normalization
const PHONE_CHARS_ALLOWED_REGEX = /^[0-9+\s\-()]+$/;


export function normalizePhoneForValidation(value: string): string {
  return value.trim().replace(/[\s\-()]/g, "");
}


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
 * Validates contact name (required, 1–255 characters).
 */
export function validateContactName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return "Contact name is required.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Contact name is required.";
  }
  if (trimmed.length > CONTACT_NAME_MAX_LENGTH) {
    return `Contact name cannot exceed ${CONTACT_NAME_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates job title (optional, max 150 characters).
 */
export function validateJobTitle(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > JOB_TITLE_MAX_LENGTH) {
    return `Job title cannot exceed ${JOB_TITLE_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates email address (optional, max 255 chars, standard practical format).
 */
export function validateEmail(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return "Enter a valid email address.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `Email cannot exceed ${EMAIL_MAX_LENGTH} characters.`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

/**
 * Validates phone number (optional, max 50 chars, Sri Lankan phone format).
 */
export function validatePhone(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return "Enter a valid phone number.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > PHONE_MAX_LENGTH) {
    return `Phone number cannot exceed ${PHONE_MAX_LENGTH} characters.`;
  }
  if (!PHONE_CHARS_ALLOWED_REGEX.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  const normalized = normalizePhoneForValidation(trimmed);
  if (!LK_PHONE_REGEX.test(normalized)) {
    return "Enter a valid phone number.";
  }
  return undefined;
}

/**
 * Validates mobile number (optional, max 50 chars, Sri Lankan phone format).
 */
export function validateMobile(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return "Enter a valid mobile number.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > MOBILE_MAX_LENGTH) {
    return `Mobile number cannot exceed ${MOBILE_MAX_LENGTH} characters.`;
  }
  if (!PHONE_CHARS_ALLOWED_REGEX.test(trimmed)) {
    return "Enter a valid mobile number.";
  }
  const normalized = normalizePhoneForValidation(trimmed);
  if (!LK_PHONE_REGEX.test(normalized)) {
    return "Enter a valid mobile number.";
  }
  return undefined;
}

/**
 * Validates contact status ("active" | "inactive").
 */
export function validateContactStatus(value: unknown): string | undefined {
  if (value !== "active" && value !== "inactive") {
    return "Contact status is required.";
  }
  return undefined;
}



export interface ContactFormValidationValues {
  customer_id?: string;
  name: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  status: ContactStatus | string;
  is_primary?: boolean;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValidationValues, string>>;

/**
 * Validates a contact form payload.
 * When isEdit is false, customer_id validation is enforced.
 */
export function validateContactForm(
  data: ContactFormValidationValues,
  isEdit = false
): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!isEdit) {
    const customerError = validateCustomerId(data.customer_id);
    if (customerError) errors.customer_id = customerError;
  }

  const nameError = validateContactName(data.name);
  if (nameError) errors.name = nameError;

  const jobTitleError = validateJobTitle(data.job_title);
  if (jobTitleError) errors.job_title = jobTitleError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const mobileError = validateMobile(data.mobile);
  if (mobileError) errors.mobile = mobileError;

  const statusError = validateContactStatus(data.status);
  if (statusError) errors.status = statusError;

  return errors;
}
