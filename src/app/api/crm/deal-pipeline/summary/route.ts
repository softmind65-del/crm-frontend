import { NextResponse } from "next/server";
import { getDealPipelineSummary } from "@/lib/api/deal-pipeline";
import { BackendApiError } from "@/types/api";

export async function GET() {
  try {
    const summary = await getDealPipelineSummary();
    return NextResponse.json({
      success: true,
      message: "Deal pipeline summary fetched successfully",
      errorCode: null,
      data: summary,
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
        message: "Unable to fetch deal pipeline summary. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
