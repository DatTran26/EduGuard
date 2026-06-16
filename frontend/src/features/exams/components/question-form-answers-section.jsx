import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import { getMinimumAnswerCount } from "./question-form-helpers";

export default function QuestionFormAnswersSection({
  formValues,
  question,
  isSubmitting,
  isTrueFalse,
  isShortAnswer,
  supportsMultipleCorrect,
  handleAnswerFieldChange,
  handleSingleCorrectAnswerChange,
  handleRemoveAnswer,
  handleAddAnswer,
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-primary">Đáp án</p>

      <div className="space-y-3">
        {formValues.answers.map((answer, index) => (
          <div
            key={answer.id ?? `${formValues.questionType}-${index}`}
            className="rounded-[12px] border border-border bg-neutral p-4"
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
                    className="px-4 py-2 min-h-0 text-xs"
                    disabled={
                      isSubmitting ||
                      formValues.answers.length <= getMinimumAnswerCount(formValues.questionType)
                    }
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
  );
}
