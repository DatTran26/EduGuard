import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import CheckboxField from "../../../components/forms/CheckboxField";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import { toDateTimeLocalInputValue } from "../examHelpers";

// Hàm này dựng state form từ exam hiện tại hoặc từ classroom mặc định khi teacher đang tạo đề mới.
function buildExamFormValues(exam, defaultClassroomId = "") {
  return {
    classroomId: exam?.classroomId ? String(exam.classroomId) : String(defaultClassroomId || ""),
    description: exam?.description ?? "",
    durationMinutes: exam?.durationMinutes ? String(exam.durationMinutes) : "30",
    enableAntiCheat: Boolean(exam?.enableAntiCheat),
    endTime: toDateTimeLocalInputValue(exam?.endTime),
    isPublished: Boolean(exam?.isPublished),
    settings: {
      maxAttempts: exam?.settings?.maxAttempts ? String(exam.settings.maxAttempts) : "1",
      requireFullscreen: Boolean(exam?.settings?.requireFullscreen),
      showResultAfterSubmit: Boolean(exam?.settings?.showResultAfterSubmit),
      shuffleAnswers: Boolean(exam?.settings?.shuffleAnswers),
      shuffleQuestions: Boolean(exam?.settings?.shuffleQuestions),
    },
    startTime: toDateTimeLocalInputValue(exam?.startTime),
    title: exam?.title ?? "",
  };
}

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
  const [formValues, setFormValues] = useState(() => buildExamFormValues(exam, defaultClassroomId));
  const isEditingExam = Boolean(exam);

  // Hàm này cập nhật một field đơn giản trong form để code phần JSX gọn hơn.
  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  // Hàm này cập nhật nhóm setting boolean/number của exam mà không làm mất các field khác.
  function handleSettingChange(settingName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      settings: {
        ...previousValues.settings,
        [settingName]: value,
      },
    }));
  }

  // Hàm này gom dữ liệu hiện tại về shape mà examApi đang mong đợi.
  function buildSubmitPayload() {
    const shouldPublishAfterSave = Boolean(exam) && !exam.isPublished && Boolean(formValues.isPublished);

    return {
      classroomId: Number(formValues.classroomId),
      description: formValues.description.trim(),
      durationMinutes: Number(formValues.durationMinutes),
      enableAntiCheat: Boolean(formValues.enableAntiCheat),
      endTime: formValues.endTime ? new Date(formValues.endTime).toISOString() : null,
      isPublished: shouldPublishAfterSave,
      settings: {
        maxAttempts: Number(formValues.settings.maxAttempts),
        requireFullscreen: Boolean(formValues.settings.requireFullscreen),
        showResultAfterSubmit: Boolean(formValues.settings.showResultAfterSubmit),
        shuffleAnswers: Boolean(formValues.settings.shuffleAnswers),
        shuffleQuestions: Boolean(formValues.settings.shuffleQuestions),
      },
      startTime: formValues.startTime ? new Date(formValues.startTime).toISOString() : null,
      title: formValues.title.trim(),
    };
  }

  // Hàm này submit dữ liệu exam lên page cha để page tự quyết định create hay update.
  async function handleSubmit(event) {
    event.preventDefault();

    const shouldReset = await onSubmitExam(buildSubmitPayload());

    if (shouldReset && !exam) {
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

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Select
          id="exam-classroom-id"
          label="Lớp học"
          disabled={isEditingExam}
          onChange={(event) => handleFieldChange("classroomId", event.target.value)}
          options={selectOptions}
          required
          value={formValues.classroomId}
        />

        <TextInput
          id="exam-title"
          label="Tiêu đề bài kiểm tra"
          onChange={(event) => handleFieldChange("title", event.target.value)}
          placeholder="Ví dụ: Kiểm tra giữa kỳ UI"
          required
          value={formValues.title}
        />

        <TextInput
          as="textarea"
          id="exam-description"
          label="Mô tả"
          onChange={(event) => handleFieldChange("description", event.target.value)}
          placeholder="Mô tả ngắn về nội dung đề thi"
          value={formValues.description}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            id="exam-duration"
            label="Thời gian làm bài (phút)"
            min="1"
            onChange={(event) => handleFieldChange("durationMinutes", event.target.value)}
            required
            type="number"
            value={formValues.durationMinutes}
          />
          <TextInput
            id="exam-start-time"
            label="Thời gian mở đề"
            onChange={(event) => handleFieldChange("startTime", event.target.value)}
            type="datetime-local"
            value={formValues.startTime}
          />
          <TextInput
            id="exam-end-time"
            label="Thời gian đóng đề"
            onChange={(event) => handleFieldChange("endTime", event.target.value)}
            type="datetime-local"
            value={formValues.endTime}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            id="exam-max-attempts"
            label="Số lần làm tối đa"
            min="1"
            onChange={(event) => handleSettingChange("maxAttempts", event.target.value)}
            required
            type="number"
            value={formValues.settings.maxAttempts}
          />
          {isEditingExam ? (
            <div className="rounded-[16px] border border-border bg-neutral px-4 py-4">
              <p className="text-sm font-semibold text-primary">Trạng thái hiển thị</p>
              {exam?.isPublished ? (
                <p className="mt-2 text-sm text-secondary">Đã publish</p>
              ) : (
                <div className="mt-3">
                  <CheckboxField
                    checked={formValues.isPublished}
                    id="exam-is-published"
                    label="Publish sau khi lưu"
                    onChange={(event) => handleFieldChange("isPublished", event.target.checked)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[16px] border border-border bg-neutral px-4 py-4">
              <p className="text-sm font-semibold text-primary">Trạng thái hiển thị</p>
              <p className="mt-2 text-sm text-secondary">Bản nháp</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary">Cấu hình đề thi</p>
          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxField
              checked={formValues.enableAntiCheat}
              id="exam-enable-anti-cheat"
              label="Bật anti-cheat"
              onChange={(event) => handleFieldChange("enableAntiCheat", event.target.checked)}
            />
            <CheckboxField
              checked={formValues.settings.requireFullscreen}
              id="exam-require-fullscreen"
              label="Yêu cầu fullscreen"
              onChange={(event) => handleSettingChange("requireFullscreen", event.target.checked)}
            />
            <CheckboxField
              checked={formValues.settings.shuffleQuestions}
              id="exam-shuffle-questions"
              label="Random câu hỏi"
              onChange={(event) => handleSettingChange("shuffleQuestions", event.target.checked)}
            />
            <CheckboxField
              checked={formValues.settings.shuffleAnswers}
              id="exam-shuffle-answers"
              label="Random đáp án"
              onChange={(event) => handleSettingChange("shuffleAnswers", event.target.checked)}
            />
            <CheckboxField
              checked={formValues.settings.showResultAfterSubmit}
              id="exam-show-result"
              label="Hiển thị kết quả sau khi nộp"
              onChange={(event) => handleSettingChange("showResultAfterSubmit", event.target.checked)}
            />
          </div>
        </div>

        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang lưu..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
