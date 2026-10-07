import { NextResponse, type NextRequest } from "next/server";
import { updateDealPipelineStage } from "@/lib/api/deal-pipeline";
import { BackendApiError } from "@/types/api";
import { StageColorKey, UpdateDealStageInput } from "@/types/deal";
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

    if (name === undefined && color_key === undefined && custom_color_hex === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field (name, color_key, custom_color_hex) must be provided for update.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const updatePayload: UpdateDealStageInput = {
      version: rawVersion,
    };
    if (name !== undefined) updatePayload.name = name;
    if (color_key !== undefined) updatePayload.color_key = color_key;
    if (custom_color_hex !== undefined) updatePayload.custom_color_hex = custom_color_hex;

    const updatedPipeline = await updateDealPipelineStage(trimmedStageId, updatePayload);

    return NextResponse.json({
      success: true,
      message: "Deal pipeline stage updated successfully",
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
        message: "Unable to update deal stage. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
