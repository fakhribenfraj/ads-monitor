export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface Brief {
  id: string;
  brief: string;
  campaignName: string;
  category: string;
  dateCampaign: string;
  descriptionCampaign: string;

  logo: string;
  price: string;
  priceCreator: string;
  numberCreators: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  typePosting: ["posting"];
  platform: ["tiktok"];
  activeCreators: number;
}

export interface FindBriefRequest {
  brief: "public";
  typePosting: "posting";
  status: "PENDING";
  platform: ("tiktok" | "instagram")[];
}

export interface FindBriefResponse {
  response: Brief[];
}
