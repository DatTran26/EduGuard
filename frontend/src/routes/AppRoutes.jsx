import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicRoute from "../components/layout/PublicRoute";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ClassroomDetailPage from "../features/classrooms/pages/ClassroomDetailPage";
import ClassroomListPage from "../features/classrooms/pages/ClassroomListPage";
import JoinClassroomPage from "../features/classrooms/pages/JoinClassroomPage";
import AdminMonitoringPage from "../features/admin/pages/AdminMonitoringPage";
import TeacherMonitoringPage from "../features/anti-cheat/pages/TeacherMonitoringPage";
import TeacherAssignmentListPage from "../features/assignments/pages/TeacherAssignmentListPage";
import AdminDashboardPage from "../features/dashboard/pages/AdminDashboardPage";
import TeacherDashboardPage from "../features/dashboard/pages/TeacherDashboardPage";
import ExamAttemptPage from "../features/exam-attempts/pages/ExamAttemptPage";
import ExamDetailPage from "../features/exams/pages/ExamDetailPage";
import ExamListPage from "../features/exams/pages/ExamListPage";
import QuestionBankPage from "../features/question-banks/pages/QuestionBankPage";
import TeacherNotificationsPage from "../features/notifications/pages/TeacherNotificationsPage";
import TeacherResultsPage from "../features/results/pages/TeacherResultsPage";
import ProfilePage from "../features/users/pages/ProfilePage";
import UserManagementPage from "../features/users/pages/UserManagementPage";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/common/LoadingScreen";
import { routeConfig } from "./routeConfig";
import { getDefaultPathByRole } from "./roleRoutes";

// Component này xử lý route gốc để người dùng được đưa thẳng về đúng khu vực theo role.
function RootRedirect() {
  const { isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return (
      <LoadingScreen
        title="Đang tải EduGuard"
        message="Đang xác thực phiên và chuyển bạn tới đúng khu vực…"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to={routeConfig.login} />;
  }

  return <Navigate replace to={getDefaultPathByRole(user?.role)} />;
}

// Component này gom toàn bộ route chính của ứng dụng theo từng vai trò sử dụng.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootRedirect />} path={routeConfig.root} />

      <Route element={<PublicRoute />}>
        <Route element={<LoginPage />} path={routeConfig.login} />
        <Route element={<RegisterPage />} path={routeConfig.register} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route
              element={<AdminDashboardPage />}
              path={routeConfig.adminDashboard}
            />
            <Route
              element={<ClassroomListPage />}
              path={routeConfig.adminClassrooms}
            />
            <Route
              element={<ClassroomDetailPage />}
              path={routeConfig.adminClassroomDetail}
            />
            <Route element={<ExamListPage />} path={routeConfig.adminExams} />
            <Route
              element={<ExamDetailPage />}
              path={routeConfig.adminExamDetail}
            />
            <Route
              element={<AdminMonitoringPage />}
              path={routeConfig.adminMonitoring}
            />
            <Route
              element={<UserManagementPage />}
              path={routeConfig.adminUsers}
            />
            <Route element={<ProfilePage />} path={routeConfig.adminProfile} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
            <Route
              element={<TeacherDashboardPage />}
              path={routeConfig.teacherDashboard}
            />
            <Route
              element={<ClassroomListPage />}
              path={routeConfig.teacherClassrooms}
            />
            <Route
              element={<ClassroomDetailPage />}
              path={routeConfig.teacherClassroomDetail}
            />
            <Route
              element={<TeacherAssignmentListPage />}
              path={routeConfig.teacherAssignments}
            />
            <Route element={<ExamListPage />} path={routeConfig.teacherExams} />
            <Route
              element={<QuestionBankPage />}
              path={routeConfig.teacherQuestionBanks}
            />
            <Route
              element={<ExamDetailPage />}
              path={routeConfig.teacherExamDetail}
            />
            <Route
              element={<TeacherMonitoringPage />}
              path={routeConfig.teacherMonitoring}
            />
            <Route
              element={<TeacherResultsPage />}
              path={routeConfig.teacherResults}
            />
            <Route
              element={<TeacherNotificationsPage />}
              path={routeConfig.teacherNotifications}
            />
            <Route element={<ProfilePage />} path={routeConfig.teacherProfile} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
            <Route
              element={<ClassroomListPage />}
              path={routeConfig.studentClassrooms}
            />
            <Route
              element={<JoinClassroomPage />}
              path={routeConfig.studentJoinClassroom}
            />
            <Route
              element={<ClassroomDetailPage />}
              path={routeConfig.studentClassroomDetail}
            />
            <Route element={<ExamListPage />} path={routeConfig.studentExams} />
            <Route
              element={<ExamDetailPage />}
              path={routeConfig.studentExamDetail}
            />
            <Route
              element={<Navigate replace to={routeConfig.studentClassrooms} />}
              path={routeConfig.studentDashboard}
            />
            <Route element={<ProfilePage />} path={routeConfig.studentProfile} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route element={<ExamAttemptPage />} path={routeConfig.studentExamAttempt} />
      </Route>

      <Route element={<Navigate replace to={routeConfig.root} />} path="*" />
    </Routes>
  );
}
