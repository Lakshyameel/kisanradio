import api from "../lib/api";

export interface KvkDetails {
  kvkName: string;
  hostUniversity: string;
  district: string;
  state: string;
  pinCode?: string;
}

export interface AgriNewsItem {
  id: string;
  title: string;
  slug: string;
  source: "MINISTRY" | "KVK" | "PIB" | "ICAR";
  sourceName: string;
  ministryDivision?: string;
  kvkDetails?: KvkDetails;
  category: "SCHEMES" | "CROP_SCIENCE" | "PEST_ALERT" | "SUBSIDY_MSP" | "TECHNOLOGY" | "ORGANIC_NATURAL";
  categoryLabel: string;
  summary: string;
  fullBody: string;
  publishedAt: string;
  readTimeMin: number;
  audioDurationSec: number;
  audioUrl: string;
  narrator: string;
  language: string;
  state?: string;
  district?: string;
  keyTakeaways: string[];
  actionItemsForFarmers: string[];
  officialReferenceUrl?: string;
  link?: string;
  matchedBy?: "MINISTRY" | "KEYWORD";
  isUrgent?: boolean;
  isTrending?: boolean;
  isSample?: boolean;
  isLive?: boolean;
  sourceLabel?: string;
  tags: string[];
}

export interface KvkCenterInfo {
  id: string;
  name: string;           // alias for kvkName — REST convention
  kvkName: string;
  hostUniversity: string;
  state: string;
  district: string;
  address: string;
  programCoordinator: string;
  contactNumber: string;
  email: string;
  specialtyCrops: string[];
  keyDemonstrations: string[];
  establishedYear: number;
}

export interface AgriNewsListResponse {
  items: AgriNewsItem[];
  total: number;
  page: number;
  totalPages: number;
  ministryCount: number;
  kvkCount: number;
  fetchedAt?: string;
  isLive?: boolean;
}

export interface KvkDirectoryResponse {
  centers: KvkCenterInfo[];
  count: number;
  states: string[];
}

export interface AgriNewsStatsResponse {
  totalNewsBulletins: number;
  ministryBulletins: number;
  kvkAdvisories: number;
  totalKvkCentersCatalogued: number;
  totalNationalKvksOperational: number;
  agencyCredentials: {
    ministry: string;
    icar: string;
    portal: string;
  };
}

export interface AgriNewsFilterParams {
  source?: "ALL" | "MINISTRY" | "KVK";
  category?: string;
  state?: string;
  search?: string;
  dateFilter?: "TODAY" | "7DAYS" | "ALL";
  page?: number;
  limit?: number;
}

export const fetchAgriNewsList = async (params: AgriNewsFilterParams = {}): Promise<AgriNewsListResponse> => {
  const { data } = await api.get<AgriNewsListResponse>("/agriculture-news", { params });
  return data;
};

export const fetchMinistryNews = async (params: { category?: string; search?: string; limit?: number } = {}): Promise<AgriNewsListResponse> => {
  const { data } = await api.get<AgriNewsListResponse>("/agriculture-news/ministry", { params });
  return data;
};

export const fetchKvkNews = async (params: { state?: string; category?: string; search?: string; limit?: number } = {}): Promise<AgriNewsListResponse> => {
  const { data } = await api.get<AgriNewsListResponse>("/agriculture-news/kvk", { params });
  return data;
};

export const fetchKvkDirectory = async (params: { state?: string; district?: string; search?: string } = {}): Promise<KvkDirectoryResponse> => {
  const { data } = await api.get<KvkDirectoryResponse>("/agriculture-news/kvk/directory", { params });
  return data;
};

export const fetchAgriNewsStats = async (): Promise<AgriNewsStatsResponse> => {
  const { data } = await api.get<AgriNewsStatsResponse>("/agriculture-news/stats");
  return data;
};

export const fetchAgriNewsById = async (idOrSlug: string): Promise<AgriNewsItem> => {
  const { data } = await api.get<AgriNewsItem>(`/agriculture-news/${idOrSlug}`);
  return data;
};
