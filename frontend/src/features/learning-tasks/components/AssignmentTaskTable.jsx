import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { SkeletonTable } from "../../../components/common/Skeleton";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";

function IconActionButton({
  accentClassName = "",
  children,
  isDisabled = false,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-colors duration-150",
        "hover:bg-surface-sunken hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        accentClassName,
      )}
    >
      {children}
    </button>
  );
}

function AssignmentCountPill({ tone = "neutral", value }) {
  const toneClassName =
    tone === "danger"
      ? "border-danger/15 bg-danger/8 text-danger"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "success"
        ? "border-success/15 bg-success/8 text-success"
        : "border-border bg-surface-sunken text-secondary";

  return (
    <span
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClassName,
      )}
    >
      {value}
    </span>
  );
}

export default function AssignmentTaskTable({
  armedDeleteTaskId = "",
  emptyDescription,
  emptyTitle,
  errorMessage,
  isLoading = false,
  onDelete,
  onEdit,
  onOpenGrading,
  onRetry,
  onSelect,
  selectedTaskId = "",
  tasks = [],
}) {
  if (isLoading) {
    return <SkeletonTable rows={6} cols={6} className="rounded-[24px]" />;
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Không thể tải danh sách bài tập."
        description={errorMessage}
        action={
          <Button onClick={onRetry} variant="secondary">
            Thử lại
          </Button>
        }
      />
    );
  }

  if (tasks.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-left text-[0.78rem] uppercase tracking-[0.14em] text-secondary">
              <th className="px-4 py-3 font-semibold">Tên bài tập</th>
              <th className="px-4 py-3 font-semibold">Tên lớp</th>
              <th className="px-4 py-3 font-semibold">Hạn nộp</th>
              <th className="px-4 py-3 text-center font-semibold">Chưa chấm</th>
              <th className="px-4 py-3 text-center font-semibold">Đã nộp</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const isSelected = String(selectedTaskId) === String(task.id);
              const isDeleteArmed = String(armedDeleteTaskId) === String(task.id);
              const submissionCount = Math.max(Number(task.submissionCount) || 0, 0);
              const totalStudents = Math.max(Number(task.totalStudents) || 0, 0);
              const isSubmissionComplete = totalStudents > 0 && submissionCount >= totalStudents;
              const submissionTone = isSubmissionComplete ? "success" : "warning";

              return (
                <tr
                  key={task.id}
                  className={cn(
                    "border-b border-border/70 transition-colors duration-150 last:border-b-0",
                    isSelected ? "bg-sky-50/80" : "hover:bg-surface-sunken/70",
                  )}
                >
                  <td className="px-4 py-3.5 align-middle">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelect?.(task.id)}
                        className="truncate text-left font-semibold text-primary transition-colors duration-150 hover:text-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <p className="truncate font-medium text-primary" title={task.className}>
                      {task.className}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 align-middle text-secondary">
                    {task.deadline ? formatShortDateTime(task.deadline) : "Chưa đặt hạn nộp"}
                  </td>

                  <td className="px-4 py-3.5 text-center align-middle">
                    <AssignmentCountPill
                      tone={Number(task.ungradedCount) > 0 ? "danger" : "neutral"}
                      value={task.ungradedCount}
                    />
                  </td>

                  <td className="px-4 py-3.5 text-center align-middle">
                    <AssignmentCountPill
                      tone={submissionTone}
                      value={`${submissionCount}/${totalStudents}`}
                    />
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <IconActionButton label="Mở chấm bài" onClick={() => onOpenGrading?.(task)}>
                        <FiEye className="h-4 w-4" />
                      </IconActionButton>
                      <IconActionButton label="Chỉnh sửa bài tập" onClick={() => onEdit?.(task)}>
                        <FiEdit2 className="h-4 w-4" />
                      </IconActionButton>
                      <IconActionButton
                        accentClassName={isDeleteArmed ? "border-danger/20 bg-danger/8 text-danger hover:bg-danger/10 hover:text-danger" : ""}
                        label={isDeleteArmed ? "Xác nhận xóa bài tập" : "Xóa bài tập"}
                        onClick={() => onDelete?.(task)}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </IconActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
