import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { getQuestionTypeLabel } from "../examHelpers";

// Hàm này đổi số đáp án đúng thành câu mô tả ngắn để teacher quét nhanh chất lượng câu hỏi.
function getCorrectAnswerSummary(question) {
  if (question.questionType === "ShortAnswer") {
    return `${question.answerCount} đáp án mẫu`;
  }

  return `${question.correctAnswerCount} đáp án đúng`;
}

// Hàm này chọn màu badge cho loại câu hỏi để list câu hỏi đỡ đơn điệu hơn.
function getQuestionTypeBadgeVariant(questionType) {
  if (questionType === "ShortAnswer") {
    return "caution";
  }

  if (questionType === "MultipleChoice") {
    return "info";
  }

  if (questionType === "TrueFalse") {
    return "success";
  }

  return "neutral";
}

// Card này hiển thị một câu hỏi hoàn chỉnh cùng đáp án để teacher/admin theo dõi và chỉnh sửa.
export default function QuestionCard({
  canManage = false,
  canDelete = canManage,
  canEdit = canManage,
  isDeleting = false,
  isEditing = false,
  isExpanded = false,
  onDeleteQuestion,
  onEditQuestion,
  onToggleExpand = null,
  question,
}) {
  const canToggleExpand = typeof onToggleExpand === "function";

  return (
    <Card className={isEditing ? "eg-question-card eg-question-card-active" : "eg-question-card"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {canToggleExpand ? (
          <button
            className="flex min-w-0 flex-1 flex-col items-start gap-3 text-left"
            onClick={onToggleExpand}
            type="button"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Câu {question.orderIndex}</Badge>
              <Badge variant={getQuestionTypeBadgeVariant(question.questionType)}>
                {getQuestionTypeLabel(question.questionType)}
              </Badge>
              <Badge variant="neutral">{question.score} điểm</Badge>
            </div>
            <p className="eg-question-card-preview text-sm leading-6 text-primary">{question.content}</p>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-secondary">
              {question.answerCount} đáp án • {getCorrectAnswerSummary(question)}
            </p>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Câu {question.orderIndex}</Badge>
              <Badge variant={getQuestionTypeBadgeVariant(question.questionType)}>
                {getQuestionTypeLabel(question.questionType)}
              </Badge>
              <Badge variant="neutral">{question.score} điểm</Badge>
            </div>
            <p className="eg-question-card-preview text-sm leading-6 text-primary">{question.content}</p>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-secondary">
              {question.answerCount} đáp án • {getCorrectAnswerSummary(question)}
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {canEdit ? (
            <Button onClick={onEditQuestion} variant={isEditing ? "primary" : "secondary"}>
              {isEditing ? "Đang chỉnh sửa" : "Sửa"}
            </Button>
          ) : null}
          {canDelete ? (
            <Button disabled={isDeleting} onClick={onDeleteQuestion} variant="ghost">
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          ) : null}
          {canToggleExpand ? (
            <Button onClick={onToggleExpand} variant="ghost">
              {isExpanded ? "Thu gọn" : "Xem đáp án"}
            </Button>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {question.answers.map((answer, index) => (
            <div
              key={answer.id ?? `${question.id}-answer-${index + 1}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-neutral px-4 py-3"
            >
              <p className="text-sm leading-6 text-secondary">
                {question.questionType === "ShortAnswer"
                  ? `Mẫu ${index + 1}`
                  : String.fromCharCode(65 + index)}
                . {answer.content}
              </p>
              <Badge variant={answer.isCorrect ? "success" : "neutral"}>
                {answer.isCorrect ? "Đúng" : "Sai"}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
