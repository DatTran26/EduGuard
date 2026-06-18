import { useEffect, useRef, useState } from "react";
import {
  FiAtSign,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiMail,
  FiRotateCcw,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { userApi } from "../../../api/userApi";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";
import TextInput from "../../../components/forms/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  getFirstValidationError,
  hasValidationErrors,
  validateEmailAddress,
  validateRequiredText,
} from "../../../utils/formValidation";

const ACCEPTED_AVATAR_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_FILE_SIZE_BYTES = 700 * 1024;

// MOCK STATUS:
// - Trang này đang đọc/lưu hồ sơ qua userApi mock.
// - Avatar upload hiện được giữ cục bộ trong localStorage dưới dạng data URL để chờ API upload thật.

// Hàm này chuyển dữ liệu profile lấy từ API sang state form để việc chỉnh sửa dễ kiểm soát hơn.
function buildProfileFormValues(profile) {
  return {
    avatarUrl: profile?.avatarUrl ?? "",
    email: profile?.email ?? "",
    fullName: profile?.fullName ?? "",
  };
}

function normalizeProfileFormValues(values) {
  return {
    avatarUrl: values?.avatarUrl?.trim() ?? "",
    email: values?.email?.trim() ?? "",
    fullName: values?.fullName?.trim() ?? "",
  };
}

function hasProfileFormChanges(profile, formValues) {
  const currentValues = normalizeProfileFormValues(profile);
  const nextValues = normalizeProfileFormValues(formValues);

  return (
    currentValues.avatarUrl !== nextValues.avatarUrl ||
    currentValues.email !== nextValues.email ||
    currentValues.fullName !== nextValues.fullName
  );
}

// Hàm này đọc file ảnh thành data URL để avatar có thể lưu cục bộ trong mock profile hiện tại.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => resolve(typeof fileReader.result === "string" ? fileReader.result : "");
    fileReader.onerror = () => reject(new Error("Không thể đọc file ảnh đã chọn."));
    fileReader.readAsDataURL(file);
  });
}

function ProfileInfoTile({ icon: Icon, label, value, valueClassName }) {
  return (
    <div className="rounded-[20px] border border-border bg-white/80 px-4 py-4 shadow-[0_12px_30px_rgb(15_23_42/6%)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-sky-100 bg-sky-50 text-sky-700">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{label}</p>
          <p className={cn("truncate text-sm font-semibold text-primary", valueClassName)}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Trang này cho phép người dùng xem và sửa thông tin cá nhân của chính mình.
export default function ProfilePage() {
  const { updateProfile, user } = useAuth();
  const { showToast } = useToast();
  const avatarFileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState(buildProfileFormValues(user));
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [selectedAvatarFileName, setSelectedAvatarFileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    // Hàm này tải hồ sơ ban đầu lúc mở trang mà không chạm phải warning setState trong effect.
    async function loadInitialProfile() {
      try {
        const response = await userApi.getMyProfile();

        if (!isMounted) {
          return;
        }

        setProfile(response.data);
        setFormValues(buildProfileFormValues(response.data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "danger",
          title: "Tải hồ sơ thất bại",
          message: error.message || "Không thể tải hồ sơ cá nhân.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialProfile();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Hàm này cập nhật state form khi người dùng thay đổi giá trị trên input.
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

  // Hàm này mở hộp thoại chọn file avatar từ máy người dùng.
  function handleAvatarPickerClick() {
    avatarFileInputRef.current?.click();
  }

  // Hàm này đọc ảnh đã chọn, kiểm tra định dạng/dung lượng rồi đưa vào form để người dùng xem trước.
  async function handleAvatarFileChange(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!ACCEPTED_AVATAR_FILE_TYPES.includes(selectedFile.type)) {
      const nextMessage = "Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.";
      setAvatarUploadError(nextMessage);
      showToast({
        tone: "danger",
        title: "Ảnh chưa hợp lệ",
        message: nextMessage,
      });
      return;
    }

    if (selectedFile.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      const nextMessage = "Ảnh đại diện phải nhỏ hơn 700 KB để lưu ổn định trong trình duyệt.";
      setAvatarUploadError(nextMessage);
      showToast({
        tone: "danger",
        title: "Ảnh quá lớn",
        message: nextMessage,
      });
      return;
    }

    setIsProcessingAvatar(true);
    setAvatarUploadError("");

    try {
      const avatarDataUrl = await readFileAsDataUrl(selectedFile);
      handleFieldChange("avatarUrl", avatarDataUrl);
      setSelectedAvatarFileName(selectedFile.name);
      showToast({
        tone: "success",
        title: "Đã chọn ảnh đại diện",
        message: "Ảnh mới đang được xem trước. Hãy lưu thay đổi để cập nhật avatar.",
      });
    } catch (error) {
      const nextMessage = error.message || "Không thể xử lý ảnh đại diện.";
      setAvatarUploadError(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải ảnh thất bại",
        message: nextMessage,
      });
    } finally {
      setIsProcessingAvatar(false);
    }
  }

  // Hàm này đưa form về avatar mặc định để người dùng có thể bỏ ảnh hiện tại nếu muốn.
  function handleResetAvatar() {
    handleFieldChange("avatarUrl", "");
    setAvatarUploadError("");
    setSelectedAvatarFileName("");
  }

  function handleResetForm() {
    setFormValues(buildProfileFormValues(profile ?? user));
    setAvatarUploadError("");
    setSelectedAvatarFileName("");
    setValidationErrors({});
  }

  function validateFormValues() {
    return {
      fullName: validateRequiredText(formValues.fullName, "Họ và tên không được để trống."),
      email: validateEmailAddress(formValues.email),
    };
  }

  // Hàm này submit thay đổi hồ sơ cá nhân rồi đồng bộ lại session user đang đăng nhập.
  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationErrors = validateFormValues();

    setValidationErrors(nextValidationErrors);

    if (hasValidationErrors(nextValidationErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextPayload = normalizeProfileFormValues(formValues);
      const updatedProfile = await updateProfile(nextPayload);
      setProfile(updatedProfile);
      setFormValues(buildProfileFormValues(updatedProfile));
      setValidationErrors({});
      setAvatarUploadError("");
      setSelectedAvatarFileName("");
      showToast({
        tone: "success",
        title: "Đã cập nhật hồ sơ",
        message: "Cập nhật hồ sơ thành công.",
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật thất bại",
        message: error.message || "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="eg-feedback-panel">Đang tải hồ sơ cá nhân...</div>;
  }

  const effectiveProfile = profile ?? user;
  const previewFullName = formValues.fullName || effectiveProfile?.fullName || "Người dùng EduGuard";
  const previewEmail = formValues.email || effectiveProfile?.email || "user@eduguard.local";
  const roleLabel = getRoleLabel(effectiveProfile?.role);
  const profileTitle = effectiveProfile?.role === "Student" ? "Hồ sơ sinh viên" : "Hồ sơ cá nhân";
  const isFormDirty = hasProfileFormChanges(effectiveProfile, formValues);
  const avatarStateLabel = selectedAvatarFileName
    ? "Ảnh mới"
    : formValues.avatarUrl
      ? "Ảnh hiện tại"
      : "Mặc định";
  const avatarStatusText = selectedAvatarFileName
    ? selectedAvatarFileName
    : formValues.avatarUrl
      ? "Đang dùng ảnh đại diện đã lưu"
      : "Đang dùng avatar mặc định của hệ thống";
  const formErrorMessage = getFirstValidationError(validationErrors);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#e0f2fe_100%)] p-[1px] shadow-[0_28px_90px_rgb(15_23_42/18%)]">
        <div className="relative overflow-hidden rounded-[31px] bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_35%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f766e_100%)] px-6 py-6 text-white md:px-8 md:py-8">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-300/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="w-fit rounded-[28px] border border-white/15 bg-white/10 p-2.5 backdrop-blur">
                <Avatar
                  alt={`Ảnh đại diện của ${previewFullName}`}
                  className="ring-4 ring-white/12"
                  name={previewFullName}
                  sizeClassName="h-24 w-24 md:h-28 md:w-28"
                  src={formValues.avatarUrl}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <FiCheckCircle className="h-3.5 w-3.5" />
                    Hồ sơ
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{profileTitle}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-sky-100/90">
                    <span className="inline-flex items-center gap-2">
                      <FiUser className="h-4 w-4" />
                      {previewFullName}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FiMail className="h-4 w-4" />
                      {previewEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/80">Trạng thái</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {effectiveProfile?.isActive ? "Đang hoạt động" : "Đã khóa"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/80">Cập nhật</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {formatShortDateTime(effectiveProfile?.updatedAt || effectiveProfile?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <form className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" noValidate onSubmit={handleSubmit}>
        <div className="xl:col-span-2">
          <FormErrorSummary message={formErrorMessage} />
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(240,249,255,0.92)_100%)] shadow-[0_18px_46px_rgb(15_23_42/7%)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-primary">Tài khoản</h2>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                    isFormDirty
                      ? "border border-amber-200 bg-amber-50 text-amber-700"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {isFormDirty ? "Chưa lưu" : "Đã đồng bộ"}
                </span>
              </div>

              <div className="grid gap-3">
                <ProfileInfoTile icon={FiAtSign} label="Email đăng nhập" value={previewEmail} />
                <ProfileInfoTile icon={FiShield} label="Vai trò" value={roleLabel} />
                <ProfileInfoTile
                  icon={FiClock}
                  label="Cập nhật"
                  value={formatShortDateTime(effectiveProfile?.updatedAt || effectiveProfile?.createdAt)}
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-5 shadow-[0_18px_46px_rgb(15_23_42/7%)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-primary">Ảnh đại diện</h2>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-sunken px-3 py-1 text-xs font-semibold text-secondary">
                {avatarStateLabel}
              </span>
            </div>

            <div className="rounded-[24px] border border-border bg-neutral p-5">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="rounded-[28px] border border-white/70 bg-white p-2 shadow-[0_18px_40px_rgb(15_23_42/10%)]">
                  <Avatar
                    alt={`Xem trước ảnh đại diện của ${previewFullName}`}
                    name={previewFullName}
                    sizeClassName="h-24 w-24 md:h-28 md:w-28"
                    src={formValues.avatarUrl}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-lg font-semibold text-primary">{previewFullName}</p>
                  <p className="truncate text-sm text-secondary">{avatarStatusText}</p>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-secondary">
                      PNG/JPG/WEBP
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-secondary">
                      Tối đa 700 KB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <input
              ref={avatarFileInputRef}
              accept={ACCEPTED_AVATAR_FILE_TYPES.join(",")}
              className="hidden"
              id="profile-avatar-file"
              type="file"
              onChange={handleAvatarFileChange}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                disabled={isProcessingAvatar || isSubmitting}
                type="button"
                variant="secondary"
                onClick={handleAvatarPickerClick}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiCamera className="h-4 w-4" />
                  <span>{isProcessingAvatar ? "Đang xử lý ảnh..." : "Chọn ảnh từ máy"}</span>
                </span>
              </Button>

              <Button
                disabled={isProcessingAvatar || isSubmitting || !formValues.avatarUrl}
                type="button"
                variant="ghost"
                onClick={handleResetAvatar}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiRotateCcw className="h-4 w-4" />
                  <span>Dùng avatar mặc định</span>
                </span>
              </Button>
            </div>

            {avatarUploadError ? <p className="eg-error-text">{avatarUploadError}</p> : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-5 shadow-[0_18px_46px_rgb(15_23_42/7%)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-sky-100 bg-sky-50 text-sky-700">
                <FiEdit3 className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-primary">Thông tin</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                error={validationErrors.fullName}
                id="profile-full-name"
                label="Họ và tên"
                onChange={(event) => handleFieldChange("fullName", event.target.value)}
                placeholder="Nhập họ và tên"
                required
                value={formValues.fullName}
              />
              <TextInput
                error={validationErrors.email}
                id="profile-email"
                label="Email"
                onChange={(event) => handleFieldChange("email", event.target.value)}
                placeholder="Nhập email"
                required
                type="email"
                value={formValues.email}
              />
            </div>
          </Card>

          <Card className="space-y-5 shadow-[0_18px_46px_rgb(15_23_42/7%)]">
            <h2 className="text-xl font-semibold tracking-tight text-primary">Trạng thái</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-border bg-neutral px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Vai trò</p>
                <p className="mt-2 text-sm font-semibold text-primary">{roleLabel}</p>
              </div>
              <div className="rounded-[20px] border border-border bg-neutral px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Tài khoản</p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {effectiveProfile?.isActive ? "Đang hoạt động" : "Đã khóa"}
                </p>
              </div>
              <div className="rounded-[20px] border border-border bg-neutral px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Tạo lúc</p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {formatShortDateTime(effectiveProfile?.createdAt)}
                </p>
              </div>
              <div className="rounded-[20px] border border-border bg-neutral px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Cập nhật</p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {formatShortDateTime(effectiveProfile?.updatedAt || effectiveProfile?.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.92)_100%)] shadow-[0_18px_46px_rgb(15_23_42/7%)]">
            <h2 className="text-xl font-semibold tracking-tight text-primary">Lưu thay đổi</h2>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={isSubmitting || !isFormDirty}
                type="button"
                variant="secondary"
                onClick={handleResetForm}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiRotateCcw className="h-4 w-4" />
                  <span>Hoàn tác</span>
                </span>
              </Button>

              <Button
                className="sm:min-w-[190px]"
                disabled={isSubmitting || isProcessingAvatar || !isFormDirty}
                type="submit"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiSave className="h-4 w-4" />
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </span>
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
