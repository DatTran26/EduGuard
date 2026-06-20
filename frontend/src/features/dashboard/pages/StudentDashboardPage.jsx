import { useEffect, useState } from "react";
import { FiBookOpen, FiClipboard, FiAlertTriangle, FiCalendar, FiRefreshCw, FiInfo } from "react-icons/fi";
import { dashboardApi } from "../../../api/dashboardApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import TimelineList from "../../../components/dashboard/TimelineList";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import StatCard from "../../../components/dashboard/StatCard";

function buildUpcomingItems(upcomingItems) {
  return upcomingItems.map((item) => ({
    id: item.id,
    title: item.title,
    meta: `${item.type} • ${formatShortDateTime(item.date)}`,
  }));
}

function ClassProgressList({ items }) {
  if (items.length === 0) {
    return <EmptyState title="Bạn chưa tham gia lớp nào." />;
  }

  return (
    <div className="space-y-4">
      {items.map((classroom) => (
        <div key={classroom.id} className="space-y-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary">{classroom.name}</p>
            <Badge variant="neutral">Thiếu API</Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Tổng số bài tập: {classroom.assignmentCount}</span>
            <span className="flex items-center gap-1">
              Điểm thi: <span className="font-semibold">N/A</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeficiencyNotice({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border bg-surface-sunken rounded-2xl text-center space-y-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
        <FiInfo size={20} />
      </span>
      <p className="text-sm font-bold text-primary">{title}</p>
      <p className="text-xs text-secondary max-w-[280px] leading-relaxed">
        {message}
      </p>
      <Badge variant="info">Yêu cầu API Backend</Badge>
    </div>
  );
}

function StudentDashboardSkeleton() {
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[120px] rounded-2xl bg-surface border border-border p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-border rounded-full" />
              <div className="h-8 w-8 bg-border rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-border rounded-lg" />
          </div>
        ))}
      </div>

      {/* Grid Skeletons */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[250px] rounded-2xl bg-surface border border-border p-6 space-y-4">
          <div className="h-6 w-32 bg-border rounded-full" />
          <div className="space-y-3">
            <div className="h-10 bg-surface-sunken rounded-lg" />
            <div className="h-10 bg-surface-sunken rounded-lg" />
            <div className="h-10 bg-surface-sunken rounded-lg" />
          </div>
        </div>
        <div className="h-[250px] rounded-2xl bg-surface border border-border p-6 space-y-4">
          <div className="h-6 w-32 bg-border rounded-full" />
          <div className="space-y-3">
            <div className="h-10 bg-surface-sunken rounded-lg" />
            <div className="h-10 bg-surface-sunken rounded-lg" />
            <div className="h-10 bg-surface-sunken rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  async function loadDashboard() {
    setIsLoading(true);
    setLoadErrorMessage("");
    try {
      const response = await dashboardApi.getStudentDashboard();
      setDashboardData(response.data);
    } catch (error) {
      const nextMessage = error.message || "Không thể tải dashboard sinh viên.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải dashboard sinh viên thất bại",
        message: nextMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [showToast]);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (loadErrorMessage || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border bg-surface rounded-2xl space-y-4 max-w-[1280px] mx-auto">
        <FiAlertTriangle size={48} className="text-danger animate-bounce" />
        <h3 className="text-lg font-bold text-primary">Tải dữ liệu thất bại</h3>
        <p className="text-sm text-secondary max-w-md text-center">
          {loadErrorMessage || "Đã xảy ra lỗi không xác định khi tải dữ liệu từ máy chủ."}
        </p>
        <Button onClick={loadDashboard} className="flex items-center gap-2">
          <FiRefreshCw /> Thử lại
        </Button>
      </div>
    );
  }

  const { summary, classProgress, upcomingItems } = dashboardData;

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(34 197 94 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <p className="inline-flex rounded-full border border-success/20 bg-success-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-success">
            Sinh viên
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Dashboard cá nhân
          </h1>
          <p className="max-w-xl text-sm leading-6 text-secondary">
            Theo dõi tiến độ học tập, bài tập sắp đến hạn và kết quả thi của bạn.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lớp đã tham gia"
          value={summary.joinedClassrooms}
          tone="info"
          icon={<FiBookOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Bài chưa nộp"
          value={
            <span className="text-sm font-semibold text-secondary">Chưa hỗ trợ API</span>
          }
          tone="neutral"
          icon={<FiClipboard className="h-5 w-5" />}
        />
        <StatCard
          label="Cảnh báo cao"
          value={
            <span className="text-sm font-semibold text-secondary">Chưa hỗ trợ API</span>
          }
          tone="neutral"
          icon={<FiAlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Việc sắp tới"
          value={summary.upcomingItems}
          tone="success"
          icon={<FiCalendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Tiến độ theo lớp</h3>
          <ClassProgressList items={classProgress} />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Việc sắp tới</h3>
          <TimelineList
            items={buildUpcomingItems(upcomingItems)}
            emptyMessage="Hiện chưa có lịch bài tập hay bài kiểm tra nào gần hạn."
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Kết quả gần đây</h3>
          <DeficiencyNotice
            title="Lịch sử thi cử"
            message="Chức năng hiển thị toàn bộ lịch sử thi cử yêu cầu API lấy danh sách Attempt dành riêng cho sinh viên."
          />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Thông báo gần đây</h3>
          <DeficiencyNotice
            title="Kênh thông báo"
            message="Hệ thống thông báo cá nhân yêu cầu bổ sung API Notification lưu trữ trên máy chủ."
          />
        </Card>
      </div>
    </div>
  );
}
