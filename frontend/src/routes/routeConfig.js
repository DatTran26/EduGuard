export const routeConfig = {
  root: "/",
  login: "/login",
  register: "/register",
  notifications: "/notifications",
  adminDashboard: "/admin/dashboard",
  adminClassrooms: "/admin/classrooms",
  adminClassroomDetail: "/admin/classrooms/:classroomId",
  adminExams: "/admin/exams",
  adminExamDetail: "/admin/exams/:examId",
  adminProctoring: "/admin/exams/:examId/proctoring",
  adminMonitoring: "/admin/monitoring",
  adminExamMonitoring: "/admin/exam-monitoring",
  adminProctoringAi: "/admin/proctoring-ai",
  adminEmailSettings: "/admin/email-settings",
  adminProctoringEvidence: "/admin/proctoring-evidence",
  adminUsers: "/admin/users",
  adminGptModel: "/admin/gpt-model",
  adminProfile: "/admin/profile",
  teacherDashboard: "/teacher/dashboard",
  teacherClassrooms: "/teacher/classrooms",
  teacherClassroomDetail: "/teacher/classrooms/:classroomId",
  teacherTasks: "/teacher/tasks",
  teacherAssignments: "/teacher/assignments",
  teacherExams: "/teacher/exams",
  teacherQuestionBanks: "/teacher/question-banks",
  teacherExamDetail: "/teacher/exams/:examId",
  teacherMonitoring: "/teacher/monitoring",
  teacherProctoring: "/teacher/exams/:examId/proctoring",
  teacherProctoringEvidence: "/teacher/proctoring-evidence",
  teacherResults: "/teacher/results",
  teacherNotifications: "/teacher/notifications",
  teacherProfile: "/teacher/profile",
  studentDashboard: "/student/dashboard",
  studentClassrooms: "/student/classrooms",
  studentJoinClassroom: "/student/classrooms/join",
  studentClassroomDetail: "/student/classrooms/:classroomId",
  studentExams: "/student/exams",
  studentExamDetail: "/student/exams/:examId",
  studentExamLobby: "/student/exams/:examId/lobby",
  studentExamDeviceCheck: "/student/exams/:examId/device-check",
  studentExamAttempt: "/student/attempts/:attemptId",
  studentExamPaused: "/student/attempts/:attemptId/paused",
  studentProfile: "/student/profile",
};

export function buildTeacherTasksPath(type = "assignment", extraParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set("type", type === "exam" ? "exam" : "assignment");

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return `${routeConfig.teacherTasks}?${searchParams.toString()}`;
}

export function getDashboardPathByRole(role) {
  if (role === "Admin") return routeConfig.adminDashboard;
  if (role === "Teacher") return routeConfig.teacherDashboard;
  return routeConfig.studentDashboard;
}

export function getClassroomListPathByRole(role) {
  if (role === "Admin") return routeConfig.adminClassrooms;
  if (role === "Teacher") return routeConfig.teacherClassrooms;
  return routeConfig.studentClassrooms;
}

export function buildClassroomDetailPathByRole(role, classroomId) {
  return `${getClassroomListPathByRole(role)}/${classroomId}`;
}

export function getExamListPathByRole(role) {
  if (role === "Admin") return routeConfig.adminExams;
  if (role === "Teacher") return buildTeacherTasksPath("exam");
  return routeConfig.studentExams;
}

export function buildExamDetailPathByRole(role, examId) {
  if (role === "Admin") {
    return `${routeConfig.adminExams}/${examId}`;
  }

  if (role === "Teacher") {
    return `${routeConfig.teacherExams}/${examId}`;
  }

  return `${routeConfig.studentExams}/${examId}`;
}

export function buildStudentExamAttemptPath(attemptId) {
  return `/student/attempts/${attemptId}`;
}

export function buildStudentExamLobbyPath(examId) {
  return `/student/exams/${examId}/lobby`;
}

export function buildStudentDeviceCheckPath(examId) {
  return `/student/exams/${examId}/device-check`;
}

export function buildStudentExamPausedPath(attemptId) {
  return `/student/attempts/${attemptId}/paused`;
}

export function buildStudentExamDetailPath(examId) {
  return `/student/exams/${examId}`;
}

export function buildTeacherProctoringPath(examId) {
  return `/teacher/exams/${examId}/proctoring`;
}

export function buildAdminProctoringPath(examId) {
  return `/admin/exams/${examId}/proctoring`;
}

export function buildProctoringPathByRole(role, examId) {
  if (role === "Admin") {
    return buildAdminProctoringPath(examId);
  }

  return buildTeacherProctoringPath(examId);
}

export function buildExamMonitoringPathByRole(role, examId) {
  if (role === "Admin") {
    return `${routeConfig.adminExamMonitoring}?examId=${examId}`;
  }

  return `${routeConfig.teacherMonitoring}?examId=${examId}`;
}

export function getProfilePathByRole(role) {
  if (role === "Admin") return routeConfig.adminProfile;
  if (role === "Teacher") return routeConfig.teacherProfile;
  return routeConfig.studentProfile;
}
