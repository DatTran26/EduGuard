import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useAuth } from "../../../hooks/useAuth";
import { buildExamDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getExamStatusVariant } from "../examHelpers";

// Component này là card tóm tắt bài kiểm tra để danh sách exam dễ quét hơn trên cả desktop lẫn mobile.
export default function ExamCard({ exam, isDeleting = false, onDeleteExam }) {
  const { user } = useAuth();
  const averageScoreLabel = typeof exam.averageScore === "number" ? exam.averageScore : "--";
  const canDelete = Boolean(exam.canDelete) && typeof onDeleteExam === "function";

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getExamStatusVariant(exam.statusLabel)}>{exam.statusLabel}</Badge>
          <Badge variant={exam.enableAntiCheat ? "caution" : "neutral"}>
            {exam.enableAntiCheat ? "Anti-cheat bật" : "Anti-cheat tắt"}
          </Badge>
        </div>
        <p className="text-sm text-secondary">{exam.classroomName}</p>
      </div>

      <h3 className="text-xl font-semibold text-primary">{exam.title}</h3>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Thời lượng</p>
          <p className="mt-2 text-sm font-semibold text-primary">{exam.durationMinutes} phút</p>
        </div>
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Câu hỏi</p>
          <p className="mt-2 text-sm font-semibold text-primary">{exam.questionCount} câu</p>
        </div>
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Lượt làm</p>
          <p className="mt-2 text-sm font-semibold text-primary">{exam.attemptCount} lượt</p>
        </div>
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Điểm TB</p>
          <p className="mt-2 text-sm font-semibold text-primary">{averageScoreLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          {exam.startTime ? `Mở đề: ${formatShortDateTime(exam.startTime)}` : "Chưa đặt lịch mở đề"}
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Link
            className="eg-button eg-button-secondary"
            to={buildExamDetailPathByRole(user?.role, exam.id)}
          >
            Xem chi tiết
          </Link>
          {canDelete ? (
            <Button
              disabled={isDeleting}
              onClick={() => onDeleteExam(exam.id, exam.title)}
              variant="danger"
            >
              {isDeleting ? "Đang xóa..." : "Xóa bài kiểm tra"}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
