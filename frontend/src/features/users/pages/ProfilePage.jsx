import { useEffect, useRef, useState } from "react";
import { userApi } from "../../../api/userApi";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import TextInput from "../../../components/forms/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { formatShortDateTime } from "../../../utils/formatDate";

const ACCEPTED_AVATAR_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_FILE_SIZE_BYTES = 700 * 1024;

// Hàm này chuyển dữ liệu profile lấy từ API sang state form để việc chỉnh sửa dễ kiểm soát hơn.
function buildProfileFormValues(profile) {
  return {
    avatarUrl: profile?.avatarUrl ?? "",
    email: profile?.email ?? "",
    fullName: profile?.fullName ?? "",
  };
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

  // Hàm này submit thay đổi hồ sơ cá nhân rồi đồng bộ lại session user đang đăng nhập.
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedProfile = await updateProfile(formValues);
      setProfile(updatedProfile);
      setFormValues(buildProfileFormValues(updatedProfile));
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
    return (
      <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
        Đang tải hồ sơ cá nhân...
      </div>
    );
  }

  const previewFullName = formValues.fullName || profile?.fullName || user?.fullName || "Người dùng EduGuard";
  const previewEmail = formValues.email || profile?.email || user?.email || "user@eduguard.local";
  const avatarStatusText = selectedAvatarFileName
    ? `Ảnh đã chọn: ${selectedAvatarFileName}`
    : formValues.avatarUrl
      ? "Đang xem trước ảnh đại diện hiện tại"
      : "Đang dùng avatar mặc định của hệ thống";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getRoleLabel(user?.role)}
        title="Hồ sơ cá nhân"
        description="Xem và cập nhật thông tin cơ bản của tài khoản."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-primary">Cập nhật thông tin</h3>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextInput
              id="profile-full-name"
              label="Họ và tên"
              onChange={(event) => handleFieldChange("fullName", event.target.value)}
              placeholder="Nhập họ và tên"
              required
              value={formValues.fullName}
            />
            <TextInput
              id="profile-email"
              label="Email"
              onChange={(event) => handleFieldChange("email", event.target.value)}
              placeholder="Nhập email"
              required
              type="email"
              value={formValues.email}
            />

            <div className="space-y-3">
              <label className="eg-label" htmlFor="profile-avatar-file">
                Ảnh đại diện
              </label>
              <div className="flex items-center gap-4 rounded-[18px] border border-border bg-neutral p-4">
                <Avatar
                  alt={`Xem trước ảnh đại diện của ${previewFullName}`}
                  name={previewFullName}
                  sizeClassName="h-16 w-16"
                  src={formValues.avatarUrl}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold text-primary">{avatarStatusText}</p>
                  <p className="text-sm leading-6 text-secondary">
                    Hỗ trợ PNG, JPG, WEBP. Dung lượng tối đa 700 KB.
                  </p>
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

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={isProcessingAvatar || isSubmitting}
                  type="button"
                  variant="secondary"
                  onClick={handleAvatarPickerClick}
                >
                  {isProcessingAvatar ? "Đang xử lý ảnh..." : "Tải ảnh từ máy"}
                </Button>
                <Button
                  disabled={isProcessingAvatar || isSubmitting || !formValues.avatarUrl}
                  type="button"
                  variant="ghost"
                  onClick={handleResetAvatar}
                >
                  Dùng avatar mặc định
                </Button>
              </div>

              {avatarUploadError ? (
                <p className="eg-error-text">{avatarUploadError}</p>
              ) : (
                <p className="eg-helper-text">
                  Ảnh được lưu cục bộ trong trình duyệt ở phiên bản mock hiện tại.
                </p>
              )}
            </div>

            <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Thông tin tài khoản</h3>

          <div className="flex items-center gap-4 rounded-[18px] border border-border bg-neutral p-4">
            <Avatar
              alt={`Ảnh đại diện của ${previewFullName}`}
              name={previewFullName}
              sizeClassName="h-[72px] w-[72px]"
              src={formValues.avatarUrl}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-primary">{previewFullName}</p>
              <p className="truncate text-sm text-secondary">{previewEmail}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-secondary">
            <p>
              <span className="font-semibold text-primary">Vai trò:</span> {getRoleLabel(profile?.role)}
            </p>
            <p>
              <span className="font-semibold text-primary">Trạng thái:</span>{" "}
              {profile?.isActive ? "Đang hoạt động" : "Đã khóa"}
            </p>
            <p>
              <span className="font-semibold text-primary">Tạo lúc:</span>{" "}
              {formatShortDateTime(profile?.createdAt)}
            </p>
            <p>
              <span className="font-semibold text-primary">Cập nhật:</span>{" "}
              {formatShortDateTime(profile?.updatedAt || profile?.createdAt)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
