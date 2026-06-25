import { Link } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiCalendar, FiCheckCircle } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getAssignmentDeadlineMeta } from "../../assignments/assignmentHelpers";

function buildAssignmentStatusMeta(assignment, submission, isOverdue) {
  if (typeof submission?.score === "number") {
    return { label: "Đã chấm", variant: "success" };
  }

  if (submission) {
    return { label: "Chờ chấm", variant: "neutral" };
  }

  if (isOverdue) {
    return { label: "Quá hạn", variant: "danger" };
  }

  if (assignment.deadline) {
    return { label: "Cần nộp", variant: "caution" };
  }

  return { label: "Đang mở", variant: "info" };
}

function buildAssignmentActionMeta(submission, isOverdue) {
  if (typeof submission?.score === "number" || submission) {
    return {
      label: "Xem bài",
      className: "eg-button eg-button-secondary min-w-[128px]",
    };
  }

  if (isOverdue) {
    return {
      label: "Chi tiết",
      className: "eg-button eg-button-secondary min-w-[128px]",
    };
  }

  return {
    label: "Nộp bài",
    className: "eg-button eg-button-primary min-w-[128px]",
  };
}

export default function StudentAssignmentCard({ assignment }) {
  const submission = assignment.mySubmission ?? null;
  const deadlineMeta = getAssignmentDeadlineMeta(assignment);
  const isOverdue = deadlineMeta.label === "Đã hết hạn";
  const classroomPath = buildClassroomDetailPathByRole("Student", assignment.classroomId);
  const detailPath = `${classroomPath}?tab=assignments&assignmentId=${assignment.id}`;
  const statusMeta = buildAssignmentStatusMeta(assignment, submission, isOverdue);
  const actionMeta = buildAssignmentActionMeta(submission, isOverdue);
  const scoreLabel =
    typeof submission?.score === "number"
      ? `${submission.score} / ${assignment.maxScore} điểm`
      : assignment.deadline
        ? formatShortDateTime(assignment.deadline)
        : "Không giới hạn";
  const scoreTitle = typeof submission?.score === "number" ? "Điểm" : "Hạn nộp";
  const supportingLabel = submission
    ? submission.submittedAt
      ? `Đã nộp ${formatShortDateTime(submission.submittedAt)}`
      : "Đã nộp bài"
    : isOverdue
      ? "Đã hết hạn nộp"
      : "Sẵn sàng nộp bài";

  return (
    <Card className="group flex h-full flex-col rounded-[24px] border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-tertiary/25">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-info-muted text-info transition-colors duration-200 group-hover:bg-surface-sunken">
          <FiBookOpen className="h-[18px] w-[18px]" />
        </span>
        <Badge className="whitespace-nowrap" variant={statusMeta.variant}>
          {statusMeta.label}
        </Badge>
      </div>

      <div className="mt-4 min-w-0 space-y-1.5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
          {assignment.classroomName}
        </p>
        <h3 className="truncate text-lg font-semibold text-primary" title={assignment.title}>
          {assignment.title}
        </h3>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-border bg-surface-sunken px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Lớp học</p>
          <p className="mt-1 truncate text-sm font-semibold text-primary" title={assignment.classroomName}>
            {assignment.classroomName}
          </p>
        </div>
        <div className="rounded-[18px] border border-border bg-surface-sunken px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{scoreTitle}</p>
          <p className="mt-1 truncate text-sm font-semibold text-primary" title={scoreLabel}>
            {scoreLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-secondary">
        {typeof submission?.score === "number" ? (
          <FiCheckCircle className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <FiCalendar className="h-4 w-4 shrink-0 text-secondary" />
        )}
        <span className="truncate" title={supportingLabel}>{supportingLabel}</span>
      </div>

      <div className="mt-auto pt-5">
        <Link className={actionMeta.className} to={detailPath}>
          <span>{actionMeta.label}</span>
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
