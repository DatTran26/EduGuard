import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateNumberField,
  validateRequiredText,
} from "../../../utils/formValidation";
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
  showDescriptions = true,
  submitLabel = "Lưu câu hỏi",
  title = "Câu hỏi mới",
}) {
  const [formValues, setFormValues] = useState(() =>
    buildQuestionFormValues(question, defaultOrderIndex),
  );
  const [validationErrors, setValidationErrors] = useState({});

  function handleFieldChange(fieldName, value) {
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: "",
    }));
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  function handleQuestionTypeChange(nextQuestionType) {
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      answers: [],
      answersGroup: "",
    }));
    setFormValues((previousValues) => ({
      ...previousValues,
      questionType: nextQuestionType,
      answers: buildDefaultAnswerValues(nextQuestionType),
    }));
  }

  function handleAnswerFieldChange(answerIndex, fieldName, value) {
    setValidationErrors((previousErrors) => {
      const nextErrors = {
        ...previousErrors,
      };

      if (fieldName === "content" && Array.isArray(nextErrors.answers)) {
        nextErrors.answers = [...nextErrors.answers];
        nextErrors.answers[answerIndex] = "";
      }

      if (fieldName === "isCorrect") {
        nextErrors.answersGroup = "";
      }

      return nextErrors;
    });
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
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      answersGroup: "",
    }));
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: previousValues.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === answerIndex,
      })),
    }));
  }

  function handleAddAnswer() {
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      answersGroup: "",
    }));
    setFormValues((previousValues) => ({
      ...previousValues,
      answers: [...previousValues.answers, buildAnswerFormValue()],
    }));
  }

  function handleRemoveAnswer(answerIndex) {
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      answers: [],
      answersGroup: "",
    }));
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

  function validateFormValues() {
    const isShortAnswer = isShortAnswerQuestion(formValues.questionType);
    const supportsMultipleCorrect = allowsMultipleCorrectAnswers(formValues.questionType);
    const correctAnswerCount = formValues.answers.filter((answer) => answer.isCorrect).length;
    const minimumAnswerCount = getMinimumAnswerCount(formValues.questionType);
    const nextErrors = {
      content: validateRequiredText(formValues.content, "Nội dung câu hỏi không được để trống."),
      score: validateNumberField(formValues.score, {
        requiredMessage: "Điểm không được để trống.",
        invalidMessage: "Điểm phải là số hợp lệ.",
        min: 0.25,
        minMessage: "Điểm phải lớn hơn hoặc bằng 0.25.",
      }),
      orderIndex: validateNumberField(formValues.orderIndex, {
        requiredMessage: "Thứ tự hiển thị không được để trống.",
        invalidMessage: "Thứ tự hiển thị phải là số hợp lệ.",
        min: 1,
        minMessage: "Thứ tự hiển thị phải lớn hơn hoặc bằng 1.",
        integer: true,
        integerMessage: "Thứ tự hiển thị phải là số nguyên.",
      }),
      answers: formValues.answers.map((answer, index) =>
        validateRequiredText(
          answer.content,
          isShortAnswer
            ? `Đáp án mẫu ${index + 1} không được để trống.`
            : `Đáp án ${index + 1} không được để trống.`,
        ),
      ),
      answersGroup: "",
    };

    if (formValues.answers.length < minimumAnswerCount) {
      nextErrors.answersGroup =
        minimumAnswerCount === 1 ? "Cần ít nhất 1 đáp án mẫu." : "Cần ít nhất 2 đáp án.";
      return nextErrors;
    }

    if (!isShortAnswer) {
      if (supportsMultipleCorrect && correctAnswerCount === 0) {
        nextErrors.answersGroup = "Hãy chọn ít nhất 1 đáp án đúng.";
      }

      if (!supportsMultipleCorrect && correctAnswerCount !== 1) {
        nextErrors.answersGroup = "Hãy chọn đúng 1 đáp án đúng.";
      }
    }

    return nextErrors;
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

    const nextValidationErrors = validateFormValues();
    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const shouldReset = await onSubmitQuestion(buildSubmitPayload());

    if (shouldReset && !question) {
      setValidationErrors({});
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

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <TextInput
          as="textarea"
          error={validationErrors.content}
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
            error={validationErrors.score}
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
            error={validationErrors.orderIndex}
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

        {showDescriptions && questionTypeGuidance ? (
          <div className="rounded-[12px] border border-info/20 bg-info-muted px-4 py-3 text-sm leading-6 text-secondary">
            <p className="font-semibold text-primary">{questionTypeGuidance.title}</p>
            <p className="mt-1">{questionTypeGuidance.description}</p>
          </div>
        ) : null}

        <QuestionFormAnswersSection
          errors={validationErrors}
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
