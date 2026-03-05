import axios from "axios";
import { prisma } from "@/lib/prisma";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://connectcontent.me/api";

interface ExternalBrief {
  _id: string;
  brief: string;
  campaignName: string;
  category: string;
  dateCampaign: string;
  descriptionCampaign: string;
  idBrand: {
    _id: string;
    firstName: string;
    __t: string;
    logo: string;
  };
  logo: string;
  price: string;
  priceCreator: string;
  numberCreators: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  typePosting: ["posting"];
  platform: ["tiktok"];
  activeCreators: number;
}

interface StoredCredentials {
  email: string;
  password: string;
}

async function getStoredCredentials(): Promise<StoredCredentials | null> {
  if (process.env.API_EMAIL && process.env.API_PASSWORD) {
    return {
      email: process.env.API_EMAIL,
      password: process.env.API_PASSWORD,
    };
  }

  const settings = await prisma.settings.findFirst();
  if (settings?.credentials) {
    return settings.credentials as unknown as StoredCredentials;
  }
  return null;
}

async function loginToExternalApi(email: string, password: string): Promise<string> {
  const response = await axios.post(`${API_BASE_URL}/loginCreator`, {
    email,
    password,
  });
  return response.data.accessToken;
}

async function fetchBriefsFromExternalApi(token: string): Promise<ExternalBrief[]> {
  const response = await axios.post(
    `${API_BASE_URL}/campaign/find-brief-in-creator`,
    {
      brief: "public",
      typePosting: "posting",
      status: "PENDING",
      platform: ["tiktok", "instagram"],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.response || [];
}

async function getOrCreateBrand(brandData: ExternalBrief["idBrand"]) {
  const existingBrand = await prisma.brand.findFirst({
    where: { externalId: brandData._id },
  });

  if (existingBrand) {
    return existingBrand;
  }

  return prisma.brand.create({
    data: {
      externalId: brandData._id,
      firstName: brandData.firstName,
      logo: brandData.logo,
      type: brandData.__t,
    },
  });
}

async function createNotificationForBrief(brief: ExternalBrief) {
  const notification = await prisma.notification.create({
    data: {
      type: "NEW_BRIEF",
      title: "New Brief Available",
      message: `New brief "${brief.campaignName}" is now available. Category: ${brief.category}`,
      data: {
        briefId: brief._id,
        campaignName: brief.campaignName,
        category: brief.category,
        priceCreator: brief.priceCreator,
      },
    },
  });

  return notification;
}

export async function syncBriefs(): Promise<{
  newBriefs: number;
  totalBriefs: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let newBriefs = 0;

  try {
    const credentials = await getStoredCredentials();

    if (!credentials) {
      errors.push("No credentials stored. Please configure API credentials.");
      return { newBriefs: 0, totalBriefs: 0, errors };
    }

    let token: string;
    try {
      token = await loginToExternalApi(credentials.email, credentials.password);
    } catch (loginError) {
      errors.push(`Failed to login: ${loginError instanceof Error ? loginError.message : "Unknown error"}`);
      return { newBriefs: 0, totalBriefs: 0, errors };
    }

    const externalBriefs = await fetchBriefsFromExternalApi(token);

    for (const brief of externalBriefs) {
      const existingBrief = await prisma.brief.findUnique({
        where: { externalId: brief._id },
      });

      if (!existingBrief) {
        const brand = await getOrCreateBrand(brief.idBrand);

        await prisma.brief.create({
          data: {
            externalId: brief._id,
            brief: brief.brief,
            campaignName: brief.campaignName,
            category: brief.category,
            dateCampaign: new Date(brief.dateCampaign),
            descriptionCampaign: brief.descriptionCampaign,
            logo: brief.logo,
            price: brief.price,
            priceCreator: brief.priceCreator,
            numberCreators: brief.numberCreators,
            status: brief.status,
            typePosting: brief.typePosting,
            platform: brief.platform,
            activeCreators: brief.activeCreators,
            brandId: brand.id,
          },
        });

        await createNotificationForBrief(brief);
        newBriefs++;
      }
    }

    const totalBriefs = await prisma.brief.count();

    return {
      newBriefs,
      totalBriefs,
      errors,
    };
  } catch (error) {
    errors.push(`Sync error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return {
      newBriefs,
      totalBriefs: await prisma.brief.count(),
      errors,
    };
  }
}
