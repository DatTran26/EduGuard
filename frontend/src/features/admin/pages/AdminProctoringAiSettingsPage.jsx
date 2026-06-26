import { useEffect, useState } from "react";
import { FiCpu, FiInfo, FiSave, FiSettings, FiSliders } from "react-icons/fi";
import { proctoringApi } from "../../../api/proctoringApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import CheckboxField from "../../../components/forms/CheckboxField";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { SkeletonForm } from "../../../components/common/Skeleton";

const defaultForm = {
  enableYoloDetection: true,
  aiServiceBaseUrl: "http://127.0.0.1:8800",
  phoneVisibleMinConfidence: 0.65,
  bookVisibleMinConfidence: 0.6,
  secondPersonMinConfidence: 0.65,
  detectionIntervalSeconds: 4,
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

export default function AdminProctoringAiSettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    proctoringApi
      .getAiSettings()
      .then((response) => {
        if (isMounted && response.data) {
          setForm({ ...defaultForm, ...response.data });
        }
      })
      .catch((error) => {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được cấu hình AI",
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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await proctoringApi.updateAiSettings(form);
      setForm({ ...defaultForm, ...response.data });
      showToast({ tone: "success", title: "Đã lưu cấu hình AI giám sát" });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu thất bại", message: error.message });
    } finally {
      setIsSaving(false);
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
          <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
            Quản trị viên
          </p>
          <PageHeader
            description="Cấu hình URL dịch vụ AI và ngưỡng phát hiện YOLO. Backend sẽ proxy khung hình camera tới dịch vụ này khi giám sát thi."
            title="Cấu hình AI giám sát"
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
                <h2 className="text-base font-semibold text-primary">Kết nối dịch vụ</h2>
                <p className="text-sm text-secondary">Địa chỉ FastAPI YOLO mà backend gọi tới.</p>
              </div>
            </div>

            <TextInput
              id="proctoring-ai-service-url"
              label="URL dịch vụ AI"
              helperText="Ví dụ: http://127.0.0.1:8800 (local) hoặc http://proctoring-ai:8800 (Docker)."
              onChange={(event) => updateField("aiServiceBaseUrl", event.target.value)}
              placeholder="http://127.0.0.1:8800"
              value={form.aiServiceBaseUrl}
            />
          </Card>

          <Card className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-sunken text-info">
                <FiCpu size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-primary">Phát hiện YOLO</h2>
                <p className="text-sm text-secondary">Bật/tắt phân tích khung hình bằng mô hình YOLO.</p>
              </div>
            </div>

            <CheckboxField
              checked={form.enableYoloDetection}
              helperText="Khi tắt, backend không gửi frame tới dịch vụ AI — chỉ giám sát thủ công qua camera."
              id="proctoring-ai-enable-yolo"
              label="Bật phát hiện YOLO"
              onChange={(event) => updateField("enableYoloDetection", event.target.checked)}
            />
          </Card>
        </div>

        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-sunken text-info">
              <FiSliders size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-primary">Ngưỡng tin cậy</h2>
              <p className="text-sm text-secondary">
                Giá trị từ 0 đến 1 — càng cao thì càng ít cảnh báo nhưng dễ bỏ sót vi phạm.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              id="proctoring-ai-phone-confidence"
              label="Ngưỡng điện thoại"
              helperText="Độ tin cậy tối thiểu để gắn nhãn phát hiện điện thoại."
              max="1"
              min="0"
              onChange={(event) => updateField("phoneVisibleMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.phoneVisibleMinConfidence}
            />
            <TextInput
              id="proctoring-ai-book-confidence"
              label="Ngưỡng sách / tài liệu"
              helperText="Độ tin cậy tối thiểu khi phát hiện sách hoặc tài liệu lận."
              max="1"
              min="0"
              onChange={(event) => updateField("bookVisibleMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.bookVisibleMinConfidence}
            />
            <TextInput
              id="proctoring-ai-second-person-confidence"
              label="Ngưỡng người thứ hai"
              helperText="Độ tin cậy tối thiểu khi phát hiện thêm người trong khung hình."
              max="1"
              min="0"
              onChange={(event) => updateField("secondPersonMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.secondPersonMinConfidence}
            />
            <TextInput
              id="proctoring-ai-detection-interval"
              label="Chu kỳ phát hiện (giây)"
              helperText="Khoảng thời gian giữa hai lần gửi frame tới dịch vụ AI (tối thiểu 2 giây)."
              min="2"
              onChange={(event) => updateField("detectionIntervalSeconds", Number(event.target.value))}
              type="number"
              value={form.detectionIntervalSeconds}
            />
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-neutral px-5 py-4">
          <div className="flex items-start gap-3 text-sm leading-6 text-secondary">
            <FiInfo className="mt-0.5 shrink-0 text-info" size={18} />
            <p>
              Trọng số mô hình <code className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs">.pt</code> được
              cấu hình trên máy chủ AI, không qua màn hình này. Cảnh báo chỉ hỗ trợ giáo viên xem xét.
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
