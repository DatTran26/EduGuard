import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getDefaultPathByRole } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";

const DEMO_ACCOUNT_OPTIONS = [
  {
    label: "Giảng viên",
    email: "teacher@eduguard.local",
    password: "12345678",
  },
  {
    label: "Sinh viên",
    email: "student@eduguard.local",
    password: "12345678",
  },
  {
    label: "Quản trị viên",
    email: "admin@eduguard.local",
    password: "12345678",
  },
];

// Trang này dùng mock auth API để đăng nhập thật giả lập bằng các tài khoản seed trong localStorage.
export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [formValues, setFormValues] = useState({
    email: "teacher@eduguard.local",
    password: "12345678",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMethod, setActiveMethod] = useState("");

  // Hàm này lấy route cần quay lại sau khi login xong, giống lúc route guard redirect user.
  function getRedirectPath(role) {
    return location.state?.from?.pathname || getDefaultPathByRole(role);
  }

  // Hàm này cập nhật state form theo từng field để phần submit phía dưới gọn hơn.
  function handleFieldChange(fieldName, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
  }

  // Hàm này đổ sẵn thông tin tài khoản seed vào form để test role nhanh hơn.
  function handleFillDemoAccount(account) {
    setFormValues({
      email: account.email,
      password: account.password,
    });
  }

  // Hàm này xử lý submit form đăng nhập theo flow authApi.login.
  async function handleSubmit(event) {
    event.preventDefault();
    setActiveMethod("local");
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
      showToast({
        tone: "danger",
        title: "Đăng nhập thất bại",
        message: error.message || "Không thể đăng nhập. Bạn thử lại giúp mình nhé.",
      });
    } finally {
      setIsSubmitting(false);
      setActiveMethod("");
    }
  }

  // Hàm này mô phỏng nút Google OAuth để user có thể vào nhanh bằng profile Google demo.
  async function handleGoogleLogin() {
    setActiveMethod("google");
    setIsSubmitting(true);

    try {
      const session = await loginWithGoogle();
      showToast({
        tone: "success",
        title: "Đăng nhập Google thành công",
        message: `Đã kết nối tài khoản ${session.user.email}.`,
      });
      navigate(getRedirectPath(session.user.role), { replace: true });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Google chưa đăng nhập được",
        message: error.message || "Không thể tiếp tục với Google lúc này.",
      });
    } finally {
      setIsSubmitting(false);
      setActiveMethod("");
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      description="Tiếp tục vào không gian làm việc của bạn."
      footerText="Chưa có tài khoản?"
      footerLinkLabel="Đăng ký ngay"
      footerLinkTo={routeConfig.register}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <GoogleAuthButton
          disabled={isSubmitting}
          isLoading={isSubmitting && activeMethod === "google"}
          onClick={handleGoogleLogin}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">hoặc</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <label className="eg-label">Tài khoản mẫu</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNT_OPTIONS.map((account) => (
              <Button
                key={account.email}
                onClick={() => handleFillDemoAccount(account)}
                type="button"
                variant="secondary"
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>

        <TextInput
          autoComplete="email"
          id="login-email"
          label="Email"
          onChange={(event) => handleFieldChange("email", event.target.value)}
          placeholder="teacher@eduguard.local"
          required
          type="email"
          value={formValues.email}
        />
        <TextInput
          autoComplete="current-password"
          id="login-password"
          label="Mật khẩu"
          onChange={(event) => handleFieldChange("password", event.target.value)}
          placeholder="Nhập mật khẩu"
          required
          type="password"
          value={formValues.password}
        />

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting && activeMethod === "local" ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </AuthLayout>
  );
}
