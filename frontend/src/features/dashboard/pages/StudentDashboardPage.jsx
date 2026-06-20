import { useEffect, useState } from "react";
import { FiBookOpen, FiClipboard, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import { dashboardApi } from "../../../api/dashboardApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import MetricBarList from "../../../components/dashboard/MetricBarList";
import StatCard from "../../../components/dashboard/StatCard";
import TimelineList from "../../../components/dashboard/TimelineList";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";

// Hàm này đổi danh sách việc sắp tới sang timeline để sinh viên nhìn nhanh việc cần làm tiếp theo.
function buildUpcomingItems(upcomingItems) {
  return upcomingItems.map((item) => ({
    id: item.id,
    title: `${item.title} • ${item.classroomName}`,
    meta: formatShortDateTime(item.date),
  }));
}

// Hàm này đổi kết quả gần đây sang timeline để hiển thị điểm và suspicion score gọn hơn.
function buildRecentResultItems(recentResults) {
  return recentResults.map((item) => ({
    id: item.id,
    title: `${item.title} • ${item.classroomName}`,
    meta: `${item.score} điểm • Suspicion ${item.suspicionScore}`,
  }));
}

// Hàm này đổi notification sang timeline để student dashboard không phải tự render lặp nhiều lần.
function buildNotificationItems(notifications) {
  return notifications.map((notification) => ({
    id: notification.id,
    title: `${notification.title} • ${notification.type}`,
    meta: formatShortDateTime(notification.createdAt),
  }));
}

// Hàm này đổi tiến độ từng lớp sang dạng thanh phần trăm để sinh viên dễ nhìn lớp nào còn thiếu việc.
function buildClassProgressBars(classProgress) {
  return classProgress.map((item) => ({
    label: item.name,
    value: `${item.submissionProgress}%`,
    percentage: item.submissionProgress,
  }));
}

// Trang này là dashboard của sinh viên với trọng tâm là bài tập, lịch sắp tới và kết quả cá nhân.
export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Hàm này tải dashboard sinh viên khi trang vừa mở để có dữ liệu tổng quan cá nhân.
    async function loadDashboard() {
      try {
        const response = await dashboardApi.getStudentDashboard();

        if (!isMounted) {
          return;
        }

        setDashboardData(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải dashboard sinh viên.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải dashboard sinh viên thất bại",
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
      <div className="eg-feedback-panel">
        Đang tải dashboard sinh viên...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        title="Chưa tải được dashboard sinh viên."
        description={loadErrorMessage}
      />
    );
  }

  const { summary, classProgress, upcomingItems, recentResults, notifications } = dashboardData;

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
          value={summary.pendingAssignments}
          tone="caution"
          icon={<FiClipboard className="h-5 w-5" />}
        />
        <StatCard
          label="Cảnh báo cao"
          value={summary.warningCount}
          tone="danger"
          icon={<FiAlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Việc sắp tới"
          value={summary.upcomingItems}
          tone="neutral"
          icon={<FiCalendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h3 className="eg-section-title">Tiến độ theo lớp</h3>
          <MetricBarList
            items={buildClassProgressBars(classProgress)}
            emptyMessage="Bạn chưa tham gia lớp nào."
          />
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
          <TimelineList
            items={buildRecentResultItems(recentResults)}
            emptyMessage="Bạn chưa có kết quả bài kiểm tra nào."
          />
        </Card>
        <Card className="space-y-4">
          <h3 className="eg-section-title">Thông báo gần đây</h3>
          <TimelineList
            items={buildNotificationItems(notifications)}
            emptyMessage="Hiện chưa có thông báo mới."
          />
        </Card>
      </div>
    </div>
  );
}
