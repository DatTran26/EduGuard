import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiUsers,
  FiRefreshCw,
} from "react-icons/fi";
import { dashboardApi } from "../../../api/dashboardApi";
import { buildTeacherTasksPath, routeConfig } from "../../../routes/routeConfig";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Badge from "../../../components/common/Badge";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  ClassroomPerformanceChart,
  ExamStatusBreakdownChart,
  TeacherActivityTrendChart,
} from "../components/teacher-dashboard-charts";
import Skeleton from "../../../components/common/Skeleton";
import Button from "../../../components/common/Button";

function KPICard({ label, value, icon, tone }) {
  const toneStyles = {
    info: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    warning: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    danger: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
    neutral: "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800/30",
  };
  
  const currentStyle = toneStyles[tone] || toneStyles.neutral;
  
  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-border bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border ${currentStyle}`}>
          {icon}
        </span>
        <span className="text-xs font-semibold text-secondary whitespace-nowrap truncate select-none">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-primary whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

const HERO_BACKGROUND_STYLE = {
  backgroundImage:
    "radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 30%), linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-sunken) 46%, var(--color-border-subtle) 100%)",
};

const SUMMARY_CARD_STYLES = {
  info: {
    wrapper: "eg-summary-card eg-exam-summary-card-info",
    icon: <FiBookOpen className="h-5 w-5 text-info" />,
  },
  neutral: {
    wrapper: "eg-summary-card eg-exam-summary-card-neutral",
    icon: <FiUsers className="h-5 w-5 text-secondary" />,
  },
  success: {
    wrapper: "eg-summary-card eg-exam-summary-card-success",
    icon: <FiActivity className="h-5 w-5 text-success" />,
  },
  caution: {
    wrapper: "eg-summary-card eg-exam-summary-card-caution",
    icon: <FiClipboard className="h-5 w-5 text-caution" />,
  },
};

const ACTION_BADGE_COPY = {
  neutral: { variant: "neutral", label: "Bản nháp" },
  info: { variant: "info", label: "Sắp tới" },
  success: { variant: "success", label: "Ổn định" },
  caution: { variant: "caution", label: "Cần nhắc" },
  danger: { variant: "danger", label: "Ưu tiên" },
};

function buildSummaryCards(summary) {
  return [
    {
      label: "Lớp đang quản lý",
      value: summary.managedClassrooms,
      tone: "info",
    },
    {
      label: "Sinh viên đang theo học",
      value: summary.totalStudents,
      tone: "neutral",
    },
    {
      label: "Điểm thi trung bình",
      value: `${summary.averageExamScore}/10`,
      tone: "success",
    },
    {
      label: "Tỉ lệ nộp bài",
      value: `${summary.submissionRate}%`,
      tone: "caution",
    },
  ];
}

function getRiskBadgeVariant(totalSuspicion) {
  if (totalSuspicion >= 20) {
    return "danger";
  }

  if (totalSuspicion >= 10) {
    return "caution";
  }

  return "info";
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  async function loadDashboard() {
    setIsLoading(true);
    setLoadErrorMessage("");
    try {
      const response = await dashboardApi.getTeacherDashboard();
      setDashboardData(response.data);
    } catch (error) {
      const nextMessage = error.message || "Không thể tải dữ liệu dashboard giảng viên.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải dashboard thất bại",
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
    return (
      <div className="mx-auto max-w-[1280px] space-y-6 animate-pulse">
        {/* Title and actions skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>

        {/* Charts grid skeleton */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="eg-card p-6 h-[380px]">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
          <div className="eg-card p-6 h-[380px]">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        </div>

        {/* Bottom performance chart skeleton */}
        <div className="eg-card p-6 h-[360px]">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>

        {/* Bottom grid skeleton */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="eg-card p-6 h-[250px]">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-full rounded-xl mb-3" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="eg-card p-6 h-[250px]">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-full rounded-xl mb-3" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="eg-card p-6 h-[250px]">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-12 w-full rounded-xl mb-3" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
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

  const {
    summary,
    activityTrend,
    examStatusBreakdown,
    classroomPerformance,
    actionItems,
    highRiskStudents,
    upcomingExams,
  } = dashboardData;

  const totalWarnings = activityTrend ? activityTrend.reduce((sum, item) => sum + (item.alertCount || 0), 0) : 0;

  const kpiData = [
    {
      label: "Lớp đang quản lý",
      value: summary.managedClassrooms,
      icon: <FiBookOpen className="h-4 w-4" />,
      tone: "info",
    },
    {
      label: "Sinh viên đang theo học",
      value: summary.totalStudents,
      icon: <FiUsers className="h-4 w-4" />,
      tone: "neutral",
    },
    {
      label: "Bài kiểm tra",
      value: summary.totalExams,
      icon: <FiClipboard className="h-4 w-4" />,
      tone: "success",
    },
    {
      label: "Bài tập",
      value: summary.totalAssignments,
      icon: <FiBookOpen className="h-4 w-4" />,
      tone: "info",
    },
    {
      label: "Tỉ lệ nộp bài",
      value: `${summary.submissionRate}%`,
      icon: <FiActivity className="h-4 w-4" />,
      tone: "warning",
    },
    {
      label: "Cảnh báo bất thường",
      value: totalWarnings,
      icon: <FiAlertTriangle className="h-4 w-4" />,
      tone: "danger",
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      {/* Title & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Dashboard giảng viên
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(buildTeacherTasksPath("assignment", { create: 1 }))}
          >
            Tạo bài tập
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(buildTeacherTasksPath("exam", { create: 1 }))}
          >
            Tạo đề thi
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(routeConfig.teacherClassrooms)}
          >
            Gửi thông báo
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            tone={kpi.tone}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-primary truncate">Hoạt động 7 ngày gần nhất</h3>
          <TeacherActivityTrendChart data={activityTrend} />
        </Card>

        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-primary truncate">Cơ cấu trạng thái bài kiểm tra</h3>
          <ExamStatusBreakdownChart data={examStatusBreakdown} />
        </Card>
      </div>

      {/* Classroom Performance */}
      <Card className="space-y-5">
        <h3 className="text-lg font-semibold text-primary truncate">Hiệu suất theo lớp</h3>
        <ClassroomPerformanceChart data={classroomPerformance} />
      </Card>

      {/* Action Items & Upcoming Lists */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary truncate">Việc cần xử lý</h3>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-danger-muted text-danger">
              <FiAlertTriangle className="h-5 w-5" />
            </span>
          </div>

          <div className="space-y-3">
            {actionItems.map((item) => {
              const badgeCopy = ACTION_BADGE_COPY[item.tone] ?? ACTION_BADGE_COPY.info;

              return (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-border bg-surface-sunken px-4 py-3.5 animate-fadeIn"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-primary truncate">{item.title}</p>
                      <p className="text-xs leading-5 text-secondary truncate">{item.detail}</p>
                    </div>
                    <Badge variant={badgeCopy.variant}>{badgeCopy.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary truncate">Lịch thi sắp diễn ra</h3>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-info-muted text-info">
              <FiCalendar className="h-5 w-5" />
            </span>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-border p-4 text-sm text-secondary">
              Hiện chưa có bài kiểm tra nào sắp diễn ra.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-[18px] border border-border bg-surface-sunken px-4 py-3.5 animate-fadeIn"
                >
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{exam.title}</p>
                    <p className="text-xs leading-5 text-secondary truncate">
                      {exam.classroomName} • {formatShortDateTime(exam.startTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary truncate">Sinh viên cần lưu ý</h3>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-caution-muted text-caution">
              <FiUsers className="h-5 w-5" />
            </span>
          </div>

          {highRiskStudents.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-border p-4 text-sm text-secondary">
              Chưa có sinh viên nào vượt ngưỡng cảnh báo.
            </div>
          ) : (
            <div className="space-y-3">
              {highRiskStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-[18px] border border-border bg-surface-sunken px-4 py-3.5 animate-fadeIn"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-sm font-semibold text-primary">{student.studentName}</p>
                      <p className="truncate text-xs leading-5 text-secondary">
                        Bài gần nhất: {student.latestExamTitle}
                      </p>
                    </div>
                    <Badge variant={getRiskBadgeVariant(student.totalSuspicion)}>
                      {student.totalSuspicion} điểm
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
