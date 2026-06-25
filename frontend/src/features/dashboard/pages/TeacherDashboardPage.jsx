import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiUsers,
} from "react-icons/fi";
import { dashboardApi } from "../../../api/dashboardApi";
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
import Skeleton, { SkeletonStatCard } from "../../../components/common/Skeleton";
import { getRoleLabel } from "../../../routes/roleRoutes";

const HERO_BACKGROUND_STYLE = {
  backgroundImage:
    "radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 30%), linear-gradient(135deg, #ffffff 0%, #f8fbff 46%, #eef6ff 100%)",
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

function DashboardHeaderSkeleton() {
  return (
    <div
      className="eg-page-hero p-6 sm:p-8"
      style={HERO_BACKGROUND_STYLE}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
        <div className="space-y-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-[20px]" />
          <Skeleton className="h-20 w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}

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

        if (!isMounted) {
          return;
        }

        setDashboardData(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải dữ liệu dashboard giảng viên.";

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
      <div className="mx-auto max-w-[1280px] space-y-6">
        <DashboardHeaderSkeleton />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="eg-card space-y-4 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-[280px] w-full rounded-[20px]" />
          </div>
          <div className="eg-card space-y-4 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-[280px] w-full rounded-[20px]" />
          </div>
        </div>

        <div className="eg-card space-y-4 p-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[280px] w-full rounded-[20px]" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="eg-card space-y-3 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
          </div>
          <div className="eg-card space-y-3 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
          </div>
          <div className="eg-card space-y-3 p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
            <Skeleton className="h-20 w-full rounded-[18px]" />
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
    activityTrend,
    examStatusBreakdown,
    classroomPerformance,
    actionItems,
    highRiskStudents,
    upcomingExams,
  } = dashboardData;
  const summaryCards = buildSummaryCards(summary);
  const headerPills = [
    {
      label: "Bài kiểm tra",
      value: summary.totalExams,
      icon: <FiClipboard className="h-4 w-4 text-info" />,
    },
    {
      label: "Bài tập",
      value: summary.totalAssignments,
      icon: <FiBookOpen className="h-4 w-4 text-success" />,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div
        className="eg-page-hero p-6 sm:p-8"
        style={HERO_BACKGROUND_STYLE}
      >
        <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-info/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
              {getRoleLabel("Teacher")}
            </p>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.5rem]">
                Dashboard giảng dạy
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-secondary sm:text-[0.95rem]">
                Theo dõi nhanh tiến độ lớp học, trạng thái bài kiểm tra và các tín hiệu cần xử lý.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {headerPills.map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border border-white/75 bg-white/80 p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-secondary">
                    {item.label}
                  </p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-surface-sunken">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const styleConfig = SUMMARY_CARD_STYLES[item.tone] ?? SUMMARY_CARD_STYLES.info;

          return (
            <div key={item.label} className={`${styleConfig.wrapper} min-h-[132px]`}>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div className="space-y-4">
                  <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
                  <p className="text-4xl font-semibold tracking-tight text-primary">{item.value}</p>
                </div>

                <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[16px] border border-white/70 bg-white/70">
                  {styleConfig.icon}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-primary">Hoạt động 7 ngày gần nhất</h3>
            <p className="text-sm text-secondary">
              Biến động số lượt nộp bài thi và số cảnh báo bất thường theo ngày.
            </p>
          </div>
          <TeacherActivityTrendChart data={activityTrend} />
        </Card>

        <Card className="space-y-5">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-primary">Cơ cấu trạng thái bài kiểm tra</h3>
            <p className="text-sm text-secondary">
              Phân bổ nhanh giữa đề nháp, đề sắp mở, đang mở và đã đóng.
            </p>
          </div>
          <ExamStatusBreakdownChart data={examStatusBreakdown} />
        </Card>
      </div>

      <Card className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-primary">Hiệu suất theo lớp</h3>
          <p className="text-sm text-secondary">
            So sánh tỉ lệ nộp bài và điểm trung bình để nhận ra lớp cần hỗ trợ thêm.
          </p>
        </div>
        <ClassroomPerformanceChart data={classroomPerformance} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Việc cần xử lý</h3>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-danger-muted text-danger">
              <FiAlertTriangle className="h-5 w-5" />
            </span>
          </div>

          <div className="space-y-3">
            {actionItems.map((item) => {
              const badgeCopy = ACTION_BADGE_COPY[item.tone] ?? ACTION_BADGE_COPY.info;

              return (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-border bg-neutral px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-primary">{item.title}</p>
                      <p className="text-xs leading-5 text-secondary">{item.detail}</p>
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
            <h3 className="text-lg font-semibold text-primary">Lịch thi sắp diễn ra</h3>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-info-muted text-info">
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
                  className="rounded-[18px] border border-border bg-neutral px-4 py-3.5"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-primary">{exam.title}</p>
                    <p className="text-xs leading-5 text-secondary">
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
            <h3 className="text-lg font-semibold text-primary">Sinh viên cần lưu ý</h3>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-caution-muted text-caution">
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
                  className="rounded-[18px] border border-border bg-neutral px-4 py-3.5"
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
