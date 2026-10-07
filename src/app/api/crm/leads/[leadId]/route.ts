import { NextResponse, type NextRequest } from "next/server";
import { updateLead, deleteLead } from "@/lib/api/leads";
import { BackendApiError } from "@/types/api";
import { UpdateLeadInput, LeadSource, LeadStatus } from "@/types/lead";
import { isValidUUID } from "@/lib/utils/uuid";
import {
  validateContactId,
  validateLeadTitle,
  validateLeadSource,
  validateNormalLeadStatus,
  validateEstimatedValue,
  parseEstimatedValue,
  validateNotes,
  normalizeOptionalString,
} from "@/lib/validation/lead";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

interface ParsedValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: UpdateLeadInput;
}

/**
 * Validates and sanitizes incoming untrusted JSON payload for Lead partial update.
 * Strictly allowlists approved fields, rejects forbidden fields (such as customer_id),
 * rejects status = "converted", and rejects empty PATCH requests.
 */
function parseAndValidateUpdateLeadBody(raw: unknown): ParsedValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;

  // Customer is strictly read-only on edit
  if ("customer_id" in body) {
    return {
      valid: false,
      error: "Customer cannot be changed for an existing lead.",
    };
  }

  // Check mutual exclusion between stage_id and status
  const hasStageId = "stage_id" in body && body.stage_id !== null && body.stage_id !== undefined && body.stage_id !== "";
  const hasStatus = "status" in body && body.status !== null && body.status !== undefined && body.status !== "";

  if (hasStageId && hasStatus) {
    return {
      valid: false,
      error: "Cannot provide both stage_id and status; stage_id is the authoritative stage selector.",
    };
  }

  // Reject status: converted from normal edit/status update
  if (body.status === "converted") {
    return {
      valid: false,
      error: "Leads can only become converted through the Convert to Deal action.",
    };
  }

  const patch: Record<string, unknown> = {};

  // 1. Contact ID (nullable UUID)
  if ("contact_id" in body) {
    if (body.contact_id === null || body.contact_id === "") {
      patch.contact_id = null;
    } else {
      const contactErr = validateContactId(body.contact_id);
      if (contactErr) return { valid: false, error: contactErr };
      patch.contact_id = (body.contact_id as string).trim();
    }
  }

  // 2. Title (1–255 chars)
  if ("title" in body) {
    const titleErr = validateLeadTitle(body.title);
    if (titleErr) return { valid: false, error: titleErr };
    patch.title = (body.title as string).trim();
  }

  // 3. Source (allowed LeadSource)
  if ("source" in body) {
    const sourceErr = validateLeadSource(body.source);
    if (sourceErr) return { valid: false, error: sourceErr };
    patch.source = (body.source as string).trim() as LeadSource;
  }

  // 4. Stage ID (authoritative stage selector)
  if (hasStageId) {
    const rawStageId = (body.stage_id as string).trim();
    if (!isValidUUID(rawStageId)) {
      return { valid: false, error: "Invalid pipeline stage ID format." };
    }
    patch.stage_id = rawStageId;
  } else if (hasStatus) {
    // 5. Status (allowed normal LeadStatus, for backward compatibility)
    const statusErr = validateNormalLeadStatus(body.status);
    if (statusErr) return { valid: false, error: statusErr };
    patch.status = (body.status as string).trim() as LeadStatus;
  }

  // 5. Estimated Value (nullable Numeric(18,2))
  if ("estimated_value" in body) {
    if (body.estimated_value === null || body.estimated_value === "") {
      patch.estimated_value = null;
    } else {
      const valErr = validateEstimatedValue(body.estimated_value);
      if (valErr) return { valid: false, error: valErr };
      patch.estimated_value = parseEstimatedValue(body.estimated_value);
    }
  }

  // 6. Notes (nullable, max 2000 chars)
  if ("notes" in body) {
    if (body.notes === null || body.notes === "") {
      patch.notes = null;
    } else {
      const notesErr = validateNotes(body.notes);
      if (notesErr) return { valid: false, error: notesErr };
      patch.notes = normalizeOptionalString(body.notes);
    }
  }

  // Prevent empty PATCH
  if (Object.keys(patch).length === 0) {
    return { valid: false, error: "No changes provided to update." };
  }

  return {
    valid: true,
    data: patch as UpdateLeadInput,
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const trimmedId = leadId?.trim() ?? "";

    if (!isValidUUID(trimmedId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID format.",
          errorCode: "INVALID_UUID",
          data: null,
        },
        { status: 400 }
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

    const validation = parseAndValidateUpdateLeadBody(rawBody);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid lead update data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const updatedLead = await updateLead(trimmedId, validation.data);

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      errorCode: null,
      data: updatedLead,
    });
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
        message: "Unable to update lead. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const trimmedId = leadId?.trim() ?? "";

    if (!isValidUUID(trimmedId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID format.",
          errorCode: "INVALID_UUID",
          data: null,
        },
        { status: 400 }
      );
    }

    await deleteLead(trimmedId);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
      errorCode: null,
      data: null,
    });
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
        message: "Unable to delete lead. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
