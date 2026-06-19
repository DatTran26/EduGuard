import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";

export default function ExamFormBasicSection({
  errors = {},
  formValues,
  isEditingExam,
  selectOptions,
  onFieldChange,
  showDescriptions = true,
}) {
  return (
    <section className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">Thông tin cơ bản</h4>
        {showDescriptions ? (
          <p className="text-sm leading-6 text-secondary">
            Chọn lớp học, đặt tiêu đề rõ ràng và thêm mô tả ngắn để sinh viên dễ nhận biết đề.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <Select
          id="exam-classroom-id"
          label="Lớp học"
          disabled={isEditingExam}
          error={errors.classroomId}
          onChange={(event) => onFieldChange("classroomId", event.target.value)}
          options={selectOptions}
          required
          value={formValues.classroomId}
        />

        <TextInput
          id="exam-title"
          label="Tiêu đề bài kiểm tra"
          error={errors.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          placeholder="Ví dụ: Kiểm tra giữa kỳ UI"
          required
          value={formValues.title}
        />

        <TextInput
          as="textarea"
          id="exam-description"
          label="Mô tả"
          helperText={showDescriptions ? "Mô tả ngắn giúp sinh viên hiểu phạm vi nội dung trước khi vào phòng thi." : undefined}
          onChange={(event) => onFieldChange("description", event.target.value)}
          placeholder="Mô tả ngắn về nội dung đề thi"
          value={formValues.description}
        />
      </div>
    </section>
  );
}
