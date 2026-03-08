import axios, { AxiosError } from "axios";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "./webpush";

async function sendPushNotificationsToAllUsers(title: string, message: string, data?: any) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return;
    }

    const payload = JSON.stringify({
      title,
      body: message,
      data,
    });

    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        payload
      );

      if (success) {
        successCount++;
      } else {
        failedCount++;
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }

    console.log(`Push notifications sent: ${successCount} success, ${failedCount} failed (removed)`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

// use WHATWG URL API to avoid node deprecation warning coming from url.parse
// build the URL once and pass it to axios as the baseURL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://connectcontent.me/api";
const API_URL_OBJ = new URL(API_BASE_URL); // will throw if the string isn't a valid URL

const axiosInstance = axios.create({
  baseURL: API_URL_OBJ.toString(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// optional debug logging; can be removed in production
axiosInstance.interceptors.request.use((config) => {
  console.debug("[syncBriefs] request", config.method, config.url);
  return config;
});

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

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

// wrap network requests with retry helper so transient ECONNRESETs can be retried
async function loginToExternalApi(
  email: string,
  password: string,
): Promise<string> {
  const response = await withRetry(() =>
    axiosInstance.post("/loginCreator", { email, password }),
  );

  return response.data.accessToken;
}

async function fetchBriefsFromExternalApi(
  token: string,
): Promise<ExternalBrief[]> {
  const response = await withRetry(() =>
    axiosInstance.post(
      "/campaign/find-brief-in-creator",
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
      },
    ),
  );

  return response.data.response || [];
}

interface FetchBriefsOptions {
  status?: string;
  platform?: string[];
  category?: string;
}

export async function fetchBriefsFromExternalApiWithCredentials(
  options: FetchBriefsOptions = {}
): Promise<ExternalBrief[]> {
  const credentials = await getStoredCredentials();

  if (!credentials) {
    throw new Error("No credentials stored. Please configure API credentials.");
  }

  const token = await loginToExternalApi(credentials.email, credentials.password);

  const requestBody = {
    brief: "public",
    typePosting: "posting",
    status: options.status || "PENDING",
    platform: options.platform || ["tiktok", "instagram"],
  };

  const response = await withRetry(() =>
    axiosInstance.post(
      "/campaign/find-brief-in-creator",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ),
  );

  let briefs: ExternalBrief[] = response.data.response || [];

  if (options.category) {
    briefs = briefs.filter(brief => 
      brief.category.toLowerCase().includes(options.category!.toLowerCase())
    );
  }

  return briefs;
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

export async function syncBriefs(): Promise<{
  newBriefs: number;
  totalBriefs: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let newBriefs = 0;
  const newBriefsData: ExternalBrief[] = [];

  try {
    const credentials = await getStoredCredentials();
    console.log("credentials", credentials);

    if (!credentials) {
      errors.push("No credentials stored. Please configure API credentials.");
      return { newBriefs: 0, totalBriefs: 0, errors };
    }

    let token: string;
    try {
      token = await loginToExternalApi(credentials.email, credentials.password);
    } catch (loginError) {
      // if it's an AxiosError we can pull more context (status/code)
      if (axios.isAxiosError(loginError)) {
        console.error(
          "login axios error:",
          loginError.code,
          loginError.response?.status,
          loginError.message,
        );
      } else {
        console.error("login error:", loginError);
      }

      errors.push(
        `Failed to login: ${loginError instanceof Error ? loginError.message : "Unknown error"}`,
      );
      return { newBriefs: 0, totalBriefs: 0, errors };
    }

    const externalBriefs = await fetchBriefsFromExternalApi(token);

    for (const brief of externalBriefs) {
      const existingBrief = await prisma.brief.findUnique({
        where: { externalId: brief._id },
      });

      if (!existingBrief) {
        // const brand = await getOrCreateBrand(brief.idBrand);

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
            // brandId: brand.id,
          },
        });

        newBriefs++;
        newBriefsData.push(brief);
      } else if (existingBrief.activeCreators !== brief.activeCreators) {
        await prisma.brief.update({
          where: { id: existingBrief.id },
          data: {
            activeCreators: brief.activeCreators,
          },
        });
      }
    }

    if (newBriefs > 0) {
      const totalCreators = newBriefsData.reduce((sum, b) => sum + b.numberCreators, 0);
      const prices = newBriefsData.map(b => parseFloat(b.price.replace(/[^0-9.-]/g, '')) || 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const maxPrice = Math.max(...prices, 0);
      const minPrice = Math.min(...prices.filter(p => p > 0), 0);

      const briefDetails = newBriefsData.slice(0, 3).map(b => 
        `• ${b.campaignName}: ${b.price} (${b.numberCreators} creator${b.numberCreators > 1 ? 's' : ''})`
      ).join('\n');
      
      const additionalCount = newBriefsData.length - 3;
      const additionalInfo = additionalCount > 0 ? `\n+ ${additionalCount} more brief${additionalCount > 1 ? 's' : ''}` : '';

      const notificationTitle = `${newBriefs} New Brief${newBriefs > 1 ? 's' : ''} Found`;
      const notificationMessage = `Total: ${newBriefs} brief${newBriefs > 1 ? 's' : ''} | ${totalCreators} creator${totalCreators > 1 ? 's' : ''} needed | Avg: $${avgPrice.toFixed(0)} ($${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)})\n\n${briefDetails}${additionalInfo}`;

      await prisma.notification.create({
        data: {
          type: "NEW_BRIEF",
          title: notificationTitle,
          message: notificationMessage,
          data: {
            totalBriefs: newBriefs,
            totalCreators,
            avgPrice: avgPrice.toFixed(0),
            minPrice: minPrice.toFixed(0),
            maxPrice: maxPrice.toFixed(0),
            briefs: newBriefsData.map(b => ({
              id: b._id,
              campaignName: b.campaignName,
              price: b.price,
              numberCreators: b.numberCreators,
            })),
          },
        },
      });

      await sendPushNotificationsToAllUsers(notificationTitle, notificationMessage);
    }

    const totalBriefs = await prisma.brief.count();

    return {
      newBriefs,
      totalBriefs,
      errors,
    };
  } catch (error) {
    errors.push(
      `Sync error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      newBriefs,
      totalBriefs: await prisma.brief.count(),
      errors,
    };
  }
}
