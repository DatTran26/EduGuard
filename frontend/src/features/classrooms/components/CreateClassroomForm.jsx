import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import TextInput from "../../../components/forms/TextInput";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateRequiredText,
} from "../../../utils/formValidation";

// Hàm này đổi dữ liệu classroom đầu vào về state form gọn để create và edit dùng chung được.
function buildFormValues(classroom) {
  return {
    description: classroom?.description ?? "",
    name: classroom?.name ?? "",
  };
}

// Form này dùng chung cho tạo và sửa lớp học để tránh viết hai bộ form gần như giống hệt nhau.
export default function CreateClassroomForm({
  classroom = null,
  isSubmitting = false,
  onSubmitClassroom,
  submitLabel = "Lưu lớp học",
  title = "Thông tin lớp học",
}) {
  const [formValues, setFormValues] = useState(() => buildFormValues(classroom));
  const [validationErrors, setValidationErrors] = useState({});

  // Hàm này cập nhật giá trị field tương ứng để các input đều đi qua một luồng state thống nhất.
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
      name: validateRequiredText(formValues.name, "Tên lớp học không được để trống."),
    };
  }

  // Hàm này submit dữ liệu đã chuẩn hóa để page cha xử lý create hoặc update giống gọi API thật.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const shouldReset = await onSubmitClassroom({
      description: formValues.description.trim(),
      name: formValues.name.trim(),
    });

    if (shouldReset && !classroom) {
      setValidationErrors({});
      setFormValues({
        description: "",
        name: "",
      });
    }
  }

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <TextInput
          error={validationErrors.name}
          id="classroom-name"
          label="Tên lớp học"
          onChange={(event) => handleFieldChange("name", event.target.value)}
          placeholder="Ví dụ: Lập trình Web 2B"
          required
          value={formValues.name}
        />

        <div className="rounded-[18px] border border-border bg-neutral px-4 py-4">
          <p className="text-sm font-semibold text-primary">Mã lớp</p>
          <p className="mt-2 font-mono text-sm text-primary">
            {classroom?.joinCode || "Sẽ được backend tạo sau khi lưu lớp học"}
          </p>
        </div>

        <TextInput
          as="textarea"
          id="classroom-description"
          label="Mô tả lớp"
          onChange={(event) => handleFieldChange("description", event.target.value)}
          placeholder="Mô tả ngắn về lớp học"
          value={formValues.description}
        />

        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang lưu..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
