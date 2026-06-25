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
  adminMonitoring: "/admin/monitoring",
  adminProctoringAi: "/admin/proctoring-ai",
  adminUsers: "/admin/users",
  adminProfile: "/admin/profile",
  teacherDashboard: "/teacher/dashboard",
  teacherClassrooms: "/teacher/classrooms",
  teacherClassroomDetail: "/teacher/classrooms/:classroomId",
  teacherAssignments: "/teacher/assignments",
  teacherExams: "/teacher/exams",
  teacherExamDetail: "/teacher/exams/:examId",
  teacherMonitoring: "/teacher/monitoring",
  teacherProctoring: "/teacher/exams/:examId/proctoring",
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
  if (role === "Teacher") return routeConfig.teacherExams;
  return routeConfig.studentExams;
}

export function buildExamDetailPathByRole(role, examId) {
  return `${getExamListPathByRole(role)}/${examId}`;
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

export function getProfilePathByRole(role) {
  if (role === "Admin") return routeConfig.adminProfile;
  if (role === "Teacher") return routeConfig.teacherProfile;
  return routeConfig.studentProfile;
}
