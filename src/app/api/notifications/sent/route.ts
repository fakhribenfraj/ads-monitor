import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        NOT: {
          notificationSent: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        brief: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ response: notifications });
  } catch (error) {
    console.error("Error fetching unsent notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch unsent notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId } = body;

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: "Notification ID and User ID are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.notificationSent.findUnique({
      where: {
        userId_notificationId: {
          userId,
          notificationId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ response: existing });
    }

    const notificationSent = await prisma.notificationSent.create({
      data: {
        userId,
        notificationId,
        read: false,
      },
    });

    return NextResponse.json({ response: notificationSent }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification sent record:", error);
    return NextResponse.json(
      { error: "Failed to create notification sent record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, read } = body;

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: "Notification ID and User ID are required" },
        { status: 400 }
      );
    }

    const notificationSent = await prisma.notificationSent.update({
      where: {
        userId_notificationId: {
          userId,
          notificationId,
        },
      },
      data: {
        read,
        readAt: read ? new Date() : null,
      },
    });

    return NextResponse.json({ response: notificationSent });
  } catch (error) {
    console.error("Error updating notification sent:", error);
    return NextResponse.json(
      { error: "Failed to update notification sent" },
      { status: 500 }
    );
  }
}
