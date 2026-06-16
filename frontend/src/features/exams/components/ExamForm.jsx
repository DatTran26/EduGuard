import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import ExamFormBasicSection from "./exam-form-basic-section";
import ExamFormConfigSection from "./exam-form-config-section";
import {
  calculateEndTimeInputValue,
  buildExamFormValues,
  buildSubmitPayload,
} from "./exam-form-helpers";

// Form này dùng chung cho tạo và sửa đề thi để phần CRUD exam không bị lặp code quá nhiều.
export default function ExamForm({
  classroomOptions = [],
  defaultClassroomId = "",
  exam = null,
  isSubmitting = false,
  onSubmitExam,
  submitLabel = "Lưu bài kiểm tra",
  title = "Thông tin bài kiểm tra",
}) {
  const [formValues, setFormValues] = useState(() =>
    buildExamFormValues(exam, defaultClassroomId),
  );
  const [isEndTimeManuallyEdited, setIsEndTimeManuallyEdited] = useState(false);
  const isEditingExam = Boolean(exam);

  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  function handleDurationChange(value) {
    setFormValues((previousValues) => {
      const nextValues = {
        ...previousValues,
        durationMinutes: value,
      };

      if (!isEndTimeManuallyEdited) {
        const nextEndTime = calculateEndTimeInputValue(
          nextValues.startTime,
          nextValues.durationMinutes,
        );
        nextValues.endTime = nextEndTime || previousValues.endTime;
      }

      return nextValues;
    });
  }

  function handleStartTimeChange(value) {
    setFormValues((previousValues) => {
      const nextValues = {
        ...previousValues,
        startTime: value,
      };

      if (!isEndTimeManuallyEdited) {
        const nextEndTime = calculateEndTimeInputValue(
          nextValues.startTime,
          nextValues.durationMinutes,
        );
        nextValues.endTime = nextEndTime || "";
      }

      return nextValues;
    });
  }

  function handleEndTimeChange(value) {
    setIsEndTimeManuallyEdited(true);
    handleFieldChange("endTime", value);
  }

  function handleSettingChange(settingName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      settings: {
        ...previousValues.settings,
        [settingName]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const shouldReset = await onSubmitExam(buildSubmitPayload(formValues, exam));

    if (shouldReset && !exam) {
      setIsEndTimeManuallyEdited(false);
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

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <ExamFormBasicSection
          formValues={formValues}
          isEditingExam={isEditingExam}
          selectOptions={selectOptions}
          onFieldChange={handleFieldChange}
          onDurationChange={handleDurationChange}
          onStartTimeChange={handleStartTimeChange}
          onEndTimeChange={handleEndTimeChange}
        />

        <ExamFormConfigSection
          formValues={formValues}
          exam={exam}
          isEditingExam={isEditingExam}
          onFieldChange={handleFieldChange}
          onSettingChange={handleSettingChange}
        />

        <div className="pt-2">
          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
