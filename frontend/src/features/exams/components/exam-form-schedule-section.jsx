import TextInput from "../../../components/forms/TextInput";

function formatDateTimeLocalLabel(value) {
  return String(value || "").replace("T", " ");
}

export default function ExamFormScheduleSection({
  errors = {},
  expectedEndTimeValue = "",
  formValues,
  isEndTimeManuallyEdited = false,
  onDurationChange,
  onEndTimeChange,
  onStartTimeChange,
  showDescriptions = true,
}) {
  const endTimeHelperText = isEndTimeManuallyEdited
    ? "Bạn đang dùng giờ đóng đề thủ công. Xóa giá trị để quay về mốc tự động theo giờ mở đề + thời lượng."
    : "Mặc định hệ thống tự đặt giờ đóng đề = giờ mở đề + thời gian làm bài. Bạn vẫn có thể chỉnh muộn hơn khi cần.";

  return (
    <section className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">Lịch thi</h4>
        {showDescriptions ? (
          <p className="text-sm leading-6 text-secondary">
            Theo giờ Việt Nam (UTC+7). Frontend hiển thị theo múi giờ Việt Nam và gửi backend dưới
            dạng UTC để tránh lệch giờ giữa các máy.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TextInput
          id="exam-duration"
          label="Thời gian làm bài (phút)"
          error={errors.durationMinutes}
          helperText={showDescriptions ? "Thời lượng này được dùng để tính mốc đóng đề tự động khi bạn đã nhập giờ mở đề." : undefined}
          min="1"
          onChange={(event) => onDurationChange(event.target.value)}
          required
          type="number"
          value={formValues.durationMinutes}
        />
        <TextInput
          id="exam-start-time"
          label="Thời gian mở đề"
          helperText={showDescriptions ? "Theo giờ Việt Nam (UTC+7)." : undefined}
          onChange={(event) => onStartTimeChange(event.target.value)}
          type="datetime-local"
          value={formValues.startTime}
        />
        <TextInput
          id="exam-end-time"
          label="Thời gian đóng đề"
          error={errors.endTime}
          helperText={showDescriptions ? endTimeHelperText : undefined}
          onChange={(event) => onEndTimeChange(event.target.value)}
          type="datetime-local"
          value={formValues.endTime}
        />
      </div>

      {showDescriptions && expectedEndTimeValue ? (
        <div className="rounded-[12px] border border-border bg-surface px-4 py-3 text-sm text-secondary">
          Mốc đóng đề tự động theo cấu hình hiện tại:{" "}
          <span className="font-mono text-primary">{formatDateTimeLocalLabel(expectedEndTimeValue)}</span>
        </div>
      ) : null}
    </section>
  );
}
