export const AI_DETECTION_TYPES = {
  phoneVisible: "PhoneVisible",
  bookVisible: "BookVisible",
  multipleFaces: "MultipleFaces",
  personNotVisible: "PersonNotVisible",
  normal: "Normal",
  disabled: "Disabled",
};

const AI_DETECTION_META = {
  PhoneVisible: { label: "Phát hiện điện thoại", variant: "danger" },
  BookVisible: { label: "Phát hiện tài liệu", variant: "danger" },
  MultipleFaces: { label: "Nhiều người trong khung hình", variant: "danger" },
  PersonNotVisible: { label: "Không thấy người", variant: "caution" },
  Normal: { label: "Bình thường", variant: "success" },
  Disabled: { label: "AI tắt", variant: "neutral" },
  UnsupportedMedia: { label: "Ảnh không hỗ trợ", variant: "neutral" },
  Unknown: { label: "Không xác định", variant: "neutral" },
};

export function getAiDetectionMeta(detectionType) {
  return AI_DETECTION_META[detectionType] ?? {
    label: detectionType || "AI detect",
    variant: "info",
  };
}

export function parseAiDetectionMetadata(metadata) {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    return {
      detectionType: parsed?.detectionType ?? null,
      confidence: Number(parsed?.confidence) || 0,
      labels: Array.isArray(parsed?.labels) ? parsed.labels : [],
    };
  } catch {
    return null;
  }
}

export function formatAiConfidence(confidence) {
  const value = Number(confidence);
  if (Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function normalizeAiDetectionEvent(raw) {
  return {
    examId: Number(raw?.examId) || 0,
    examAttemptId: Number(raw?.examAttemptId) || 0,
    studentId: raw?.studentId ?? "",
    studentName: raw?.studentName ?? "",
    detectionType: raw?.detectionType ?? "Unknown",
    confidence: Number(raw?.confidence) || 0,
    isFlagged: Boolean(raw?.isFlagged),
    message: raw?.message ?? "",
    labels: Array.isArray(raw?.labels) ? raw.labels : [],
    occurredAt: raw?.occurredAt ?? new Date().toISOString(),
  };
}

export function isAiViolationEvent(event) {
  return Boolean(event?.isFlagged) || (event?.detectionType && event.detectionType !== "Normal" && event.detectionType !== "Disabled");
}

const AI_VIOLATION_LOG_TYPES = new Set([
  "PHONE_VISIBLE",
  "BOOK_VISIBLE",
  "SECOND_PERSON_VISIBLE",
  "PERSON_NOT_VISIBLE",
  "PhoneVisible",
  "BookVisible",
  "SecondPersonVisible",
  "PersonNotVisible",
  "MultipleFaces",
]);

export function isAiViolationLog(log) {
  const aiMeta = parseAiDetectionMetadata(log?.metadata);
  if (aiMeta?.detectionType) {
    return true;
  }

  return AI_VIOLATION_LOG_TYPES.has(log?.type);
}
