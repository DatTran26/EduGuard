import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import TextInput from "../../../components/forms/TextInput";
import { toAssignmentDateTimeInputValue } from "../assignmentHelpers";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateNumberField,
  validateRequiredText,
} from "../../../utils/formValidation";

function buildAssignmentFormValues(assignment = null) {
  return {
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    deadline: toAssignmentDateTimeInputValue(assignment?.deadline),
    maxScore: assignment?.maxScore ? String(assignment.maxScore) : "10",
  };
}

export default function AssignmentForm({
  assignment = null,
  isSubmitting = false,
  onCancel = null,
  onSubmitAssignment,
  submitLabel = "Lưu bài tập",
  title = "Thông tin bài tập",
}) {
  const [formValues, setFormValues] = useState(() => buildAssignmentFormValues(assignment));
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

  function validateFormValues() {
    return {
      title: validateRequiredText(formValues.title, "Tiêu đề bài tập không được để trống."),
      deadline: validateRequiredText(formValues.deadline, "Hạn nộp không được để trống."),
      maxScore: validateNumberField(formValues.maxScore, {
        requiredMessage: "Điểm tối đa không được để trống.",
        invalidMessage: "Điểm tối đa phải là số hợp lệ.",
        min: 1,
        minMessage: "Điểm tối đa phải lớn hơn hoặc bằng 1.",
      }),
    };
  }

  function buildSubmitPayload() {
    return {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      deadline: formValues.deadline ? new Date(formValues.deadline).toISOString() : null,
      maxScore: Number(formValues.maxScore),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const shouldReset = await onSubmitAssignment(buildSubmitPayload());

    if (shouldReset && !assignment) {
      setValidationErrors({});
      setFormValues(buildAssignmentFormValues(null));
    }
  }

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <TextInput
          error={validationErrors.title}
          id={`assignment-title-${assignment?.id ?? "create"}`}
          label="Tiêu đề bài tập"
          onChange={(event) => handleFieldChange("title", event.target.value)}
          placeholder="Ví dụ: Bài tập chương 1"
          required
          value={formValues.title}
        />

        <TextInput
          as="textarea"
          id={`assignment-description-${assignment?.id ?? "create"}`}
          label="Nội dung"
          onChange={(event) => handleFieldChange("description", event.target.value)}
          placeholder="Nhập yêu cầu bài tập"
          value={formValues.description}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            error={validationErrors.deadline}
            id={`assignment-deadline-${assignment?.id ?? "create"}`}
            label="Hạn nộp"
            onChange={(event) => handleFieldChange("deadline", event.target.value)}
            required
            type="datetime-local"
            value={formValues.deadline}
          />
          <TextInput
            error={validationErrors.maxScore}
            id={`assignment-max-score-${assignment?.id ?? "create"}`}
            label="Điểm tối đa"
            min="1"
            onChange={(event) => handleFieldChange("maxScore", event.target.value)}
            required
            step="0.5"
            type="number"
            value={formValues.maxScore}
          />
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
