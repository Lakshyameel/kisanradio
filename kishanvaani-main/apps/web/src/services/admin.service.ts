import api from "../lib/api";

export interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    totalContent: number;
    totalAudio: number;
    pendingStories: number;
    pendingQuestions: number;
    mandiCount: number;
    totalPlays: number;
    scheduledContentCount?: number;
    auditLogsCount?: number;
  };
  contentByType: Array<{ type: string; _count: { id: number } }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    state?: string;
    createdAt: string;
  }>;
}

export interface AnalyticsResponse {
  metrics: {
    totalAudioPlays: number;
    completedPlays: number;
    completionRate: number;
    totalContentCount: number;
    totalRegisteredFarmers: number;
  };
  topDistricts: Array<{
    district: string;
    state: string;
    listenersCount: number;
    activeCrops: string[];
  }>;
  topListenedAudio: Array<{
    id: string;
    title: string;
    viewsCount: number;
    category: string;
    type: string;
    language: string;
    durationSec: number;
  }>;
  activityTrend: Array<{
    date: string;
    dayLabel: string;
    plays: number;
    completions: number;
  }>;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScheduledContentItem {
  id: string;
  title: string;
  description?: string;
  body?: string;
  type: string;
  category: string;
  language: string;
  status: string;
  scheduledPublishAt: string;
  authorName?: string;
  audio?: {
    fileUrl: string;
    durationSec: number;
    transcript?: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const res = await api.get<AdminStatsResponse>("/admin/stats");
  return res.data;
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await api.get<AnalyticsResponse>("/admin/analytics");
  return res.data;
}

export async function fetchAuditLogs(options?: {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
}): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", String(options.page));
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.action) params.append("action", options.action);
  if (options?.targetType) params.append("targetType", options.targetType);

  const res = await api.get<AuditLogsResponse>(`/admin/audit-logs?${params.toString()}`);
  return res.data;
}

export async function fetchScheduledContent(): Promise<{ scheduled: ScheduledContentItem[] }> {
  const res = await api.get<{ scheduled: ScheduledContentItem[] }>("/admin/content/scheduled");
  return res.data;
}

export async function scheduleContent(data: {
  title: string;
  description?: string;
  body?: string;
  type?: string;
  category?: string;
  language?: string;
  audioUrl?: string;
  durationSec?: number;
  transcript?: string;
  authorName?: string;
  scheduledPublishAt: string;
}): Promise<any> {
  const res = await api.post("/admin/content/schedule", data);
  return res.data;
}

export async function publishDueContent(): Promise<any> {
  const res = await api.post("/admin/content/publish-due");
  return res.data;
}

export async function publishScheduledNow(id: string): Promise<any> {
  const res = await api.post(`/admin/content/${id}/publish-now`);
  return res.data;
}

export async function bulkUploadData(
  type: "CONTENT" | "MANDI_PRICE",
  items: any[]
): Promise<{
  success: boolean;
  totalReceived: number;
  successCount: number;
  failedCount: number;
  errors?: any[];
}> {
  const res = await api.post("/admin/bulk-upload", { type, items });
  return res.data;
}

export async function fetchPendingStories(): Promise<{ stories: any[] }> {
  const res = await api.get<{ stories: any[] }>("/admin/stories/pending");
  return res.data;
}

export async function updateStoryStatus(id: string, status: "PUBLISHED" | "REJECTED"): Promise<any> {
  const res = await api.put(`/admin/stories/${id}/status`, { status });
  return res.data;
}

export async function fetchPendingQuestions(): Promise<{ questions: any[] }> {
  const res = await api.get<{ questions: any[] }>("/admin/questions/pending");
  return res.data;
}
