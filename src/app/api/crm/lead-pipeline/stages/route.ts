import { NextResponse, type NextRequest } from "next/server";
import { createPipelineStage } from "@/lib/api/lead-pipeline";
import { BackendApiError } from "@/types/api";
import { StageColorKey } from "@/types/pipeline";
import { STAGE_COLOR_KEYS } from "@/lib/utils/stage-colors";

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
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const rawColorKey = typeof body.color_key === "string" ? body.color_key.trim() : "";
    const rawVersion = typeof body.version === "number" ? body.version : Number(body.version);

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

    const updatedPipeline = await createPipelineStage({
      name: rawName,
      color_key: rawColorKey as StageColorKey,
      version: rawVersion,
      custom_color_hex,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pipeline stage added successfully",
        errorCode: null,
        data: updatedPipeline,
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
        message: "Unable to add stage. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
