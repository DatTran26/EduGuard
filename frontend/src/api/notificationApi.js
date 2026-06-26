import axiosClient from "./axiosClient";
import { requestApi } from "./apiHelpers";
import { normalizeNotificationDto } from "../features/notifications/utils/notificationUtils";

export const notificationApi = {
  async createClassroomNotification(payload) {
    return requestApi(() =>
      axiosClient.post("/notifications/classroom", {
        classroomId: Number(payload.classroomId),
        title: payload.title?.trim() ?? "",
        content: payload.content?.trim() ?? "",
        type: payload.type?.trim() ?? "Info",
      })
    );
  },

  async getClassroomNotifications(classroomId) {
    return requestApi(() => axiosClient.get(`/notifications/classroom/${classroomId}`));
  },

  async getMyNotifications() {
    const apiResponse = await requestApi(() => axiosClient.get("/notifications/me"));
    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((item) => normalizeNotificationDto(item))
        : [],
    };
  },

  async getUnreadCount() {
    return requestApi(() => axiosClient.get("/notifications/me/unread-count"));
  },

  async markAsRead(userNotificationId) {
    return requestApi(() =>
      axiosClient.put(`/notifications/${userNotificationId}/read`)
    );
  },

  async markAllAsRead() {
    return requestApi(() => axiosClient.put("/notifications/me/read-all"));
  },
};
