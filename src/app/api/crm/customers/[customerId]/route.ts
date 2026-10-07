import { NextResponse, type NextRequest } from "next/server";
import { updateCustomer, deleteCustomer, isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import {
  CustomerStatus,
  CustomerType,
  UpdateCustomerInput,
} from "@/types/customer";
import {
  validateCustomerType,
  validateCustomerName,
  validateCompanyName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateCustomerStatus,
} from "@/lib/validation/customer";

const ALLOWED_PATCH_FIELDS = new Set([
  "customer_type",
  "name",
  "company_name",
  "email",
  "phone",
  "address",
  "status",
]);

interface ParsedPatchValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: UpdateCustomerInput;
}

/**
 * Validates and sanitizes incoming untrusted JSON payload for customer update.
 * Strictly allowlists approved fields, rejects any forbidden or unexpected fields,
 * and normalizes empty optional strings to null.
 * Enforces that name and company_name cannot be cleared to empty/null if provided.
 */
function parseAndValidateUpdateCustomerBody(
  raw: unknown
): ParsedPatchValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;
  const keys = Object.keys(body);

  // Reject unexpected or forbidden fields early
  for (const key of keys) {
    if (!ALLOWED_PATCH_FIELDS.has(key)) {
      return {
        valid: false,
        error: `Field '${key}' is not allowed in customer updates.`,
      };
    }
  }

  const sanitized: Record<string, unknown> = {};

  // 1. customer_type (optional in PATCH, must be 'individual' | 'company')
  if ("customer_type" in body) {
    const err = validateCustomerType(body.customer_type);
    if (err) {
      return { valid: false, error: err };
    }
    sanitized.customer_type = body.customer_type as CustomerType;
  }

  // 2. name (optional in PATCH, but if present, cannot be cleared or empty)
  if ("name" in body) {
    const err = validateCustomerName(body.name);
    if (err) {
      return { valid: false, error: err };
    }
    sanitized.name = (body.name as string).trim();
  }

  // 3. company_name (optional in PATCH, max 255 chars, normalize empty string or null to null)
  if ("company_name" in body) {
    if (body.company_name === null || body.company_name === "") {
      sanitized.company_name = null;
    } else if (typeof body.company_name === "string") {
      const trimmed = body.company_name.trim();
      if (!trimmed) {
        sanitized.company_name = null;
      } else {
        const err = validateCompanyName(trimmed);
        if (err) {
          return { valid: false, error: err };
        }
        sanitized.company_name = trimmed;
      }
    } else {
      return {
        valid: false,
        error: "Company name must be a string.",
      };
    }
  }

  // 4. email (optional, max 255 chars, normalize empty string to null)
  if ("email" in body) {
    if (body.email === null || body.email === "") {
      sanitized.email = null;
    } else if (typeof body.email === "string") {
      const trimmed = body.email.trim();
      if (!trimmed) {
        sanitized.email = null;
      } else {
        const err = validateEmail(trimmed);
        if (err) {
          return { valid: false, error: err };
        }
        sanitized.email = trimmed;
      }
    } else {
      return {
        valid: false,
        error: "Enter a valid email address.",
      };
    }
  }

  // 5. phone (optional, max 50 chars, normalize empty string to null)
  if ("phone" in body) {
    if (body.phone === null || body.phone === "") {
      sanitized.phone = null;
    } else if (typeof body.phone === "string") {
      const trimmed = body.phone.trim();
      if (!trimmed) {
        sanitized.phone = null;
      } else {
        const err = validatePhone(trimmed);
        if (err) {
          return { valid: false, error: err };
        }
        sanitized.phone = trimmed;
      }
    } else {
      return {
        valid: false,
        error: "Enter a valid phone number.",
      };
    }
  }

  // 6. address (optional, max 500 chars, normalize empty string to null)
  if ("address" in body) {
    if (body.address === null || body.address === "") {
      sanitized.address = null;
    } else if (typeof body.address === "string") {
      const trimmed = body.address.trim();
      if (!trimmed) {
        sanitized.address = null;
      } else {
        const err = validateAddress(trimmed);
        if (err) {
          return { valid: false, error: err };
        }
        sanitized.address = trimmed;
      }
    } else {
      return {
        valid: false,
        error: "Address cannot exceed 500 characters.",
      };
    }
  }

  // 7. status (optional in PATCH, must be 'active' | 'inactive')
  if ("status" in body) {
    const err = validateCustomerStatus(body.status);
    if (err) {
      return { valid: false, error: err };
    }
    sanitized.status = body.status as CustomerStatus;
  }

  // Empty check: Do not send {} to FastAPI
  if (Object.keys(sanitized).length === 0) {
    return {
      valid: false,
      error: "No customer changes were provided.",
    };
  }

  return {
    valid: true,
    data: sanitized as UpdateCustomerInput,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!isValidUUID(customerId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer could not be updated because it is no longer available.",
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

    const validation = parseAndValidateUpdateCustomerBody(rawBody);
    if (!validation.valid || !validation.data) {
      const isNoChanges =
        validation.error === "No customer changes were provided.";
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

    const updatedCustomer = await updateCustomer(customerId, validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        errorCode: null,
        data: updatedCustomer,
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
              "Customer could not be updated because it is no longer available.",
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
        message: "Unable to update customer. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!isValidUUID(customerId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer could not be deleted because it is no longer available.",
          errorCode: "NOT_FOUND",
          data: null,
        },
        { status: 404 }
      );
    }

    await deleteCustomer(customerId);

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
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
              "Customer could not be deleted because it is no longer available.",
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
        message: "Unable to delete customer. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
