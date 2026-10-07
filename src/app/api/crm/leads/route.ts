import { NextResponse, type NextRequest } from "next/server";
import { createLead } from "@/lib/api/leads";
import { BackendApiError } from "@/types/api";
import { CreateLeadInput, LeadSource, LeadStatus } from "@/types/lead";
import { isValidUUID } from "@/lib/utils/uuid";
import {
  validateCustomerId,
  validateContactId,
  validateLeadTitle,
  validateLeadSource,
  validateNormalLeadStatus,
  validateEstimatedValue,
  parseEstimatedValue,
  validateNotes,
  normalizeOptionalString,
} from "@/lib/validation/lead";

interface ParsedValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: CreateLeadInput;
}

/**
 * Validates and sanitizes incoming untrusted JSON payload for Lead creation.
 * Strictly allowlists approved fields, strips forbidden attributes,
 * rejects status: "converted", and normalizes empty strings to null.
 */
function parseAndValidateCreateLeadBody(raw: unknown): ParsedValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;

  // Reject manual conversion or system fields
  if (body.status === "converted") {
    return {
      valid: false,
      error: "Leads can only become converted through the Convert to Deal action.",
    };
  }

  // 1. Customer ID validation (required UUID)
  const customerError = validateCustomerId(body.customer_id);
  if (customerError) {
    return { valid: false, error: customerError };
  }
  const customer_id = (body.customer_id as string).trim();

  // 2. Contact ID validation (optional UUID)
  let contact_id: string | null = null;
  if ("contact_id" in body && body.contact_id !== null && body.contact_id !== undefined) {
    const contactErr = validateContactId(body.contact_id);
    if (contactErr) return { valid: false, error: contactErr };
    const trimmed = typeof body.contact_id === "string" ? body.contact_id.trim() : null;
    contact_id = trimmed && trimmed.length > 0 ? trimmed : null;
  }

  // 3. Lead Title validation (required, 1–255 chars)
  const titleError = validateLeadTitle(body.title);
  if (titleError) {
    return { valid: false, error: titleError };
  }
  const title = (body.title as string).trim();

  // 4. Source validation (required allowed source)
  const sourceError = validateLeadSource(body.source);
  if (sourceError) {
    return { valid: false, error: sourceError };
  }
  const source = (body.source as string).trim() as LeadSource;

  // 5. Stage ID / Status validation (stage_id is authoritative; cannot provide both)
  let stage_id: string | undefined = undefined;
  let status: LeadStatus | undefined = undefined;

  const hasStageId = "stage_id" in body && body.stage_id !== null && body.stage_id !== undefined && body.stage_id !== "";
  const hasStatus = "status" in body && body.status !== null && body.status !== undefined && body.status !== "";

  if (hasStageId && hasStatus) {
    return {
      valid: false,
      error: "Cannot provide both stage_id and status; stage_id is the authoritative stage selector.",
    };
  }

  if (hasStageId) {
    const rawStageId = (body.stage_id as string).trim();
    if (!isValidUUID(rawStageId)) {
      return { valid: false, error: "Invalid pipeline stage ID format." };
    }
    stage_id = rawStageId;
  } else if (hasStatus) {
    const statusError = validateNormalLeadStatus(body.status);
    if (statusError) {
      return { valid: false, error: statusError };
    }
    status = (body.status as string).trim() as LeadStatus;
  } else {
    // Default to 'new' if neither is supplied
    status = "new";
  }

  // 6. Estimated Value (optional Numeric(18,2))
  let estimated_value: number | null = null;
  if ("estimated_value" in body && body.estimated_value !== null && body.estimated_value !== undefined && body.estimated_value !== "") {
    const valError = validateEstimatedValue(body.estimated_value);
    if (valError) return { valid: false, error: valError };
    estimated_value = parseEstimatedValue(body.estimated_value);
  }

  // 7. Notes (optional, max 2000 chars)
  let notes: string | null = null;
  if ("notes" in body && body.notes !== null && body.notes !== undefined) {
    const notesError = validateNotes(body.notes);
    if (notesError) return { valid: false, error: notesError };
    notes = normalizeOptionalString(body.notes);
  }

  const createData: CreateLeadInput = stage_id
    ? {
        customer_id,
        contact_id,
        title,
        source,
        stage_id,
        estimated_value,
        notes,
      }
    : {
        customer_id,
        contact_id,
        title,
        source,
        status: status ?? "new",
        estimated_value,
        notes,
      };

  return {
    valid: true,
    data: createData,
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

    const validation = parseAndValidateCreateLeadBody(rawBody);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid lead data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const createdLead = await createLead(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        errorCode: null,
        data: createdLead,
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
        message: "Unable to add lead. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
