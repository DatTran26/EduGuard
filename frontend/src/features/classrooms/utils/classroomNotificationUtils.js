export const CLASSROOM_NOTIFICATION_TYPES = [
  { value: "Info", label: "Thông báo chung", badgeLabel: "Thông báo", tone: "info" },
  { value: "Emergency", label: "Quan trọng / Khẩn cấp", badgeLabel: "Khẩn cấp", tone: "danger" },
  { value: "Warning", label: "Cảnh báo nhắc nhở", badgeLabel: "Cảnh báo", tone: "warning" },
];

export const CLASSROOM_NOTIFICATION_TONE_CLASSES = {
  danger: "border-danger/25 bg-danger-muted text-danger",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  info: "border-info/25 bg-info-muted text-info",
};

export const CLASSROOM_NOTIFICATION_CARD_CLASSES = {
  danger: "border-danger/25 bg-danger-muted/80",
  warning: "border-amber-500/25 bg-amber-500/10",
  info: "border-info/25 bg-info-muted/80",
};

export const CLASSROOM_NOTIFICATION_PREVIEW_CLASSES = {
  danger: "border-danger/30 bg-danger-muted/80 text-danger",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  info: "border-info/30 bg-info-muted/80 text-info",
};

export function getClassroomNotificationTypeMeta(type) {
  if (type === "Success") {
    return {
      value: "Emergency",
      label: "Quan trọng / Khẩn cấp",
      badgeLabel: "Khẩn cấp",
      tone: "danger",
    };
  }

  const matched = CLASSROOM_NOTIFICATION_TYPES.find((item) => item.value === type);
  return matched ?? CLASSROOM_NOTIFICATION_TYPES[0];
}

export function getClassroomNotificationToneClasses(type) {
  const meta = getClassroomNotificationTypeMeta(type);
  return CLASSROOM_NOTIFICATION_TONE_CLASSES[meta.tone] ?? CLASSROOM_NOTIFICATION_TONE_CLASSES.info;
}

export function getClassroomNotificationCardClasses(type) {
  const meta = getClassroomNotificationTypeMeta(type);
  return CLASSROOM_NOTIFICATION_CARD_CLASSES[meta.tone] ?? CLASSROOM_NOTIFICATION_CARD_CLASSES.info;
}
