import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton from "../../../components/common/Skeleton";
import LearningTaskCard from "./LearningTaskCard";

function LearningTaskCardSkeleton() {
  return (
    <Card className="space-y-4 animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="w-full max-w-[420px] space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-6 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-[16px]" />
        ))}
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </Card>
  );
}

export default function LearningTaskList({
  emptyDescription,
  emptyTitle,
  errorMessage,
  getTaskActions,
  isLoading = false,
  onRetry,
  onSelect,
  selectedTaskId = "",
  tasks = [],
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <LearningTaskCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Không thể tải dữ liệu hoạt động học tập."
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
    <div className="space-y-4">
      {tasks.map((task) => (
        <LearningTaskCard
          key={`${task.type}-${task.id}`}
          actions={getTaskActions(task)}
          isSelected={String(selectedTaskId) === String(task.id)}
          onSelect={onSelect}
          task={task}
        />
      ))}
    </div>
  );
}
