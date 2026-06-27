import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton from "../../../components/common/Skeleton";
import ExamGridCard from "./ExamGridCard";

function ExamGridCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between p-4 rounded-[18px] border border-slate-100 bg-white/70 backdrop-blur-md shadow-sm min-h-[220px] animate-pulse space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-5/6 rounded-md" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
      <div className="flex gap-2 pt-2.5 border-t border-slate-100">
        <Skeleton className="h-7 flex-1 rounded-lg" />
        <Skeleton className="h-7 w-8 rounded-lg" />
      </div>
    </Card>
  );
}

export default function ExamGrid({
  emptyDescription,
  emptyTitle,
  errorMessage,
  isLoading = false,
  onRetry,
  tasks = [],
  onEdit,
  onDelete,
  onPublish,
  onCloseEarly,
  onComposeQuestions,
  onMonitor,
  onViewResults,
  taskActionId = "",
  armedDeleteTaskId = "",
  setArmedDeleteTaskId,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ExamGridCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Không thể tải danh sách bài kiểm tra."
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {tasks.map((task) => (
        <ExamGridCard
          key={`${task.type}-${task.id}`}
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
          onPublish={() => onPublish(task)}
          onCloseEarly={() => onCloseEarly(task)}
          onComposeQuestions={() => onComposeQuestions(task)}
          onMonitor={() => onMonitor(task)}
          onViewResults={() => onViewResults(task)}
          taskActionId={taskActionId}
          armedDeleteTaskId={armedDeleteTaskId}
          setArmedDeleteTaskId={setArmedDeleteTaskId}
        />
      ))}
    </div>
  );
}
