import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getDefaultPathByRole } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";

// Trang này đăng ký tài khoản Student mới bằng mock auth API để mô phỏng backend register thật.
export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, register } = useAuth();
  const { showToast } = useToast();
  const [formValues, setFormValues] = useState({
    confirmPassword: "12345678",
    email: "studentmoi@eduguard.local",
    fullName: "Sinh viên mới",
    password: "12345678",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMethod, setActiveMethod] = useState("");

  // Hàm này cập nhật state form đăng ký theo từng field để phần submit dưới đây đỡ lặp lại.
  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  // Hàm này kiểm tra nhanh dữ liệu form để bám gần với rule backend sau này.
  function validateFormValues() {
    if (formValues.password !== formValues.confirmPassword) {
      return "Mật khẩu xác nhận chưa khớp.";
    }

    if (formValues.password.length < 8) {
      return "Mật khẩu cần ít nhất 8 ký tự.";
    }

    return "";
  }

  // Hàm này submit thông tin đăng ký rồi đưa user mới về route mặc định của Student.
  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateFormValues();

    if (validationMessage) {
      showToast({
        tone: "danger",
        title: "Đăng ký chưa hợp lệ",
        message: validationMessage,
      });
      return;
    }

    setActiveMethod("local");
    setIsSubmitting(true);

    try {
      const session = await register(formValues);
      showToast({
        tone: "success",
        title: "Đăng ký thành công",
        message: "Tài khoản mới đã được tạo với avatar capybara mặc định.",
      });
      navigate(getDefaultPathByRole(session.user.role), { replace: true });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Đăng ký thất bại",
        message: error.message || "Không thể tạo tài khoản mới.",
      });
    } finally {
      setIsSubmitting(false);
      setActiveMethod("");
    }
  }

  // Hàm này mô phỏng flow đăng ký bằng Google và dùng luôn ảnh từ profile Google demo.
  async function handleGoogleRegister() {
    setActiveMethod("google");
    setIsSubmitting(true);

    try {
      const session = await loginWithGoogle();
      showToast({
        tone: "success",
        title: "Google đã sẵn sàng",
        message: `Tài khoản ${session.user.email} đã vào hệ thống cùng ảnh đại diện Google.`,
      });
      navigate(getDefaultPathByRole(session.user.role), { replace: true });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Google chưa đăng ký được",
        message: error.message || "Không thể tạo tài khoản bằng Google.",
      });
    } finally {
      setIsSubmitting(false);
      setActiveMethod("");
    }
  }

  return (
    <AuthLayout
      title="Đăng ký"
      description="Tạo tài khoản sinh viên mới để tham gia lớp học."
      footerText="Đã có tài khoản?"
      footerLinkLabel="Quay lại đăng nhập"
      footerLinkTo={routeConfig.login}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <GoogleAuthButton
          disabled={isSubmitting}
          isLoading={isSubmitting && activeMethod === "google"}
          label="Đăng ký với Google"
          onClick={handleGoogleRegister}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">hoặc</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <TextInput
          id="register-full-name"
          label="Họ và tên"
          onChange={(event) => handleFieldChange("fullName", event.target.value)}
          placeholder="Nhập họ và tên"
          required
          value={formValues.fullName}
        />
        <TextInput
          autoComplete="email"
          id="register-email"
          label="Email"
          onChange={(event) => handleFieldChange("email", event.target.value)}
          placeholder="student@eduguard.local"
          required
          type="email"
          value={formValues.email}
        />
        <TextInput
          autoComplete="new-password"
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
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
          placeholder="Nhập lại mật khẩu"
          required
          type="password"
          value={formValues.confirmPassword}
        />

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting && activeMethod === "local" ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
