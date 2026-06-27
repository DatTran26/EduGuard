import { routeConfig } from "../../../routes/routeConfig";

const NOTIFICATION_TYPE_META = {
  AntiCheat: { label: "Gian lận", tone: "danger" },
  AntiCheatHighRisk: { label: "Rủi ro cao", tone: "danger" },
  ProctorInvite: { label: "Giám sát", tone: "info" },
  LateJoin: { label: "Vào trễ", tone: "warning" },
  ExamPublished: { label: "Đề thi mới", tone: "success" },
  AssignmentNew: { label: "Bài tập mới", tone: "info" },
  Warning: { label: "Cảnh báo", tone: "warning" },
  Emergency: { label: "Khẩn cấp", tone: "danger" },
  Success: { label: "Thành công", tone: "success" },
  Info: { label: "Thông báo", tone: "info" },
};

const CLASSROOM_BULLETIN_TYPES = new Set(["Info", "Warning", "Emergency", "Success"]);

export function resolveInboxNotificationType(type, item = null) {
  const safeType = type || "Info";

  if (safeType === "Success") {
    const isClassroomBulletin =
      !item?.relatedExamId &&
      !item?.actionUrl &&
      (Boolean(item?.classroomName) || CLASSROOM_BULLETIN_TYPES.has(safeType));

    if (isClassroomBulletin || !item) {
      return "Emergency";
    }
  }

  return safeType;
}

export function getNotificationTypeMeta(type, item = null) {
  const resolvedType = resolveInboxNotificationType(type, item);
  return NOTIFICATION_TYPE_META[resolvedType] ?? NOTIFICATION_TYPE_META.Info;
}

export const NOTIFICATION_TONE_BADGE_CLASSES = {
  danger: "border-danger/25 bg-danger-muted text-danger",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  success: "border-success/25 bg-success-muted text-success",
  info: "border-info/25 bg-info-muted text-info",
};

export const NOTIFICATION_TONE_DOT_CLASSES = {
  danger: "bg-rose-500 ring-rose-500/15",
  warning: "bg-amber-500 ring-amber-500/15",
  success: "bg-emerald-500 ring-emerald-500/15",
  info: "bg-sky-500 ring-sky-500/15",
};

const NOTIFICATION_TONE_CARD_CLASSES = {
  danger: {
    unread: "border-danger/30 bg-danger-muted/90 hover:bg-danger-muted",
    read: "border-danger/15 bg-danger-muted/45 hover:bg-danger-muted/65",
  },
  warning: {
    unread: "border-amber-500/30 bg-amber-500/12 hover:bg-amber-500/18",
    read: "border-amber-500/15 bg-amber-500/6 hover:bg-amber-500/10",
  },
  success: {
    unread: "border-success/30 bg-success-muted/90 hover:bg-success-muted",
    read: "border-success/15 bg-success-muted/45 hover:bg-success-muted/65",
  },
  info: {
    unread: "border-info/30 bg-info-muted/90 hover:bg-info-muted",
    read: "border-info/15 bg-info-muted/45 hover:bg-info-muted/65",
  },
};

const NOTIFICATION_TONE_TITLE_CLASSES = {
  danger: "text-danger",
  warning: "text-amber-800 dark:text-amber-300",
  success: "text-success",
  info: "text-info",
};

export function getNotificationBadgeClasses(type, item = null) {
  const tone = getNotificationTypeMeta(type, item).tone;
  return NOTIFICATION_TONE_BADGE_CLASSES[tone] ?? NOTIFICATION_TONE_BADGE_CLASSES.info;
}

export function getNotificationDotClasses(type, isRead = false, item = null) {
  const tone = getNotificationTypeMeta(type, item).tone;
  const dotClass = NOTIFICATION_TONE_DOT_CLASSES[tone] ?? NOTIFICATION_TONE_DOT_CLASSES.info;
  return isRead ? `${dotClass.split(" ")[0]} opacity-60` : `${dotClass} ring-4`;
}

export function getNotificationCardClasses(type, isRead = false, item = null) {
  const tone = getNotificationTypeMeta(type, item).tone;
  const cardClasses = NOTIFICATION_TONE_CARD_CLASSES[tone] ?? NOTIFICATION_TONE_CARD_CLASSES.info;
  return cardClasses[isRead ? "read" : "unread"];
}

export function getNotificationTitleClasses(type, isRead = false, item = null) {
  if (isRead) {
    return "text-primary";
  }

  const tone = getNotificationTypeMeta(type, item).tone;
  return NOTIFICATION_TONE_TITLE_CLASSES[tone] ?? "text-primary";
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

  if (item?.type === "ExamPublished" && userRole === "Student") {
    return `/student/exams/${examId}`;
  }

  return routeConfig.notifications;
}

export function normalizeNotificationDto(item) {
  const normalizedItem = {
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

  return {
    ...normalizedItem,
    type: resolveInboxNotificationType(normalizedItem.type, normalizedItem),
  };
}
