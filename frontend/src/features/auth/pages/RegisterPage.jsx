import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiBookOpen, FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
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

const WIZARD_STEPS = [
  { label: "Tài khoản" },
  { label: "Cá nhân" },
  { label: "Vai trò" },
  { label: "Xác thực" },
];

const ROLE_OPTIONS = [
  {
    id: "Student",
    label: "Sinh viên",
    description: "Tham gia lớp học và làm bài thi",
    icon: <FiBookOpen size={22} />,
  },
  {
    id: "Teacher",
    label: "Giảng viên",
    description: "Tạo lớp học và quản lý bài kiểm tra",
    icon: <FiUser size={22} />,
  },
];

function WizardStepIndicator({ currentStep }) {
  return (
    <div className="eg-auth-step-indicator" aria-label="Tiến trình đăng ký">
      {WIZARD_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <>
            <div
              key={step.label}
              className={[
                "eg-auth-step-dot",
                isDone ? "eg-auth-step-dot-done" : "",
                isActive ? "eg-auth-step-dot-active" : "",
              ].join(" ")}
              title={step.label}
              aria-label={`Bước ${stepNumber}: ${step.label}${isDone ? " (đã xong)" : isActive ? " (đang thực hiện)" : ""}`}
            >
              {isDone ? <FiCheck size={13} /> : stepNumber}
            </div>
            {index < WIZARD_STEPS.length - 1 ? (
              <div
                key={`line-${index}`}
                className={["eg-auth-step-line", isDone ? "eg-auth-step-line-done" : ""].join(" ")}
              />
            ) : null}
          </>
        );
      })}
    </div>
  );
}

// Trang này đăng ký tài khoản mới qua backend rồi đăng nhập luôn để giữ trải nghiệm mượt hơn.
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState("right");
  const [formValues, setFormValues] = useState({
    confirmPassword: "",
    email: "",
    fullName: "",
    password: "",
  });
  const [selectedRole, setSelectedRole] = useState("Student");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
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

  function validateStep1() {
    const nextErrors = {
      email: validateEmailAddress(formValues.email),
      password: validateRequiredText(formValues.password, "Mật khẩu không được để trống."),
      confirmPassword: validateRequiredText(formValues.confirmPassword, "Xác nhận mật khẩu không được để trống."),
    };
    if (!nextErrors.password) nextErrors.password = validateMinLength(formValues.password, 8, "Mật khẩu cần ít nhất 8 ký tự.");
    if (!nextErrors.password && !/[a-z]/.test(formValues.password)) nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ thường.";
    if (!nextErrors.password && !/[A-Z]/.test(formValues.password)) nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ hoa.";
    if (!nextErrors.password && !/[0-9]/.test(formValues.password)) nextErrors.password = "Mật khẩu cần có ít nhất 1 chữ số.";
    if (!nextErrors.password && !/[^A-Za-z0-9]/.test(formValues.password)) nextErrors.password = "Mật khẩu cần có ít nhất 1 ký tự đặc biệt.";
    if (!nextErrors.confirmPassword && formValues.password !== formValues.confirmPassword) nextErrors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
    return nextErrors;
  }

  function validateStep2() {
    return { fullName: validateRequiredText(formValues.fullName, "Họ và tên không được để trống.") };
  }

  function goToStep(nextStep, direction) {
    setSlideDirection(direction);
    setCurrentStep(nextStep);
    setValidationErrors({});
    setRegisterErrorMessage("");
  }

  function handleNext() {
    if (currentStep === 1) {
      const errors = validateStep1();
      setValidationErrors(errors);
      if (hasValidationErrors(errors)) return;
    }
    if (currentStep === 2) {
      const errors = validateStep2();
      setValidationErrors(errors);
      if (hasValidationErrors(errors)) return;
    }
    goToStep(currentStep + 1, "right");
  }

  function handleBack() {
    goToStep(currentStep - 1, "left");
  }

  // Hàm này submit thông tin đăng ký rồi đưa user mới về route mặc định của Student.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();
    setValidationErrors(nextValidationErrors);
    setRegisterErrorMessage("");
    if (hasValidationErrors(nextValidationErrors)) return;

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

  const animationClass =
    slideDirection === "right" ? "eg-auth-step-enter-right" : "eg-auth-step-enter-left";
  const formErrorMessage = registerErrorMessage || getFirstValidationError(validationErrors);

  return (
    <AuthLayout
      title="Tạo tài khoản"
      description={`Bước ${currentStep} / ${WIZARD_STEPS.length} — ${WIZARD_STEPS[currentStep - 1].label}`}
      footerText="Đã có tài khoản?"
      footerLinkLabel="Quay lại đăng nhập"
      footerLinkTo={routeConfig.login}
    >
      <div className="space-y-6">
        {/* Step indicator */}
        <WizardStepIndicator currentStep={currentStep} />

        {/* Step content with animation */}
        <div key={currentStep} className={animationClass}>

          {/* ── Step 1: Account info ── */}
          {currentStep === 1 ? (
            <form
              className="space-y-4"
              noValidate
              onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            >
              <FormErrorSummary message={formErrorMessage} />
              <TextInput
                autoComplete="email"
                className="eg-auth-input"
                error={validationErrors.email}
                id="register-email"
                label="Email"
                onChange={(event) => handleFieldChange("email", event.target.value)}
                placeholder="Nhập email"
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
              <Button className="eg-auth-primary-button" type="submit">
                Tiếp theo <FiChevronRight className="inline-block h-4 w-4 ml-1" />
              </Button>
            </form>
          ) : null}

          {/* ── Step 2: Personal info ── */}
          {currentStep === 2 ? (
            <form
              className="space-y-4"
              noValidate
              onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            >
              <FormErrorSummary message={formErrorMessage} />
              <TextInput
                className="eg-auth-input"
                error={validationErrors.fullName}
                id="register-full-name"
                label="Họ và tên"
                onChange={(event) => handleFieldChange("fullName", event.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                required
                value={formValues.fullName}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  className="eg-button eg-button-secondary flex-1"
                  onClick={handleBack}
                >
                  <FiChevronLeft className="h-4 w-4" /> Quay lại
                </button>
                <Button className="eg-auth-primary-button flex-[2]" type="submit">
                  Tiếp theo <FiChevronRight className="inline-block h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          ) : null}

          {/* ── Step 3: Role selection ── */}
          {currentStep === 3 ? (
            <div className="space-y-5">
              <p className="text-sm text-secondary">Bạn muốn sử dụng EduGuard với tư cách nào?</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={[
                      "eg-auth-role-card",
                      selectedRole === role.id ? "eg-auth-role-card-active" : "",
                    ].join(" ")}
                    onClick={() => setSelectedRole(role.id)}
                    aria-pressed={selectedRole === role.id}
                  >
                    <span className="eg-auth-role-icon" aria-hidden="true">
                      {role.icon}
                    </span>
                    <span className="text-sm font-semibold text-primary">{role.label}</span>
                    <span className="text-xs text-secondary">{role.description}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="eg-button eg-button-secondary flex-1"
                  onClick={handleBack}
                >
                  <FiChevronLeft className="h-4 w-4" /> Quay lại
                </button>
                <Button className="eg-auth-primary-button flex-[2]" onClick={handleNext}>
                  Tiếp theo <FiChevronRight className="inline-block h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}

          {/* ── Step 4: OTP placeholder ── */}
          {currentStep === 4 ? (
            <form className="space-y-5" noValidate onSubmit={handleSubmit}>
              <FormErrorSummary message={formErrorMessage} />

              {registerErrorMessage ? (
                <div className="eg-auth-inline-alert" role="alert">
                  {registerErrorMessage}
                </div>
              ) : null}

              <div className="space-y-3">
                <p className="text-sm text-secondary">
                  Nhập mã OTP 6 chữ số gửi đến{" "}
                  <strong className="text-primary">{formValues.email}</strong>
                </p>
                <div className="eg-auth-otp-grid" role="group" aria-label="Mã OTP 6 chữ số">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      className="eg-auth-otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      id={`otp-${idx}`}
                      aria-label={`Chữ số thứ ${idx + 1}`}
                      onChange={(e) => {
                        const newOtp = [...otpValues];
                        newOtp[idx] = e.target.value.replace(/\D/, "");
                        setOtpValues(newOtp);
                        if (e.target.value && idx < 5) {
                          document.getElementById(`otp-${idx + 1}`)?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="eg-button eg-button-secondary flex-1"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <FiChevronLeft className="h-4 w-4" /> Quay lại
                </button>
                <Button
                  className="eg-auth-primary-button flex-[2]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
                </Button>
              </div>
            </form>
          ) : null}

        </div>
      </div>
    </AuthLayout>
  );
}
