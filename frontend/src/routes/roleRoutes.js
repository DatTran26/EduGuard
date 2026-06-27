import {
  getProfilePathByRole,
  routeConfig,
} from "./routeConfig";

// Object này định nghĩa menu sidebar theo từng role để mỗi người chỉ thấy đúng khu vực mình cần.
const ROLE_NAVIGATION_ITEMS = {
  Admin: [
    { label: "Dashboard", path: routeConfig.adminDashboard },
    { label: "Quản lí lớp học", path: routeConfig.adminClassrooms },
    { label: "Quản lí bài kiểm tra", path: routeConfig.adminExams },
    { label: "Giám sát", path: routeConfig.adminMonitoring },
    { label: "AI giám sát", path: routeConfig.adminProctoringAi },
    { label: "Quản lí người dùng", path: routeConfig.adminUsers },
    { label: "Hồ sơ cá nhân", path: routeConfig.adminProfile },
  ],
  Teacher: [
    { label: "Dashboard", path: routeConfig.teacherDashboard },
    { label: "Lớp học", path: routeConfig.teacherClassrooms },
    { label: "Hoạt động học tập", path: routeConfig.teacherTasks },
    { label: "Ngân hàng câu hỏi", path: routeConfig.teacherQuestionBanks },
    { label: "Giám sát thi", path: routeConfig.teacherMonitoring },
    { label: "Kết quả", path: routeConfig.teacherResults },
    { label: "Hồ sơ", path: routeConfig.teacherProfile },
  ],
  Student: [
    { label: "Lớp của tôi", path: routeConfig.studentClassrooms },
    { label: "Bài kiểm tra", path: routeConfig.studentExams },
    { label: "Tham gia lớp", path: routeConfig.studentJoinClassroom },
    { label: "Xem thông báo", path: routeConfig.notifications },
    { label: "Hồ sơ", path: routeConfig.studentProfile },
  ],
};

// Hàm này trả menu điều hướng tương ứng với role đang đăng nhập.
export function getNavigationItemsByRole(role) {
  return ROLE_NAVIGATION_ITEMS[role] ?? ROLE_NAVIGATION_ITEMS.Student;
}

// Hàm này trả route mặc định sau khi user đăng nhập hoặc bị redirect do sai quyền.
export function getDefaultPathByRole(role) {
  if (role === "Admin") {
    return routeConfig.adminDashboard;
  }

  if (role === "Teacher") {
    return routeConfig.teacherDashboard;
  }

  return routeConfig.studentClassrooms;
}

// Hàm này đổi role kỹ thuật sang nhãn tiếng Việt để đưa lên UI cho tự nhiên hơn.
export function getRoleLabel(role) {
  if (role === "Admin") {
    return "Quản trị viên";
  }

  if (role === "Teacher") {
    return "Giảng viên";
  }

  return "Sinh viên";
}

// Hàm này trả route hồ sơ theo role để top bar hoặc page khác có thể dùng lại thống nhất.
export function getProfileRouteByRole(role) {
  return getProfilePathByRole(role);
}
