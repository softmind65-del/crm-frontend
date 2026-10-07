import { NextResponse, type NextRequest } from "next/server";
import { resetDealPipelineDefaults } from "@/lib/api/deal-pipeline";
import { BackendApiError } from "@/types/api";

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

    const updatedPipeline = await resetDealPipelineDefaults({
      version: rawVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Deal pipeline reset to defaults successfully",
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
        message: "Unable to reset deal pipeline. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
