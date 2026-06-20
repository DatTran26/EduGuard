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
  FiRefreshCw,
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
import { createNotificationConnection } from "../../../signalr/notificationConnection";
import Button from "../../../components/common/Button";

const HEALTH_ICONS = {
  "API Server": FiServer,
  "Redis Cache": FiDatabase,
  "SignalR Hub": FiWifi,
  "Database": FiLayers,
};

function buildActivityTimelineItems(activities) {
  return activities.map((activity) => ({
    id: activity.id,
    title: `${activity.actorName} • ${activity.action}`,
    meta: formatShortDateTime(activity.createdAt),
  }));
}

function buildClassroomOverviewBars(classroomOverview) {
  if (classroomOverview.length === 0) return [];
  const maxMemberCount = Math.max(1, ...classroomOverview.map((item) => item.memberCount));

  return classroomOverview.map((item) => ({
    label: item.name,
    value: `${item.memberCount} người`,
    percentage: Math.round((item.memberCount / maxMemberCount) * 100),
  }));
}

function buildExamStatusBars(examStatusBreakdown) {
  if (examStatusBreakdown.length === 0) return [];
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="h-40 rounded-3xl bg-surface-sunken border border-border p-6 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-border rounded-full" />
          <div className="h-8 w-64 bg-border rounded-full" />
          <div className="h-4 w-96 bg-border rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[120px] rounded-2xl bg-surface border border-border p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-border rounded-full" />
              <div className="h-8 w-8 bg-border rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-border rounded-lg" />
          </div>
        ))}
      </div>

      {/* Realtime Panel Skeleton */}
      <div className="h-[180px] rounded-2xl bg-surface border border-border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-border rounded-full" />
            <div className="h-3 w-72 bg-border rounded-full" />
          </div>
          <div className="h-6 w-16 bg-border rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-20 bg-surface-sunken border border-border rounded-xl" />
          <div className="h-20 bg-surface-sunken border border-border rounded-xl" />
          <div className="h-20 bg-surface-sunken border border-border rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signalrStatus, setSignalrStatus] = useState("ok");
  const { showToast } = useToast();

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getAdminDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu dashboard.");
      showToast({
        tone: "danger",
        title: "Tải dashboard admin thất bại",
        message: err.message || "Không thể tải dashboard admin.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [showToast]);

  useEffect(() => {
    const connection = createNotificationConnection();
    
    connection.start()
      .then(() => {
        setSignalrStatus("ok");
      })
      .catch(() => {
        setSignalrStatus("err");
      });
    
    connection.onreconnecting(() => {
      setSignalrStatus("warn");
    });
    connection.onreconnected(() => {
      setSignalrStatus("ok");
    });
    connection.onclose(() => {
      setSignalrStatus("err");
    });

    return () => {
      connection.stop().catch(() => {});
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border bg-surface rounded-2xl space-y-4">
        <FiAlertTriangle size={48} className="text-danger animate-bounce" />
        <h3 className="text-lg font-bold text-primary">Tải dữ liệu thất bại</h3>
        <p className="text-sm text-secondary max-w-md text-center">
          {error || "Đã xảy ra lỗi không xác định khi tải dữ liệu từ máy chủ."}
        </p>
        <Button onClick={loadDashboard} className="flex items-center gap-2">
          <FiRefreshCw /> Thử lại
        </Button>
      </div>
    );
  }

  const {
    summary,
    roleDistribution,
    examStatusBreakdown,
    classroomOverview,
    highRiskAttempts,
    recentActivities,
    cheatingTypes,
    realtime,
    systemHealth,
  } = dashboardData;

  const healthList = (systemHealth || []).map(item => {
    if (item.label === "SignalR Hub") {
      return { ...item, status: signalrStatus };
    }
    return item;
  });

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
            <p className="text-3xl font-bold text-info">{realtime?.onlineUsers ?? 0}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">Người online</p>
          </div>
          <div className="rounded-[16px] border border-success/20 bg-success-muted p-4 text-center">
            <p className="text-3xl font-bold text-success">{realtime?.activeExams ?? 0}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-secondary">Kỳ thi đang diễn ra</p>
          </div>
          <div className="rounded-[16px] border border-caution/20 bg-caution-muted p-4 text-center">
            <p className="text-3xl font-bold text-caution">{realtime?.activeSessions ?? 0}</p>
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
          {healthList.map((service) => {
            const IconComponent = HEALTH_ICONS[service.label] || FiServer;
            return (
              <div key={service.label} className="eg-system-health-row">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-border bg-surface text-secondary">
                    <IconComponent className="h-4 w-4" />
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
                  <span className={[
                    "text-xs font-semibold",
                    service.status === "ok" ? "text-success" : service.status === "warn" ? "text-caution" : "text-danger"
                  ].join(" ")}>
                    {service.status === "ok" ? "Hoạt động" : service.status === "warn" ? "Cảnh báo" : "Lỗi"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
