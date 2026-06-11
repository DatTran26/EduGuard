import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import { QUESTION_TYPE_OPTIONS, getQuestionTypeLabel } from "../examHelpers";

// Hàm này dựng 1 dòng đáp án mặc định để form thêm/sửa câu hỏi có shape ổn định ngay từ đầu.
function buildAnswerFormValue(answer = {}, fallbackContent = "") {
  return {
    id: answer.id ?? null,
    content: answer.content ?? fallbackContent,
    isCorrect: Boolean(answer.isCorrect),
  };
}

// Hàm này trả số đáp án tối thiểu theo từng loại câu hỏi để teacher không xóa quá mức cần thiết.
function getMinimumAnswerCount(questionType) {
  if (questionType === "ShortAnswer") {
    return 1;
  }

  if (questionType === "TrueFalse") {
    return 2;
  }

  return 2;
}

// Hàm này dựng bộ đáp án mặc định phù hợp với loại câu hỏi vừa chọn trên form.
function buildDefaultAnswerValues(questionType) {
  if (questionType === "TrueFalse") {
    return [
      buildAnswerFormValue({ content: "Đúng", isCorrect: true }),
      buildAnswerFormValue({ content: "Sai", isCorrect: false }),
    ];
  }

  if (questionType === "ShortAnswer") {
    return [buildAnswerFormValue()];
  }

  return [buildAnswerFormValue(), buildAnswerFormValue()];
}

// Hàm này dựng state ban đầu cho form từ question hiện có hoặc từ dữ liệu mặc định khi teacher tạo mới.
function buildQuestionFormValues(question = null, defaultOrderIndex = 1) {
  const questionType = question?.questionType ?? "SingleChoice";

  return {
    content: question?.content ?? "",
    orderIndex: question?.orderIndex ? String(question.orderIndex) : String(defaultOrderIndex),
    questionType,
    score: question?.score ? String(question.score) : "1",
    answers:
      question?.answers?.length > 0
        ? question.answers.map((answer) => buildAnswerFormValue(answer))
        : buildDefaultAnswerValues(questionType),
  };
}

// Hàm này trả lời nhanh loại câu hỏi hiện tại có dùng bộ đáp án cố định đúng/sai hay không.
function isTrueFalseQuestion(questionType) {
  return questionType === "TrueFalse";
}

// Hàm này cho biết câu hỏi hiện tại có cho phép chọn nhiều đáp án đúng hay không.
function allowsMultipleCorrectAnswers(questionType) {
  return questionType === "MultipleChoice";
}

// Hàm này cho biết form hiện tại đang nhập đáp án mẫu tự luận thay vì option trắc nghiệm.
function isShortAnswerQuestion(questionType) {
  return questionType === "ShortAnswer";
}

// Hàm này trả copy ngắn cho khu vực đáp án để teacher nhìn là hiểu đang nhập kiểu gì.
function getAnswerSectionCopy(questionType) {
  if (questionType === "ShortAnswer") {
    return "Nhập các đáp án mẫu hoặc từ khóa chấp nhận cho câu tự luận ngắn.";
  }

  if (questionType === "TrueFalse") {
    return "Chỉ cần chọn đáp án đúng, nội dung Đúng/Sai sẽ được cố định theo chuẩn.";
  }

  if (questionType === "MultipleChoice") {
    return "Bạn có thể đánh dấu nhiều đáp án đúng cho câu hỏi này.";
  }

  return "Chọn đúng 1 đáp án đúng trong các lựa chọn bên dưới.";
}

// Form này dùng chung cho cả tạo và sửa câu hỏi để teacher không phải học lại nhiều luồng thao tác khác nhau.
export default function QuestionForm({
  defaultOrderIndex = 1,
  isSubmitting = false,
  onCancel = null,
  onSubmitQuestion,
  question = null,
  submitLabel = "Lưu câu hỏi",
  title = "Câu hỏi mới",
}) {
  const [formValues, setFormValues] = useState(() =>
    buildQuestionFormValues(question, defaultOrderIndex),
  );

  // Hàm này cập nhật field đơn của câu hỏi để phần JSX gọn và dễ đọc hơn.
  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  // Hàm này đổi loại câu hỏi và reset bộ đáp án cho đúng cấu trúc của loại mới.
  function handleQuestionTypeChange(nextQuestionType) {
    setFormValues((previousValues) => ({
      ...previousValues,
      questionType: nextQuestionType,
      answers: buildDefaultAnswerValues(nextQuestionType),
    }));
  }

  // Hàm này cập nhật một field bất kỳ của 1 đáp án trong mảng động.
  function handleAnswerFieldChange(answerIndex, fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: previousValues.answers.map((answer, index) => {
        if (index !== answerIndex) {
          return answer;
        }

        return {
          ...answer,
          [fieldName]: value,
        };
      }),
    }));
  }

  // Hàm này đánh dấu đáp án đúng cho dạng 1 đáp án hoặc đúng/sai để luôn chỉ còn đúng 1 lựa chọn.
  function handleSingleCorrectAnswerChange(answerIndex) {
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: previousValues.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === answerIndex,
      })),
    }));
  }

  // Hàm này thêm 1 dòng đáp án mới ở cuối danh sách cho teacher nhập nhanh hơn.
  function handleAddAnswer() {
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: [...previousValues.answers, buildAnswerFormValue()],
    }));
  }

  // Hàm này xóa 1 đáp án khỏi form nhưng vẫn giữ đủ số lượng tối thiểu theo loại câu hỏi.
  function handleRemoveAnswer(answerIndex) {
    setFormValues((previousValues) => {
      if (previousValues.answers.length <= getMinimumAnswerCount(previousValues.questionType)) {
        return previousValues;
      }

      const nextAnswers = previousValues.answers.filter((_, index) => index !== answerIndex);

      if (
        !allowsMultipleCorrectAnswers(previousValues.questionType) &&
        !isShortAnswerQuestion(previousValues.questionType) &&
        !nextAnswers.some((answer) => answer.isCorrect)
      ) {
        nextAnswers[0] = {
          ...nextAnswers[0],
          isCorrect: true,
        };
      }

      return {
        ...previousValues,
        answers: nextAnswers,
      };
    });
  }

  // Hàm này gom state hiện tại về payload mà examApi.createQuestion / updateQuestion đang cần.
  function buildSubmitPayload() {
    return {
      content: formValues.content.trim(),
      orderIndex: Number(formValues.orderIndex),
      questionType: formValues.questionType,
      score: Number(formValues.score),
      answers: formValues.answers.map((answer) => ({
        id: answer.id,
        content: answer.content.trim(),
        isCorrect: Boolean(answer.isCorrect),
      })),
    };
  }

  // Hàm này submit form câu hỏi cho page cha, sau đó reset lại nếu đang ở chế độ tạo mới.
  async function handleSubmit(event) {
    event.preventDefault();

    const shouldReset = await onSubmitQuestion(buildSubmitPayload());

    if (shouldReset && !question) {
      setFormValues(buildQuestionFormValues(null, defaultOrderIndex));
    }
  }

  const isTrueFalse = isTrueFalseQuestion(formValues.questionType);
  const isShortAnswer = isShortAnswerQuestion(formValues.questionType);
  const supportsMultipleCorrect = allowsMultipleCorrectAnswers(formValues.questionType);

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="text-sm text-secondary">
          {`Loại hiện tại: ${getQuestionTypeLabel(formValues.questionType)}.`}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          as="textarea"
          id={`question-content-${question?.id ?? "create"}`}
          label="Nội dung câu hỏi"
          onChange={(event) => handleFieldChange("content", event.target.value)}
          placeholder="Nhập nội dung câu hỏi"
          required
          value={formValues.content}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Select
            id={`question-type-${question?.id ?? "create"}`}
            label="Loại câu hỏi"
            onChange={(event) => handleQuestionTypeChange(event.target.value)}
            options={QUESTION_TYPE_OPTIONS}
            value={formValues.questionType}
          />
          <TextInput
            id={`question-score-${question?.id ?? "create"}`}
            label="Điểm"
            min="0.25"
            onChange={(event) => handleFieldChange("score", event.target.value)}
            required
            step="0.25"
            type="number"
            value={formValues.score}
          />
          <TextInput
            id={`question-order-${question?.id ?? "create"}`}
            label="Thứ tự hiển thị"
            min="1"
            onChange={(event) => handleFieldChange("orderIndex", event.target.value)}
            required
            step="1"
            type="number"
            value={formValues.orderIndex}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">Đáp án</p>
            <p className="text-sm text-secondary">{getAnswerSectionCopy(formValues.questionType)}</p>
          </div>

          <div className="space-y-3">
            {formValues.answers.map((answer, index) => (
              <div
                key={answer.id ?? `${formValues.questionType}-${index}`}
                className="rounded-[16px] border border-border bg-neutral p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <TextInput
                    id={`question-answer-${question?.id ?? "create"}-${index}`}
                    label={
                      isShortAnswer ? `Đáp án mẫu ${index + 1}` : `Đáp án ${index + 1}`
                    }
                    onChange={(event) =>
                      handleAnswerFieldChange(index, "content", event.target.value)
                    }
                    placeholder={
                      isShortAnswer ? "Ví dụ: ProtectedRoute" : "Nhập nội dung đáp án"
                    }
                    readOnly={isTrueFalse}
                    required
                    value={answer.content}
                  />

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    {isShortAnswer ? (
                      <span className="rounded-full bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                        Được chấp nhận
                      </span>
                    ) : supportsMultipleCorrect ? (
                      <label className="flex items-center gap-2 text-sm text-primary">
                        <input
                          checked={answer.isCorrect}
                          className="h-4 w-4 accent-[var(--color-tertiary)]"
                          onChange={(event) =>
                            handleAnswerFieldChange(index, "isCorrect", event.target.checked)
                          }
                          type="checkbox"
                        />
                        Đúng
                      </label>
                    ) : (
                      <label className="flex items-center gap-2 text-sm text-primary">
                        <input
                          checked={answer.isCorrect}
                          className="h-4 w-4 accent-[var(--color-tertiary)]"
                          name={`correct-answer-${question?.id ?? "create"}`}
                          onChange={() => handleSingleCorrectAnswerChange(index)}
                          type="radio"
                        />
                        Đúng
                      </label>
                    )}

                    {!isTrueFalse ? (
                      <Button
                        className="px-4 py-2"
                        disabled={isSubmitting || formValues.answers.length <= getMinimumAnswerCount(formValues.questionType)}
                        onClick={() => handleRemoveAnswer(index)}
                        variant="ghost"
                      >
                        Xóa đáp án
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isTrueFalse ? (
            <Button disabled={isSubmitting} onClick={handleAddAnswer} variant="secondary">
              {isShortAnswer ? "Thêm đáp án mẫu" : "Thêm đáp án"}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
          {onCancel ? (
            <Button disabled={isSubmitting} onClick={onCancel} variant="secondary">
              Hủy
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
