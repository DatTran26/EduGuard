import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Clipboard, Download, FileText } from "lucide-react";
import { examApi } from "../../../api/examApi";
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

function ImportWorkflowStep({ children, isLastStep = false, number, title }) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-info/20 bg-info-muted text-sm font-semibold text-info">
          {number}
        </span>
        {!isLastStep ? <span className="my-2 h-full min-h-8 w-px bg-border" aria-hidden="true" /> : null}
      </div>
      <div className={isLastStep ? "pb-0" : "pb-5"}>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textAreaElement = document.createElement("textarea");
  textAreaElement.value = text;
  textAreaElement.setAttribute("readonly", "");
  textAreaElement.style.position = "fixed";
  textAreaElement.style.top = "-9999px";
  document.body.appendChild(textAreaElement);
  textAreaElement.select();

  const didCopy = document.execCommand("copy");
  textAreaElement.remove();

  if (!didCopy) {
    throw new Error("Không thể copy prompt vào clipboard.");
  }
}

export default function QuestionImportResources() {
  const [templates, setTemplates] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const [downloadingFileName, setDownloadingFileName] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadImportResources() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [templateResponse, promptResponse] = await Promise.all([
          examApi.getQuestionImportTemplates(),
          examApi.getQuestionImportPrompt(),
        ]);

        if (!isMounted) {
          return;
        }

        setTemplates(templateResponse.data);
        setPrompt(promptResponse.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message || "Không thể tải tài liệu import.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadImportResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const standardTemplate = useMemo(
    () =>
      templates.find(
        (template) =>
          template.questionType === "standard" ||
          template.fileName === "Dinh_dang_chuan_de_import_file.md",
      ) ?? null,
    [templates],
  );

  async function handleDownloadStandardTemplate() {
    if (!standardTemplate) {
      setErrorMessage("Chưa có file định dạng chuẩn để tải về.");
      return;
    }

    setDownloadingFileName(standardTemplate.fileName);
    setErrorMessage("");

    try {
      await examApi.downloadQuestionImportTemplate(standardTemplate);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải file định dạng chuẩn.");
    } finally {
      setDownloadingFileName("");
    }
  }

  async function handleCopyPrompt() {
    if (!prompt?.content) {
      setErrorMessage("Chưa có nội dung prompt để copy.");
      return;
    }

    setCopyState("copying");
    setErrorMessage("");

    try {
      await copyTextToClipboard(prompt.content);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch (error) {
      setCopyState("idle");
      setErrorMessage(error.message || "Không thể copy prompt.");
    }
  }

  const promptContent = prompt?.content ?? "";
  const isDownloadingStandard = downloadingFileName === standardTemplate?.fileName;

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Hướng dẫn tạo file import</Badge>
            <Badge variant="neutral">Teacher / Admin</Badge>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">Tạo file Excel import bằng AI</h3>
            <p className="max-w-3xl text-sm leading-6 text-secondary">
              Tải file chuẩn và copy prompt, sau đó đưa đề gốc cho AI để generate file .xlsx đúng cấu trúc.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-border bg-neutral p-4">
        <div className="space-y-0">
      {isLoading ? (
        <div className="space-y-3 rounded-[18px] border border-border bg-neutral p-4">
          <div className="h-4 w-1/3 rounded-full bg-border-subtle" />
          <div className="h-4 w-2/3 rounded-full bg-border-subtle" />
          <div className="h-4 w-1/2 rounded-full bg-border-subtle" />
        </div>
      ) : (
        <div className="space-y-0">
          <ImportWorkflowStep number="01" title="Tải file chuẩn">
          {standardTemplate ? (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-[18px] border border-border bg-surface p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface text-secondary">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-primary">{standardTemplate.displayName}</p>
                  <p className="break-all text-sm text-secondary">{standardTemplate.fileName}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="neutral">{formatFileSize(standardTemplate.fileSizeBytes)}</Badge>
                <Button
                  className="w-full sm:w-auto"
                  disabled={isDownloadingStandard}
                  onClick={handleDownloadStandardTemplate}
                  variant="secondary"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {isDownloadingStandard ? "Đang tải..." : "Tải file chuẩn"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-caution/20 bg-caution-muted px-4 py-3 text-sm leading-6 text-caution">
              Chưa tìm thấy file định dạng chuẩn trên server.
            </div>
          )}
          </ImportWorkflowStep>

          <ImportWorkflowStep number="02" title="Copy prompt">
          <div className="rounded-[18px] border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-primary">Prompt chuyển đổi đề import</p>
                {prompt?.fileName ? (
                  <p className="break-all text-sm text-secondary">{prompt.fileName}</p>
                ) : null}
              </div>

              <div className="ml-auto flex flex-wrap justify-end gap-2">
                <Button
                  disabled={!promptContent || copyState === "copying"}
                  onClick={handleCopyPrompt}
                  variant="secondary"
                >
                  {copyState === "copied" ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Clipboard className="h-4 w-4" aria-hidden="true" />
                  )}
                  {copyState === "copied" ? "Đã copy" : copyState === "copying" ? "Đang copy..." : "Copy"}
                </Button>
                <Button onClick={() => setIsPromptExpanded((value) => !value)} variant="ghost">
                  {isPromptExpanded ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isPromptExpanded ? "Thu gọn" : "Mở rộng"}
                </Button>
              </div>
            </div>

            {promptContent ? (
              <pre
                className={`mt-4 overflow-auto whitespace-pre-wrap rounded-[14px] border border-border bg-surface p-4 font-sans text-sm leading-6 text-primary ${
                  isPromptExpanded ? "max-h-[560px]" : "max-h-44"
                }`}
              >
                {promptContent}
              </pre>
            ) : (
              <p className="mt-4 rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-secondary">
                Chưa có nội dung prompt để hiển thị.
              </p>
            )}
          </div>
          </ImportWorkflowStep>

          <ImportWorkflowStep number="03" title="Generate file Excel bằng AI">
            <p className="rounded-[16px] border border-border bg-surface px-4 py-3 text-sm leading-6 text-secondary">
              Mở ChatGPT hoặc công cụ AI, gửi prompt + file chuẩn + đề gốc để generate file Excel import.
            </p>
          </ImportWorkflowStep>

          <ImportWorkflowStep number="04" title="Upload vào EduGuard" isLastStep>
            <p className="rounded-[16px] border border-border bg-surface px-4 py-3 text-sm leading-6 text-secondary">
              Upload file Excel AI tạo ở khu Nhập từ file bên dưới, review lỗi rồi commit vào đề.
            </p>
          </ImportWorkflowStep>
        </div>
      )}
        </div>

      </div>

      {errorMessage ? (
        <div className="rounded-[16px] border border-danger/18 bg-danger-muted px-4 py-3 text-sm leading-6 text-danger">
          {errorMessage}
        </div>
      ) : null}
    </Card>
  );
}
