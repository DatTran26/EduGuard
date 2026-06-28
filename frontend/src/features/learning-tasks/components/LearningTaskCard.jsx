import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import { LEARNING_TASK_TYPES } from "../learningTaskMapper";

function getBadgeVariantByTone(tone) {
  if (tone === "success") return "success";
  if (tone === "caution") return "caution";
  if (tone === "danger") return "danger";
  if (tone === "info") return "info";
  return "neutral";
}

function getTaskTypeLabel(type) {
  return type === LEARNING_TASK_TYPES.exam ? "Bài thi" : "Bài tập";
}

function buildMetricItems(task) {
  if (task.type === LEARNING_TASK_TYPES.exam) {
    return [
      { label: "Mở đề", value: formatShortDateTime(task.startTime || task.createdAt) },
      { label: "Đóng đề", value: formatShortDateTime(task.endTime || task.deadline || task.createdAt) },
      { label: "Lượt làm", value: task.attemptCount },
      { label: "Số câu hỏi", value: task.questionCount },
    ];
  }

  return [
    { label: "Hạn nộp", value: formatShortDateTime(task.deadline || task.createdAt) },
    { label: "Đã nộp / lớp", value: `${task.submissionCount} / ${task.totalStudents || 0}` },
    { label: "Chưa chấm", value: task.ungradedCount },
    { label: "Điểm TB", value: typeof task.averageScore === "number" ? task.averageScore : "--" },
  ];
}

export default function LearningTaskCard({ actions = [], isSelected = false, onSelect, task }) {
  const metricItems = buildMetricItems(task);

  function handleSelectCard() {
    onSelect?.(task.id);
  }

  function handleCardKeyDown(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectCard();
    }
  }

  return (
    <Card
      className={cn(
        "space-y-4 border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-100",
        isSelected
          ? "border-sky-200 ring-2 ring-sky-100"
          : "border-border hover:border-sky-100 hover:shadow-sm",
      )}
      aria-label={`Mở workspace cho ${task.title}`}
      onClick={handleSelectCard}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={task.type === LEARNING_TASK_TYPES.exam ? "neutral" : "info"}>
              {getTaskTypeLabel(task.type)}
            </Badge>
            <Badge variant={getBadgeVariantByTone(task.status?.tone)}>
              {task.status?.label || "Không xác định"}
            </Badge>
            <Badge variant="neutral">{task.className}</Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary">{task.title}</h3>
            <p className="mt-1 text-sm text-secondary">
              Tạo lúc {formatShortDateTime(task.createdAt)}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            isSelected
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-border bg-surface-sunken text-secondary",
          )}
        >
          {isSelected ? "Đang xem" : "Chọn xem"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {metricItems.map((item) => (
          <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-4">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.key}
              disabled={Boolean(action.disabled)}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(event);
              }}
              variant={action.variant}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
