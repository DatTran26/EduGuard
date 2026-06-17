import CheckboxField from "../../../components/forms/CheckboxField";

export default function ExamFormMonitoringSection({ formValues, onFieldChange, onSettingChange }) {
  return (
    <section className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">Giám sát</h4>
        <p className="text-sm leading-6 text-secondary">
          Các tuỳ chọn này hỗ trợ anti-cheat và trải nghiệm làm bài trong môi trường thi trực tuyến.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CheckboxField
          checked={formValues.enableAntiCheat}
          id="exam-enable-anti-cheat"
          label="Bật anti-cheat"
          onChange={(event) => onFieldChange("enableAntiCheat", event.target.checked)}
        />
        <CheckboxField
          checked={formValues.settings.requireFullscreen}
          id="exam-require-fullscreen"
          label="Yêu cầu fullscreen"
          onChange={(event) => onSettingChange("requireFullscreen", event.target.checked)}
        />
      </div>

      <div className="rounded-[12px] border border-border bg-surface px-4 py-4 text-sm leading-6 text-secondary">
        Khi bật anti-cheat, giáo viên có thể theo dõi log vi phạm và điểm nghi ngờ ngay trên màn chi
        tiết đề thi. Fullscreen giúp giảm chuyển ngữ cảnh trong lúc làm bài.
      </div>
    </section>
  );
}