import { NextResponse, type NextRequest } from "next/server";
import { getDeal, updateDeal, deleteDeal } from "@/lib/api/deals";
import { BackendApiError } from "@/types/api";
import { isValidUUID } from "@/lib/utils/uuid";
import { UpdateDealInput } from "@/types/deal";

interface RouteParams {
  params: Promise<{ dealId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const trimmedId = dealId?.trim() ?? "";

    if (!isValidUUID(trimmedId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deal ID format.",
          errorCode: "INVALID_UUID",
          data: null,
        },
        { status: 400 }
      );
    }

    const deal = await getDeal(trimmedId);

    return NextResponse.json({
      success: true,
      message: "Deal fetched successfully",
      errorCode: null,
      data: deal,
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
        message: "Unable to fetch deal. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const trimmedId = dealId?.trim() ?? "";

    if (!isValidUUID(trimmedId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deal ID format.",
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
    const updateInput: UpdateDealInput = {};

    if ("title" in body && body.title !== undefined) {
      const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
      if (!rawTitle) {
        return NextResponse.json(
          {
            success: false,
            message: "Deal title cannot be empty.",
            errorCode: "VALIDATION_ERROR",
            data: null,
          },
          { status: 422 }
        );
      }
      updateInput.title = rawTitle;
    }

    if ("customer_id" in body && body.customer_id !== undefined) {
      const rawCid = typeof body.customer_id === "string" ? body.customer_id.trim() : "";
      if (!isValidUUID(rawCid)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid customer ID format.",
            errorCode: "VALIDATION_ERROR",
            data: null,
          },
          { status: 422 }
        );
      }
      updateInput.customer_id = rawCid;
    }

    if ("contact_id" in body) {
      if (body.contact_id === null || body.contact_id === "") {
        updateInput.contact_id = null;
      } else if (typeof body.contact_id === "string") {
        const rawContactId = body.contact_id.trim();
        if (!isValidUUID(rawContactId)) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid contact ID format.",
              errorCode: "VALIDATION_ERROR",
              data: null,
            },
            { status: 422 }
          );
        }
        updateInput.contact_id = rawContactId;
      }
    }

    if ("value" in body) {
      if (body.value === null || body.value === "") {
        updateInput.value = null;
      } else {
        const num = typeof body.value === "number" ? body.value : Number(body.value);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Deal value must be a non-negative number.",
              errorCode: "VALIDATION_ERROR",
              data: null,
            },
            { status: 422 }
          );
        }
        updateInput.value = num;
      }
    }

    if ("expected_close_date" in body) {
      if (body.expected_close_date === null || body.expected_close_date === "") {
        updateInput.expected_close_date = null;
      } else if (typeof body.expected_close_date === "string") {
        const rawDate = body.expected_close_date.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          return NextResponse.json(
            {
              success: false,
              message: "Expected close date must be in YYYY-MM-DD format.",
              errorCode: "VALIDATION_ERROR",
              data: null,
            },
            { status: 422 }
          );
        }
        updateInput.expected_close_date = rawDate;
      }
    }

    if ("notes" in body) {
      if (body.notes === null) {
        updateInput.notes = null;
      } else if (typeof body.notes === "string") {
        updateInput.notes = body.notes.trim() || null;
      }
    }

    const updated = await updateDeal(trimmedId, updateInput);

    return NextResponse.json({
      success: true,
      message: "Deal updated successfully",
      errorCode: null,
      data: updated,
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
        message: "Unable to update deal. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const trimmedId = dealId?.trim() ?? "";

    if (!isValidUUID(trimmedId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deal ID format.",
          errorCode: "INVALID_UUID",
          data: null,
        },
        { status: 400 }
      );
    }

    await deleteDeal(trimmedId);

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
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
        message: "Unable to delete deal. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
