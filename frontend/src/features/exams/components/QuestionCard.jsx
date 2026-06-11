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
  isDeleting = false,
  isEditing = false,
  onDeleteQuestion,
  onEditQuestion,
  question,
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Câu {question.orderIndex}</Badge>
            <Badge variant={getQuestionTypeBadgeVariant(question.questionType)}>
              {getQuestionTypeLabel(question.questionType)}
            </Badge>
            <Badge variant="neutral">{question.score} điểm</Badge>
          </div>
          <p className="text-sm leading-6 text-primary">{question.content}</p>
        </div>

        <div className="space-y-2 text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
            {getCorrectAnswerSummary(question)}
          </p>
          {canManage ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={onEditQuestion} variant={isEditing ? "primary" : "secondary"}>
                {isEditing ? "Đang chỉnh sửa" : "Sửa câu hỏi"}
              </Button>
              <Button disabled={isDeleting} onClick={onDeleteQuestion} variant="ghost">
                {isDeleting ? "Đang xóa..." : "Xóa câu hỏi"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <div
            key={answer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-neutral px-4 py-3"
          >
            <p className="text-sm leading-6 text-secondary">
              {question.questionType === "ShortAnswer" ? `Mẫu ${index + 1}` : `Đáp án ${index + 1}`}: {answer.content}
            </p>
            <Badge variant={answer.isCorrect ? "success" : "neutral"}>
              {answer.isCorrect ? "Đúng" : "Sai"}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
