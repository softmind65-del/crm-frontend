import { NextResponse, type NextRequest } from "next/server";
import { moveLeadStage } from "@/lib/api/lead-pipeline";
import { BackendApiError } from "@/types/api";
import { isValidUUID } from "@/lib/utils/uuid";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const trimmedLeadId = leadId?.trim() ?? "";

    if (!isValidUUID(trimmedLeadId)) {
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

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request payload.",
          errorCode: "INVALID_PAYLOAD",
          data: null,
        },
        { status: 422 }
      );
    }

    const body = rawBody as Record<string, unknown>;
    const rawStageId = typeof body.stage_id === "string" ? body.stage_id.trim() : "";

    if (!isValidUUID(rawStageId)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid destination stage ID is required.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const updatedLead = await moveLeadStage(trimmedLeadId, rawStageId);

    return NextResponse.json({
      success: true,
      message: "Lead stage updated successfully",
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
        message: "Unable to move lead stage. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
