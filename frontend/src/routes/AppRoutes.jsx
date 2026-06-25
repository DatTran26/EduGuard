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
import AdminProctoringAiSettingsPage from "../features/admin/pages/AdminProctoringAiSettingsPage";
import TeacherMonitoringPage from "../features/anti-cheat/pages/TeacherMonitoringPage";
import TeacherAssignmentListPage from "../features/assignments/pages/TeacherAssignmentListPage";
import AdminDashboardPage from "../features/dashboard/pages/AdminDashboardPage";
import TeacherDashboardPage from "../features/dashboard/pages/TeacherDashboardPage";
import ExamAttemptPage from "../features/exam-attempts/pages/ExamAttemptPage";
import ExamLobbyPage from "../features/proctoring/pages/ExamLobbyPage";
import ExamPausedPage from "../features/proctoring/pages/ExamPausedPage";
import StudentDeviceCheckPage from "../features/proctoring/pages/StudentDeviceCheckPage";
import TeacherProctoringRoomPage from "../features/proctoring/pages/TeacherProctoringRoomPage";
import ExamDetailPage from "../features/exams/pages/ExamDetailPage";
import ExamListPage from "../features/exams/pages/ExamListPage";
import TeacherNotificationsPage from "../features/notifications/pages/TeacherNotificationsPage";
import TeacherResultsPage from "../features/results/pages/TeacherResultsPage";
import ProfilePage from "../features/users/pages/ProfilePage";
import UserManagementPage from "../features/users/pages/UserManagementPage";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/common/LoadingScreen";
import { routeConfig } from "./routeConfig";
import { getDefaultPathByRole } from "./roleRoutes";

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
            <Route element={<AdminDashboardPage />} path={routeConfig.adminDashboard} />
            <Route element={<ClassroomListPage />} path={routeConfig.adminClassrooms} />
            <Route element={<ClassroomDetailPage />} path={routeConfig.adminClassroomDetail} />
            <Route element={<ExamListPage />} path={routeConfig.adminExams} />
            <Route element={<ExamDetailPage />} path={routeConfig.adminExamDetail} />
            <Route element={<AdminMonitoringPage />} path={routeConfig.adminMonitoring} />
            <Route element={<AdminProctoringAiSettingsPage />} path={routeConfig.adminProctoringAi} />
            <Route element={<UserManagementPage />} path={routeConfig.adminUsers} />
            <Route element={<ProfilePage />} path={routeConfig.adminProfile} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
            <Route element={<TeacherDashboardPage />} path={routeConfig.teacherDashboard} />
            <Route element={<ClassroomListPage />} path={routeConfig.teacherClassrooms} />
            <Route element={<ClassroomDetailPage />} path={routeConfig.teacherClassroomDetail} />
            <Route element={<TeacherAssignmentListPage />} path={routeConfig.teacherAssignments} />
            <Route element={<ExamListPage />} path={routeConfig.teacherExams} />
            <Route element={<ExamDetailPage />} path={routeConfig.teacherExamDetail} />
            <Route element={<TeacherMonitoringPage />} path={routeConfig.teacherMonitoring} />
            <Route element={<TeacherProctoringRoomPage />} path={routeConfig.teacherProctoring} />
            <Route element={<TeacherResultsPage />} path={routeConfig.teacherResults} />
            <Route element={<TeacherNotificationsPage />} path={routeConfig.teacherNotifications} />
            <Route element={<ProfilePage />} path={routeConfig.teacherProfile} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
            <Route element={<ClassroomListPage />} path={routeConfig.studentClassrooms} />
            <Route element={<JoinClassroomPage />} path={routeConfig.studentJoinClassroom} />
            <Route element={<ClassroomDetailPage />} path={routeConfig.studentClassroomDetail} />
            <Route element={<ExamListPage />} path={routeConfig.studentExams} />
            <Route element={<ExamDetailPage />} path={routeConfig.studentExamDetail} />
            <Route element={<Navigate replace to={routeConfig.studentClassrooms} />} path={routeConfig.studentDashboard} />
            <Route element={<ProfilePage />} path={routeConfig.studentProfile} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route element={<ExamLobbyPage />} path={routeConfig.studentExamLobby} />
        <Route element={<StudentDeviceCheckPage />} path={routeConfig.studentExamDeviceCheck} />
        <Route element={<ExamAttemptPage />} path={routeConfig.studentExamAttempt} />
        <Route element={<ExamPausedPage />} path={routeConfig.studentExamPaused} />
      </Route>

      <Route element={<Navigate replace to={routeConfig.root} />} path="*" />
    </Routes>
  );
}
