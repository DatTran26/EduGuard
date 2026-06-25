import CheckboxField from "../../../components/forms/CheckboxField";

export default function ExamFormMonitoringSection({
  formValues,
  onFieldChange,
  onSettingChange,
  showDescriptions = true,
}) {
  return (
    <section className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">Giám sát</h4>
        {showDescriptions ? (
          <p className="text-sm leading-6 text-secondary">
            Các tuỳ chọn này hỗ trợ anti-cheat, camera live và trải nghiệm làm bài trong môi trường
            thi trực tuyến.
          </p>
        ) : null}
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
        <CheckboxField
          checked={formValues.settings.requireCamera}
          id="exam-require-camera"
          label="Yêu cầu camera"
          onChange={(event) => onSettingChange("requireCamera", event.target.checked)}
        />
        <CheckboxField
          checked={formValues.settings.enableLiveProctoring}
          id="exam-enable-live-proctoring"
          label="Bật phòng giám sát live"
          onChange={(event) => onSettingChange("enableLiveProctoring", event.target.checked)}
        />
        <CheckboxField
          checked={formValues.settings.enableCameraProctoring}
          id="exam-enable-camera-proctoring"
          label="Giám sát camera trong lúc thi"
          onChange={(event) => onSettingChange("enableCameraProctoring", event.target.checked)}
        />
        <CheckboxField
          checked={formValues.settings.enableExternalDeviceDetection}
          id="exam-enable-external-device-detection"
          label="Phát hiện dấu hiệu thiết bị ngoài (AI)"
          onChange={(event) =>
            onSettingChange("enableExternalDeviceDetection", event.target.checked)
          }
        />
        <CheckboxField
          checked={formValues.settings.captureSnapshotOnViolation}
          id="exam-capture-snapshot-on-violation"
          label="Tự chụp ảnh khi có dấu hiệu rủi ro"
          onChange={(event) =>
            onSettingChange("captureSnapshotOnViolation", event.target.checked)
          }
        />
      </div>

      {showDescriptions ? (
        <div className="rounded-[12px] border border-border bg-surface px-4 py-4 text-sm leading-6 text-secondary">
          Khi bật giám sát live, giáo viên có thể xem camera sinh viên trong Phòng giám sát bài thi.
          Các cảnh báo chỉ hỗ trợ giáo viên xem xét, không tự kết luận gian lận.
        </div>
      ) : null}
    </section>
  );
}
