import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import { getMinimumAnswerCount } from "./question-form-helpers";

function buildAnswerLabel(index, isShortAnswer) {
  if (isShortAnswer) {
    return `Mẫu ${index + 1}`;
  }

  return String.fromCharCode(65 + index);
}

export default function QuestionFormAnswersSection({
  errors = {},
  formValues,
  isDisabled,
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
      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary">Đáp án</p>
        {errors.answersGroup ? (
          <p className="text-sm font-medium text-danger">{errors.answersGroup}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {formValues.answers.map((answer, index) => (
          <div
            key={answer.id ?? `${formValues.questionType}-${index}`}
            className="rounded-[18px] border border-border bg-neutral p-4"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-semibold tracking-[0.18em] text-secondary">
                  {buildAnswerLabel(index, isShortAnswer)}
                </span>

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
                        disabled={isDisabled}
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
                        disabled={isDisabled}
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
                        isDisabled ||
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

              <TextInput
                disabled={isDisabled}
                error={errors.answers?.[index]}
                id={`question-answer-${question?.id ?? "create"}-${index}`}
                label={isShortAnswer ? `Đáp án mẫu ${index + 1}` : `Nội dung đáp án ${buildAnswerLabel(index, false)}`}
                onChange={(event) =>
                  handleAnswerFieldChange(index, "content", event.target.value)
                }
                placeholder={isShortAnswer ? "Ví dụ: ProtectedRoute" : "Nhập nội dung đáp án"}
                readOnly={isTrueFalse}
                required
                value={answer.content}
              />
            </div>
          </div>
        ))}
      </div>

      {!isTrueFalse ? (
        <Button disabled={isDisabled || isSubmitting} onClick={handleAddAnswer} variant="secondary">
          {isShortAnswer ? "Thêm đáp án mẫu" : "Thêm đáp án"}
        </Button>
      ) : null}
    </div>
  );
}
