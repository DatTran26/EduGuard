// Object này gom toàn bộ route của ứng dụng để tránh viết path rải rác ở nhiều chỗ.
export const routeConfig = {
  root: "/",
  login: "/login",
  register: "/register",
  adminDashboard: "/admin/dashboard",
  adminClassrooms: "/admin/classrooms",
  adminClassroomDetail: "/admin/classrooms/:classroomId",
  adminExams: "/admin/exams",
  adminExamDetail: "/admin/exams/:examId",
  adminMonitoring: "/admin/monitoring",
  adminUsers: "/admin/users",
  adminProfile: "/admin/profile",
  teacherDashboard: "/teacher/dashboard",
  teacherClassrooms: "/teacher/classrooms",
  teacherClassroomDetail: "/teacher/classrooms/:classroomId",
  teacherAssignments: "/teacher/assignments",
  teacherExams: "/teacher/exams",
  teacherExamDetail: "/teacher/exams/:examId",
  teacherMonitoring: "/teacher/monitoring",
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

// Hàm này trả route dashboard theo role để login redirect và sidebar dùng chung một chuẩn.
export function getDashboardPathByRole(role) {
  if (role === "Admin") {
    return routeConfig.adminDashboard;
  }

  if (role === "Teacher") {
    return routeConfig.teacherDashboard;
  }

  return routeConfig.studentDashboard;
}

// Hàm này trả về route danh sách classroom đúng với role hiện tại của user.
export function getClassroomListPathByRole(role) {
  if (role === "Admin") {
    return routeConfig.adminClassrooms;
  }

  if (role === "Teacher") {
    return routeConfig.teacherClassrooms;
  }

  return routeConfig.studentClassrooms;
}

// Hàm này tạo route classroom detail đúng theo role để điều hướng không bị lẫn path.
export function buildClassroomDetailPathByRole(role, classroomId) {
  return `${getClassroomListPathByRole(role)}/${classroomId}`;
}

// Hàm này trả route danh sách đề thi đúng với role để sidebar và redirect dùng cùng một chỗ.
export function getExamListPathByRole(role) {
  if (role === "Admin") {
    return routeConfig.adminExams;
  }

  if (role === "Teacher") {
    return routeConfig.teacherExams;
  }

  return routeConfig.studentExams;
}

// Hàm này tạo route chi tiết đề thi đúng theo role hiện tại để điều hướng không bị sai path.
export function buildExamDetailPathByRole(role, examId) {
  return `${getExamListPathByRole(role)}/${examId}`;
}

// Ham nay tao route phong lam bai cua student tu attempt id de flow bat dau / tiep tuc thong nhat.
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

// Hàm này trả về route profile phù hợp với từng vai trò trong app.
export function getProfilePathByRole(role) {
  if (role === "Admin") {
    return routeConfig.adminProfile;
  }

  if (role === "Teacher") {
    return routeConfig.teacherProfile;
  }

  return routeConfig.studentProfile;
}
