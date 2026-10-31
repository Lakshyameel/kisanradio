import api from "../lib/api";

export interface CommunityStoryItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: "SUCCESS_STORY" | "FAILURE_STORY" | "FARMER_EXPERIENCE";
  audioUrl?: string;
  status: string;
  likesCount: number;
  farmerName?: string;
  location?: string;
  createdAt: string;
  user?: {
    name: string;
    avatarUrl?: string;
    state?: string;
    district?: string;
  };
}

export async function fetchCommunityStories(category?: string): Promise<{ stories: CommunityStoryItem[] }> {
  const res = await api.get<{ stories: CommunityStoryItem[] }>("/community/stories", {
    params: { category: category === "ALL" ? undefined : category },
  });
  return res.data;
}

export async function submitCommunityStory(data: {
  title: string;
  body: string;
  category: string;
  farmerName?: string;
  location?: string;
  audioUrl?: string;
}): Promise<{ story: CommunityStoryItem; message: string }> {
  const res = await api.post<{ story: CommunityStoryItem; message: string }>("/community/stories", data);
  return res.data;
}

export async function likeStory(id: string): Promise<{ id: string; likesCount: number }> {
  const res = await api.post<{ id: string; likesCount: number }>(`/community/stories/${id}/like`);
  return res.data;
}

export async function fetchMyStories(): Promise<{ stories: CommunityStoryItem[] }> {
  const res = await api.get<{ stories: CommunityStoryItem[] }>("/community/my-stories");
  return res.data;
}
