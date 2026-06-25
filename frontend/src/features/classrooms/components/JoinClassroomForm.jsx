import { useState } from "react";
import { FiKey, FiLogIn } from "react-icons/fi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import TextInput from "../../../components/forms/TextInput";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateMinLength,
  validateRequiredText,
} from "../../../utils/formValidation";

// Form này phụ trách nhập mã lớp để sinh viên tham gia lớp theo đúng flow tài liệu yêu cầu.
export default function JoinClassroomForm({ isSubmitting = false, onJoinClassroom }) {
  const [joinCode, setJoinCode] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Hàm này chuẩn hóa mã lớp ngay khi gõ để dữ liệu gửi đi luôn ở dạng in hoa, không có khoảng trắng.
  function handleJoinCodeChange(value) {
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      joinCode: "",
    }));
    setJoinCode(value.toUpperCase().replace(/\s+/g, ""));
  }

  function validateFormValues() {
    const nextErrors = {
      joinCode: validateRequiredText(joinCode, "Mã lớp không được để trống."),
    };

    if (!nextErrors.joinCode) {
      nextErrors.joinCode = validateMinLength(joinCode, 6, "Mã lớp cần ít nhất 6 ký tự.");
    }

    return nextErrors;
  }

  // Hàm này gửi mã lớp về page cha và chỉ reset input khi thao tác join thành công.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const shouldReset = await onJoinClassroom(joinCode.trim());

    if (shouldReset) {
      setValidationErrors({});
      setJoinCode("");
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-linear-to-r from-info-muted via-surface to-surface px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-info/20 bg-surface text-info">
            <FiKey className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-primary">Nhập mã lớp để tham gia</h3>
        </div>
      </div>

      <form className="space-y-5 px-6 py-6" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <TextInput
          id="join-classroom-code"
          label="Mã lớp"
          autoCapitalize="characters"
          autoComplete="off"
          className="font-mono text-base tracking-[0.32em] uppercase sm:text-lg"
          error={validationErrors.joinCode}
          maxLength={12}
          onChange={(event) => handleJoinCodeChange(event.target.value)}
          placeholder="VD: WEB2B9"
          required
          value={joinCode}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            <span className="inline-flex items-center gap-2">
              <FiLogIn className="h-4 w-4" />
              <span>{isSubmitting ? "Đang tham gia..." : "Tham gia lớp"}</span>
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
