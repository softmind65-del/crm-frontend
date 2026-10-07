import { NextResponse } from "next/server";
import { getLeadPipeline } from "@/lib/api/lead-pipeline";
import { BackendApiError } from "@/types/api";

export async function GET() {
  try {
    const pipeline = await getLeadPipeline();
    return NextResponse.json({
      success: true,
      message: "Lead pipeline fetched successfully",
      errorCode: null,
      data: pipeline,
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
        message: "Unable to fetch lead pipeline. Please try again.",
        errorCode: "INTERNAL_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
