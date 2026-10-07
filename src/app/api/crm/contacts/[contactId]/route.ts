import { NextResponse, type NextRequest } from "next/server";
import { updateContact, deleteContact } from "@/lib/api/contacts";
import { isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { ContactStatus, UpdateContactInput } from "@/types/contact";
import {
  validateContactName,
  validateJobTitle,
  validateEmail,
  validatePhone,
  validateMobile,
  validateContactStatus,
} from "@/lib/validation/contact";

const ALLOWED_PATCH_FIELDS = new Set([
  "name",
  "job_title",
  "email",
  "phone",
  "mobile",
  "status",
  "is_primary",
]);

interface ParsedPatchValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: UpdateContactInput;
}

/**
 * Validates and sanitizes incoming untrusted JSON payload for contact update.
 * Strictly allowlists approved fields, rejects any forbidden or unexpected fields,
 * and normalizes empty optional strings to null.
 * Enforces that customer_id cannot be modified via update.
 */
function parseAndValidateUpdateContactBody(
  raw: unknown
): ParsedPatchValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;
  const keys = Object.keys(body);

  if ("customer_id" in body) {
    return {
      valid: false,
      error: "Customer relationship cannot be changed.",
    };
  }

  // Reject unexpected or forbidden fields early
  for (const key of keys) {
    if (!ALLOWED_PATCH_FIELDS.has(key)) {
      return {
        valid: false,
        error: `Field '${key}' is not allowed in contact updates.`,
      };
    }
  }

  const sanitized: Record<string, unknown> = {};

  // 1. name (optional in PATCH, but if present, cannot be empty)
  if ("name" in body) {
    const err = validateContactName(body.name);
    if (err) return { valid: false, error: err };
    sanitized.name = (body.name as string).trim();
  }

  // 2. job_title (optional, max 150 chars, normalize empty to null)
  if ("job_title" in body) {
    if (body.job_title === null || body.job_title === "") {
      sanitized.job_title = null;
    } else if (typeof body.job_title === "string") {
      const trimmed = body.job_title.trim();
      if (!trimmed) {
        sanitized.job_title = null;
      } else {
        const err = validateJobTitle(trimmed);
        if (err) return { valid: false, error: err };
        sanitized.job_title = trimmed;
      }
    } else {
      return { valid: false, error: "Job title must be a string." };
    }
  }

  // 3. email (optional, max 255 chars, normalize empty to null)
  if ("email" in body) {
    if (body.email === null || body.email === "") {
      sanitized.email = null;
    } else if (typeof body.email === "string") {
      const trimmed = body.email.trim();
      if (!trimmed) {
        sanitized.email = null;
      } else {
        const err = validateEmail(trimmed);
        if (err) return { valid: false, error: err };
        sanitized.email = trimmed;
      }
    } else {
      return { valid: false, error: "Enter a valid email address." };
    }
  }

  // 4. phone (optional, max 50 chars, normalize empty to null)
  if ("phone" in body) {
    if (body.phone === null || body.phone === "") {
      sanitized.phone = null;
    } else if (typeof body.phone === "string") {
      const trimmed = body.phone.trim();
      if (!trimmed) {
        sanitized.phone = null;
      } else {
        const err = validatePhone(trimmed);
        if (err) return { valid: false, error: err };
        sanitized.phone = trimmed;
      }
    } else {
      return { valid: false, error: "Enter a valid phone number." };
    }
  }

  // 5. mobile (optional, max 50 chars, normalize empty to null)
  if ("mobile" in body) {
    if (body.mobile === null || body.mobile === "") {
      sanitized.mobile = null;
    } else if (typeof body.mobile === "string") {
      const trimmed = body.mobile.trim();
      if (!trimmed) {
        sanitized.mobile = null;
      } else {
        const err = validateMobile(trimmed);
        if (err) return { valid: false, error: err };
        sanitized.mobile = trimmed;
      }
    } else {
      return { valid: false, error: "Enter a valid mobile number." };
    }
  }

  // 6. status (optional in PATCH, must be 'active' | 'inactive')
  if ("status" in body) {
    const err = validateContactStatus(body.status);
    if (err) return { valid: false, error: err };
    sanitized.status = body.status as ContactStatus;
  }

  // 7. is_primary (optional in PATCH, boolean)
  if ("is_primary" in body) {
    if (typeof body.is_primary !== "boolean") {
      return { valid: false, error: "Primary indicator must be a boolean." };
    }
    sanitized.is_primary = body.is_primary;
  }

  // Empty check: Do not send {} to FastAPI
  if (Object.keys(sanitized).length === 0) {
    return {
      valid: false,
      error: "No contact changes were provided.",
    };
  }

  return {
    valid: true,
    data: sanitized as UpdateContactInput,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;

    if (!isValidUUID(contactId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Contact could not be updated because it is no longer available.",
          errorCode: "NOT_FOUND",
          data: null,
        },
        { status: 404 }
      );
    }

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

    const validation = parseAndValidateUpdateContactBody(rawBody);
    if (!validation.valid || !validation.data) {
      const isNoChanges =
        validation.error === "No contact changes were provided.";
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid update payload.",
          errorCode: isNoChanges ? "NO_CHANGES" : "VALIDATION_ERROR",
          data: null,
        },
        { status: isNoChanges ? 400 : 422 }
      );
    }

    const updatedContact = await updateContact(contactId, validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Contact updated successfully",
        errorCode: null,
        data: updatedContact,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Contact could not be updated because it is no longer available.",
            errorCode: "NOT_FOUND",
            data: null,
          },
          { status: 404 }
        );
      }

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
        message: "Unable to update contact. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;

    if (!isValidUUID(contactId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Contact could not be deleted because it is no longer available.",
          errorCode: "NOT_FOUND",
          data: null,
        },
        { status: 404 }
      );
    }

    await deleteContact(contactId);

    return NextResponse.json(
      {
        success: true,
        message: "Contact deleted successfully",
        errorCode: null,
        data: null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      if (error.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Contact could not be deleted because it is no longer available.",
            errorCode: "NOT_FOUND",
            data: null,
          },
          { status: 404 }
        );
      }

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
        message: "Unable to delete contact. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
