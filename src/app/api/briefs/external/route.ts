import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const requestParams: FindBriefRequest = {
      brief: searchParams.get("brief") || "public",
      typePosting: searchParams.get("typePosting") || "posting",
      status: searchParams.get("status") || "PENDING",
      platform: searchParams.getAll("platform"),
    };

    // If no platform specified, use default
    if (requestParams.platform.length === 0) {
      requestParams.platform = ["tiktok", "instagram"];
    }

    const briefs = await findBriefWithRetry(requestParams);

    return NextResponse.json({ response: briefs });
  } catch (error) {
    console.error("Error fetching external briefs:", error);
    
    if (error instanceof AxiosError) {
      return NextResponse.json(
        { 
          error: "Failed to fetch briefs from external API",
          details: error.message,
          status: error.response?.status,
        },
        { status: error.response?.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 }
    );
  }
}
