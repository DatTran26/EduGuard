import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import { QUESTION_TYPE_OPTIONS } from "../examHelpers";
import {
  buildAnswerFormValue,
  getMinimumAnswerCount,
  buildDefaultAnswerValues,
  buildQuestionFormValues,
  getQuestionTypeGuidance,
  isTrueFalseQuestion,
  allowsMultipleCorrectAnswers,
  isShortAnswerQuestion,
} from "./question-form-helpers";
import QuestionFormAnswersSection from "./question-form-answers-section";

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

  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  function handleQuestionTypeChange(nextQuestionType) {
    setFormValues((previousValues) => ({
      ...previousValues,
      questionType: nextQuestionType,
      answers: buildDefaultAnswerValues(nextQuestionType),
    }));
  }

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

  function handleSingleCorrectAnswerChange(answerIndex) {
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: previousValues.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === answerIndex,
      })),
    }));
  }

  function handleAddAnswer() {
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: [...previousValues.answers, buildAnswerFormValue()],
    }));
  }

  function handleRemoveAnswer(answerIndex) {
    setFormValues((previousValues) => {
      if (
        previousValues.answers.length <= getMinimumAnswerCount(previousValues.questionType)
      ) {
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
  const questionTypeGuidance = getQuestionTypeGuidance(formValues.questionType);

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-5" onSubmit={handleSubmit}>
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

        {questionTypeGuidance ? (
          <div className="rounded-[12px] border border-info/20 bg-info-muted px-4 py-3 text-sm leading-6 text-secondary">
            <p className="font-semibold text-primary">{questionTypeGuidance.title}</p>
            <p className="mt-1">{questionTypeGuidance.description}</p>
          </div>
        ) : null}

        <QuestionFormAnswersSection
          formValues={formValues}
          question={question}
          isSubmitting={isSubmitting}
          isTrueFalse={isTrueFalse}
          isShortAnswer={isShortAnswer}
          supportsMultipleCorrect={supportsMultipleCorrect}
          handleAnswerFieldChange={handleAnswerFieldChange}
          handleSingleCorrectAnswerChange={handleSingleCorrectAnswerChange}
          handleRemoveAnswer={handleRemoveAnswer}
          handleAddAnswer={handleAddAnswer}
        />

        <div className="flex flex-wrap gap-3 pt-2">
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
