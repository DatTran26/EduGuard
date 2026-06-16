import CheckboxField from "../../../components/forms/CheckboxField";
import TextInput from "../../../components/forms/TextInput";

export default function ExamFormConfigSection({
  formValues,
  exam,
  isEditingExam,
  onFieldChange,
  onSettingChange,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          id="exam-max-attempts"
          label="Số lần làm tối đa"
          min="1"
          onChange={(event) => onSettingChange("maxAttempts", event.target.value)}
          required
          type="number"
          value={formValues.settings.maxAttempts}
        />
        <div className="rounded-[12px] border border-border bg-neutral px-4 py-4">
          <p className="text-sm font-semibold text-primary">Trạng thái hiển thị</p>
          {exam?.isPublished ? (
            <p className="mt-2 text-sm text-secondary">Đã publish</p>
          ) : (
            <div className="mt-3">
              <CheckboxField
                checked={formValues.isPublished}
                id="exam-is-published"
                label={isEditingExam ? "Publish sau khi lưu" : "Publish ngay khi tạo"}
                onChange={(event) => onFieldChange("isPublished", event.target.checked)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">Cấu hình đề thi</p>
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
    </div>
  );
}
