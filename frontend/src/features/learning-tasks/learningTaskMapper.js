import { canCloseExamEarly } from "../exams/examHelpers";

export const LEARNING_TASK_TYPES = {
  assignment: "assignment",
  exam: "exam",
};

export const LEARNING_TASK_TYPE_OPTIONS = [
  { label: "Bài tập", value: LEARNING_TASK_TYPES.assignment },
  { label: "Bài thi / Đề thi", value: LEARNING_TASK_TYPES.exam },
];

const ASSIGNMENT_STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Đang mở", value: "open" },
  { label: "Cần chấm", value: "need-grading" },
  { label: "Đã đóng", value: "closed" },
];

const EXAM_STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Bản nháp", value: "draft" },
  { label: "Sắp mở", value: "upcoming" },
  { label: "Đang mở", value: "open" },
  { label: "Đã đóng", value: "closed" },
];

const ASSIGNMENT_SORT_OPTIONS = [
  { label: "Hạn nộp gần nhất", value: "deadline-asc" },
  { label: "Hạn nộp xa nhất", value: "deadline-desc" },
  { label: "Cần chấm nhiều nhất", value: "grading-desc" },
  { label: "Mới tạo gần đây", value: "created-desc" },
];

const EXAM_SORT_OPTIONS = [
  { label: "Mới tạo gần đây", value: "created-desc" },
  { label: "Lịch mở gần nhất", value: "start-asc" },
  { label: "Nhiều lượt làm nhất", value: "attempts-desc" },
  { label: "Tên A-Z", value: "title-asc" },
];

function getAssignmentStatusMeta(assignment, nowTimestamp) {
  if (Number(assignment?.ungradedCount) > 0) {
    return { label: "Cần chấm", value: "need-grading", tone: "caution" };
  }

  if (assignment?.deadline && new Date(assignment.deadline).getTime() < nowTimestamp) {
    return { label: "Đã đóng", value: "closed", tone: "danger" };
  }

  return { label: "Đang mở", value: "open", tone: "success" };
}

function isAssignmentOpen(task, nowTimestamp = Date.now()) {
  if (!task?.deadline) {
    return true;
  }

  return new Date(task.deadline).getTime() >= nowTimestamp;
}

function isAssignmentDueSoon(task, nowTimestamp = Date.now()) {
  if (!task?.deadline) {
    return false;
  }

  const deadlineTimestamp = new Date(task.deadline).getTime();
  return deadlineTimestamp > nowTimestamp && deadlineTimestamp - nowTimestamp <= 48 * 60 * 60 * 1000;
}

function getExamStatusMeta(exam) {
  if (exam?.statusLabel === "Bản nháp") {
    return { label: "Bản nháp", value: "draft", tone: "neutral" };
  }

  if (exam?.statusLabel === "Sắp mở") {
    return { label: "Sắp mở", value: "upcoming", tone: "caution" };
  }

  if (exam?.statusLabel === "Đang mở") {
    return { label: "Đang mở", value: "open", tone: "success" };
  }

  if (exam?.statusLabel === "Đã đóng") {
    return { label: "Đã đóng", value: "closed", tone: "danger" };
  }

  return { label: exam?.statusLabel || "Không xác định", value: "other", tone: "info" };
}

function roundAverageScore(submissions = []) {
  const scoredSubmissions = submissions.filter((submission) => typeof submission?.score === "number");

  if (scoredSubmissions.length === 0) {
    return null;
  }

  const totalScore = scoredSubmissions.reduce((sum, submission) => sum + Number(submission.score || 0), 0);
  return Math.round((totalScore / scoredSubmissions.length) * 10) / 10;
}

export function resolveLearningTaskType(value) {
  return value === LEARNING_TASK_TYPES.exam ? LEARNING_TASK_TYPES.exam : LEARNING_TASK_TYPES.assignment;
}

export function getLearningTaskPageCopy(type) {
  if (type === LEARNING_TASK_TYPES.exam) {
    return {
      badge: "GIẢNG VIÊN",
      title: "Quản lý hoạt động học tập",
      description: "Tạo, theo dõi và quản lý bài tập, bài thi của các lớp học.",
      createLabel: "Tạo bài kiểm tra",
      emptyTitle: "Chưa có bài kiểm tra nào.",
      emptyDescription: "Tạo đề thi đầu tiên để bắt đầu lên lịch kiểm tra cho lớp học.",
    };
  }

  return {
    badge: "GIẢNG VIÊN",
    title: "Quản lý hoạt động học tập",
    description: "Tạo, theo dõi và quản lý bài tập, bài thi của các lớp học.",
    createLabel: "Tạo bài tập",
    emptyTitle: "Chưa có bài tập nào.",
    emptyDescription: "Tạo bài tập đầu tiên để giao nhiệm vụ học tập cho lớp học.",
  };
}

export function getLearningTaskStatusOptions(type) {
  return type === LEARNING_TASK_TYPES.exam ? EXAM_STATUS_OPTIONS : ASSIGNMENT_STATUS_OPTIONS;
}

export function getLearningTaskSortOptions(type) {
  return type === LEARNING_TASK_TYPES.exam ? EXAM_SORT_OPTIONS : ASSIGNMENT_SORT_OPTIONS;
}

export function getDefaultSortOption(type) {
  return type === LEARNING_TASK_TYPES.exam ? "created-desc" : "deadline-asc";
}

export function resolveLearningTaskQuickFilter(type, value) {
  const normalizedValue = String(value || "").trim();

  if (type === LEARNING_TASK_TYPES.exam) {
    return ["open", "upcoming", "published"].includes(normalizedValue)
      ? normalizedValue
      : "";
  }

  return ["open", "due-soon", "need-grading"].includes(normalizedValue)
    ? normalizedValue
    : "";
}

export function mapAssignmentToLearningTask(assignment, classrooms = [], submissions = [], nowTimestamp = Date.now()) {
  const classroom = classrooms.find((item) => Number(item.id) === Number(assignment?.classroomId)) ?? null;
  const ungradedCount = submissions.filter((submission) => typeof submission?.score !== "number").length;
  const averageScore = roundAverageScore(submissions);
  const totalStudents = Number(classroom?.memberCount) || Number(assignment?.classroomMemberCount) || 0;

  return {
    id: Number(assignment?.id) || 0,
    type: LEARNING_TASK_TYPES.assignment,
    title: assignment?.title ?? "",
    classId: Number(assignment?.classroomId) || 0,
    className: classroom?.name || assignment?.classroomName || "Lớp học chưa xác định",
    status: getAssignmentStatusMeta({ ...assignment, ungradedCount }, nowTimestamp),
    deadline: assignment?.deadline ?? null,
    createdAt: assignment?.createdAt ?? null,
    submissionCount: Number(assignment?.submissionCount) || submissions.length,
    totalStudents,
    ungradedCount,
    averageScore,
    rawData: {
      ...assignment,
      classroomName: classroom?.name || assignment?.classroomName || "Lớp học chưa xác định",
      classroomMemberCount: totalStudents,
      ungradedCount,
      averageScore,
    },
  };
}

export function mapExamToLearningTask(exam) {
  return {
    id: Number(exam?.id) || 0,
    type: LEARNING_TASK_TYPES.exam,
    title: exam?.title ?? "",
    classId: Number(exam?.classroomId) || 0,
    className: exam?.classroomName || "Lớp học chưa xác định",
    status: getExamStatusMeta(exam),
    deadline: exam?.endTime ?? null,
    createdAt: exam?.createdAt ?? null,
    startTime: exam?.startTime ?? null,
    endTime: exam?.endTime ?? null,
    submissionCount: Number(exam?.attemptCount) || 0,
    totalStudents: null,
    attemptCount: Number(exam?.attemptCount) || 0,
    questionCount: Number(exam?.questionCount) || 0,
    averageScore: typeof exam?.averageScore === "number" ? exam.averageScore : null,
    isPublished: Boolean(exam?.isPublished),
    enableAntiCheat: Boolean(exam?.enableAntiCheat),
    canPublish: Boolean(exam?.canEdit && !exam?.isPublished),
    canCloseEarly: canCloseExamEarly(exam),
    publishIssueCount: Number(exam?.questionCount) > 0 ? 0 : 1,
    rawData: exam,
  };
}

export function filterLearningTasks(tasks = [], filters = {}) {
  const normalizedSearch = String(filters.searchTerm || "").trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.classroomId && Number(task.classId) !== Number(filters.classroomId)) {
      return false;
    }

    if (filters.status && task.status?.value !== filters.status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [task.title, task.className].some((value) =>
      String(value || "").toLowerCase().includes(normalizedSearch),
    );
  });
}

export function filterLearningTasksByQuickFilter(
  tasks = [],
  type,
  quickFilter,
  nowTimestamp = Date.now(),
) {
  if (!quickFilter) {
    return tasks;
  }

  if (type === LEARNING_TASK_TYPES.exam) {
    return tasks.filter((task) => {
      if (quickFilter === "published") {
        return Boolean(task.isPublished);
      }

      return task.status?.value === quickFilter;
    });
  }

  return tasks.filter((task) => {
    if (quickFilter === "need-grading") {
      return Number(task.ungradedCount) > 0;
    }

    if (quickFilter === "due-soon") {
      return isAssignmentDueSoon(task, nowTimestamp);
    }

    if (quickFilter === "open") {
      return isAssignmentOpen(task, nowTimestamp);
    }

    return task.status?.value === quickFilter;
  });
}

export function sortLearningTasks(tasks = [], type, sortOption) {
  const nextTasks = tasks.slice();

  if (type === LEARNING_TASK_TYPES.exam) {
    return nextTasks.sort((firstTask, secondTask) => {
      if (sortOption === "start-asc") {
        return new Date(firstTask.startTime || firstTask.createdAt || 0) - new Date(secondTask.startTime || secondTask.createdAt || 0);
      }

      if (sortOption === "attempts-desc") {
        return Number(secondTask.attemptCount || 0) - Number(firstTask.attemptCount || 0);
      }

      if (sortOption === "title-asc") {
        return String(firstTask.title || "").localeCompare(String(secondTask.title || ""), "vi");
      }

      return new Date(secondTask.createdAt || 0) - new Date(firstTask.createdAt || 0);
    });
  }

  return nextTasks.sort((firstTask, secondTask) => {
    if (sortOption === "deadline-desc") {
      return new Date(secondTask.deadline || secondTask.createdAt || 0) - new Date(firstTask.deadline || firstTask.createdAt || 0);
    }

    if (sortOption === "grading-desc") {
      return Number(secondTask.ungradedCount || 0) - Number(firstTask.ungradedCount || 0);
    }

    if (sortOption === "created-desc") {
      return new Date(secondTask.createdAt || 0) - new Date(firstTask.createdAt || 0);
    }

    return new Date(firstTask.deadline || firstTask.createdAt || 0) - new Date(secondTask.deadline || secondTask.createdAt || 0);
  });
}

export function buildLearningTaskStats(tasks = [], type, nowTimestamp = Date.now()) {
  if (type === LEARNING_TASK_TYPES.exam) {
    return [
      { label: "Tổng số", value: tasks.length, tone: "neutral", filterValue: "" },
      { label: "Đang mở", value: tasks.filter((task) => task.status?.value === "open").length, tone: "success", filterValue: "open" },
      { label: "Sắp diễn ra", value: tasks.filter((task) => task.status?.value === "upcoming").length, tone: "caution", filterValue: "upcoming" },
      { label: "Đã publish", value: tasks.filter((task) => task.isPublished).length, tone: "info", filterValue: "published" },
    ];
  }

  return [
    { label: "Tổng số", value: tasks.length, tone: "neutral", filterValue: "" },
    { label: "Đang mở", value: tasks.filter((task) => isAssignmentOpen(task, nowTimestamp)).length, tone: "success", filterValue: "open" },
    {
      label: "Sắp đến hạn",
      value: tasks.filter((task) => isAssignmentDueSoon(task, nowTimestamp)).length,
      tone: "danger",
      filterValue: "due-soon",
    },
    { label: "Cần chấm", value: tasks.filter((task) => Number(task.ungradedCount) > 0).length, tone: "caution", filterValue: "need-grading" },
  ];
}
