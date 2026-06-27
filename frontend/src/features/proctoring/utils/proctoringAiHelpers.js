export const AI_DETECTION_TYPES = {
  phoneVisible: "PhoneVisible",
  bookVisible: "BookVisible",
  multipleFaces: "MultipleFaces",
  personNotVisible: "PersonNotVisible",
  normal: "Normal",
  disabled: "Disabled",
};

export const PROCTORING_AI_DETECTION_FILTERS = [
  { id: "all", label: "Tất cả lỗi AI" },
  { id: "any", label: "Có vi phạm AI" },
  { id: AI_DETECTION_TYPES.phoneVisible, label: "Phát hiện điện thoại" },
  { id: AI_DETECTION_TYPES.bookVisible, label: "Phát hiện tài liệu" },
  { id: AI_DETECTION_TYPES.multipleFaces, label: "Nhiều người trong khung hình" },
  { id: AI_DETECTION_TYPES.personNotVisible, label: "Không thấy người" },
];

const AI_DETECTION_META = {
  PhoneVisible: { label: "Phát hiện điện thoại", variant: "info" },
  BookVisible: { label: "Phát hiện tài liệu", variant: "danger" },
  MultipleFaces: { label: "Nhiều người trong khung hình", variant: "caution" },
  PersonNotVisible: { label: "Không thấy người", variant: "neutral" },
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

export function resolveTileAiStatusMeta(student, { globalAiEnabled = true, studentAiEnabled = true } = {}) {
  if (!globalAiEnabled || !studentAiEnabled) {
    return getAiDetectionMeta(AI_DETECTION_TYPES.disabled);
  }

  if (student?.latestDetectionType) {
    return getAiDetectionMeta(student.latestDetectionType);
  }

  return getAiDetectionMeta(AI_DETECTION_TYPES.normal);
}

export function parseAiDetectionMetadata(metadata) {
  if (!metadata) {
    return null;
  }

  try {
    const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const detectionType = parsed?.detectionType ?? null;
    if (!detectionType) {
      return null;
    }

    return {
      detectionType,
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

export function getAiConfidenceColorClass(confidence) {
  const raw = Number(confidence);
  if (Number.isNaN(raw)) {
    return "text-slate-400";
  }

  const percent = raw <= 1 ? raw * 100 : raw;

  if (percent >= 70) {
    return "text-emerald-400";
  }

  if (percent >= 50) {
    return "text-amber-300";
  }

  if (percent >= 20) {
    return "text-white";
  }

  return "text-rose-400";
}

export function formatAiDetectionDetail(confidence) {
  const value = formatAiConfidence(confidence);
  if (value === "—") {
    return "";
  }

  return `Độ tin cậy: ${value}`;
}

const AI_VIOLATION_DESCRIPTION_PATTERN = /^AI phát hiện:\s*.+$/i;

export function sanitizeAiViolationDescription(description) {
  const trimmed = description?.trim();
  if (!trimmed) {
    return "";
  }

  if (AI_VIOLATION_DESCRIPTION_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
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
  return Boolean(event?.isFlagged) || isAiViolationDetectionType(event?.detectionType);
}

export function isAiViolationDetectionType(detectionType) {
  return Boolean(
    detectionType
      && detectionType !== AI_DETECTION_TYPES.normal
      && detectionType !== AI_DETECTION_TYPES.disabled,
  );
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
