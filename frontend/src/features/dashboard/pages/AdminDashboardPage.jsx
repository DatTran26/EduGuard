import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBookOpen,
  FiClipboard,
  FiDatabase,
  FiLayers,
  FiServer,
  FiUsers,
  FiWifi,
} from "react-icons/fi";
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

// Mock data cho các section UI mới (không thay đổi backend)
const MOCK_REALTIME = {
  onlineUsers: 47,
  activeExams: 3,
  activeSessions: 124,
};

const MOCK_SYSTEM_HEALTH = [
  { label: "API Server", status: "ok", Icon: FiServer },
  { label: "Redis Cache", status: "ok", Icon: FiDatabase },
  { label: "SignalR Hub", status: "ok", Icon: FiWifi },
  { label: "Database", status: "ok", Icon: FiLayers },
];

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
        <div key={item.id} className="eg-risk-card">
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
      {/* ── Hero Header ── */}
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(59 130 246 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
              Quản trị viên
            </p>
            <PageHeader title="Dashboard quản trị" />
            <p className="text-sm text-secondary">
              Theo dõi toàn hệ thống — người dùng, bài thi, giám sát và hoạt động.
            </p>
          </div>
          <div className="eg-realtime-badge">
            <span className="eg-realtime-dot" aria-hidden="true" />
            Đang hoạt động
          </div>
        </div>
      </div>

      {/* ── Statistic Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Người dùng"
          tone="info"
          value={summary.totalUsers}
          icon={<FiUsers className="h-5 w-5" />}
        />
        <StatCard
          label="Giảng viên"
          tone="neutral"
          value={summary.totalTeachers}
          icon={<FiUsers className="h-5 w-5" />}
        />
        <StatCard
          label="Sinh viên"
          tone="success"
          value={summary.totalStudents}
          icon={<FiUsers className="h-5 w-5" />}
        />
        <StatCard
          label="Lớp học"
          tone="neutral"
          value={summary.totalClassrooms}
          icon={<FiBookOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Bài kiểm tra"
          tone="success"
          value={summary.totalExams}
          icon={<FiClipboard className="h-5 w-5" />}
        />
        <StatCard
          label="Điểm nghi ngờ"
          tone="caution"
          value={summary.totalSuspicionPoints}
          icon={<FiAlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* ── Realtime Monitoring ── */}
      <Card>
        <div className="eg-section-header">
          <div>
            <h3 className="eg-section-title">Giám sát thời gian thực</h3>
            <p className="eg-section-subtitle">Tình trạng hoạt động hiện tại của hệ thống</p>
          </div>
          <div className="eg-realtime-badge">
            <span className="eg-realtime-dot" aria-hidden="true" />
            Live
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[16px] border border-info/20 bg-info-muted p-4 text-center">
            <p className="text-3xl font-bold text-info">{MOCK_REALTIME.onlineUsers}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">Người online</p>
          </div>
          <div className="rounded-[16px] border border-success/20 bg-success-muted p-4 text-center">
            <p className="text-3xl font-bold text-success">{MOCK_REALTIME.activeExams}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">Kỳ thi đang diễn ra</p>
          </div>
          <div className="rounded-[16px] border border-caution/20 bg-caution-muted p-4 text-center">
            <p className="text-3xl font-bold text-caution">{MOCK_REALTIME.activeSessions}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">Phiên hoạt động</p>
          </div>
        </div>
      </Card>

      {/* ── Data grids ── */}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Vai trò người dùng</h3>
          <MetricBarList items={roleDistribution} />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Trạng thái bài kiểm tra</h3>
          <MetricBarList items={buildExamStatusBars(examStatusBreakdown)} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Lớp học</h3>
          <MetricBarList items={buildClassroomOverviewBars(classroomOverview)} />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Lượt làm cần chú ý</h3>
          <HighRiskAttemptList items={highRiskAttempts} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Hoạt động gần đây</h3>
          <TimelineList items={buildActivityTimelineItems(recentActivities)} />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Hành vi anti-cheat</h3>
          <MetricBarList items={cheatingTypes} />
        </Card>
      </div>

      {/* ── System Health ── */}
      <Card>
        <div className="eg-section-header">
          <div>
            <h3 className="eg-section-title">Sức khỏe hệ thống</h3>
            <p className="eg-section-subtitle">Trạng thái các dịch vụ cốt lõi</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MOCK_SYSTEM_HEALTH.map((service) => (
            <div key={service.label} className="eg-system-health-row">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-border bg-surface text-secondary">
                  <service.Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-primary">{service.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "eg-system-health-dot",
                    service.status === "ok"
                      ? "eg-system-health-dot-ok"
                      : service.status === "warn"
                      ? "eg-system-health-dot-warn"
                      : "eg-system-health-dot-err",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-success">
                  {service.status === "ok" ? "Hoạt động" : service.status === "warn" ? "Cảnh báo" : "Lỗi"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
