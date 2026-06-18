import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateEmailAddress,
  validateMinLength,
  validateRequiredText,
} from "../../../utils/formValidation";

const ROLE_OPTIONS = [
  { label: "Admin", value: "Admin" },
  { label: "Teacher", value: "Teacher" },
  { label: "Student", value: "Student" },
];

const STATUS_OPTIONS = [
  { label: "Đang hoạt động", value: "true" },
  { label: "Đã khóa", value: "false" },
];

function buildFormValues(user) {
  return {
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "Student",
    isActive: typeof user?.isActive === "boolean" ? user.isActive : true,
  };
}

export default function AdminUserForm({
  title,
  user = null,
  isEditing = false,
  isSelfEditing = false,
  isSubmitting = false,
  onCancel,
  onSubmitUser,
}) {
  const [formValues, setFormValues] = useState(() => buildFormValues(user));
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
    const nextErrors = {
      fullName: validateRequiredText(formValues.fullName, "Họ tên không được để trống."),
      email: validateEmailAddress(formValues.email),
      password: "",
    };

    if (!isEditing) {
      nextErrors.password = validateRequiredText(formValues.password, "Mật khẩu không được để trống.");

      if (!nextErrors.password) {
        nextErrors.password = validateMinLength(
          formValues.password,
          8,
          "Mật khẩu phải có ít nhất 8 ký tự.",
        );
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    const payload = {
      fullName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      role: isSelfEditing ? user?.role ?? formValues.role : formValues.role,
      isActive: isSelfEditing ? user?.isActive ?? true : formValues.isActive,
    };

    if (!isEditing) {
      payload.password = formValues.password;
    }

    const shouldReset = await onSubmitUser(payload);

    if (shouldReset && !isEditing) {
      setValidationErrors({});
      setFormValues(buildFormValues(null));
    }
  }

  return (
    <Card className="space-y-5">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={getFirstValidationError(validationErrors)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            autoComplete="name"
            error={validationErrors.fullName}
            id="admin-user-full-name"
            label="Họ tên"
            onChange={(event) => handleFieldChange("fullName", event.target.value)}
            required
            value={formValues.fullName}
          />

          <TextInput
            autoComplete="email"
            error={validationErrors.email}
            id="admin-user-email"
            label="Email"
            onChange={(event) => handleFieldChange("email", event.target.value)}
            required
            type="email"
            value={formValues.email}
          />
        </div>

        {!isEditing ? (
          <TextInput
            autoComplete="new-password"
            error={validationErrors.password}
            id="admin-user-password"
            label="Mật khẩu"
            minLength={8}
            onChange={(event) => handleFieldChange("password", event.target.value)}
            required
            type="password"
            value={formValues.password}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            disabled={isSelfEditing}
            id="admin-user-role"
            label="Vai trò"
            onChange={(event) => handleFieldChange("role", event.target.value)}
            options={ROLE_OPTIONS}
            value={formValues.role}
          />

          <Select
            disabled={isSelfEditing}
            id="admin-user-status"
            label="Trạng thái"
            onChange={(event) => handleFieldChange("isActive", event.target.value === "true")}
            options={STATUS_OPTIONS}
            value={String(formValues.isActive)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {onCancel ? (
            <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="secondary">
              Hủy
            </Button>
          ) : null}

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Thêm người dùng"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
