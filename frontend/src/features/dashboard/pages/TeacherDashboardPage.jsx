import { useEffect, useState } from "react";
import { dashboardApi } from "../../../api/dashboardApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import MetricBarList from "../../../components/dashboard/MetricBarList";
import StatCard from "../../../components/dashboard/StatCard";
import TimelineList from "../../../components/dashboard/TimelineList";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";

// Hàm này đổi lịch thi sắp tới sang format timeline để giảng viên xem nhanh kế hoạch gần hạn.
function buildUpcomingExamItems(upcomingExams) {
  return upcomingExams.map((exam) => ({
    id: exam.id,
    title: `${exam.title} • ${exam.classroomName}`,
    meta: `${formatShortDateTime(exam.startTime)} • ${exam.durationMinutes} phút`,
  }));
}

// Hàm này đổi classroom performance thành dữ liệu có thanh tiến độ theo submission rate.
function buildPerformanceBars(classroomPerformance) {
  return classroomPerformance.map((item) => ({
    label: item.name,
    value: `${item.submissionRate}%`,
    percentage: item.submissionRate,
  }));
}

// Hàm này đổi danh sách sinh viên rủi ro cao sang format timeline để teacher nắm được người cần chú ý.
function buildRiskStudentItems(highRiskStudents) {
  return highRiskStudents.map((item) => ({
    id: item.id,
    title: `${item.studentName} • ${item.latestExamTitle}`,
    meta: `${item.totalSuspicion} điểm nghi ngờ`,
  }));
}

// Trang này là dashboard của giảng viên với trọng tâm là lớp học, bài nộp, điểm và anti-cheat.
export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Hàm này tải dashboard giảng viên một lần khi mở trang.
    async function loadDashboard() {
      try {
        const response = await dashboardApi.getTeacherDashboard();

        if (!isMounted) {
          return;
        }

        setDashboardData(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải dashboard giảng viên.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải dashboard giảng viên thất bại",
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
      <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
        Đang tải dashboard giảng viên...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        title="Chưa tải được dashboard giảng viên."
        description={loadErrorMessage}
      />
    );
  }

  const { summary, classroomPerformance, highRiskStudents, upcomingExams, cheatingTypes } = dashboardData;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Giảng viên"
        title="Dashboard lớp học"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lớp quản lý" value={summary.managedClassrooms} tone="info" />
        <StatCard label="Sinh viên" value={summary.totalStudents} tone="neutral" />
        <StatCard label="Bài tập" value={summary.totalAssignments} tone="success" />
        <StatCard label="Bài kiểm tra" value={summary.totalExams} tone="caution" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Hiệu suất theo lớp</h3>
          <MetricBarList
            items={buildPerformanceBars(classroomPerformance)}
            emptyMessage="Bạn chưa có lớp học nào để thống kê."
          />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Sinh viên rủi ro cao</h3>
          <TimelineList
            items={buildRiskStudentItems(highRiskStudents)}
            emptyMessage="Chưa có sinh viên nào vượt ngưỡng nghi ngờ."
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Lịch thi sắp tới</h3>
          <TimelineList
            items={buildUpcomingExamItems(upcomingExams)}
            emptyMessage="Hiện chưa có bài kiểm tra nào sắp diễn ra."
          />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Nhóm cảnh báo nổi bật</h3>
          <MetricBarList
            items={cheatingTypes}
            emptyMessage="Chưa có dữ liệu anti-cheat để thống kê."
          />
        </Card>
      </div>
    </div>
  );
}
