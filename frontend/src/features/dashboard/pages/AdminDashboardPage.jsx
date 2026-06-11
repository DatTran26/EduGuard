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

// Hàm này đổi dữ liệu activity sang format của TimelineList để admin xem lịch sử thao tác gọn hơn.
function buildActivityTimelineItems(activities) {
  return activities.map((activity) => ({
    id: activity.id,
    title: activity.actorName,
    subtitle: activity.action,
    meta: formatShortDateTime(activity.createdAt),
    description: activity.description,
  }));
}

// Hàm này đổi overview classroom sang format có thanh mức độ để nhìn nhanh lớp nào đang nổi bật.
function buildClassroomOverviewBars(classroomOverview) {
  const maxMemberCount = Math.max(1, ...classroomOverview.map((item) => item.memberCount));

  return classroomOverview.map((item) => ({
    label: item.name,
    value: `${item.memberCount} người`,
    helperText: `${item.assignmentCount} bài tập • ${item.examCount} bài thi`,
    percentage: Math.round((item.memberCount / maxMemberCount) * 100),
  }));
}

// Trang này là dashboard của admin để theo dõi nhanh user, classroom và activity toàn hệ thống.
export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Hàm này tải dữ liệu dashboard admin khi trang vừa mở.
    async function loadDashboard() {
      try {
        const response = await dashboardApi.getAdminDashboard();

        if (!isMounted) {
          return;
        }

        setDashboardData(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải dashboard admin.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải dashboard admin thất bại",
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
        Đang tải dashboard admin...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        title="Chưa tải được dashboard admin."
        description={loadErrorMessage || "Hiện chưa có dữ liệu dashboard admin để hiển thị."}
      />
    );
  }

  const { summary, roleDistribution, classroomOverview, recentActivities, cheatingTypes } = dashboardData;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị viên"
        title="Dashboard hệ thống"
        description="Theo dõi người dùng, lớp học và các hoạt động gần đây trong EduGuard."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Người dùng" value={summary.totalUsers} helperText={`${summary.totalStudents} sinh viên • ${summary.totalTeachers} giảng viên`} tone="info" />
        <StatCard label="Lớp học" value={summary.totalClassrooms} helperText="Tổng lớp đang được lưu trong hệ thống mock" tone="neutral" />
        <StatCard label="Bài kiểm tra" value={summary.totalExams} helperText={`${summary.totalAttempts} lượt làm bài đã ghi nhận`} tone="success" />
        <StatCard label="Điểm nghi ngờ" value={summary.totalSuspicionPoints} helperText="Tổng suspicion point từ các lượt làm bài" tone="caution" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Phân bố vai trò</h3>
          <MetricBarList items={roleDistribution} emptyMessage="Chưa có dữ liệu vai trò." />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Lớp học nổi bật</h3>
          <MetricBarList
            items={buildClassroomOverviewBars(classroomOverview)}
            emptyMessage="Chưa có dữ liệu lớp học."
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Hoạt động gần đây</h3>
          <TimelineList
            items={buildActivityTimelineItems(recentActivities)}
            emptyMessage="Chưa có hoạt động nào được ghi nhận."
          />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Hành vi anti-cheat phổ biến</h3>
          <MetricBarList
            items={cheatingTypes}
            emptyMessage="Chưa có log anti-cheat nào trong hệ thống."
          />
        </Card>
      </div>
    </div>
  );
}
