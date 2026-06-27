import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Trash2,
  Plus,
  PlusCircle,
} from "lucide-react";
import { examApi } from "../../../api/examApi";
import { questionBankApi, questionBankEnums } from "../../../api/questionBankApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useToast } from "../../../hooks/useToast";

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

function getPromptSuggestions(text) {
  if (!text) return [];
  const suggestions = [];
  const val = text.toLowerCase();

  if (text.trim().length < 15) {
    suggestions.push({
      type: "info",
      text: "Yêu cầu hơi ngắn. Bạn có thể bổ sung thêm chi tiết chủ đề hoặc nội dung tài liệu để câu hỏi sinh ra chính xác hơn.",
    });
  }

  const hasQuantity = /\b\d+\s*(câu|câu hỏi|yêu cầu)\b/i.test(val) || /\bsinh\s*\d+\b/i.test(val) || /\btạo\s*\d+\b/i.test(val);
  if (!hasQuantity) {
    suggestions.push({
      type: "tip",
      text: "Mẹo: Bạn có thể chỉ định số lượng câu hỏi mong muốn (Ví dụ: 'Tạo 5 câu hỏi...').",
    });
  }

  const hasDifficulty = /dễ|khó|trung bình|easy|medium|hard/i.test(val);
  if (!hasDifficulty) {
    suggestions.push({
      type: "tip",
      text: "Mẹo: Bạn nên bổ sung yêu cầu về độ khó (Ví dụ: 'trong đó có 3 câu dễ và 2 câu trung bình').",
    });
  }

  const hasType = /trắc nghiệm|đúng sai|trả lời ngắn|singlechoice|multiplechoice|truefalse|shortanswer/i.test(val);
  if (!hasType) {
    suggestions.push({
      type: "tip",
      text: "Mẹo: Hãy nêu rõ loại câu hỏi cần tạo (Một lựa chọn, Nhiều lựa chọn, Đúng/Sai, hay Trả lời ngắn).",
    });
  }

  return suggestions;
}

export default function QuestionImportResources({ bankId, mode = "ai", onQuestionsGenerated }) {
  const { showToast } = useToast();

  // AI Generator state
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Preview popup modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState("");

  // Original template resources state
  const [templates, setTemplates] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
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

  // Handle AI generation submit -> Opens preview popup
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
        difficulty: "Medium",
        status: "Approved",
      };

      const response = await questionBankApi.generateQuestionsAiPreview(bankId, payload);
      if (response.data && response.data.length > 0) {
        const questionsWithSelection = response.data.map(q => ({ ...q, selected: true }));
        setPreviewQuestions(questionsWithSelection);
        setModalErrorMessage("");
        setIsModalOpen(true);
        showToast({ tone: "success", title: `Đã sinh xong ${response.data.length} câu hỏi. Vui lòng rà soát lại.` });
      } else {
        setErrorMessage("AI không trả về câu hỏi hợp lệ nào. Vui lòng thử lại với prompt chi tiết hơn.");
      }
    } catch (error) {
      setErrorMessage(error.message || "Quá trình sinh câu hỏi bằng AI thất bại.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Preview Modal Handlers
  function handleUpdateQuestion(idx, field, value) {
    setPreviewQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;

        // Reset answers structure if question type is changed to TrueFalse
        if (field === "questionType" && value === "TrueFalse") {
          return {
            ...q,
            [field]: value,
            answers: [
              { content: "Đúng", isCorrect: true, orderIndex: 1 },
              { content: "Sai", isCorrect: false, orderIndex: 2 },
            ],
          };
        }

        // Adjust scores
        if (field === "defaultScore") {
          return { ...q, [field]: Number(value) || 1 };
        }

        return { ...q, [field]: value };
      })
    );
  }

  function handleUpdateAnswer(idx, ansIdx, field, value) {
    setPreviewQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const nextAnswers = q.answers.map((ans, aIdx) => {
          if (aIdx !== ansIdx) return ans;
          return { ...ans, [field]: value };
        });
        return { ...q, answers: nextAnswers };
      })
    );
  }

  function handleToggleCorrectAnswer(idx, ansIdx) {
    setPreviewQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const isSingleOrBoolean = q.questionType === "SingleChoice" || q.questionType === "TrueFalse";

        const nextAnswers = q.answers.map((ans, aIdx) => {
          if (isSingleOrBoolean) {
            return { ...ans, isCorrect: aIdx === ansIdx };
          } else {
            return aIdx === ansIdx ? { ...ans, isCorrect: !ans.isCorrect } : ans;
          }
        });
        return { ...q, answers: nextAnswers };
      })
    );
  }

  function handleAddAnswerOption(idx) {
    setPreviewQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        return {
          ...q,
          answers: [
            ...q.answers,
            { content: "", isCorrect: false, orderIndex: q.answers.length + 1 },
          ],
        };
      })
    );
  }

  function handleDeleteAnswerOption(idx, ansIdx) {
    setPreviewQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const nextAnswers = q.answers
          .filter((_, aIdx) => aIdx !== ansIdx)
          .map((ans, aIdx) => ({ ...ans, orderIndex: aIdx + 1 }));
        return { ...q, answers: nextAnswers };
      })
    );
  }

  function handleDeleteQuestion(idx) {
    setPreviewQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAddNewEmptyQuestion() {
    setPreviewQuestions((prev) => [
      ...prev,
      {
        content: "",
        questionType: "SingleChoice",
        difficulty: "Medium",
        defaultScore: 1.0,
        subject: "",
        chapter: "",
        lesson: "",
        status: "Approved",
        selected: true,
        answers: [
          { content: "Phương án A", isCorrect: true, orderIndex: 1 },
          { content: "Phương án B", isCorrect: false, orderIndex: 2 },
        ],
      },
    ]);
  }

  function handleBulkUpdateStatus(statusValue) {
    setPreviewQuestions((prev) =>
      prev.map((q) => ({ ...q, status: statusValue }))
    );
    showToast({ tone: "info", title: "Đã cập nhật trạng thái đồng loạt" });
  }

  async function handleSaveBulkQuestions() {
    setModalErrorMessage("");
    const selectedQuestions = previewQuestions.filter(q => q.selected !== false);
    if (selectedQuestions.length === 0) {
      setModalErrorMessage("Vui lòng chọn ít nhất một câu hỏi để lưu vào ngân hàng.");
      return;
    }
    setIsSavingBulk(true);
    try {
      const response = await questionBankApi.createQuestionsBulk(bankId, selectedQuestions);
      const importedCount = response.data?.importedCount || 0;
      setSuccessMessage(`Đã sinh thành công và nhập ${importedCount} câu hỏi vào ngân hàng.`);
      setPromptText("");
      setIsModalOpen(false);

      showToast({ tone: "success", title: "Lưu thành công", message: `Đã nhập ${importedCount} câu hỏi.` });

      if (onQuestionsGenerated) {
        await onQuestionsGenerated();
      }
    } catch (error) {
      setModalErrorMessage(error.message || "Lưu câu hỏi thất bại.");
    } finally {
      setIsSavingBulk(false);
    }
  }

  const promptContent = prompt?.content ?? "";
  const isDownloadingStandard = downloadingFileName === standardTemplate?.fileName;

  const suggestions = useMemo(() => getPromptSuggestions(promptText), [promptText]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-5 space-y-5">
        {mode === "ai" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                Tạo đề với AI
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                Nhập nội dung tài liệu, đề bài gốc hoặc yêu cầu cụ thể. AI sẽ phân tích và tạo bản xem trước câu hỏi để rà soát trước khi chính thức đưa vào ngân hàng.
              </p>
            </div>

            <form onSubmit={handleGenerateAiQuestions} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ai-prompt" className="block text-sm font-semibold text-primary">
                  Yêu cầu hoặc Nội dung đề bài
                </label>
                <textarea
                  id="ai-prompt"
                  className={`w-full min-h-[140px] rounded-[16px] border bg-surface p-4 font-sans text-sm text-primary placeholder-secondary focus:outline-none focus:ring-1 disabled:opacity-50 ${
                    errorMessage ? "border-danger focus:border-danger focus:ring-danger" : "border-border focus:border-primary focus:ring-primary"
                  }`}
                  placeholder="Ví dụ: Tạo 5 câu hỏi trắc nghiệm một lựa chọn (SingleChoice) về chủ đề Sinh học tế bào, trong đó có 3 câu dễ và 2 câu trung bình..."
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  disabled={isGenerating || !bankId}
                />
                {errorMessage && (
                  <p className="text-xs text-danger flex items-center gap-1.5 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Polite recommendations box */}
              {suggestions.length > 0 && (
                <div className="rounded-2xl border border-info/10 bg-info-muted/5 p-4 space-y-2 text-xs leading-relaxed text-secondary transition-all">
                  <div className="font-semibold text-primary flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-info" />
                    <span>Gợi ý viết prompt hiệu quả (Linh động, không bắt buộc):</span>
                  </div>
                  <ul className="list-disc list-inside pl-1 space-y-1">
                    {suggestions.map((s, idx) => (
                      <li key={idx} className="marker:text-info/50 text-secondary">
                        {s.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

      {/* Edit/Review Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-neutral-muted/10 p-5 shrink-0">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  Xem trước & Chỉnh sửa câu hỏi từ AI (GPT-5.4)
                </h3>
                <p className="text-xs text-secondary">
                  Xem và sửa đổi nội dung, đáp án, trạng thái, độ khó của câu hỏi trước khi lưu vào ngân hàng đề thi.
                </p>
              </div>

              {/* Bulk Action Buttons & Close Icon */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allSelected = previewQuestions.every(q => q.selected !== false);
                    setPreviewQuestions(prev => prev.map(q => ({ ...q, selected: !allSelected })));
                  }}
                  className="px-2.5 py-1.5 text-xs border border-border rounded-xl bg-surface hover:bg-neutral text-primary font-medium transition mr-2"
                  type="button"
                >
                  {previewQuestions.every(q => q.selected !== false) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                <div className="hidden sm:flex items-center gap-1.5 border border-border rounded-2xl bg-surface px-2.5 py-1.5 text-xs text-secondary mr-2">
                  <span className="font-semibold">Áp dụng nhanh trạng thái:</span>
                  <button
                    onClick={() => handleBulkUpdateStatus("Approved")}
                    className="px-2 py-0.5 rounded-lg hover:bg-neutral text-success font-medium transition"
                    type="button"
                  >
                    Sẵn sàng
                  </button>
                  <button
                    onClick={() => handleBulkUpdateStatus("Draft")}
                    className="px-2 py-0.5 rounded-lg hover:bg-neutral text-warning font-medium transition"
                    type="button"
                  >
                    Nháp
                  </button>
                  <button
                    onClick={() => handleBulkUpdateStatus("Archived")}
                    className="px-2 py-0.5 rounded-lg hover:bg-neutral text-secondary font-medium transition"
                    type="button"
                  >
                    Lưu trữ
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-neutral transition"
                  type="button"
                  title="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-sunken">
              {modalErrorMessage && (
                <div className="rounded-[16px] border border-danger/18 bg-danger-muted px-4 py-3 text-sm leading-6 text-danger flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{modalErrorMessage}</span>
                </div>
              )}

              {previewQuestions.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-surface rounded-2xl border border-dashed border-border">
                  <AlertCircle className="h-12 w-12 text-secondary mx-auto" />
                  <p className="text-sm text-secondary font-medium">Chưa có câu hỏi nào. Hãy thêm mới hoặc sinh câu hỏi từ AI.</p>
                </div>
              ) : (
                previewQuestions.map((q, idx) => (
                  <Card key={idx} className={`p-6 relative space-y-5 border border-border shadow-sm hover:shadow-md transition bg-surface ${q.selected === false ? "opacity-60" : ""}`}>
                    {/* Question Index & Controls Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={q.selected !== false}
                          onChange={(e) => handleUpdateQuestion(idx, "selected", e.target.checked)}
                          className="h-4 w-4 rounded text-primary border-border focus:ring-primary focus:ring-offset-0 transition cursor-pointer"
                        />
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-muted text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-primary">Câu hỏi</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Question Type */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-secondary font-medium whitespace-nowrap">Loại:</span>
                          <select
                            value={q.questionType}
                            onChange={(e) => handleUpdateQuestion(idx, "questionType", e.target.value)}
                            className="text-xs rounded-xl border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="SingleChoice">Trắc nghiệm 1 lựa chọn</option>
                            <option value="MultipleChoice">Trắc nghiệm nhiều lựa chọn</option>
                            <option value="TrueFalse">Đúng / Sai</option>
                            <option value="ShortAnswer">Trả lời ngắn</option>
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-secondary font-medium whitespace-nowrap">Độ khó:</span>
                          <select
                            value={q.difficulty}
                            onChange={(e) => handleUpdateQuestion(idx, "difficulty", e.target.value)}
                            className="text-xs rounded-xl border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Easy">Dễ</option>
                            <option value="Medium">Trung bình</option>
                            <option value="Hard">Khó</option>
                          </select>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-secondary font-medium whitespace-nowrap">Trạng thái:</span>
                          <select
                            value={q.status}
                            onChange={(e) => handleUpdateQuestion(idx, "status", e.target.value)}
                            className="text-xs rounded-xl border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Draft">Nháp (Draft)</option>
                            <option value="Reviewed">Cần rà soát (Reviewed)</option>
                            <option value="Approved">Sẵn sàng (Approved)</option>
                            <option value="Archived">Lưu trữ (Archived)</option>
                          </select>
                        </div>

                        {/* Default Score */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-secondary font-medium whitespace-nowrap">Điểm:</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={q.defaultScore}
                            onChange={(e) => handleUpdateQuestion(idx, "defaultScore", parseFloat(e.target.value) || 1)}
                            className="w-16 text-xs rounded-xl border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-muted/20 transition"
                          type="button"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text Area */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-primary">Nội dung câu hỏi</label>
                      <textarea
                        value={q.content}
                        onChange={(e) => handleUpdateQuestion(idx, "content", e.target.value)}
                        className="w-full min-h-[60px] rounded-xl border border-border bg-surface p-3 font-sans text-sm text-primary placeholder-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </div>

                    {/* Subject, Chapter, Lesson Details */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mb-1">Môn học</label>
                        <input
                          type="text"
                          value={q.subject || ""}
                          onChange={(e) => handleUpdateQuestion(idx, "subject", e.target.value)}
                          className="w-full text-xs rounded-lg border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Môn học..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mb-1">Chương</label>
                        <input
                          type="text"
                          value={q.chapter || ""}
                          onChange={(e) => handleUpdateQuestion(idx, "chapter", e.target.value)}
                          className="w-full text-xs rounded-lg border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Chương học..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mb-1">Bài học</label>
                        <input
                          type="text"
                          value={q.lesson || ""}
                          onChange={(e) => handleUpdateQuestion(idx, "lesson", e.target.value)}
                          className="w-full text-xs rounded-lg border border-border bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Bài học..."
                        />
                      </div>
                    </div>

                    {/* Answers Area */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                          <span>Phương án trả lời</span>
                          <span className="text-[10px] text-secondary font-normal">
                            ({q.questionType === "SingleChoice" || q.questionType === "TrueFalse" ? "Chọn 1 đáp án đúng" : "Có thể chọn nhiều đáp án đúng"})
                          </span>
                        </label>

                        {/* Add Answer Button */}
                        {q.questionType !== "TrueFalse" && (
                          <button
                            onClick={() => handleAddAnswerOption(idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover transition"
                            type="button"
                          >
                            <PlusCircle className="h-3.5 w-3.5" /> Thêm tùy chọn
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {q.answers.map((ans, ansIdx) => (
                          <div key={ansIdx} className="flex items-center gap-3">
                            {/* Checkbox / Radio Button */}
                            <input
                              type={q.questionType === "SingleChoice" || q.questionType === "TrueFalse" ? "radio" : "checkbox"}
                              name={`question-correct-${idx}`}
                              checked={ans.isCorrect}
                              onChange={() => handleToggleCorrectAnswer(idx, ansIdx)}
                              className="h-4 w-4 rounded-full text-primary border-border focus:ring-primary focus:ring-offset-0 transition cursor-pointer"
                            />

                            {/* Answer Input */}
                            <input
                              type="text"
                              value={ans.content}
                              onChange={(e) => handleUpdateAnswer(idx, ansIdx, "content", e.target.value)}
                              className={`flex-1 text-xs rounded-xl border bg-surface px-3 py-2 text-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                                ans.isCorrect ? "border-success bg-success-muted/5" : "border-border"
                              }`}
                              placeholder={`Phương án ${ansIdx + 1}...`}
                              disabled={q.questionType === "TrueFalse"}
                            />

                            {/* Delete Answer Button */}
                            {q.questionType !== "TrueFalse" && q.answers.length > 1 && (
                              <button
                                onClick={() => handleDeleteAnswerOption(idx, ansIdx)}
                                className="p-1 rounded-lg text-secondary hover:text-danger transition"
                                type="button"
                                title="Xóa phương án này"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-border bg-neutral-muted/10 p-5 gap-3 shrink-0">
              <button
                onClick={handleAddNewEmptyQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl border border-primary text-primary bg-surface hover:bg-primary-muted/10 transition"
                type="button"
              >
                <Plus className="h-4 w-4" /> Thêm câu hỏi mới
              </button>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                  disabled={isSavingBulk}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleSaveBulkQuestions}
                  variant="primary"
                  disabled={isSavingBulk || previewQuestions.length === 0}
                >
                  {isSavingBulk ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang lưu câu hỏi...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Lưu {previewQuestions.filter(q => q.selected !== false).length} câu hỏi vào ngân hàng
                    </>
                  )}
                </Button>
              </div>
            </div>
        </div>
        </div>
      )}
    </Card>
  );
}
