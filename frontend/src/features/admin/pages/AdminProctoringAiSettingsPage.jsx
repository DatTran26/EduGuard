import { useEffect, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
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

  return (
    <div className="space-y-6">
      <PageHeader
        description="Cấu hình ngưỡng YOLO và URL dịch vụ AI. API backend proxy frame tới service này."
        eyebrow="Admin"
        title="Cấu hình AI giám sát"
      />

      <Card className="p-6">
        {isLoading ? (
          <SkeletonForm fields={6} />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              <input
                checked={form.enableYoloDetection}
                onChange={(event) => updateField("enableYoloDetection", event.target.checked)}
                type="checkbox"
              />
              Bật phát hiện YOLO
            </label>

            <Input
              label="AI service base URL"
              onChange={(event) => updateField("aiServiceBaseUrl", event.target.value)}
              value={form.aiServiceBaseUrl}
            />
            <Input
              label="Ngưỡng điện thoại"
              onChange={(event) => updateField("phoneVisibleMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.phoneVisibleMinConfidence}
            />
            <Input
              label="Ngưỡng sách/tài liệu"
              onChange={(event) => updateField("bookVisibleMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.bookVisibleMinConfidence}
            />
            <Input
              label="Ngưỡng người thứ hai"
              onChange={(event) => updateField("secondPersonMinConfidence", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.secondPersonMinConfidence}
            />
            <Input
              label="Chu kỳ detect (giây)"
              onChange={(event) => updateField("detectionIntervalSeconds", Number(event.target.value))}
              min="2"
              type="number"
              value={form.detectionIntervalSeconds}
            />

            <Button disabled={isSaving} type="submit">
              {isSaving ? "Đang lưu…" : "Lưu cấu hình"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
