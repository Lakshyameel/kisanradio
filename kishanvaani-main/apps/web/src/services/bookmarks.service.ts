import api from "../lib/api";
import { ContentItem } from "./content.service";

export interface BookmarkResponseItem extends ContentItem {
  bookmarkId: string;
  bookmarkedAt: string;
}

export async function fetchBookmarks(): Promise<{ bookmarks: BookmarkResponseItem[] }> {
  const res = await api.get<{ bookmarks: BookmarkResponseItem[] }>("/bookmarks");
  return res.data;
}

export async function toggleBookmark(contentId: string): Promise<{ isBookmarked: boolean; message: string }> {
  const res = await api.post<{ isBookmarked: boolean; message: string }>("/bookmarks/toggle", { contentId });
  return res.data;
}

export async function checkBookmark(contentId: string): Promise<{ isBookmarked: boolean }> {
  const res = await api.get<{ isBookmarked: boolean }>(`/bookmarks/check/${contentId}`);
  return res.data;
}
