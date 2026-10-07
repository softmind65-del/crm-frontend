import { NextResponse, type NextRequest } from "next/server";
import { createContact, getContacts } from "@/lib/api/contacts";
import { BackendApiError } from "@/types/api";
import { ContactStatus, CreateContactInput } from "@/types/contact";
import { isValidUUID } from "@/lib/utils/uuid";
import {
  validateCustomerId,
  validateContactName,
  validateJobTitle,
  validateEmail,
  validatePhone,
  validateMobile,
  validateContactStatus,
} from "@/lib/validation/contact";

interface ParsedValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: CreateContactInput;
}

/**
 * Validates and sanitizes incoming JSON payload for Contact creation.
 * Enforces field allowlisting, strips forbidden attributes,
 * and normalizes empty strings to null.
 */
function parseAndValidateCreateContactBody(raw: unknown): ParsedValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;

  // 1. Customer ID validation (required UUID)
  const customerError = validateCustomerId(body.customer_id);
  if (customerError) {
    return { valid: false, error: customerError };
  }
  const customer_id = (body.customer_id as string).trim();

  // 2. Contact Name validation (required, 1–255 chars)
  const nameError = validateContactName(body.name);
  if (nameError) {
    return { valid: false, error: nameError };
  }
  const name = (body.name as string).trim();

  // 3. Job Title (optional, max 150 chars, normalize empty to null)
  let job_title: string | null = null;
  if ("job_title" in body && body.job_title !== null && body.job_title !== undefined) {
    if (typeof body.job_title !== "string") {
      return { valid: false, error: "Job title must be a string." };
    }
    const trimmed = body.job_title.trim();
    if (trimmed) {
      const err = validateJobTitle(trimmed);
      if (err) return { valid: false, error: err };
      job_title = trimmed;
    }
  }

  // 4. Email (optional, max 255 chars, normalize empty to null)
  let email: string | null = null;
  if ("email" in body && body.email !== null && body.email !== undefined) {
    if (typeof body.email !== "string") {
      return { valid: false, error: "Enter a valid email address." };
    }
    const trimmed = body.email.trim();
    if (trimmed) {
      const err = validateEmail(trimmed);
      if (err) return { valid: false, error: err };
      email = trimmed;
    }
  }

  // 5. Phone (optional, max 50 chars, normalize empty to null)
  let phone: string | null = null;
  if ("phone" in body && body.phone !== null && body.phone !== undefined) {
    if (typeof body.phone !== "string") {
      return { valid: false, error: "Enter a valid phone number." };
    }
    const trimmed = body.phone.trim();
    if (trimmed) {
      const err = validatePhone(trimmed);
      if (err) return { valid: false, error: err };
      phone = trimmed;
    }
  }

  // 6. Mobile (optional, max 50 chars, normalize empty to null)
  let mobile: string | null = null;
  if ("mobile" in body && body.mobile !== null && body.mobile !== undefined) {
    if (typeof body.mobile !== "string") {
      return { valid: false, error: "Enter a valid mobile number." };
    }
    const trimmed = body.mobile.trim();
    if (trimmed) {
      const err = validateMobile(trimmed);
      if (err) return { valid: false, error: err };
      mobile = trimmed;
    }
  }

  // 7. Status (optional in body, defaults to 'active')
  let status: ContactStatus = "active";
  if ("status" in body && body.status !== undefined && body.status !== null) {
    const err = validateContactStatus(body.status);
    if (err) return { valid: false, error: err };
    status = body.status as ContactStatus;
  }

  // 8. Is Primary (optional boolean, defaults to false)
  let is_primary = false;
  if ("is_primary" in body && body.is_primary !== undefined && body.is_primary !== null) {
    if (typeof body.is_primary !== "boolean") {
      return { valid: false, error: "Primary indicator must be a boolean." };
    }
    is_primary = body.is_primary;
  }

  return {
    valid: true,
    data: {
      customer_id,
      name,
      job_title,
      email,
      phone,
      mobile,
      status,
      is_primary,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Malformed JSON body.",
          errorCode: "INVALID_JSON",
          data: null,
        },
        { status: 400 }
      );
    }

    const validation = parseAndValidateCreateContactBody(rawBody);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid contact data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const createdContact = await createContact(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Contact created successfully",
        errorCode: null,
        data: createdContact,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errorCode: error.errorCode,
          data: null,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add contact. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || undefined;

    const rawCustomerId = searchParams.get("customer_id")?.trim() || undefined;
    const customerId =
      rawCustomerId && isValidUUID(rawCustomerId) ? rawCustomerId : undefined;

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    const rawPageSize = parseInt(searchParams.get("page_size") || "20", 10);
    const pageSize =
      !isNaN(rawPageSize) && rawPageSize >= 1 && rawPageSize <= 50
        ? rawPageSize
        : 20;

    const result = await getContacts({
      page,
      pageSize,
      search,
      customerId,
    });

    // Strip internal user_id, return only safe fields for picker usage
    const safeItems = result.items.map((contact) => ({
      id: contact.id,
      customer_id: contact.customer_id,
      name: contact.name,
      job_title: contact.job_title ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      mobile: contact.mobile ?? null,
      status: contact.status,
      is_primary: contact.is_primary,
    }));

    return NextResponse.json({
      success: true,
      items: safeItems,
      meta: {
        total: result.meta.total,
        page: result.meta.page,
        pageSize: result.meta.pageSize,
        totalPages: result.meta.totalPages,
      },
    });
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          errorCode: error.errorCode,
          items: [],
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve contacts. Please try again.",
        errorCode: "INTERNAL_ERROR",
        items: [],
      },
      { status: 500 }
    );
  }
}
