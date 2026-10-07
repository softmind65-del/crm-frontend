import { NextResponse, type NextRequest } from "next/server";
import { convertLeadToDeal } from "@/lib/api/leads";
import { BackendApiError } from "@/types/api";
import { ConvertLeadToDealInput } from "@/types/lead";
import { isValidUUID } from "@/lib/utils/uuid";
import {
  validateDealConversionForm,
  parseEstimatedValue,
  normalizeOptionalString,
} from "@/lib/validation/lead";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const rawValue = body.value;
    if (
      rawValue !== undefined &&
      rawValue !== null &&
      typeof rawValue !== "string" &&
      typeof rawValue !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid numeric amount.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const rawTitle = typeof body.title === "string" ? body.title : "";
    const rawExpectedCloseDate =
      typeof body.expected_close_date === "string" ? body.expected_close_date : null;
    const rawNotes = typeof body.notes === "string" ? body.notes : null;

    // Form validation
    const validationErrors = validateDealConversionForm({
      title: rawTitle,
      value: rawValue,
      expected_close_date: rawExpectedCloseDate,
      notes: rawNotes,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      return NextResponse.json(
        {
          success: false,
          message: firstError ?? "Invalid deal conversion data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    // Prepare strictly allowlisted input
    const conversionInput: ConvertLeadToDealInput = {
      title: rawTitle.trim(),
      value: parseEstimatedValue(rawValue),
      expected_close_date:
        rawExpectedCloseDate && rawExpectedCloseDate.trim()
          ? rawExpectedCloseDate.trim()
          : null,
      notes: normalizeOptionalString(rawNotes),
    };

    const dealResult = await convertLeadToDeal(trimmedId, conversionInput);

    return NextResponse.json({
      success: true,
      message: "Lead successfully converted to deal",
      errorCode: null,
      data: dealResult,
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
        message: "Unable to convert lead. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
