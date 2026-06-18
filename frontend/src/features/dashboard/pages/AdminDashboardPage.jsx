import { useEffect, useState } from "react";
import { dashboardApi } from "../../../api/dashboardApi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import MetricBarList from "../../../components/dashboard/MetricBarList";
import StatCard from "../../../components/dashboard/StatCard";
import TimelineList from "../../../components/dashboard/TimelineList";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";

function buildActivityTimelineItems(activities) {
  return activities.map((activity) => ({
    id: activity.id,
    title: `${activity.actorName} • ${activity.action}`,
    meta: formatShortDateTime(activity.createdAt),
  }));
}

function buildClassroomOverviewBars(classroomOverview) {
  const maxMemberCount = Math.max(1, ...classroomOverview.map((item) => item.memberCount));

  return classroomOverview.map((item) => ({
    label: item.name,
    value: `${item.memberCount} người`,
    percentage: Math.round((item.memberCount / maxMemberCount) * 100),
  }));
}

function buildExamStatusBars(examStatusBreakdown) {
  const maxCount = Math.max(1, ...examStatusBreakdown.map((item) => item.value));

  return examStatusBreakdown.map((item) => ({
    label: item.label,
    value: item.value,
    percentage: Math.round((item.value / maxCount) * 100),
  }));
}

function getAttemptRiskVariant(suspicionScore) {
  if (Number(suspicionScore) >= 10) {
    return "danger";
  }

  if (Number(suspicionScore) >= 5) {
    return "caution";
  }

  return "info";
}

function HighRiskAttemptList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Chưa có lượt làm cần chú ý." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[18px] border border-border bg-neutral p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{item.studentName}</p>
              <p className="mt-1 truncate text-sm text-secondary">{item.examTitle}</p>
            </div>
            <Badge variant={getAttemptRiskVariant(item.suspicionScore)}>{item.suspicionScore} điểm</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
            <span className="rounded-full border border-border bg-surface px-3 py-1">{item.classroomName}</span>
            <span className="rounded-full border border-border bg-surface px-3 py-1">{item.logCount} log</span>
            <span className="rounded-full border border-border bg-surface px-3 py-1">
              {formatShortDateTime(item.submittedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await dashboardApi.getAdminDashboard();

        if (!isMounted) {
          return;
        }

        setDashboardData(response.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "danger",
          title: "Tải dashboard admin thất bại",
          message: error.message || "Không thể tải dashboard admin.",
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
    return <div className="eg-feedback-panel">Đang tải dashboard admin...</div>;
  }

  if (!dashboardData) {
    return <EmptyState title="Chưa tải được dashboard admin." />;
  }

  const {
    summary,
    roleDistribution,
    examStatusBreakdown,
    classroomOverview,
    highRiskAttempts,
    recentActivities,
    cheatingTypes,
  } = dashboardData;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Người dùng" tone="info" value={summary.totalUsers} />
        <StatCard label="Giảng viên" tone="neutral" value={summary.totalTeachers} />
        <StatCard label="Sinh viên" tone="success" value={summary.totalStudents} />
        <StatCard label="Lớp học" tone="neutral" value={summary.totalClassrooms} />
        <StatCard label="Bài kiểm tra" tone="success" value={summary.totalExams} />
        <StatCard label="Điểm nghi ngờ" tone="caution" value={summary.totalSuspicionPoints} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Vai trò</h3>
          <MetricBarList items={roleDistribution} />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Trạng thái bài kiểm tra</h3>
          <MetricBarList items={buildExamStatusBars(examStatusBreakdown)} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Lớp học</h3>
          <MetricBarList items={buildClassroomOverviewBars(classroomOverview)} />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Lượt làm cần chú ý</h3>
          <HighRiskAttemptList items={highRiskAttempts} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Hoạt động gần đây</h3>
          <TimelineList items={buildActivityTimelineItems(recentActivities)} />
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Hành vi anti-cheat</h3>
          <MetricBarList items={cheatingTypes} />
        </Card>
      </div>
    </div>
  );
}
