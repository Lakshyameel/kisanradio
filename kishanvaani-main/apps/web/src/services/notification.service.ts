import api from "../lib/api";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "QUESTION_ANSWERED" | "SPRAY_ALERT" | "PRICE_ALERT" | "SYSTEM";
  linkUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  unreadCount: number;
  notifications: AppNotification[];
}

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse> {
    const res = await api.get<NotificationResponse>("/notifications");
    return res.data;
  },

  async markAsRead(id: string): Promise<{ success: boolean; unreadCount: number }> {
    const res = await api.patch<{ success: boolean; unreadCount: number }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; unreadCount: number }> {
    const res = await api.patch<{ success: boolean; unreadCount: number }>("/notifications/read-all");
    return res.data;
  },

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean }>(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;
