import { useRef } from "react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";

function formatFileSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), units.length - 1);
  const normalizedValue = sizeInBytes / 1024 ** unitIndex;

  return `${normalizedValue >= 10 ? normalizedValue.toFixed(0) : normalizedValue.toFixed(1)} ${units[unitIndex]}`;
}

export default function QuestionImportPanel({
  acceptedExtensions = [],
  commitLabel = "Commit vào đề",
  errorMessage = "",
  infoMessage = "",
  isCommitDisabled = false,
  isDisabled = false,
  isSubmitting = false,
  maxFileSizeLabel = "5 MB",
  onClearFile,
  onCommitImport,
  onFileSelected,
  showCommitButton = true,
  statusLabel = "Review trước khi commit",
  stagedFile = null,
  submittingLabel = "Đang commit...",
}) {
  const fileInputRef = useRef(null);
  const acceptedLabel = acceptedExtensions.join(", ");

  function handleTriggerFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const [nextFile] = Array.from(event.target.files || []);
    onFileSelected(nextFile ?? null);
    event.target.value = "";
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Nhập từ file</Badge>
          <Badge variant={isDisabled ? "neutral" : "info"}>
            {isDisabled ? "Lưu đề trước" : statusLabel}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-primary">Nhập ngân hàng câu hỏi</h3>
      </div>

      <input
        ref={fileInputRef}
        accept={acceptedExtensions.join(",")}
        className="sr-only"
        onChange={handleFileChange}
        type="file"
      />

      <button
        className="eg-question-import-dropzone"
        disabled={isDisabled || isSubmitting}
        onClick={handleTriggerFilePicker}
        type="button"
      >
        <span className="eg-question-import-dropzone-icon" aria-hidden="true">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 16.5V5.25m0 0 4.5 4.5M12 5.25 7.5 9.75M4.5 16.5v1.125A1.875 1.875 0 0 0 6.375 19.5h11.25A1.875 1.875 0 0 0 19.5 17.625V16.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span className="space-y-1 text-left">
          <span className="block text-sm font-semibold text-primary">
            {stagedFile ? "Chọn file khác" : "Chọn file để review"}
          </span>
          <span className="block text-sm text-secondary">
            Hỗ trợ {acceptedLabel} • tối đa {maxFileSizeLabel}
          </span>
        </span>
      </button>

      <div className="flex flex-wrap gap-2">
        {acceptedExtensions.map((extension) => (
          <Badge key={extension} variant="neutral">
            {extension}
          </Badge>
        ))}
      </div>

      {stagedFile ? (
        <div className="rounded-[18px] border border-border bg-neutral p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">File đang chờ review</p>
              <p className="text-sm text-secondary">{stagedFile.name}</p>
            </div>
            <Badge variant="info">{formatFileSize(stagedFile.size)}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {showCommitButton ? (
              <Button disabled={isDisabled || isSubmitting || isCommitDisabled} onClick={onCommitImport}>
                {isSubmitting ? submittingLabel : commitLabel}
              </Button>
            ) : null}
            <Button disabled={isDisabled || isSubmitting} onClick={onClearFile} variant="secondary">
              Bỏ file này
            </Button>
          </div>
        </div>
      ) : null}

      {infoMessage ? (
        <div className="rounded-[16px] border border-info/18 bg-info-muted px-4 py-3 text-sm leading-6 text-info">
          {infoMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[16px] border border-danger/18 bg-danger-muted px-4 py-3 text-sm leading-6 text-danger">
          {errorMessage}
        </div>
      ) : null}
    </Card>
  );
}
