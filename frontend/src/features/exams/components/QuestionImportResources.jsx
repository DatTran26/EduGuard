import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Clipboard, Download, FileText, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { examApi } from "../../../api/examApi";
import { questionBankApi, questionBankEnums } from "../../../api/questionBankApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TextInput from "../../../components/forms/TextInput";
import Select from "../../../components/forms/Select";

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

export default function QuestionImportResources({ bankId, onQuestionsGenerated }) {
  // Tabs
  const [activeTab, setActiveTab] = useState("ai");

  // AI Generator state
  const [promptText, setPromptText] = useState("");
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem("eduguard_openai_api_key") || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // AI Defaults settings
  const [aiDefaults, setAiDefaults] = useState({
    difficulty: "Medium",
    status: "Approved",
    subject: "",
    chapter: "",
    lesson: "",
    learningOutcome: "",
  });

  // Original template resources state
  const [templates, setTemplates] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const [downloadingFileName, setDownloadingFileName] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadImportResources() {
      setIsLoadingTemplates(true);
      try {
        const [templateResponse, promptResponse] = await Promise.all([
          examApi.getQuestionImportTemplates(),
          examApi.getQuestionImportPrompt(),
        ]);

        if (!isMounted) return;
        setTemplates(templateResponse.data);
        setPrompt(promptResponse.data);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error.message || "Không thể tải tài liệu import.");
      } finally {
        if (isMounted) {
          setIsLoadingTemplates(false);
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

  // Handle AI generation submit
  async function handleGenerateAiQuestions(e) {
    if (e) e.preventDefault();
    if (!bankId) {
      setErrorMessage("Vui lòng chọn ngân hàng câu hỏi để lưu.");
      return;
    }
    if (!promptText.trim()) {
      setErrorMessage("Vui lòng nhập yêu cầu/nội dung sinh câu hỏi.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        prompt: promptText,
        userApiKey: userApiKey.trim() || null,
        ...aiDefaults
      };
      
      const response = await questionBankApi.generateQuestionsAi(bankId, payload);
      
      const importedCount = response.data?.importedCount || 0;
      setSuccessMessage(`Đã sinh thành công và nhập ${importedCount} câu hỏi vào ngân hàng.`);
      setPromptText("");
      
      if (onQuestionsGenerated) {
        await onQuestionsGenerated();
      }
    } catch (error) {
      setErrorMessage(error.message || "Quá trình sinh câu hỏi bằng AI thất bại.");
    } finally {
      setIsGenerating(false);
    }
  }

  const promptContent = prompt?.content ?? "";
  const isDownloadingStandard = downloadingFileName === standardTemplate?.fileName;

  return (
    <Card className="overflow-hidden p-0">
      {/* Tabs Header */}
      <div className="flex border-b border-border bg-neutral-muted/10">
        <button
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ai"
              ? "border-primary text-primary bg-surface/50"
              : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("ai")}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Tạo câu hỏi bằng AI trực tiếp
          </span>
        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
            activeTab === "manual"
              ? "border-primary text-primary bg-surface/50"
              : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("manual")}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Hướng dẫn import bằng file
          </span>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {activeTab === "ai" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                Sinh câu hỏi tự động với mô hình GPT-5.5
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Nhập nội dung tài liệu, đề bài gốc hoặc yêu cầu cụ thể. AI sẽ phân tích và trực tiếp sinh danh sách câu hỏi trắc nghiệm đúng chuẩn cấu trúc để nhập vào ngân hàng đề thi.
              </p>
            </div>

            <form onSubmit={handleGenerateAiQuestions} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ai-prompt" className="block text-sm font-semibold text-primary">
                  Yêu cầu hoặc Nội dung đề bài
                </label>
                <textarea
                  id="ai-prompt"
                  className="w-full min-h-[140px] rounded-[16px] border border-border bg-surface p-4 font-sans text-sm text-primary placeholder-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  placeholder="Ví dụ: Tạo 5 câu hỏi trắc nghiệm một lựa chọn (SingleChoice) về chủ đề Sinh học tế bào, trong đó có 3 câu dễ và 2 câu trung bình..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isGenerating || !bankId}
                />
              </div>

              {/* Collapsible Advanced Settings */}
              <div className="rounded-[16px] border border-border bg-neutral-muted/10 p-4 space-y-4">
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-sm font-semibold text-primary"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span>Cấu hình nâng cao & API Key</span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvanced && (
                  <div className="pt-2 grid gap-4 md:grid-cols-2">
                    <div className="col-span-2">
                      <TextInput
                        id="user-api-key"
                        label="OpenAI API Key (Tùy chọn - Lưu cục bộ)"
                        placeholder="sk-proj-..."
                        type="password"
                        value={userApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUserApiKey(val);
                          localStorage.setItem("eduguard_openai_api_key", val);
                        }}
                        disabled={isGenerating}
                      />
                      <p className="mt-1 text-[10px] text-secondary">
                        * Khoá API này được lưu bảo mật trong trình duyệt của bạn (localStorage) và chỉ gửi trực tiếp tới máy chủ khi gọi API.
                      </p>
                    </div>

                    <Select
                      id="ai-difficulty"
                      label="Độ khó mặc định"
                      value={aiDefaults.difficulty}
                      onChange={(e) => setAiDefaults(prev => ({ ...prev, difficulty: e.target.value }))}
                      options={questionBankEnums.difficultyOptions}
                      disabled={isGenerating}
                    />

                    <Select
                      id="ai-status"
                      label="Trạng thái mặc định"
                      value={aiDefaults.status}
                      onChange={(e) => setAiDefaults(prev => ({ ...prev, status: e.target.value }))}
                      options={questionBankEnums.statusOptions}
                      disabled={isGenerating}
                    />

                    <TextInput
                      id="ai-subject"
                      label="Môn học"
                      placeholder="Toán học, Vật lý..."
                      value={aiDefaults.subject}
                      onChange={(e) => setAiDefaults(prev => ({ ...prev, subject: e.target.value }))}
                      disabled={isGenerating}
                    />

                    <TextInput
                      id="ai-chapter"
                      label="Chương"
                      placeholder="Chương I, Chương II..."
                      value={aiDefaults.chapter}
                      onChange={(e) => setAiDefaults(prev => ({ ...prev, chapter: e.target.value }))}
                      disabled={isGenerating}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end items-center gap-3">
                {!bankId && (
                  <span className="text-xs text-caution flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Vui lòng chọn một ngân hàng đề thi trước.
                  </span>
                )}
                <Button
                  type="submit"
                  disabled={isGenerating || !promptText.trim() || !bankId}
                  variant="primary"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang sinh câu hỏi...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Tạo câu hỏi bằng AI
                    </>
                  )}
                </Button>
              </div>
            </form>

            {successMessage && (
              <div className="rounded-[16px] border border-success/20 bg-success-muted px-4 py-3 text-sm leading-6 text-success flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        ) : (
          /* Manual instructions Tab */
          <div className="rounded-[18px] border border-border bg-neutral p-4">
            {isLoadingTemplates ? (
              <div className="space-y-3 p-4">
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
        )}
      </div>

      {errorMessage && (
        <div className="m-5 mt-0 rounded-[16px] border border-danger/18 bg-danger-muted px-4 py-3 text-sm leading-6 text-danger flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </Card>
  );
}
