import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getDefaultPathByRole } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Hàm này giữ chỗ cho luồng quên mật khẩu trước khi backend thực sự cung cấp endpoint tương ứng.
  function handleForgotPasswordClick() {
    showToast({
      tone: "info",
      title: "Quên mật khẩu",
      message: "Tính năng khôi phục mật khẩu đang được hoàn thiện trong EduGuard.",
    });
  }

  // Hàm này xử lý submit form đăng nhập theo đúng endpoint `/api/auth/login`.
  async function handleSubmit(event) {
    event.preventDefault();
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
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập EduGuard"
      description="Truy cập nhanh vào lớp học, bài kiểm tra và khu vực quản trị của bạn chỉ với một lần xác thực."
      footerText="Chưa có tài khoản?"
      footerLinkLabel="Đăng ký ngay"
      footerLinkTo={routeConfig.register}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          autoComplete="email"
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
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
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
          id="login-password"
          label="Mật khẩu"
          onChange={(event) => handleFieldChange("password", event.target.value)}
          placeholder="Nhập mật khẩu"
          required
          type="password"
          value={formValues.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-[#536277]">
            <input
              className="h-4 w-4 rounded border-[#CCD7E4] accent-[#1479E8]"
              name="remember-session"
              type="checkbox"
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            className="text-sm font-semibold text-[#0F2F57] transition-colors duration-200 hover:text-[#1479E8]"
            type="button"
            onClick={handleForgotPasswordClick}
          >
            Quên mật khẩu?
          </button>
        </div>

        <Button
          className="w-full rounded-[20px] bg-[#1479E8] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_42px_rgba(20,121,232,0.24)] hover:bg-[#136CCF]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </AuthLayout>
  );
}
