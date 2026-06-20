import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  validateRequiredText,
} from "../../../utils/formValidation";
// import GoogleAuthButton from "../components/GoogleAuthButton";

const INVALID_CREDENTIALS_MESSAGE = "Bạn đã nhập sai tài khoản hoặc mật khẩu";

// Hàm này gom lỗi đăng nhập để sai tài khoản/mật khẩu luôn hiển thị cùng một câu rõ ràng.
function buildLoginErrorMessage(error) {
  const normalizedMessage = error?.message?.toLowerCase?.() ?? "";

  if (
    [400, 401, 403].includes(error?.status) ||
    normalizedMessage.includes("invalid") ||
    normalizedMessage.includes("password") ||
    normalizedMessage.includes("mật khẩu") ||
    normalizedMessage.includes("email")
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return error?.message || "Không thể đăng nhập. Bạn thử lại giúp mình nhé.";
}

// Trang này gọi API đăng nhập thật của backend theo contract auth trong docs.
export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm này lấy route cần quay lại sau khi login xong, giống lúc route guard redirect user.
  function getRedirectPath(role) {
    return location.state?.from?.pathname || getDefaultPathByRole(role);
  }

  // Hàm này cập nhật state form theo từng field để phần submit phía dưới gọn hơn.
  function handleFieldChange(fieldName, value) {
    setLoginErrorMessage("");
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
      email: validateEmailAddress(formValues.email),
      password: validateRequiredText(
        formValues.password,
        "Mật khẩu không được để trống.",
      ),
    };
  }

  // Hàm này giữ chỗ cho luồng quên mật khẩu trước khi backend thực sự cung cấp endpoint tương ứng.
  function handleForgotPasswordClick() {
    showToast({
      tone: "info",
      title: "Quên mật khẩu",
      message:
        "Tính năng khôi phục mật khẩu đang được hoàn thiện trong EduGuard.",
    });
  }

  // Hàm này xử lý submit form đăng nhập theo đúng endpoint `/api/auth/login`.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);
    setLoginErrorMessage("");

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await login(formValues);
      showToast({
        tone: "success",
        title: "Đăng nhập thành công",
        message: `Chào mừng ${session.user.fullName} quay lại EduGuard.`,
      });
      navigate(getRedirectPath(session.user.role), { replace: true });
    } catch (error) {
      const nextErrorMessage = buildLoginErrorMessage(error);
      setLoginErrorMessage(nextErrorMessage);

      if (nextErrorMessage !== INVALID_CREDENTIALS_MESSAGE) {
        showToast({
          tone: "danger",
          title: "Đăng nhập thất bại",
          message: nextErrorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const formErrorMessage =
    loginErrorMessage || getFirstValidationError(validationErrors);

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      footerText="Chưa có tài khoản?"
      footerLinkLabel="Đăng ký ngay"
      footerLinkTo={routeConfig.register}
    >
      <div className="space-y-5">
        {/* Google sign-in */}
        {/* <GoogleAuthButton /> */}

        {/* Divider */}
        {/* <div className="eg-auth-divider" aria-hidden="true">
          hoặc đăng nhập bằng email
        </div> */}

        {/* Email + Password form */}
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {loginErrorMessage ? null : (
            <FormErrorSummary message={formErrorMessage} />
          )}

          {loginErrorMessage ? (
            <div className="eg-auth-inline-alert" role="alert">
              {loginErrorMessage}
            </div>
          ) : null}

          <TextInput
            autoComplete="email"
            className="eg-auth-input"
            error={validationErrors.email}
            id="login-email"
            label="Email"
            onChange={(event) => handleFieldChange("email", event.target.value)}
            placeholder="student@gmail.com"
            required
            type="email"
            value={formValues.email}
          />
          <TextInput
            autoComplete="current-password"
            className="eg-auth-input"
            error={validationErrors.password}
            id="login-password"
            label="Mật khẩu"
            onChange={(event) =>
              handleFieldChange("password", event.target.value)
            }
            placeholder="Nhập mật khẩu"
            required
            type="password"
            value={formValues.password}
          />

          <div className="eg-auth-checkbox-row">
            <label className="eg-auth-checkbox">
              <input
                className="eg-auth-checkbox-input"
                name="remember-session"
                type="checkbox"
              />
              Ghi nhớ đăng nhập
            </label>
            <button
              className="eg-auth-inline-link text-sm"
              type="button"
              onClick={handleForgotPasswordClick}
            >
              Quên mật khẩu?
            </button>
          </div>

          <Button
            className="eg-auth-primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
