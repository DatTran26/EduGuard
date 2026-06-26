import { routeConfig } from "../../../routes/routeConfig";

const NOTIFICATION_TYPE_META = {
  AntiCheat: { label: "Gian lận", tone: "danger" },
  AntiCheatHighRisk: { label: "Rủi ro cao", tone: "danger" },
  ProctorInvite: { label: "Giám sát", tone: "info" },
  LateJoin: { label: "Vào trễ", tone: "warning" },
  Warning: { label: "Cảnh báo", tone: "warning" },
  Success: { label: "Thành công", tone: "success" },
  Info: { label: "Thông báo", tone: "info" },
};

export function getNotificationTypeMeta(type) {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.Info;
}

export function resolveNotificationPath(item, userRole = "Teacher") {
  if (item?.actionUrl) {
    return item.actionUrl;
  }

  const examId = Number(item?.relatedExamId) || 0;
  if (examId <= 0) {
    return routeConfig.notifications;
  }

  if (item?.type === "ProctorInvite" || item?.type === "AntiCheatHighRisk" || item?.type === "LateJoin") {
    return userRole === "Admin"
      ? `/admin/exams/${examId}/proctoring`
      : `/teacher/exams/${examId}/proctoring`;
  }

  if (item?.type === "AntiCheat") {
    const base = userRole === "Admin" ? "/admin/monitoring" : routeConfig.teacherMonitoring;
    return `${base}?examId=${examId}&view=logs`;
  }

  return routeConfig.notifications;
}

export function normalizeNotificationDto(item) {
  return {
    userNotificationId: Number(item?.userNotificationId) || 0,
    notificationId: Number(item?.notificationId) || 0,
    title: item?.title ?? "",
    content: item?.content ?? "",
    type: item?.type ?? "Info",
    senderName: item?.senderName ?? "",
    classroomName: item?.classroomName ?? "",
    relatedExamId: item?.relatedExamId ?? null,
    relatedExamAttemptId: item?.relatedExamAttemptId ?? null,
    actionUrl: item?.actionUrl ?? null,
    isRead: Boolean(item?.isRead),
    createdAt: item?.createdAt ?? null,
    readAt: item?.readAt ?? null,
  };
}
