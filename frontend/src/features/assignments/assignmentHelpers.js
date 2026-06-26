import { parseDateValue } from "../../utils/formatDate";

const ASSIGNMENT_SUBMISSION_CACHE_KEY = "eduguard_assignment_submission_cache";

function readSubmissionCache() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(ASSIGNMENT_SUBMISSION_CACHE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function writeSubmissionCache(nextCache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ASSIGNMENT_SUBMISSION_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Bo qua neu trinh duyet chan storage.
  }
}

function buildCacheKey(userId, assignmentId) {
  const normalizedUserId = userId === null || typeof userId === "undefined" ? "" : String(userId).trim();
  return `${normalizedUserId || "anonymous"}:${Number(assignmentId) || 0}`;
}

export function getCachedSubmission(userId, assignmentId) {
  const cache = readSubmissionCache();
  return cache[buildCacheKey(userId, assignmentId)] ?? null;
}

export function cacheSubmission(userId, submission) {
  const cache = readSubmissionCache();
  const cacheKey = buildCacheKey(userId, submission?.assignmentId);

  cache[cacheKey] = submission;
  writeSubmissionCache(cache);
}

export function resolveAssignmentSubmission(assignment, userId, localSubmission = null) {
  if (assignment?.mySubmission) {
    return assignment.mySubmission;
  }

  if (localSubmission) {
    return localSubmission;
  }

  return getCachedSubmission(userId, assignment?.id);
}

export function getAssignmentStatusMeta(assignment, localSubmission) {
  if (localSubmission?.score !== null && typeof localSubmission?.score === "number") {
    return {
      label: "Đã chấm",
      variant: "success",
    };
  }

  if (localSubmission) {
    return {
      label: "Đã nộp",
      variant: "info",
    };
  }

  if (assignment?.deadline && new Date(assignment.deadline).getTime() < Date.now()) {
    return {
      label: "Quá hạn",
      variant: "danger",
    };
  }

  return {
    label: "Chưa nộp",
    variant: "caution",
  };
}

export function getAssignmentDeadlineMeta(assignment) {
  if (!assignment?.deadline) {
    return {
      label: "Chưa đặt hạn",
      variant: "neutral",
    };
  }

  const remainingTimeMs = new Date(assignment.deadline).getTime() - Date.now();

  if (remainingTimeMs < 0) {
    return {
      label: "Đã hết hạn",
      variant: "danger",
    };
  }

  if (remainingTimeMs <= 24 * 60 * 60 * 1000) {
    return {
      label: "Còn dưới 24 giờ",
      variant: "caution",
    };
  }

  return {
    label: "Đang nhận bài",
    variant: "success",
  };
}

export function sortAssignmentsByDeadline(assignments = []) {
  return assignments.slice().sort((firstAssignment, secondAssignment) => {
    const firstTime = new Date(firstAssignment.deadline || firstAssignment.createdAt || 0).getTime();
    const secondTime = new Date(secondAssignment.deadline || secondAssignment.createdAt || 0).getTime();

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    return Number(firstAssignment.id || 0) - Number(secondAssignment.id || 0);
  });
}

export function buildAssignmentSummaryItems(assignments = []) {
  const overdueCount = assignments.filter(
    (assignment) => assignment.deadline && new Date(assignment.deadline).getTime() < Date.now(),
  ).length;
  const activeCount = Math.max(assignments.length - overdueCount, 0);
  const submissionCount = assignments.reduce(
    (totalValue, assignment) => totalValue + Number(assignment.submissionCount || 0),
    0,
  );

  return [
    { label: "Tổng bài tập", value: assignments.length },
    { label: "Đang nhận bài", value: activeCount },
    { label: "Đã quá hạn", value: overdueCount },
    { label: "Lượt nộp", value: submissionCount },
  ];
}

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60;

const vietnamDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VIETNAM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatVietnamDateTimeParts(value) {
  if (!value) {
    return null;
  }

  const dateObject = parseDateValue(value);

  if (!dateObject) {
    return null;
  }

  const partLookup = {};

  vietnamDateTimeFormatter.formatToParts(dateObject).forEach((part) => {
    if (part.type !== "literal") {
      partLookup[part.type] = part.value;
    }
  });

  return {
    year: partLookup.year,
    month: partLookup.month,
    day: partLookup.day,
    hour: partLookup.hour,
    minute: partLookup.minute,
  };
}

function parseDateTimeLocalInputValue(value) {
  const matchedParts = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!matchedParts) {
    return null;
  }

  const [, year, month, day, hour, minute] = matchedParts;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function toAssignmentDateTimeInputValue(value) {
  const parts = formatVietnamDateTimeParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : "";
}

export function toAssignmentVietnamISOString(value) {
  const parsedValue = parseDateTimeLocalInputValue(value);

  if (!parsedValue) {
    return null;
  }

  const utcTime =
    Date.UTC(
      parsedValue.year,
      parsedValue.month - 1,
      parsedValue.day,
      parsedValue.hour,
      parsedValue.minute,
    ) -
    VIETNAM_UTC_OFFSET_MINUTES * 60 * 1000;

  return new Date(utcTime).toISOString();
}
