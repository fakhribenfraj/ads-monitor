import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncBriefs } from "@/lib/syncBriefs";

export async function GET(request: NextRequest) {
  try {
    const result = await syncBriefs();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.getAll("platform");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (platform.length > 0 && !platform.includes("ALL")) {
      where.platform = { hasSome: platform };
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    const briefs = await prisma.brief.findMany({
      where,
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ response: briefs });
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      externalId,
      brief,
      campaignName,
      category,
      dateCampaign,
      descriptionCampaign,
      logo,
      price,
      priceCreator,
      numberCreators,
      status,
      typePosting,
      platform,
      activeCreators,
      brand,
    } = body;

    let brandId: string | null = null;

    if (brand) {
      const existingBrand = await prisma.brand.findFirst({
        where: { externalId: brand._id },
      });

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const newBrand = await prisma.brand.create({
          data: {
            externalId: brand._id,
            firstName: brand.firstName,
            logo: brand.logo,
            type: brand.__t,
          },
        });
        brandId = newBrand.id;
      }
    }

    const briefData = {
      externalId,
      brief,
      campaignName,
      category,
      dateCampaign: new Date(dateCampaign),
      descriptionCampaign,
      logo,
      price,
      priceCreator,
      numberCreators: numberCreators || 0,
      status: status || "PENDING",
      typePosting: typePosting || ["posting"],
      platform: platform || ["tiktok"],
      activeCreators: activeCreators || 0,
      brandId,
    };

    let createdBrief;
    if (externalId) {
      const existingBrief = await prisma.brief.findUnique({
        where: { externalId },
      });

      if (existingBrief) {
        createdBrief = await prisma.brief.update({
          where: { externalId },
          data: briefData,
          include: {
            brand: true,
          },
        });
      } else {
        createdBrief = await prisma.brief.create({
          data: briefData,
          include: {
            brand: true,
          },
        });
      }
    } else {
      createdBrief = await prisma.brief.create({
        data: briefData,
        include: {
          brand: true,
        },
      });
    }

    return NextResponse.json({ response: createdBrief }, { status: 201 });
  } catch (error) {
    console.error("Error creating brief:", error);
    return NextResponse.json(
      { error: "Failed to create brief" },
      { status: 500 },
    );
  }
}
