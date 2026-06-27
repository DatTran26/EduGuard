import { useEffect, useState } from "react";
import { FiCpu, FiEye, FiEyeOff, FiSave, FiSettings, FiPlay } from "react-icons/fi";
import { questionBankApi } from "../../../api/questionBankApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";

const defaultForm = {
  apiKey: "",
  model: "gpt-5.4",
  baseUrl: "https://api.openai.com/v1",
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-3xl border border-border bg-surface-sunken p-6" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-56 rounded-2xl border border-border bg-surface p-6" />
        <div className="h-56 rounded-2xl border border-border bg-surface p-6" />
      </div>
      <div className="h-72 rounded-2xl border border-border bg-surface p-6" />
    </div>
  );
}

export default function AdminGptSettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    let isMounted = true;
    questionBankApi
      .getGptSettings()
      .then((response) => {
        if (isMounted && response.data) {
          setForm({ ...defaultForm, ...response.data });
        }
      })
      .catch((error) => {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được cấu hình GPT",
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

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await questionBankApi.saveGptSettings(form);
      if (response.data) {
        setForm({ ...defaultForm, ...response.data });
      }
      showToast({ tone: "success", title: "Cập nhật cấu hình thành công" });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu thất bại", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    try {
      const response = await questionBankApi.testGptConnection(form);
      showToast({
        tone: "success",
        title: "Kiểm tra kết nối thành công",
        message: response.message || "Đã kết nối thành công tới OpenAI API!",
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Kiểm tra kết nối thất bại",
        message: error.message || "Vui lòng kiểm tra lại API Key hoặc Base URL.",
      });
    } finally {
      setIsTesting(false);
    }
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
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
          <p className="inline-flex rounded-full border border-primary/20 bg-primary-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Cấu hình Hệ thống
          </p>
          <PageHeader
            title="Cấu hình Mô hình GPT"
            description="Quản lý thông tin kết nối API OpenAI GPT phục vụ tính năng sinh đề thi và câu hỏi tự động."
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <FiCpu className="text-primary text-xl" />
                <h3 className="text-base font-semibold text-foreground">Thông tin kết nối API</h3>
              </div>

              <div className="relative">
                <TextInput
                  id="apiKey"
                  label="OpenAI API Key"
                  placeholder={form.apiKey ? "••••••••••••••••" : "Nhập OpenAI API Key..."}
                  value={form.apiKey}
                  onChange={(e) => updateField("apiKey", e.target.value)}
                  type={showApiKey ? "text" : "password"}
                  helperText="API Key được lưu bảo mật trong cơ sở dữ liệu và chỉ Admin mới có thể cấu hình."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground focus:outline-none"
                  title={showApiKey ? "Ẩn API Key" : "Hiển thị API Key"}
                >
                  {showApiKey ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  id="model"
                  label="Model"
                  placeholder="Ví dụ: gpt-5.4"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  required
                  helperText="Mô hình GPT mặc định để sinh câu hỏi (Ví dụ: gpt-5.4, gpt-4o, v.v.)."
                />

                <TextInput
                  id="baseUrl"
                  label="Base URL"
                  placeholder="Ví dụ: https://api.openai.com/v1"
                  value={form.baseUrl}
                  onChange={(e) => updateField("baseUrl", e.target.value)}
                  required
                  helperText="Địa chỉ cổng API OpenAI hoặc proxy tương thích."
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <FiSettings className="text-primary text-xl" />
                <h3 className="text-base font-semibold text-foreground">Hành động</h3>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full flex justify-center items-center gap-2 py-2.5"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSaving}
                >
                  <FiPlay className={isTesting ? "animate-spin" : ""} />
                  {isTesting ? "Đang kết nối..." : "Test API Connection"}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center gap-2 py-2.5"
                  disabled={isSaving || isTesting}
                >
                  <FiSave />
                  {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
