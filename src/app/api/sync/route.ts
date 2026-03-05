import { NextRequest, NextResponse } from "next/server";
import { syncBriefs } from "@/lib/syncBriefs";

export async function GET() {
  try {
    const result = await syncBriefs();

    if (result.errors.length > 0 && result.newBriefs === 0) {
      return NextResponse.json(
        {
          success: false,
          ...result,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
