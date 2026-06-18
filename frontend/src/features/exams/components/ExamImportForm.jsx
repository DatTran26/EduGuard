import { useRef, useState } from "react";
import { FiPaperclip, FiRefreshCcw, FiUploadCloud } from "react-icons/fi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormErrorSummary from "../../../components/forms/FormErrorSummary";

const ACCEPTED_IMPORT_FILE_EXTENSIONS = [".json", ".xlsx", ".xls", ".csv"];
const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getFileExtension(fileName = "") {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function formatFileSize(fileSize) {
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return "0 KB";
  }

  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

function validateImportFile(file) {
  if (!file) {
    return "Chọn file trước khi gửi.";
  }

  const fileExtension = getFileExtension(file.name);

  if (!ACCEPTED_IMPORT_FILE_EXTENSIONS.includes(fileExtension)) {
    return `File import chỉ hỗ trợ ${ACCEPTED_IMPORT_FILE_EXTENSIONS.join(", ")}.`;
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return "File import đang vượt quá giới hạn 10 MB.";
  }

  return "";
}

export default function ExamImportForm({
  isSubmitting = false,
  onSubmitFile,
  title = "Nhập file đề thi",
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleClearSelectedFile() {
    setSelectedFile(null);
    setValidationMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      handleClearSelectedFile();
      return;
    }

    const nextValidationMessage = validateImportFile(nextFile);
    setSelectedFile(nextFile);
    setValidationMessage(nextValidationMessage);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextValidationMessage = validateImportFile(selectedFile);
    setValidationMessage(nextValidationMessage);

    if (nextValidationMessage) {
      return;
    }

    const shouldReset = await onSubmitFile(selectedFile);

    if (shouldReset) {
      handleClearSelectedFile();
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {ACCEPTED_IMPORT_FILE_EXTENSIONS.map((fileExtension) => (
            <span
              key={fileExtension}
              className="inline-flex rounded-full border border-border bg-neutral px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-secondary"
            >
              {fileExtension.replace(".", "")}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        accept={ACCEPTED_IMPORT_FILE_EXTENSIONS.join(",")}
        className="hidden"
        id="exam-import-file"
        type="file"
        onChange={handleFileChange}
      />

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormErrorSummary message={validationMessage} />

        <button
          className="flex w-full items-center justify-between gap-4 rounded-[20px] border border-dashed border-border bg-neutral px-5 py-4 text-left transition-colors duration-200 hover:border-tertiary/40 hover:bg-surface-sunken"
          type="button"
          onClick={handleOpenFilePicker}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/70 bg-white text-link shadow-[0_16px_32px_rgb(15_23_42/8%)]">
              <FiPaperclip className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">
                {selectedFile ? selectedFile.name : "Chọn file từ máy"}
              </p>
              <p className="mt-1 text-sm text-secondary">
                {selectedFile ? formatFileSize(selectedFile.size) : "Tối đa 10 MB"}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            File
          </span>
        </button>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={handleOpenFilePicker}
          >
            <span className="inline-flex items-center gap-2">
              <FiPaperclip className="h-4 w-4" />
              <span>Chọn file</span>
            </span>
          </Button>

          <Button
            disabled={isSubmitting || !selectedFile}
            type="button"
            variant="ghost"
            onClick={handleClearSelectedFile}
          >
            <span className="inline-flex items-center gap-2">
              <FiRefreshCcw className="h-4 w-4" />
              <span>Bỏ chọn</span>
            </span>
          </Button>

          <Button
            className="sm:ml-auto"
            disabled={isSubmitting || !selectedFile || Boolean(validationMessage)}
            type="submit"
          >
            <span className="inline-flex items-center gap-2">
              <FiUploadCloud className="h-4 w-4" />
              <span>{isSubmitting ? "Đang gửi file..." : "Gửi file"}</span>
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
