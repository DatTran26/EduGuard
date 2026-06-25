import CheckboxField from "../../../components/forms/CheckboxField";
import TextInput from "../../../components/forms/TextInput";

export default function ExamFormConfigSection({
  errors = {},
  formValues,
  onSettingChange,
  showDescriptions = true,
}) {
  return (
    <section className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-primary">Cấu hình làm bài</h4>
        {showDescriptions ? (
          <p className="text-sm leading-6 text-secondary">
            Thiết lập số lượt làm, thứ tự hiển thị câu hỏi và thời điểm sinh viên được xem kết quả.
          </p>
        ) : null}
      </div>

      <div className={showDescriptions ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
        <TextInput
          id="exam-max-attempts"
          label="Số lần làm tối đa"
          error={errors.maxAttempts}
          min="1"
          onChange={(event) => onSettingChange("maxAttempts", event.target.value)}
          required
          type="number"
          value={formValues.settings.maxAttempts}
        />
        {showDescriptions ? (
          <div className="rounded-[12px] border border-border bg-surface px-4 py-4">
            <p className="text-sm font-semibold text-primary">Luồng publish</p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Đề mới sẽ được lưu ở trạng thái nháp. Sau khi đã có câu hỏi hợp lệ, hãy dùng nút
              publish ở trang chi tiết để phát hành đề.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">Hành vi trong bài thi</p>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField
            checked={formValues.settings.shuffleQuestions}
            id="exam-shuffle-questions"
            label="Random câu hỏi"
            onChange={(event) => onSettingChange("shuffleQuestions", event.target.checked)}
          />
          <CheckboxField
            checked={formValues.settings.shuffleAnswers}
            id="exam-shuffle-answers"
            label="Random đáp án"
            onChange={(event) => onSettingChange("shuffleAnswers", event.target.checked)}
          />
          <CheckboxField
            checked={formValues.settings.showResultAfterSubmit}
            id="exam-show-result"
            label="Hiển thị kết quả sau khi nộp"
            onChange={(event) => onSettingChange("showResultAfterSubmit", event.target.checked)}
          />
        </div>
      </div>
    </section>
  );
}
