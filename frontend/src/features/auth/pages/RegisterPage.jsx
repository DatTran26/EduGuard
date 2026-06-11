import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../components/common/Button";
import TextInput from "../../../components/forms/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getDefaultPathByRole } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!/[a-z]/.test(formValues.password)) {
      return "Mật khẩu cần có ít nhất 1 chữ thường.";
    }

    if (!/[A-Z]/.test(formValues.password)) {
      return "Mật khẩu cần có ít nhất 1 chữ hoa.";
    }

    if (!/[0-9]/.test(formValues.password)) {
      return "Mật khẩu cần có ít nhất 1 chữ số.";
    }

    if (!/[^A-Za-z0-9]/.test(formValues.password)) {
      return "Mật khẩu cần có ít nhất 1 ký tự đặc biệt.";
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
      showToast({
        tone: "danger",
        title: "Đăng ký thất bại",
        message: error.message || "Không thể tạo tài khoản mới.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản EduGuard"
      description="Điền thông tin để bắt đầu sử dụng không gian học tập và thi trực tuyến minh bạch của EduGuard."
      footerText="Đã có tài khoản?"
      footerLinkLabel="Quay lại đăng nhập"
      footerLinkTo={routeConfig.login}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
          id="register-full-name"
          label="Họ và tên"
          onChange={(event) => handleFieldChange("fullName", event.target.value)}
          placeholder="Nhập họ và tên"
          required
          value={formValues.fullName}
        />
        <TextInput
          autoComplete="email"
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
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
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
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
          className="rounded-[18px] border-[#D7E0EA] bg-[#FBFCFE] px-4 py-3.5 focus:border-[#1479E8] focus:shadow-[0_0_0_4px_rgba(20,121,232,0.12)]"
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
          placeholder="Nhập lại mật khẩu"
          required
          type="password"
          value={formValues.confirmPassword}
        />

        <Button
          className="w-full rounded-[20px] bg-[#1479E8] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_42px_rgba(20,121,232,0.24)] hover:bg-[#136CCF]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
