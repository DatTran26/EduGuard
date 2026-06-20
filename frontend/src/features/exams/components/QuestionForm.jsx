import { useEffect, useRef, useState } from "react";
import Badge from "../../../components/common/Badge";
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
  isDisabled = false,
  isDraftMode = false,
  isSubmitting = false,
  onCancel = null,
  onDirtyChange = null,
  onRequestCreateNew = null,
  onRequestReset = null,
  onSubmitQuestion,
  question = null,
  showDescriptions = true,
  submitLabel = "Lưu câu hỏi",
  title = "Câu hỏi mới",
}) {
  const contentInputRef = useRef(null);
  const initialQuestionFormValues = buildQuestionFormValues(question, defaultOrderIndex);
  const [formValues, setFormValues] = useState(() =>
    initialQuestionFormValues,
  );
  const [validationErrors, setValidationErrors] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialQuestionFormValues));

  const isEditMode = Boolean(question);
  const isInteractionDisabled = isSubmitting || isDisabled;
  const isDirty = JSON.stringify(formValues) !== savedSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function focusContentField() {
    window.requestAnimationFrame(() => {
      contentInputRef.current?.focus();
    });
  }

  function resetToNextCreateState() {
    const nextFormValues = buildQuestionFormValues(null, defaultOrderIndex);
    setSavedSnapshot(JSON.stringify(nextFormValues));
    setValidationErrors({});
    setFormValues(nextFormValues);
    focusContentField();
  }

  function handleRequestReset() {
    if (isDirty && !window.confirm("Bạn muốn làm mới form và bỏ các thay đổi chưa lưu?")) {
      return;
    }

    onRequestReset?.();
    resetToNextCreateState();
    setLastSavedAt(null);
  }

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

    if (isDisabled) {
      return;
    }

    const nextValidationErrors = validateFormValues();
    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const submitResult = await onSubmitQuestion(buildSubmitPayload());

    if (!submitResult?.didSave) {
      return;
    }

    setLastSavedAt(new Date());

    if (submitResult.shouldReset && !isEditMode) {
      resetToNextCreateState();
      return;
    }

    setSavedSnapshot(JSON.stringify(formValues));
  }

  const isTrueFalse = isTrueFalseQuestion(formValues.questionType);
  const isShortAnswer = isShortAnswerQuestion(formValues.questionType);
  const supportsMultipleCorrect = allowsMultipleCorrectAnswers(formValues.questionType);
  const questionTypeGuidance = getQuestionTypeGuidance(formValues.questionType);

  const statusLabel = isDisabled
    ? "Lưu đề trước"
    : isSubmitting
    ? isDraftMode
      ? "Đang cập nhật nháp"
      : "Đang lưu"
    : lastSavedAt && !isDirty
      ? isDraftMode
        ? "Đã cập nhật nháp"
        : "Đã lưu"
      : isDirty
        ? isDraftMode
          ? "Chưa cập nhật nháp"
          : "Chưa lưu"
        : isEditMode
          ? isDraftMode
            ? "Đã chọn câu nháp"
            : "Đã chọn câu hỏi"
          : isDraftMode
            ? "Sẵn sàng thêm vào đề"
            : "Sẵn sàng tạo câu mới";

  const modeBadgeLabel = isEditMode
    ? isDraftMode
      ? `Đang chỉnh câu nháp ${question.orderIndex}`
      : `Đang chỉnh sửa câu ${question.orderIndex}`
    : isDraftMode
      ? "Đang soạn câu mới"
      : "Đang tạo câu mới";

  return (
    <Card className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isEditMode ? "info" : "success"}>{modeBadgeLabel}</Badge>
          <Badge variant={isDirty ? "caution" : "neutral"}>{statusLabel}</Badge>
        </div>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <TextInput
          ref={contentInputRef}
          as="textarea"
          className="min-h-40"
          disabled={isInteractionDisabled}
          error={validationErrors.content}
          id={`question-content-${question?.id ?? "create"}`}
          label="Nội dung câu hỏi"
          onChange={(event) => handleFieldChange("content", event.target.value)}
          placeholder="Nhập nội dung câu hỏi"
          required
          value={formValues.content}
        />

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <Select
            disabled={isInteractionDisabled}
            id={`question-type-${question?.id ?? "create"}`}
            label="Loại câu hỏi"
            onChange={(event) => handleQuestionTypeChange(event.target.value)}
            options={QUESTION_TYPE_OPTIONS}
            value={formValues.questionType}
          />
          <TextInput
            disabled={isInteractionDisabled}
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
            disabled={isInteractionDisabled}
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
          isDisabled={isInteractionDisabled}
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

        <div className="eg-question-form-footer space-y-3 pt-2">
          <div className="flex flex-wrap gap-3">
            <Button disabled={isInteractionDisabled} type="submit">
              {isSubmitting ? "Đang lưu..." : submitLabel}
            </Button>

            {isEditMode && onRequestCreateNew ? (
              <Button disabled={isInteractionDisabled} onClick={onRequestCreateNew} variant="secondary">
                Tạo câu mới
              </Button>
            ) : null}

            {!isEditMode ? (
              <Button disabled={isInteractionDisabled} onClick={handleRequestReset} variant="secondary">
                Làm mới form
              </Button>
            ) : null}

            {isEditMode && onCancel ? (
              <Button disabled={isInteractionDisabled} onClick={onCancel} variant="ghost">
                Hủy chỉnh sửa
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Card>
  );
}
