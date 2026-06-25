import { questionBankEnums } from "../../../api/questionBankApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import { QUESTION_TYPE_OPTIONS } from "../../exams/examHelpers";
import { buildDefaultAnswers } from "../question-bank-helpers";

function AnswerEditor({ answers, questionType, onChange }) {
  const isSingleCorrect = questionType === "SingleChoice" || questionType === "TrueFalse";
  const canAddAnswer = questionType !== "TrueFalse";
  const canRemoveAnswer = questionType !== "TrueFalse" && answers.length > 1;

  function updateAnswer(answerIndex, fieldName, value) {
    onChange(
      answers.map((answer, index) => {
        if (index !== answerIndex) {
          return answer;
        }

        return { ...answer, [fieldName]: value };
      }),
    );
  }

  function updateCorrectAnswer(answerIndex, checked) {
    if (isSingleCorrect) {
      onChange(answers.map((answer, index) => ({ ...answer, isCorrect: index === answerIndex })));
      return;
    }

    updateAnswer(answerIndex, "isCorrect", checked);
  }

  function addAnswer() {
    onChange([...answers, { content: "", isCorrect: questionType === "ShortAnswer" }]);
  }

  function removeAnswer(answerIndex) {
    const nextAnswers = answers.filter((_, index) => index !== answerIndex);

    if (isSingleCorrect && nextAnswers.length > 0 && !nextAnswers.some((answer) => answer.isCorrect)) {
      nextAnswers[0] = { ...nextAnswers[0], isCorrect: true };
    }

    onChange(nextAnswers);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Đáp án</p>
        {canAddAnswer ? (
          <Button onClick={addAnswer} variant="secondary">
            Thêm đáp án
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {answers.map((answer, index) => (
          <div key={index} className="grid gap-3 rounded-[16px] border border-border bg-neutral p-3 md:grid-cols-[minmax(0,1fr)_112px_auto]">
            <TextInput
              id={`bank-answer-${index}`}
              label={`Đáp án ${index + 1}`}
              onChange={(event) => updateAnswer(index, "content", event.target.value)}
              value={answer.content}
            />
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-primary">
              <input
                checked={Boolean(answer.isCorrect)}
                className="h-4 w-4 accent-[var(--color-tertiary)]"
                name="bank-question-correct-answer"
                onChange={(event) => updateCorrectAnswer(index, event.target.checked)}
                type={isSingleCorrect ? "radio" : "checkbox"}
              />
              Đúng
            </label>
            {canRemoveAnswer ? (
              <Button className="self-end" onClick={() => removeAnswer(index)} variant="ghost">
                Xóa
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BankQuestionForm({
  formValues,
  isDisabled = false,
  isSubmitting = false,
  title,
  onChange,
  onReset,
  onSubmit,
}) {
  function updateField(fieldName, value) {
    onChange({ ...formValues, [fieldName]: value });
  }

  function updateQuestionType(nextQuestionType) {
    onChange({
      ...formValues,
      questionType: nextQuestionType,
      answers: buildDefaultAnswers(nextQuestionType),
    });
  }

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">
        {title ?? (formValues.id ? "Sửa câu hỏi bank" : "Thêm câu hỏi vào bank")}
      </h3>

      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput
          as="textarea"
          className="min-h-32"
          id="bank-question-content"
          label="Nội dung câu hỏi"
          onChange={(event) => updateField("content", event.target.value)}
          required
          value={formValues.content}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            id="bank-question-type"
            label="Loại câu"
            onChange={(event) => updateQuestionType(event.target.value)}
            options={QUESTION_TYPE_OPTIONS}
            value={formValues.questionType}
          />
          <Select
            id="bank-question-difficulty"
            label="Độ khó"
            onChange={(event) => updateField("difficulty", event.target.value)}
            options={questionBankEnums.difficultyOptions}
            value={formValues.difficulty}
          />
          <TextInput
            id="bank-question-score"
            label="Điểm mặc định"
            min="0.25"
            onChange={(event) => updateField("defaultScore", event.target.value)}
            step="0.25"
            type="number"
            value={formValues.defaultScore}
          />
          <Select
            id="bank-question-status"
            label="Trạng thái"
            onChange={(event) => updateField("status", event.target.value)}
            options={questionBankEnums.statusOptions}
            value={formValues.status}
          />
          <TextInput id="bank-question-subject" label="Môn" onChange={(event) => updateField("subject", event.target.value)} value={formValues.subject} />
          <TextInput id="bank-question-chapter" label="Chương" onChange={(event) => updateField("chapter", event.target.value)} value={formValues.chapter} />
          <TextInput id="bank-question-lesson" label="Bài" onChange={(event) => updateField("lesson", event.target.value)} value={formValues.lesson} />
          <TextInput id="bank-question-outcome" label="Chuẩn đầu ra" onChange={(event) => updateField("learningOutcome", event.target.value)} value={formValues.learningOutcome} />
        </div>

        <AnswerEditor
          answers={formValues.answers}
          onChange={(answers) => updateField("answers", answers)}
          questionType={formValues.questionType}
        />

        <div className="flex flex-wrap gap-3">
          <Button disabled={isSubmitting || isDisabled} type="submit">
            {isSubmitting ? "Đang lưu..." : formValues.id ? "Cập nhật câu hỏi" : "Thêm câu hỏi"}
          </Button>
          <Button onClick={onReset} variant="secondary">
            Làm mới
          </Button>
        </div>
      </form>
    </Card>
  );
}
