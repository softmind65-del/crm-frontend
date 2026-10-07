/**
 * Shared Customer Validation Module
 *
 * Central source of truth for Customer validation constants, normalization,
 * and field validation rules. Safe for both Client Component and BFF Route Handler usage.
 * Does NOT import React, Next.js server APIs, or external libraries.
 */

import { CustomerStatus, CustomerType } from "@/types/customer";

export const CUSTOMER_NAME_MAX_LENGTH = 255;
export const COMPANY_NAME_MAX_LENGTH = 255;
export const EMAIL_MAX_LENGTH = 255;
export const PHONE_MAX_LENGTH = 50;
export const ADDRESS_MAX_LENGTH = 500;

// Practical, standard email regex (rejects user, user@, @example.com, user@example)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


const LK_PHONE_REGEX = /^(?:0|94|\+94)[0-9]{9}$/;

// Characters allowed in phone inputs before normalization
const PHONE_CHARS_ALLOWED_REGEX = /^[0-9+\s\-()]+$/;



/**
 * Normalizes phone input for validation by removing whitespace, hyphens, and parentheses.
 * Preserves leading '+' for country code validation.
 */
export function normalizePhoneForValidation(value: string): string {
  return value.trim().replace(/[\s\-()]/g, "");
}


/**
 * Validates customer type ("individual" | "company").
 */
export function validateCustomerType(value: unknown): string | undefined {
  if (value !== "individual" && value !== "company") {
    return "Customer type is required.";
  }
  return undefined;
}

/**
 * Validates customer name (mandatory, 1–255 characters).
 */
export function validateCustomerName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return "Customer name is required.";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Customer name is required.";
  }
  if (trimmed.length > CUSTOMER_NAME_MAX_LENGTH) {
    return `Customer name cannot exceed ${CUSTOMER_NAME_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates company name (optional, max 255 characters).
 * Blank or whitespace-only values are treated as valid/empty.
 */
export function validateCompanyName(value: unknown): string | undefined {
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
  if (trimmed.length > COMPANY_NAME_MAX_LENGTH) {
    return `Company name cannot exceed ${COMPANY_NAME_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates email address (optional, max 255 chars, standard email format).
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
 * Validates physical address (optional, max 500 characters).
 */
export function validateAddress(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > ADDRESS_MAX_LENGTH) {
    return `Address cannot exceed ${ADDRESS_MAX_LENGTH} characters.`;
  }
  return undefined;
}

/**
 * Validates customer status ("active" | "inactive").
 */
export function validateCustomerStatus(value: unknown): string | undefined {
  if (value !== "active" && value !== "inactive") {
    return "Customer status is required.";
  }
  return undefined;
}


export interface CustomerFormValidationValues {
  customer_type: CustomerType | string;
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: CustomerStatus | string;
}

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValidationValues, string>>;

/**
 * Validates an entire customer form payload against all rules.
 * Returns a record mapping field names to specific error messages.
 */
export function validateCustomerForm(
  data: CustomerFormValidationValues
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  const typeError = validateCustomerType(data.customer_type);
  if (typeError) errors.customer_type = typeError;

  const nameError = validateCustomerName(data.name);
  if (nameError) errors.name = nameError;

  const companyError = validateCompanyName(data.company_name);
  if (companyError) errors.company_name = companyError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const addressError = validateAddress(data.address);
  if (addressError) errors.address = addressError;

  const statusError = validateCustomerStatus(data.status);
  if (statusError) errors.status = statusError;

  return errors;
}
