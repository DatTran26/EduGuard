import { 
  FiAlertTriangle, 
  FiClock, 
  FiBookOpen, 
  FiCheckCircle, 
  FiBell, 
  FiArrowRight, 
  FiPlus, 
  FiUsers, 
  FiShield, 
  FiActivity,
  FiCalendar
} from "react-icons/fi";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import { formatShortDate, formatShortDateTime } from "../../../utils/formatDate";

export default function ClassOverviewPanel({
  members,
  assignments,
  submissionsByAssignmentId,
  exams,
  attempts,
  warningCountByExamId,
  notifications,
  onAction,
}) {
  // 1. Calculate Pending Tasks
  const studentCount = members.filter((m) => m.role === "Sinh viên").length;
  const pendingTasks = [];

  // Assignment submissions waiting to be graded
  assignments.forEach((assign) => {
    const subs = submissionsByAssignmentId[assign.id] || [];
    const ungraded = subs.filter((s) => s.score === null || typeof s.score !== "number");
    if (ungraded.length > 0) {
      pendingTasks.push({
        id: `ungraded-${assign.id}`,
        type: "ungraded",
        title: assign.title,
        description: `Có ${ungraded.length} bài nộp đang chờ chấm điểm.`,
        actionLabel: "Chấm điểm",
        onClick: () => onAction("grade-assignment", assign.id),
      });
    }
  });

  // Upcoming Exams
  const now = new Date();
  exams.forEach((exam) => {
    const isUpcoming = exam.statusLabel === "Chưa diễn ra" || new Date(exam.startTime) > now;
    if (isUpcoming) {
      pendingTasks.push({
        id: `upcoming-${exam.id}`,
        type: "upcoming",
        title: exam.title,
        description: `Bài thi sẽ bắt đầu vào ${formatShortDateTime(exam.startTime)}.`,
        actionLabel: "Chi tiết",
        onClick: () => onAction("view-exam", exam.id),
      });
    }
  });

  // Students who haven't submitted yet
  if (studentCount > 0) {
    assignments.forEach((assign) => {
      const isPastDeadline = new Date(assign.deadline) < now;
      if (!isPastDeadline) {
        const subs = submissionsByAssignmentId[assign.id] || [];
        const submittedCount = subs.length;
        const missing = studentCount - submittedCount;
        if (missing > 0) {
          pendingTasks.push({
            id: `missing-${assign.id}`,
            type: "missing",
            title: assign.title,
            description: `Còn ${missing} sinh viên chưa nộp bài (Hạn: ${formatShortDateTime(assign.deadline)}).`,
            actionLabel: "Xem lớp",
            onClick: () => onAction("view-assignments"),
          });
        }
      }
    });
  }

  // Anti-cheat warning alerts
  exams.forEach((exam) => {
    const warnCount = warningCountByExamId[exam.id] || 0;
    if (warnCount > 0) {
      pendingTasks.push({
        id: `warning-${exam.id}`,
        type: "warning",
        title: exam.title,
        description: `Ghi nhận ${warnCount} cảnh báo nghi vấn cần kiểm tra.`,
        actionLabel: "Giám sát",
        onClick: () => onAction("monitor-exam", exam.id),
      });
    }
  });

  // 2. Calculate Recent Activities
  const activities = [];
  assignments.forEach((assign) => {
    activities.push({
      id: `act-assign-${assign.id}`,
      type: "assign",
      text: `Đã tạo bài tập: ${assign.title}`,
      time: new Date(assign.createdAt),
      icon: FiBookOpen,
      iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    });
  });
  exams.forEach((exam) => {
    activities.push({
      id: `act-exam-${exam.id}`,
      type: "exam",
      text: `${exam.isPublished ? "Đã xuất bản" : "Đã tạo nháp"} bài thi: ${exam.title}`,
      time: new Date(exam.updatedAt || exam.createdAt),
      icon: FiShield,
      iconColor: "text-sky-500 bg-sky-50 dark:bg-sky-950/20",
    });
  });
  attempts.forEach((attempt) => {
    activities.push({
      id: `act-attempt-${attempt.id}`,
      type: "attempt",
      text: `Sinh viên ${attempt.studentName} ${attempt.status === "Submitted" ? "đã nộp bài thi" : "bắt đầu thi"}`,
      time: new Date(attempt.submittedAt || attempt.startedAt),
      icon: FiActivity,
      iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    });
  });
  notifications.forEach((notif) => {
    activities.push({
      id: `act-notif-${notif.id}`,
      type: "notification",
      text: `Đã gửi thông báo: "${notif.title}"`,
      time: new Date(notif.createdAt),
      icon: FiBell,
      iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
    });
  });

  const recentActivities = activities
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  // 3. Learning Progress
  const progressItems = assignments.map((assign) => {
    const subs = submissionsByAssignmentId[assign.id] || [];
    const rate = studentCount > 0 ? Math.round((subs.length / studentCount) * 100) : 0;
    return {
      id: assign.id,
      title: assign.title,
      rate,
      submitted: subs.length,
      total: studentCount,
    };
  }).slice(0, 3);

  // Pending Task helpers
  function getTaskStyles(type) {
    switch (type) {
      case "warning":
        return {
          icon: FiAlertTriangle,
          iconClass: "text-red-600 bg-red-50 dark:bg-red-950/30",
          borderClass: "border-red-100 dark:border-red-900/30 hover:border-red-200",
        };
      case "ungraded":
        return {
          icon: FiClock,
          iconClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
          borderClass: "border-amber-100 dark:border-amber-900/30 hover:border-amber-200",
        };
      case "upcoming":
        return {
          icon: FiCalendar,
          iconClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
          borderClass: "border-blue-100 dark:border-blue-900/30 hover:border-blue-200",
        };
      default:
        return {
          icon: FiBookOpen,
          iconClass: "text-slate-600 bg-slate-50 dark:bg-slate-900/30",
          borderClass: "border-slate-100 dark:border-slate-800/30 hover:border-slate-200",
        };
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1.2fr]">
      {/* LEFT COLUMN (60% width) */}
      <div className="space-y-6">
        {/* Việc cần xử lý Card */}
        <Card className="shadow-sm">
          <div className="border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Việc cần xử lý
            </h3>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 mb-3">
                <FiCheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-primary">Không có việc cần xử lý</p>
              <p className="text-xs text-secondary mt-1">Lớp học hiện tại đang ở trạng thái tốt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => {
                const styles = getTaskStyles(task.type);
                const TaskIcon = styles.icon;

                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-4 rounded-xl border p-3.5 transition-all duration-150 ${styles.borderClass}`}
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.iconClass}`}>
                        <TaskIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-secondary">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={task.onClick}
                      className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-surface hover:bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-brand border border-border/80 transition-colors duration-150"
                    >
                      <span>{task.actionLabel}</span>
                      <FiArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Tiến độ học tập Card */}
        <Card className="shadow-sm">
          <div className="border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-primary">
              Tiến độ nộp bài
            </h3>
          </div>

          {progressItems.length === 0 ? (
            <p className="text-sm text-secondary py-4 text-center">Chưa có dữ liệu bài tập nào.</p>
          ) : (
            <div className="space-y-4">
              {progressItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary truncate max-w-[70%]">
                      {item.title}
                    </span>
                    <span className="text-secondary font-medium shrink-0">
                      {item.submitted}/{item.total} nộp ({item.rate}%)
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.rate >= 80 ? "bg-emerald-500" : item.rate >= 50 ? "bg-brand" : "bg-amber-500"
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Hoạt động gần đây Card */}
        <Card className="shadow-sm">
          <div className="border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-primary">
              Hoạt động gần đây
            </h3>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-sm text-secondary py-4 text-center">Chưa có hoạt động nào được ghi nhận.</p>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-border/65">
              {recentActivities.map((act) => {
                const ActIcon = act.icon;
                return (
                  <div key={act.id} className="relative flex items-start gap-3 text-xs">
                    {/* Dot Icon */}
                    <div className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-surface shadow-sm ${act.iconColor}`}>
                      <ActIcon className="h-2.5 w-2.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary leading-tight">
                        {act.text}
                      </p>
                      <p className="mt-1 text-[10px] text-secondary">
                        {formatShortDateTime(act.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* RIGHT COLUMN (40% width) */}
      <div className="space-y-6">
        {/* Thông báo gần đây Card */}
        <Card className="shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-primary">
              Thông báo mới nhất
            </h3>
            <button
              onClick={() => onAction("view-notifications")}
              className="text-xs font-semibold text-brand hover:underline shrink-0"
            >
              Xem tất cả
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs text-secondary">Chưa có thông báo nào được gửi.</p>
              <Button
                variant="secondary"
                onClick={() => onAction("send-notification")}
                className="mt-3 text-xs py-1 px-3"
              >
                Gửi thông báo đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notif) => {
                const typeStyles = {
                  Warning: "text-red-500 border-red-200 bg-red-50/50 dark:bg-red-950/20",
                  Success: "text-emerald-500 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20",
                  Info: "text-blue-500 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20",
                }[notif.type] || "text-blue-500 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20";

                return (
                  <div key={notif.id} className="rounded-xl border border-border/70 p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] ${typeStyles}`}>
                        {notif.type === "Warning" ? "Cảnh báo" : notif.type === "Success" ? "Thành công" : "Thông báo"}
                      </span>
                      <span className="text-[9px] text-secondary">
                        {formatShortDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-primary leading-tight truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-secondary leading-snug line-clamp-2">
                      {notif.content}
                    </p>
                  </div>
                );
              })}

              <Button
                variant="secondary"
                onClick={() => onAction("send-notification")}
                className="w-full text-xs py-2 inline-flex items-center justify-center gap-1 bg-surface border border-border/80 text-primary"
              >
                <FiBell className="h-3.5 w-3.5" />
                <span>Gửi thông báo mới</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Hành động nhanh Card */}
        <Card className="shadow-sm">
          <div className="border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-primary">
              Hành động nhanh
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onAction("create-assignment")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-sunken p-3 text-center transition-colors duration-150 text-primary focus:outline-none"
            >
              <FiPlus className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-primary truncate max-w-full">Tạo bài tập</span>
            </button>

            <button
              onClick={() => onAction("create-exam")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-sunken p-3 text-center transition-colors duration-150 text-primary focus:outline-none"
            >
              <FiPlus className="h-4 w-4 text-sky-500" />
              <span className="font-semibold text-primary truncate max-w-full">Tạo đề thi</span>
            </button>

            <button
              onClick={() => onAction("view-members")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-sunken p-3 text-center transition-colors duration-150 text-primary focus:outline-none"
            >
              <FiUsers className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-primary truncate max-w-full">Xem thành viên</span>
            </button>

            <button
              onClick={() => onAction("send-notification")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-sunken p-3 text-center transition-colors duration-150 text-primary focus:outline-none"
            >
              <FiBell className="h-4 w-4 text-brand" />
              <span className="font-semibold text-primary truncate max-w-full">Gửi thông báo</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
