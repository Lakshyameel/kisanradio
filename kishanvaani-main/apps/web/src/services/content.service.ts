import api from "../lib/api";

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  body?: string;
  type: string;
  category: string;
  status: string;
  language: string;
  thumbnailUrl?: string;
  authorName?: string;
  tags?: string;
  viewsCount: number;
  likesCount: number;
  isBookmarked?: boolean;
  audioUrl: string;
  durationSec: number;
  narrator?: string;
  transcript?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FeaturedContentResponse {
  heroFeatured: ContentItem | null;
  featured: ContentItem[];
  latestNews: ContentItem[];
  recommendations: ContentItem[];
  literatureSpotlight: ContentItem[];
}

export async function uploadAudioFile(filename: string, fileBase64: string, mimeType?: string): Promise<{ fileUrl: string; filename: string }> {
  const res = await api.post<{ fileUrl: string; filename: string }>(
    "/content/upload-file",
    {
      filename,
      fileBase64,
      mimeType,
    },
    { timeout: 120000 }
  );
  return res.data;
}

export async function fetchContentList(params?: {
  type?: string;
  category?: string;
  language?: string;
  search?: string;
  status?: string;
  limit?: number;
  page?: number;
}): Promise<ContentListResponse> {
  const res = await api.get<ContentListResponse>("/content", { params });
  return res.data;
}

export async function fetchFeaturedContent(): Promise<FeaturedContentResponse> {
  const res = await api.get<FeaturedContentResponse>("/content/featured");
  return res.data;
}

export async function fetchContentBySlug(slug: string): Promise<{ item: ContentItem; related: ContentItem[] }> {
  const res = await api.get<{ item: ContentItem; related: ContentItem[] }>(`/content/slug/${slug}`);
  return res.data;
}

export async function likeContent(id: string): Promise<{ id: string; likesCount: number }> {
  const res = await api.post<{ id: string; likesCount: number }>(`/content/${id}/like`);
  return res.data;
}

export async function uploadUserLiterature(data: {
  title: string;
  description?: string;
  body?: string;
  type: "STORY" | "POEM" | "FOLK_TALE" | "AUDIO_BOOK";
  language: string;
  authorName?: string;
  audioUrl?: string;
  durationSec?: number;
  thumbnailUrl?: string;
  transcript?: string;
}): Promise<{ content: ContentItem; message: string }> {
  const res = await api.post<{ content: ContentItem; message: string }>("/content/user-upload", data);
  return res.data;
}

export async function fetchMyLiterature(): Promise<{ items: ContentItem[] }> {
  const res = await api.get<{ items: ContentItem[] }>("/content/my-literature");
  return res.data;
}

export async function createContent(data: Partial<ContentItem>): Promise<ContentItem> {
  const res = await api.post<ContentItem>("/content", data);
  return res.data;
}

export async function deleteContent(id: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/content/${id}`);
  return res.data;
}
