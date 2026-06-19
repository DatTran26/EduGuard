import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import { getFirstValidationError } from "../../../utils/formValidation";
import ExamFormBasicSection from "./exam-form-basic-section";
import ExamFormConfigSection from "./exam-form-config-section";
import ExamFormMonitoringSection from "./exam-form-monitoring-section";
import ExamFormScheduleSection from "./exam-form-schedule-section";
import {
  buildExamFormValues,
  buildSubmitPayload,
  calculateEndTimeInputValue,
  hasCustomEndTimeForExam,
  validateExamFormValues,
} from "./exam-form-helpers";

function clearErrorField(previousErrors, ...fieldNames) {
  if (!previousErrors || Object.keys(previousErrors).length === 0) {
    return previousErrors;
  }

  const nextErrors = { ...previousErrors };
  fieldNames.forEach((fieldName) => {
    delete nextErrors[fieldName];
  });

  return nextErrors;
}

// Form này dùng chung cho tạo và sửa đề thi để phần CRUD exam không bị lặp code quá nhiều.
export default function ExamForm({
  classroomOptions = [],
  defaultClassroomId = "",
  exam = null,
  isSubmitting = false,
  onSubmitExam,
  showDescriptions = true,
  submitLabel = "Lưu bài kiểm tra",
  title = "Thông tin bài kiểm tra",
}) {
  const [formValues, setFormValues] = useState(() => buildExamFormValues(exam, defaultClassroomId));
  const [isEndTimeManuallyEdited, setIsEndTimeManuallyEdited] = useState(() =>
    hasCustomEndTimeForExam(exam),
  );
  const [validationErrors, setValidationErrors] = useState({});
  const isEditingExam = Boolean(exam);
  const expectedEndTimeValue = calculateEndTimeInputValue(formValues.startTime, formValues.durationMinutes);

  function handleFieldChange(fieldName, value) {
    const nextValues = {
      ...formValues,
      [fieldName]: value,
    };

    setFormValues(nextValues);
    setValidationErrors((previousErrors) => clearErrorField(previousErrors, fieldName));
  }

  function handleDurationChange(value) {
    const nextValues = {
      ...formValues,
      durationMinutes: value,
    };

    if (!isEndTimeManuallyEdited) {
      nextValues.endTime = calculateEndTimeInputValue(nextValues.startTime, nextValues.durationMinutes);
    }

    setFormValues(nextValues);
    setValidationErrors((previousErrors) =>
      clearErrorField(previousErrors, "durationMinutes", "endTime"),
    );
  }

  function handleStartTimeChange(value) {
    const nextValues = {
      ...formValues,
      startTime: value,
    };

    if (!isEndTimeManuallyEdited) {
      nextValues.endTime = calculateEndTimeInputValue(nextValues.startTime, nextValues.durationMinutes);
    }

    setFormValues(nextValues);
    setValidationErrors((previousErrors) => clearErrorField(previousErrors, "endTime"));
  }

  function handleEndTimeChange(value) {
    if (!value) {
      const nextValues = {
        ...formValues,
        endTime: calculateEndTimeInputValue(formValues.startTime, formValues.durationMinutes),
      };

      setIsEndTimeManuallyEdited(false);
      setFormValues(nextValues);
      setValidationErrors((previousErrors) => clearErrorField(previousErrors, "endTime"));
      return;
    }

    setIsEndTimeManuallyEdited(value !== expectedEndTimeValue);
    handleFieldChange("endTime", value);
  }

  function handleSettingChange(settingName, value) {
    const nextValues = {
      ...formValues,
      settings: {
        ...formValues.settings,
        [settingName]: value,
      },
    };

    setFormValues(nextValues);
    setValidationErrors((previousErrors) => {
      if (settingName === "maxAttempts") {
        return clearErrorField(previousErrors, "maxAttempts");
      }

      return previousErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateExamFormValues(formValues);
    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const shouldReset = await onSubmitExam(buildSubmitPayload(formValues));

    if (shouldReset && !exam) {
      setIsEndTimeManuallyEdited(false);
      setValidationErrors({});
      setFormValues(buildExamFormValues(null, defaultClassroomId));
    }
  }

  const selectOptions = [
    { label: "Chọn lớp học", value: "" },
    ...classroomOptions.map((classroom) => ({
      label: classroom.name,
      value: String(classroom.id),
    })),
  ];

  const footerNote = showDescriptions
    ? isEditingExam
      ? exam?.isPublished
        ? "Đề này đã publish. Hãy lưu thay đổi cấu hình trước khi tiếp tục theo dõi phòng thi."
        : "Đề đang ở trạng thái nháp. Sau khi thêm đủ câu hỏi hợp lệ, bạn có thể publish từ trang chi tiết."
      : "Đề mới sẽ được lưu ở trạng thái nháp để bạn tiếp tục hoàn thiện câu hỏi và cấu hình trước khi publish."
    : "";

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <ExamFormBasicSection
          errors={validationErrors}
          formValues={formValues}
          isEditingExam={isEditingExam}
          onFieldChange={handleFieldChange}
          selectOptions={selectOptions}
          showDescriptions={showDescriptions}
        />

        <ExamFormScheduleSection
          errors={validationErrors}
          expectedEndTimeValue={expectedEndTimeValue}
          formValues={formValues}
          isEndTimeManuallyEdited={isEndTimeManuallyEdited}
          onDurationChange={handleDurationChange}
          onEndTimeChange={handleEndTimeChange}
          onStartTimeChange={handleStartTimeChange}
          showDescriptions={showDescriptions}
        />

        <ExamFormConfigSection
          errors={validationErrors}
          formValues={formValues}
          onSettingChange={handleSettingChange}
          showDescriptions={showDescriptions}
        />

        <ExamFormMonitoringSection
          formValues={formValues}
          onFieldChange={handleFieldChange}
          onSettingChange={handleSettingChange}
          showDescriptions={showDescriptions}
        />

        <div className="pt-2">
          {footerNote ? <p className="mb-3 text-sm leading-6 text-secondary">{footerNote}</p> : null}
          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
