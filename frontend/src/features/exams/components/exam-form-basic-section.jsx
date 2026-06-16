import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";

export default function ExamFormBasicSection({
  formValues,
  isEditingExam,
  selectOptions,
  onFieldChange,
  onDurationChange,
  onStartTimeChange,
  onEndTimeChange,
}) {
  return (
    <div className="space-y-4">
      <Select
        id="exam-classroom-id"
        label="Lớp học"
        disabled={isEditingExam}
        onChange={(event) => onFieldChange("classroomId", event.target.value)}
        options={selectOptions}
        required
        value={formValues.classroomId}
      />

      <TextInput
        id="exam-title"
        label="Tiêu đề bài kiểm tra"
        onChange={(event) => onFieldChange("title", event.target.value)}
        placeholder="Ví dụ: Kiểm tra giữa kỳ UI"
        required
        value={formValues.title}
      />

      <TextInput
        as="textarea"
        id="exam-description"
        label="Mô tả"
        onChange={(event) => onFieldChange("description", event.target.value)}
        placeholder="Mô tả ngắn về nội dung đề thi"
        value={formValues.description}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <TextInput
          id="exam-duration"
          label="Thời gian làm bài (phút)"
          min="1"
          onChange={(event) => onDurationChange(event.target.value)}
          required
          type="number"
          value={formValues.durationMinutes}
        />
        <TextInput
          id="exam-start-time"
          label="Thời gian mở đề"
          onChange={(event) => onStartTimeChange(event.target.value)}
          type="datetime-local"
          value={formValues.startTime}
        />
        <TextInput
          id="exam-end-time"
          label="Thời gian đóng đề"
          onChange={(event) => onEndTimeChange(event.target.value)}
          type="datetime-local"
          value={formValues.endTime}
        />
      </div>
    </div>
  );
}
