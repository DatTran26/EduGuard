import { useEffect, useState } from "react";
import { FiInfo, FiMail, FiSave, FiSend, FiSettings } from "react-icons/fi";
import { adminSettingsApi } from "../../../api/adminSettingsApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import CheckboxField from "../../../components/forms/CheckboxField";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";

const defaultForm = {
  enabled: false,
  host: "smtp.gmail.com",
  port: 587,
  useSsl: true,
  username: "",
  password: "",
  hasPassword: false,
  fromAddress: "",
  fromName: "EduGuard",
  requireOnRegister: true,
  otpLength: 6,
  otpExpiryMinutes: 10,
  resendCooldownSeconds: 60,
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-3xl border border-border bg-surface-sunken p-6" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 rounded-2xl border border-border bg-surface p-6" />
        <div className="h-72 rounded-2xl border border-border bg-surface p-6" />
      </div>
    </div>
  );
}

export default function AdminEmailSettingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [testRecipient, setTestRecipient] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (user?.email && !testRecipient) {
      setTestRecipient(user.email);
    }
  }, [testRecipient, user?.email]);

  useEffect(() => {
    let isMounted = true;
    adminSettingsApi
      .getEmailSettings()
      .then((response) => {
        if (isMounted && response.data) {
          setForm({ ...defaultForm, ...response.data, password: "" });
        }
      })
      .catch((error) => {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được cấu hình email",
            message: error.message,
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        enabled: form.enabled,
        host: form.host.trim(),
        port: Number(form.port) || 587,
        useSsl: form.useSsl,
        username: form.username.trim(),
        password: form.password.trim() ? form.password : null,
        fromAddress: form.fromAddress.trim(),
        fromName: form.fromName.trim(),
        requireOnRegister: form.requireOnRegister,
        otpLength: Number(form.otpLength) || 6,
        otpExpiryMinutes: Number(form.otpExpiryMinutes) || 10,
        resendCooldownSeconds: Number(form.resendCooldownSeconds) || 60,
      };
      const response = await adminSettingsApi.updateEmailSettings(payload);
      setForm({ ...defaultForm, ...response.data, password: "" });
      showToast({ tone: "success", title: "Đã lưu cấu hình email" });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu thất bại", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendTestEmail() {
    setIsSendingTest(true);
    try {
      await adminSettingsApi.sendTestEmail({
        recipientEmail: testRecipient.trim(),
      });
      showToast({
        tone: "success",
        title: "Đã gửi email thử nghiệm",
        message: `Kiểm tra hộp thư ${testRecipient.trim()}.`,
      });
    } catch (error) {
      showToast({ tone: "danger", title: "Gửi thử thất bại", message: error.message });
    } finally {
      setIsSendingTest(false);
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(99 102 241 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative space-y-2">
          <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
            Quản trị viên
          </p>
          <PageHeader
            description="Cấu hình tài khoản Gmail/SMTP dùng để gửi mã OTP xác thực khi đăng ký tài khoản mới."
            title="Cấu hình email Gmail"
          />
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-sunken text-info">
                <FiSettings size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-primary">Máy chủ Gmail / SMTP</h2>
                <p className="text-sm text-secondary">
                  Gmail: bật xác minh 2 bước và tạo App Password tại Google Account.
                </p>
              </div>
            </div>

            <CheckboxField
              checked={form.enabled}
              helperText="Khi tắt, hệ thống không gửi email thật (Development vẫn log OTP ra console)."
              id="email-settings-enabled"
              label="Bật gửi email"
              onChange={(event) => updateField("enabled", event.target.checked)}
            />

            <TextInput
              id="email-settings-host"
              label="Máy chủ SMTP"
              onChange={(event) => updateField("host", event.target.value)}
              placeholder="smtp.gmail.com"
              value={form.host}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="email-settings-port"
                inputMode="numeric"
                label="Cổng"
                onChange={(event) => updateField("port", event.target.value.replace(/\D/g, ""))}
                value={form.port}
              />
              <div className="flex items-end pb-2">
                <CheckboxField
                  checked={form.useSsl}
                  id="email-settings-use-ssl"
                  label="Dùng SSL/TLS"
                  onChange={(event) => updateField("useSsl", event.target.checked)}
                />
              </div>
            </div>

            <TextInput
              autoComplete="username"
              id="email-settings-username"
              label="Tài khoản Gmail"
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="your-email@gmail.com"
              type="email"
              value={form.username}
            />

            <TextInput
              autoComplete="new-password"
              id="email-settings-password"
              label="Mật khẩu ứng dụng (App Password)"
              helperText={
                form.hasPassword && !form.password
                  ? "Đã lưu mật khẩu. Nhập giá trị mới nếu muốn thay đổi."
                  : "Dùng App Password 16 ký tự từ Google, không dùng mật khẩu đăng nhập Gmail thường."
              }
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={form.hasPassword ? "••••••••••••••••" : "Nhập App Password"}
              type="password"
              value={form.password}
            />
          </Card>

          <Card className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-sunken text-info">
                <FiMail size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-primary">Người gửi & xác thực</h2>
                <p className="text-sm text-secondary">Thông tin hiển thị trên email OTP gửi cho người đăng ký.</p>
              </div>
            </div>

            <TextInput
              id="email-settings-from-address"
              label="Email người gửi"
              onChange={(event) => updateField("fromAddress", event.target.value)}
              placeholder="noreply@yourdomain.com"
              type="email"
              value={form.fromAddress}
            />

            <TextInput
              id="email-settings-from-name"
              label="Tên hiển thị"
              onChange={(event) => updateField("fromName", event.target.value)}
              placeholder="EduGuard"
              value={form.fromName}
            />

            <CheckboxField
              checked={form.requireOnRegister}
              helperText="Khi bật, user mới phải nhập OTP trước khi đăng nhập."
              id="email-settings-require-verification"
              label="Bắt buộc xác thực email khi đăng ký"
              onChange={(event) => updateField("requireOnRegister", event.target.checked)}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                id="email-settings-otp-length"
                inputMode="numeric"
                label="Độ dài OTP"
                onChange={(event) => updateField("otpLength", event.target.value.replace(/\D/g, ""))}
                value={form.otpLength}
              />
              <TextInput
                id="email-settings-otp-expiry"
                inputMode="numeric"
                label="Hết hạn (phút)"
                onChange={(event) => updateField("otpExpiryMinutes", event.target.value.replace(/\D/g, ""))}
                value={form.otpExpiryMinutes}
              />
              <TextInput
                id="email-settings-resend-cooldown"
                inputMode="numeric"
                label="Chờ gửi lại (giây)"
                onChange={(event) => updateField("resendCooldownSeconds", event.target.value.replace(/\D/g, ""))}
                value={form.resendCooldownSeconds}
              />
            </div>
          </Card>
        </div>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-sunken text-info">
              <FiSend size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-primary">Gửi email thử nghiệm</h2>
              <p className="text-sm text-secondary">Kiểm tra cấu hình Gmail trước khi mở đăng ký cho user.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <TextInput
                id="email-settings-test-recipient"
                label="Gửi thử tới"
                onChange={(event) => setTestRecipient(event.target.value)}
                placeholder="admin@example.com"
                type="email"
                value={testRecipient}
              />
            </div>
            <Button
              className="inline-flex items-center gap-2 md:mb-1"
              disabled={isSendingTest || !testRecipient.trim()}
              onClick={handleSendTestEmail}
              type="button"
            >
              <FiSend size={16} />
              {isSendingTest ? "Đang gửi…" : "Gửi thử"}
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-neutral px-5 py-4">
          <div className="flex items-start gap-3 text-sm leading-6 text-secondary">
            <FiInfo className="mt-0.5 shrink-0 text-info" size={18} />
            <p>
              Cấu hình được lưu trong database và có hiệu lực ngay sau khi lưu. Gmail yêu cầu App Password
              khi bật xác minh 2 bước — không dùng mật khẩu đăng nhập thông thường.
            </p>
          </div>
          <Button className="inline-flex items-center gap-2" disabled={isSaving} type="submit">
            <FiSave size={16} />
            {isSaving ? "Đang lưu…" : "Lưu cấu hình"}
          </Button>
        </div>
      </form>
    </div>
  );
}
