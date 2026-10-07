import { NextResponse, type NextRequest } from "next/server";
import { reopenDeal } from "@/lib/api/deals";
import { BackendApiError } from "@/types/api";
import { isValidUUID } from "@/lib/utils/uuid";

interface RouteParams {
  params: Promise<{ dealId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { dealId } = await params;
    const trimmedDealId = dealId?.trim() ?? "";

    if (!isValidUUID(trimmedDealId)) {
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

    const reopenedDeal = await reopenDeal(trimmedDealId);

    return NextResponse.json({
      success: true,
      message: "Deal reopened successfully",
      errorCode: null,
      data: reopenedDeal,
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
        message: "Unable to reopen deal. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
