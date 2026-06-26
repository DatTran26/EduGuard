import { Link } from "react-router-dom";
import { FiArrowRight, FiClipboard } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import { buildExamDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";

function buildExamStatusMeta(exam) {
  const myAttemptCount = Number(exam.myAttemptCount ?? exam.studentAttemptCount ?? 0) || 0;
  const myScore =
    typeof exam.latestScore === "number"
      ? exam.latestScore
      : typeof exam.score === "number"
        ? exam.score
        : null;

  if (myAttemptCount > 0 || myScore !== null) {
    return {
      actionLabel: "Xem kết quả",
      actionClassName: "eg-button eg-button-secondary min-w-[128px]",
      label: "Đã thi",
      score: myScore,
      variant: "success",
    };
  }

  if (exam.statusLabel === "Đang mở") {
    return {
      actionLabel: "Vào thi",
      actionClassName: "eg-button eg-button-primary min-w-[128px]",
      label: "Đang mở",
      score: null,
      variant: "info",
    };
  }

  if (exam.statusLabel === "Sắp mở") {
    return {
      actionLabel: "Chi tiết",
      actionClassName: "eg-button eg-button-secondary min-w-[128px]",
      label: "Sắp mở",
      score: null,
      variant: "caution",
    };
  }

  if (exam.statusLabel === "Đã đóng") {
    return {
      actionLabel: "Chi tiết",
      actionClassName: "eg-button eg-button-secondary min-w-[128px]",
      label: "Hết hạn",
      score: null,
      variant: "danger",
    };
  }

  return {
    actionLabel: "Chi tiết",
    actionClassName: "eg-button eg-button-secondary min-w-[128px]",
    label: "Chưa thi",
    score: null,
    variant: "neutral",
  };
}

export default function StudentExamCard({ exam }) {
  const detailPath = buildExamDetailPathByRole("Student", exam.id);
  const statusMeta = buildExamStatusMeta(exam);
  const durationLabel = `${exam.durationMinutes || 0} phút`;
  const scheduleLabel = exam.startTime ? formatShortDateTime(exam.startTime) : "Chưa đặt lịch";
  const secondaryValue =
    typeof statusMeta.score === "number"
      ? `${statusMeta.score} điểm`
      : scheduleLabel;
  const secondaryTitle = typeof statusMeta.score === "number" ? "Điểm" : "Mở đề";

  return (
    <Card className="group flex h-full flex-col rounded-[24px] border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-tertiary/25">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-info-muted text-info transition-colors duration-200 group-hover:bg-surface-sunken">
          <FiClipboard className="h-[18px] w-[18px]" />
        </span>
        <Badge className="whitespace-nowrap" variant={statusMeta.variant}>
          {statusMeta.label}
        </Badge>
      </div>

      <div className="mt-4 min-w-0 space-y-1.5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
          {exam.classroomName}
        </p>
        <h3 className="truncate text-lg font-semibold text-primary" title={exam.title}>
          {exam.title}
        </h3>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-border bg-surface-sunken px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Thời lượng</p>
          <p className="mt-1 truncate text-sm font-semibold text-primary">{durationLabel}</p>
        </div>
        <div className="rounded-[18px] border border-border bg-surface-sunken px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{secondaryTitle}</p>
          <p className="mt-1 truncate text-sm font-semibold text-primary" title={secondaryValue}>
            {secondaryValue}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Link className={statusMeta.actionClassName} to={detailPath}>
          <span>{statusMeta.actionLabel}</span>
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
