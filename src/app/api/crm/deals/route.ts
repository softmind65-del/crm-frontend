import { NextResponse, type NextRequest } from "next/server";
import { getDeals, createDeal } from "@/lib/api/deals";
import { BackendApiError } from "@/types/api";
import { CreateDealInput, DealStage, DEAL_STAGES } from "@/types/deal";
import { isValidUUID } from "@/lib/utils/uuid";

interface ParsedValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly data?: CreateDealInput;
}

function parseAndValidateCreateDealBody(raw: unknown): ParsedValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;

  // 1. Customer ID validation (required UUID)
  const rawCustomerId = typeof body.customer_id === "string" ? body.customer_id.trim() : "";
  if (!rawCustomerId) {
    return { valid: false, error: "Customer / Company selection is required." };
  }
  if (!isValidUUID(rawCustomerId)) {
    return { valid: false, error: "Invalid customer ID format." };
  }

  // 2. Title validation (required, 1-255 characters)
  const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
  if (!rawTitle) {
    return { valid: false, error: "Deal title is required." };
  }
  if (rawTitle.length > 255) {
    return { valid: false, error: "Deal title cannot exceed 255 characters." };
  }

  // 3. Contact ID validation (optional UUID)
  let contact_id: string | null = null;
  if ("contact_id" in body && body.contact_id !== null && body.contact_id !== undefined && body.contact_id !== "") {
    const rawContactId = typeof body.contact_id === "string" ? body.contact_id.trim() : "";
    if (rawContactId) {
      if (!isValidUUID(rawContactId)) {
        return { valid: false, error: "Invalid contact ID format." };
      }
      contact_id = rawContactId;
    }
  }

  // 4. Value validation (optional non-negative number)
  let value: number | null = null;
  if ("value" in body && body.value !== null && body.value !== undefined && body.value !== "") {
    const num = typeof body.value === "number" ? body.value : Number(body.value);
    if (isNaN(num)) {
      return { valid: false, error: "Deal value must be a valid number." };
    }
    if (num < 0) {
      return { valid: false, error: "Deal value cannot be negative." };
    }
    value = num;
  }

  // 5. Expected Close Date validation (optional YYYY-MM-DD)
  let expected_close_date: string | null = null;
  if (
    "expected_close_date" in body &&
    body.expected_close_date !== null &&
    body.expected_close_date !== undefined &&
    body.expected_close_date !== ""
  ) {
    const rawDate = typeof body.expected_close_date === "string" ? body.expected_close_date.trim() : "";
    if (rawDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return { valid: false, error: "Expected close date must be in YYYY-MM-DD format." };
      }
      expected_close_date = rawDate;
    }
  }

  // 6. Notes validation (optional, max 2000 chars)
  let notes: string | null = null;
  if ("notes" in body && body.notes !== null && body.notes !== undefined) {
    const rawNotes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (rawNotes.length > 2000) {
      return { valid: false, error: "Notes cannot exceed 2000 characters." };
    }
    notes = rawNotes.length > 0 ? rawNotes : null;
  }

  return {
    valid: true,
    data: {
      customer_id: rawCustomerId,
      title: rawTitle,
      contact_id,
      value,
      expected_close_date,
      notes,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const rawPage = searchParams.get("page");
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
    const page = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const rawPageSize = searchParams.get("page_size");
    const parsedPageSize = rawPageSize ? parseInt(rawPageSize, 10) : 20;
    const pageSize = !isNaN(parsedPageSize) && parsedPageSize >= 1 ? parsedPageSize : 20;

    const search = searchParams.get("search")?.trim() || undefined;
    const customerId = searchParams.get("customer_id")?.trim() || undefined;
    const contactId = searchParams.get("contact_id")?.trim() || undefined;
    const leadId = searchParams.get("lead_id")?.trim() || undefined;
    const stageId = searchParams.get("stage_id")?.trim() || undefined;
    const rawStage = searchParams.get("stage")?.trim();
    const stage = rawStage && DEAL_STAGES.includes(rawStage as DealStage)
      ? (rawStage as DealStage)
      : undefined;

    const result = await getDeals({
      page,
      pageSize,
      search,
      customerId,
      contactId,
      leadId,
      stageId,
      stage,
    });

    return NextResponse.json({
      success: true,
      message: "Deals fetched successfully",
      errorCode: null,
      data: {
        items: result.items,
        metafields: {
          total: result.meta.total,
          page: result.meta.page,
          page_size: result.meta.pageSize,
          total_pages: result.meta.totalPages,
        },
      },
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
        message: "Unable to fetch deals. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
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

    const validation = parseAndValidateCreateDealBody(rawBody);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error ?? "Invalid deal data.",
          errorCode: "VALIDATION_ERROR",
          data: null,
        },
        { status: 422 }
      );
    }

    const createdDeal = await createDeal(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Deal created successfully",
        errorCode: null,
        data: createdDeal,
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
        message: "Unable to add deal. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
