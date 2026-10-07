import { NextResponse, type NextRequest } from "next/server";
import { updatePipelineStage } from "@/lib/api/lead-pipeline";
import { BackendApiError } from "@/types/api";
import { StageColorKey, UpdateStageInput } from "@/types/pipeline";
import { STAGE_COLOR_KEYS } from "@/lib/utils/stage-colors";
import { isValidUUID } from "@/lib/utils/uuid";

interface RouteParams {
  params: Promise<{ stageId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    let name: string | undefined;
    let color_key: StageColorKey | undefined;

    if ("name" in body && body.name !== undefined) {
      const rawName = typeof body.name === "string" ? body.name.trim() : "";
      if (!rawName || rawName.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Stage name must be between 1 and 100 characters.",
            errorCode: "VALIDATION_ERROR",
            data: null,
          },
          { status: 422 }
        );
      }
      name = rawName;
    }

    if ("color_key" in body && body.color_key !== undefined) {
      const rawColorKey = typeof body.color_key === "string" ? body.color_key.trim() : "";
      if (!STAGE_COLOR_KEYS.includes(rawColorKey as StageColorKey)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid color key. Allowed colors: ${STAGE_COLOR_KEYS.join(", ")}.`,
            errorCode: "VALIDATION_ERROR",
            data: null,
          },
          { status: 422 }
        );
      }
      color_key = rawColorKey as StageColorKey;
    }

    let custom_color_hex: string | null | undefined = undefined;
    if ("custom_color_hex" in body) {
      if (body.custom_color_hex === null || body.custom_color_hex === "") {
        custom_color_hex = null;
      } else if (typeof body.custom_color_hex === "string") {
        const hex = body.custom_color_hex.trim().toUpperCase();
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          return NextResponse.json(
            {
              success: false,
              message: "Custom color must be a valid hex code (#RRGGBB).",
              errorCode: "VALIDATION_ERROR",
              data: null,
            },
            { status: 422 }
          );
        }
        custom_color_hex = hex;
      }
    }

    if (!name && !color_key && custom_color_hex === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field ('name', 'color_key', or 'custom_color_hex') must be provided.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const updateInput: UpdateStageInput = {
      name,
      color_key,
      version: rawVersion,
      custom_color_hex,
    };

    const updatedPipeline = await updatePipelineStage(trimmedStageId, updateInput);

    return NextResponse.json({
      success: true,
      message: "Pipeline stage updated successfully",
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
        message: "Unable to update stage. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
