import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../components/common/Button";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import TextInput from "../../../components/forms/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getDefaultPathByRole } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateEmailAddress,
  validateMinLength,
  validateRequiredText,
} from "../../../utils/formValidation";

// Trang này đăng ký tài khoản mới qua backend rồi đăng nhập luôn để giữ trải nghiệm mượt hơn.
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [formValues, setFormValues] = useState({
    confirmPassword: "",
    email: "",
    fullName: "",
    password: "",
  });
  const [registerErrorMessage, setRegisterErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm này cập nhật state form đăng ký theo từng field để phần submit dưới đây đỡ lặp lại.
  function handleFieldChange(fieldName, value) {
    setRegisterErrorMessage("");
    setValidationErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: "",
    }));
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  // Hàm này kiểm tra nhanh dữ liệu form để bám gần với rule backend sau này.
  function validateFormValues() {
    const nextErrors = {
      fullName: validateRequiredText(formValues.fullName, "Họ và tên không được để trống."),
      email: validateEmailAddress(formValues.email),
      password: validateRequiredText(formValues.password, "Mật khẩu không được để trống."),
      confirmPassword: validateRequiredText(
        formValues.confirmPassword,
        "Xác nhận mật khẩu không được để trống.",
      ),
    };

    if (!nextErrors.password) {
      nextErrors.password = validateMinLength(
        formValues.password,
        8,
        "Mật khẩu cần ít nhất 8 ký tự.",
      );
    }

    if (!nextErrors.password && !/[a-z]/.test(formValues.password)) {
      nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ thường.";
    }

    if (!nextErrors.password && !/[A-Z]/.test(formValues.password)) {
      nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ hoa.";
    }

    if (!nextErrors.password && !/[0-9]/.test(formValues.password)) {
      nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ số.";
    }

    if (!nextErrors.password && !/[^A-Za-z0-9]/.test(formValues.password)) {
      nextErrors.password = "Mật khẩu cần có ít nhất 1 ký tự đặc biệt.";
    }

    if (!nextErrors.confirmPassword && formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    }

    return nextErrors;
  }

  // Hàm này submit thông tin đăng ký rồi đưa user mới về route mặc định của Student.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);
    setRegisterErrorMessage("");

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await register(formValues);
      showToast({
        tone: "success",
        title: "Đăng ký thành công",
        message: "Tài khoản mới đã được tạo và đăng nhập vào hệ thống.",
      });
      navigate(getDefaultPathByRole(session.user.role), { replace: true });
    } catch (error) {
      setRegisterErrorMessage(error.message || "Không thể tạo tài khoản mới.");
      showToast({
        tone: "danger",
        title: "Đăng ký thất bại",
        message: error.message || "Không thể tạo tài khoản mới.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const formErrorMessage = registerErrorMessage || getFirstValidationError(validationErrors);

  return (
    <AuthLayout
      title="Tạo tài khoản EduGuard"
      description="Điền thông tin để bắt đầu sử dụng không gian học tập và thi trực tuyến minh bạch của EduGuard."
      footerText="Đã có tài khoản?"
      footerLinkLabel="Quay lại đăng nhập"
      footerLinkTo={routeConfig.login}
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={formErrorMessage} />

        <TextInput
          className="eg-auth-input"
          error={validationErrors.fullName}
          id="register-full-name"
          label="Họ và tên"
          onChange={(event) => handleFieldChange("fullName", event.target.value)}
          placeholder="Nhập họ và tên"
          required
          value={formValues.fullName}
        />
        <TextInput
          autoComplete="email"
          className="eg-auth-input"
          error={validationErrors.email}
          id="register-email"
          label="Email"
          onChange={(event) => handleFieldChange("email", event.target.value)}
          placeholder="student@gmail.com"
          required
          type="email"
          value={formValues.email}
        />
        <TextInput
          autoComplete="new-password"
          className="eg-auth-input"
          error={validationErrors.password}
          id="register-password"
          label="Mật khẩu"
          onChange={(event) => handleFieldChange("password", event.target.value)}
          placeholder="Nhập mật khẩu"
          required
          type="password"
          value={formValues.password}
        />
        <TextInput
          autoComplete="new-password"
          className="eg-auth-input"
          error={validationErrors.confirmPassword}
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
          placeholder="Nhập lại mật khẩu"
          required
          type="password"
          value={formValues.confirmPassword}
        />

        <Button
          className="eg-auth-primary-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
