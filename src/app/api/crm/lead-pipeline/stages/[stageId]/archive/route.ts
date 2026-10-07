import { NextResponse, type NextRequest } from "next/server";
import { archivePipelineStage } from "@/lib/api/lead-pipeline";
import { BackendApiError } from "@/types/api";
import { isValidUUID } from "@/lib/utils/uuid";

interface RouteParams {
  params: Promise<{ stageId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { stageId } = await params;
    const trimmedStageId = stageId?.trim() ?? "";

    if (!isValidUUID(trimmedStageId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid stage ID format.",
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
    const rawVersion = typeof body.version === "number" ? body.version : Number(body.version);
    const rawDestId =
      typeof body.destination_stage_id === "string" && body.destination_stage_id.trim()
        ? body.destination_stage_id.trim()
        : null;

    if (isNaN(rawVersion) || rawVersion < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid pipeline version number is required.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    if (rawDestId && !isValidUUID(rawDestId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid destination stage ID format.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const updatedPipeline = await archivePipelineStage(trimmedStageId, {
      destination_stage_id: rawDestId,
      version: rawVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Pipeline stage archived successfully",
      errorCode: null,
      data: updatedPipeline,
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
        message: "Unable to archive stage. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
