import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCalendar,
  FiRefreshCw,
  FiUsers,
  FiX,
  FiSearch,
  FiActivity,
  FiBookOpen,
  FiClipboard,
} from "react-icons/fi";
import {
  School,
  Users,
  ClipboardCheck,
  NotebookPen,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { dashboardApi } from "../../../api/dashboardApi";
import { classroomApi } from "../../../api/classroomApi";
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

function KPICard({ label, value, icon, tone, to, onClick }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const toneStyles = {
    classes: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-indigo-500 dark:border-l-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-indigo-500/5",
      iconWrapper: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
      value: "text-slate-900 dark:text-slate-50 font-extrabold",
      label: "text-slate-500 dark:text-slate-400 font-bold"
    },
    students: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-violet-500 dark:border-l-violet-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-violet-500/5",
      iconWrapper: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
      value: "text-slate-900 dark:text-slate-50 font-extrabold",
      label: "text-slate-500 dark:text-slate-400 font-bold"
    },
    exams: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-emerald-500/5",
      iconWrapper: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
      value: "text-slate-900 dark:text-slate-50 font-extrabold",
      label: "text-slate-500 dark:text-slate-400 font-bold"
    },
    assignments: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-sky-500 dark:border-l-sky-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-sky-500/5",
      iconWrapper: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300",
      value: "text-slate-900 dark:text-slate-50 font-extrabold",
      label: "text-slate-500 dark:text-slate-400 font-bold"
    },
    submissions: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-amber-500 dark:border-l-amber-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-amber-500/5",
      iconWrapper: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
      value: "text-slate-900 dark:text-slate-50 font-extrabold",
      label: "text-slate-500 dark:text-slate-400 font-bold"
    },
    warnings: {
      card: "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-rose-500 dark:border-l-rose-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 hover:shadow-rose-500/5 animate-pulse-subtle",
      iconWrapper: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300 animate-bounce-subtle",
      value: "text-rose-700 dark:text-rose-400 font-extrabold",
      label: "text-rose-700/80 dark:text-rose-400/80 font-bold"
    }
  };

  const currentStyle = toneStyles[tone] || toneStyles.classes;

  return (
    <div 
      onClick={handleClick}
      className={`group cursor-pointer flex flex-col justify-between p-3.5 border rounded-2xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg min-w-0 ${currentStyle.card}`}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider select-none truncate mt-0.5 ${currentStyle.label}`}>
          {label}
        </span>
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${currentStyle.iconWrapper}`}>
          {icon}
        </span>
      </div>
      <div className="mt-1 flex justify-center items-center min-w-0">
        <span className={`text-2xl font-extrabold tracking-tight whitespace-nowrap ${currentStyle.value}`}>
          {value}
        </span>
      </div>
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
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalStudents, setModalStudents] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const handleOpenStudentModal = useCallback(async () => {
    setIsStudentModalOpen(true);
    setIsModalLoading(true);
    setStudentSearchQuery("");
    try {
      const classroomsRes = await classroomApi.getAll();
      const classrooms = classroomsRes.data || [];

      const memberPromises = classrooms.map(async (cls) => {
        try {
          const membersRes = await classroomApi.getMembers(cls.id);
          return {
            classroomName: cls.name,
            members: membersRes.data || [],
          };
        } catch {
          return { classroomName: cls.name, members: [] };
        }
      });

      const classroomsWithMembers = await Promise.all(memberPromises);
      const studentMap = new Map();

      classroomsWithMembers.forEach(({ classroomName, members }) => {
        members.forEach((m) => {
          const isStudent = m.role === "Sinh viên" || m.role === "Student" || !m.role;
          if (isStudent && m.status !== "Removed") {
            const key = m.studentId || m.email || m.fullName;
            if (studentMap.has(key)) {
              const existing = studentMap.get(key);
              if (!existing.classrooms.includes(classroomName)) {
                existing.classrooms.push(classroomName);
              }
            } else {
              studentMap.set(key, {
                studentId: m.studentId,
                fullName: m.fullName,
                email: m.email,
                classrooms: [classroomName],
              });
            }
          }
        });
      });

      setModalStudents(Array.from(studentMap.values()));
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Lỗi tải danh sách sinh viên",
        message: "Không thể lấy thông tin sinh viên từ các lớp học.",
      });
    } finally {
      setIsModalLoading(false);
    }
  }, [showToast]);

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
      label: "Lớp quản lí",
      value: summary.managedClassrooms,
      icon: <School className="h-4.5 w-4.5" />,
      tone: "classes",
      to: routeConfig.teacherClassrooms,
    },
    {
      label: "Tổng sinh viên",
      value: summary.totalStudents,
      icon: <Users className="h-4.5 w-4.5" />,
      tone: "students",
      onClick: handleOpenStudentModal,
    },
    {
      label: "Bài kiểm tra",
      value: summary.totalExams,
      icon: <ClipboardCheck className="h-4.5 w-4.5" />,
      tone: "exams",
      to: buildTeacherTasksPath("exam"),
    },
    {
      label: "Bài tập",
      value: summary.totalAssignments,
      icon: <NotebookPen className="h-4.5 w-4.5" />,
      tone: "assignments",
      to: buildTeacherTasksPath("assignment"),
    },
    {
      label: "Tỉ lệ nộp bài",
      value: `${summary.submissionRate}%`,
      icon: <TrendingUp className="h-4.5 w-4.5" />,
      tone: "submissions",
      to: routeConfig.teacherResults,
    },
    {
      label: "Cảnh báo",
      value: totalWarnings,
      icon: <ShieldAlert className="h-4.5 w-4.5" />,
      tone: "warnings",
      to: routeConfig.teacherMonitoring,
    },
  ];

  const filteredModalStudents = modalStudents.filter((s) => {
    const q = studentSearchQuery.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  function renderStudentModal() {
    if (!isStudentModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-fadeIn">
        {/* Backdrop click to close */}
        <div className="absolute inset-0 bg-transparent" onClick={() => setIsStudentModalOpen(false)} />

        {/* Modal Box */}
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-primary">Danh sách sinh viên</h3>
              <p className="text-xs text-secondary mt-0.5">
                {isModalLoading
                  ? "Đang tải dữ liệu sinh viên..."
                  : `Tổng cộng ${modalStudents.length} sinh viên tham gia các lớp bạn quản lý.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Search bar */}
          {!isModalLoading && modalStudents.length > 0 && (
            <div className="px-5 pt-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FiSearch className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm sinh viên theo tên hoặc email..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-primary transition-all"
                />
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {isModalLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <FiRefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-secondary animate-pulse">Đang tải và tổng hợp dữ liệu sinh viên...</p>
              </div>
            ) : filteredModalStudents.length === 0 ? (
              <div className="text-center py-12 text-secondary">
                {modalStudents.length === 0
                  ? "Chưa có sinh viên nào tham gia các lớp học của bạn."
                  : "Không tìm thấy sinh viên phù hợp với từ khóa."}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold text-secondary uppercase tracking-wider">
                      <th className="p-3 pl-4">Họ và tên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 pr-4">Lớp học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {filteredModalStudents.map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30 text-primary">
                        <td className="p-3 pl-4 font-semibold whitespace-nowrap">{student.fullName}</td>
                        <td className="p-3 text-secondary text-xs break-all">{student.email || "—"}</td>
                        <td className="p-3 pr-4">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {student.classrooms.map((cName, cIdx) => (
                              <Badge key={cIdx} variant="neutral" className="text-[10px] py-0.5 px-1.5 font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-800 border-none text-slate-600 dark:text-slate-300">
                                {cName}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button onClick={() => setIsStudentModalOpen(false)} variant="neutral" className="px-4 py-2 text-sm rounded-xl">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            to={kpi.to}
            onClick={kpi.onClick}
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

      {renderStudentModal()}
    </div>
  );
}
