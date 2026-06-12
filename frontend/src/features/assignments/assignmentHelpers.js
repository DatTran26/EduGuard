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
  return `${Number(userId) || 0}:${Number(assignmentId) || 0}`;
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

export function toAssignmentDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const dateObject = new Date(value);

  if (Number.isNaN(dateObject.getTime())) {
    return "";
  }

  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  const hours = String(dateObject.getHours()).padStart(2, "0");
  const minutes = String(dateObject.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
