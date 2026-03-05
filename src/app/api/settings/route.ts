import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      return NextResponse.json({
        credentials: null,
        syncEnabled: true,
        lastSyncAt: null,
      });
    }

    return NextResponse.json({
      credentials: settings.credentials ? "configured" : null,
      syncEnabled: settings.syncEnabled,
      lastSyncAt: settings.lastSyncAt,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, syncEnabled } = body;

    const credentials = { email, password };

    const settings = await prisma.settings.upsert({
      where: { name: "default" },
      update: {
        credentials,
        syncEnabled: syncEnabled !== undefined ? syncEnabled : undefined,
      },
      create: {
        name: "default",
        credentials,
        syncEnabled: syncEnabled ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      credentials: settings.credentials ? "configured" : null,
      syncEnabled: settings.syncEnabled,
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
