import { useEffect, useState } from "react";
import { dashboardApi } from "../../../api/dashboardApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import StatCard from "../../../components/dashboard/StatCard";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/common/Badge";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  ClassroomPerformanceChart,
  CheatingBreakdownChart,
} from "../components/teacher-dashboard-charts";
import ProctoringStreamsPlaceholder from "../components/proctoring-streams-placeholder";
import Skeleton, { SkeletonStatCard } from "../../../components/common/Skeleton";

export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await dashboardApi.getTeacherDashboard();
        if (!isMounted) return;
        setDashboardData(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) return;
        const nextMessage =
          error.message || "Không thể tải dữ liệu dashboard giảng viên.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải dashboard thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1280px] mx-auto">
        <PageHeader eyebrow="Giảng viên" title="Dashboard giảng dạy" />

        {/* 4 Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Recharts Visualizations */}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="eg-card h-[320px] flex flex-col justify-between p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>

          <div className="eg-card h-[320px] flex flex-col justify-between p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>

        {/* Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="eg-card p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>

          <div className="eg-card p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        title="Chưa tải được dashboard giảng viên"
        description={loadErrorMessage}
      />
    );
  }

  const {
    summary,
    classroomPerformance,
    highRiskStudents,
    upcomingExams,
    cheatingTypes,
  } = dashboardData;

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <PageHeader eyebrow="Giảng viên" title="Dashboard giảng dạy" />

      {/* 4 Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lớp học quản lý"
          value={summary.managedClassrooms}
          tone="info"
        />
        <StatCard
          label="Tổng số sinh viên"
          value={summary.totalStudents}
          tone="neutral"
        />
        <StatCard
          label="Điểm thi trung bình"
          value={`${summary.averageExamScore}/10`}
          tone="success"
        />
        <StatCard
          label="Tỉ lệ nộp bài trung bình"
          value={`${summary.submissionRate}%`}
          tone="caution"
        />
      </div>

      {/* Recharts Visualizations */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Hiệu suất & Tỉ lệ nộp bài theo lớp
            </h3>
            <p className="text-xs text-secondary mt-1">
              Phân tích tương quan giữa tỉ lệ nộp bài và điểm thi trung bình của từng lớp học
            </p>
          </div>
          <ClassroomPerformanceChart data={classroomPerformance} />
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Phân bố hành vi bất thường
            </h3>
            <p className="text-xs text-secondary mt-1">
              Tỷ lệ các cảnh báo anti-cheat được ghi nhận trong các kỳ thi
            </p>
          </div>
          <CheatingBreakdownChart data={cheatingTypes} />
        </Card>
      </div>

      {/* High Risk Students & Upcoming Exams List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* High Risk Students */}
        <Card className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Sinh viên có cảnh báo rủi ro cao
            </h3>
            <p className="text-xs text-secondary mt-1">
              Hệ thống gắn cờ tự động dựa trên tần suất vi phạm quy chế thi
            </p>
          </div>

          {highRiskStudents.length === 0 ? (
            <div className="text-sm text-secondary p-4 text-center border border-dashed border-border rounded-[16px]">
              Chưa có sinh viên nào vượt ngưỡng cảnh báo.
            </div>
          ) : (
            <div className="space-y-3">
              {highRiskStudents.map((student) => {
                const riskLevel =
                  student.totalSuspicion >= 20
                    ? "danger"
                    : student.totalSuspicion >= 10
                    ? "caution"
                    : "info";

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3.5 rounded-[16px] border border-border bg-neutral hover:bg-surface-sunken transition-colors duration-150"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-semibold text-primary truncate">
                        {student.studentName}
                      </p>
                      <p className="text-[11px] text-secondary mt-1 truncate">
                        Bài gần nhất: {student.latestExamTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={riskLevel}>
                        {student.totalSuspicion} điểm rủi ro
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Exams */}
        <Card className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Lịch thi sắp diễn ra
            </h3>
            <p className="text-xs text-secondary mt-1">
              Danh sách các ca thi đã lên lịch của các lớp đang quản lý
            </p>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="text-sm text-secondary p-4 text-center border border-dashed border-border rounded-[16px]">
              Hiện chưa có bài kiểm tra nào sắp diễn ra.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[16px] border border-border bg-neutral hover:bg-surface-sunken transition-colors duration-150"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary truncate">
                      {exam.title}
                    </p>
                    <p className="text-[11px] text-secondary mt-1">
                      {exam.classroomName} • {formatShortDateTime(exam.startTime)} ({exam.durationMinutes} phút)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {exam.enableAntiCheat ? (
                      <Badge variant="caution">Anti-Cheat Bật</Badge>
                    ) : (
                      <Badge variant="neutral">Anti-Cheat Tắt</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Proctoring Streams Placeholder */}
      <ProctoringStreamsPlaceholder />
    </div>
  );
}
