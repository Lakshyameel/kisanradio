import api from "../lib/api";

export interface ContinueListeningItem {
  id: string;
  title: string;
  description?: string;
  slug: string;
  type: string;
  category: string;
  language: string;
  thumbnailUrl?: string;
  audioId: string;
  audioUrl: string;
  progressSeconds: number;
  durationSec: number;
  progressPercent: number;
  lastPlayedAt: string;
}

export async function fetchHistory(): Promise<{ history: any[] }> {
  const res = await api.get<{ history: any[] }>("/history");
  return res.data;
}

export async function fetchContinueListening(): Promise<{ continueListening: ContinueListeningItem[] }> {
  const res = await api.get<{ continueListening: ContinueListeningItem[] }>("/history/continue");
  return res.data;
}

export async function syncListeningProgress(data: {
  audioId?: string;
  contentId?: string;
  progressSeconds: number;
  completed?: boolean;
}): Promise<void> {
  await api.post("/history/sync", data);
}

export async function clearHistory(): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>("/history/clear");
  return res.data;
}
