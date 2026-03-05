import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { prisma } from "@/lib/prisma";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://connectcontent.me/api";
const API_EMAIL = process.env.API_EMAIL;
const API_PASSWORD = process.env.API_PASSWORD;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
}

interface FindBriefRequest {
  brief: string;
  typePosting: string;
  status: string;
  platform: string[];
}

interface FindBriefResponse {
  response: any[];
}

async function getEnvCredentials(): Promise<LoginCredentials | null> {
  if (!API_EMAIL || !API_PASSWORD) {
    console.error("API_EMAIL or API_PASSWORD not found in environment variables");
    return null;
  }
  return { email: API_EMAIL, password: API_PASSWORD };
}

async function login(credentials: LoginCredentials): Promise<string> {
  const response = await axiosInstance.post<LoginResponse>("/loginCreator", credentials);
  return response.data.accessToken;
}

async function findBrief(token: string, request: FindBriefRequest): Promise<any[]> {
  const config: AxiosRequestConfig = {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  };
  const response = await axiosInstance.post<FindBriefResponse>(
    "/campaign/find-brief-in-creator",
    request,
    config
  );
  return response.data.response || [];
}

async function findBriefWithRetry(request: FindBriefRequest): Promise<any[]> {
  const credentials = await getEnvCredentials();
  if (!credentials) {
    throw new Error("No credentials configured in environment variables");
  }

  try {
    const token = await login(credentials);
    return await findBrief(token, request);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      // Token might be expired, retry login
      const token = await login(credentials);
      return await findBrief(token, request);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Default request parameters
    const requestParams: FindBriefRequest = {
      brief: body.brief || "public",
      typePosting: body.typePosting || "posting",
      status: body.status || "PENDING",
      platform: body.platform || ["tiktok", "instagram"],
    };

    const externalBriefs = await findBriefWithRetry(requestParams);

    // Process briefs and store in database
    let newBriefs = 0;
    for (const brief of externalBriefs) {
      const existingBrief = await prisma.brief.findUnique({
        where: { externalId: brief._id },
      });

      if (!existingBrief) {
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
            numberCreators: brief.numberCreators || 0,
            status: brief.status || "PENDING",
            typePosting: brief.typePosting || ["posting"],
            platform: brief.platform || ["tiktok"],
            activeCreators: brief.activeCreators || 0,
          },
        });
        newBriefs++;
      }
    }

    return NextResponse.json({ 
      briefs: externalBriefs,
      newBriefs,
      totalBriefs: externalBriefs.length,
    });
  } catch (error) {
    console.error("Error checking briefs:", error);
    
    if (error instanceof AxiosError) {
      return NextResponse.json(
        { 
          error: "Failed to check briefs",
          details: error.message,
        },
        { status: error.response?.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to check briefs" },
      { status: 500 }
    );
  }
}
