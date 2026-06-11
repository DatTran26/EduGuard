import { useEffect, useState } from "react";
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

// Hàm này chuyển dữ liệu profile lấy từ API sang state form để việc chỉnh sửa dễ kiểm soát hơn.
function buildProfileFormValues(profile) {
  return {
    avatarUrl: profile?.avatarUrl ?? "",
    email: profile?.email ?? "",
    fullName: profile?.fullName ?? "",
  };
}

// Trang này cho phép người dùng xem và sửa thông tin cá nhân của chính mình.
export default function ProfilePage() {
  const { updateProfile, user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState(buildProfileFormValues(user));
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
            <TextInput
              id="profile-avatar-url"
              label="Avatar URL"
              onChange={(event) => handleFieldChange("avatarUrl", event.target.value)}
              placeholder="https://..."
              value={formValues.avatarUrl}
            />

            <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Thông tin tài khoản</h3>

          <div className="flex items-center gap-4 rounded-[18px] border border-border bg-neutral p-4">
            <Avatar
              alt={`Ảnh đại diện của ${profile?.fullName ?? "người dùng"}`}
              name={profile?.fullName ?? ""}
              sizeClassName="h-[72px] w-[72px]"
              src={profile?.avatarUrl ?? ""}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-primary">{profile?.fullName}</p>
              <p className="truncate text-sm text-secondary">{profile?.email}</p>
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
