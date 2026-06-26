import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  LayoutList,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { classroomApi } from "../../../api/classroomApi";
import { questionBankApi, questionBankEnums } from "../../../api/questionBankApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton, { SkeletonStatCard } from "../../../components/common/Skeleton";
import CheckboxField from "../../../components/forms/CheckboxField";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { routeConfig } from "../../../routes/routeConfig";
import { QUESTION_TYPE_OPTIONS, calculateEndTimeInputValue, toVietnamISOString } from "../../exams/examHelpers";
import BankQuestionForm from "../components/BankQuestionForm";
import QuestionImportPanel from "../../exams/components/QuestionImportPanel";
import QuestionImportResources from "../../exams/components/QuestionImportResources";
import {
  EMPTY_BANK_FORM,
  EMPTY_CREATE_EXAM_FORM,
  EMPTY_IMPORT_DEFAULTS,
  EMPTY_MATRIX_FORM,
  EMPTY_MATRIX_ITEM,
  MATRIX_QUESTION_TYPE_OPTIONS,
  QUESTION_STATUS_FILTER_OPTIONS,
  QUESTION_TYPE_FILTER_OPTIONS,
  buildDefaultAnswers,
  buildBankQuestionFilters,
  buildEmptyQuestionForm,
  buildMatrixFormFromMatrix,
  buildQuestionFormFromQuestion,
  calculateMatrixTotals,
  formatMatrixNumber,
  formatMatrixIssueRequirement,
  formatMatrixIssueShortfall,
  getBankQuestionValidationError,
  getDifficultyBadgeMark,
  getDifficultyBadgeVariant,
  getDifficultyLabel,
  getQuestionTypeLabel,
  getStatusBadgeMark,
  getStatusBadgeVariant,
  getStatusLabel,
  distributeDifficultyToItems,
  parseMatrixItemsForForm,
} from "../question-bank-helpers";

function buildBankFormValues(bank) {
  return {
    name: bank?.name ?? "",
    description: bank?.description ?? "",
    subject: bank?.subject ?? "",
    gradeLevel: bank?.gradeLevel ?? "",
  };
}

function IconButtonContent({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" className="h-4 w-4" />
      {children}
    </span>
  );
}

function normalizeCompareText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function optionalTextMatches(actual, expected) {
  return !normalizeCompareText(expected) || normalizeCompareText(actual) === normalizeCompareText(expected);
}

function buildDraftQuestionFromPreviewItem(item, index) {
  const question = item.question ?? {};

  return {
    draftId: `${item.matrixItemId}-${question.id}-${index}`,
    matrixItemId: Number(item.matrixItemId) || 0,
    bankQuestionId: Number(question.id) || 0,
    bankQuestionVersion: Number(question.version) || null,
    content: question.content ?? "",
    questionType: question.questionType ?? "SingleChoice",
    difficulty: question.difficulty ?? "Medium",
    subject: question.subject ?? "",
    chapter: question.chapter ?? "",
    lesson: question.lesson ?? "",
    learningOutcome: question.learningOutcome ?? "",
    score: Number(item.score) || Number(question.defaultScore) || 0,
    orderIndex: index + 1,
    answers: Array.isArray(question.answers)
      ? question.answers.map((answer, answerIndex) => ({
          content: answer.content ?? "",
          isCorrect: Boolean(answer.isCorrect),
          orderIndex: Number(answer.orderIndex) || answerIndex + 1,
        }))
      : [],
  };
}

function buildDraftQuestionsFromPreview(preview) {
  return Array.isArray(preview?.questions)
    ? preview.questions.map((item, index) => buildDraftQuestionFromPreviewItem(item, index))
    : [];
}

function buildDraftQuestionForm(question) {
  return {
    id: question.draftId,
    content: question.content,
    questionType: question.questionType,
    difficulty: question.difficulty,
    defaultScore: question.score,
    subject: question.subject,
    chapter: question.chapter,
    lesson: question.lesson,
    learningOutcome: question.learningOutcome,
    status: "Approved",
    answers: question.answers.length > 0 ? question.answers.map((answer) => ({ ...answer })) : buildDefaultAnswers(question.questionType),
  };
}

function buildDraftQuestionUpdate(previousQuestion, formValues) {
  return {
    ...previousQuestion,
    content: formValues.content,
    questionType: formValues.questionType,
    score: Number(formValues.defaultScore) || 0,
    answers: Array.isArray(formValues.answers)
      ? formValues.answers.map((answer, answerIndex) => ({
          content: answer.content ?? "",
          isCorrect: Boolean(answer.isCorrect),
          orderIndex: Number(answer.orderIndex) || answerIndex + 1,
        }))
      : [],
  };
}

function buildDraftMatrixWarnings(draftQuestions, matrix) {
  if (!matrix || draftQuestions.length === 0) {
    return [];
  }

  const warnings = [];
  const expectedTotalQuestions = Number(matrix.totalQuestions) || 0;
  const actualTotalQuestions = draftQuestions.length;
  const expectedTotalScore = Number(matrix.totalScore) || 0;
  const actualTotalScore = draftQuestions.reduce((total, question) => total + (Number(question.score) || 0), 0);

  if (actualTotalQuestions !== expectedTotalQuestions) {
    warnings.push(`Đề nháp có ${actualTotalQuestions} câu, ma trận yêu cầu ${expectedTotalQuestions} câu.`);
  }

  if (Math.abs(actualTotalScore - expectedTotalScore) > 0.001) {
    warnings.push(`Tổng điểm đề nháp là ${formatMatrixNumber(actualTotalScore)}, ma trận yêu cầu ${formatMatrixNumber(expectedTotalScore)}.`);
  }

  matrix.items.forEach((item, index) => {
    const rowQuestions = draftQuestions.filter((question) => Number(question.matrixItemId) === Number(item.id));
    const rowLabel = `Dòng ma trận ${index + 1}`;

    if (rowQuestions.length !== Number(item.questionCount)) {
      warnings.push(`${rowLabel} đang có ${rowQuestions.length} câu, ma trận yêu cầu ${item.questionCount} câu.`);
    }

    const mismatchedTypeCount = item.questionType
      ? rowQuestions.filter((question) => question.questionType !== item.questionType).length
      : 0;
    const mismatchedDifficultyCount = rowQuestions.filter((question) => question.difficulty !== item.difficulty).length;
    const mismatchedTextCount = rowQuestions.filter((question) => (
      !optionalTextMatches(question.chapter, item.chapter) ||
      !optionalTextMatches(question.lesson, item.lesson) ||
      !optionalTextMatches(question.learningOutcome, item.learningOutcome)
    )).length;

    if (mismatchedTypeCount > 0) {
      warnings.push(`${rowLabel} có ${mismatchedTypeCount} câu không còn đúng loại câu ${getQuestionTypeLabel(item.questionType)}.`);
    }

    if (mismatchedDifficultyCount > 0) {
      warnings.push(`${rowLabel} có ${mismatchedDifficultyCount} câu không còn đúng độ khó ${getDifficultyLabel(item.difficulty)}.`);
    }

    if (mismatchedTextCount > 0) {
      warnings.push(`${rowLabel} có ${mismatchedTextCount} câu không còn khớp chương, bài hoặc yêu cầu cần đạt.`);
    }
  });

  return warnings;
}

function MatrixIssueDialog({ dialog, onClose }) {
  if (!dialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-[24px] border border-border bg-surface p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-caution/20 bg-caution-muted text-caution">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-primary">{dialog.title}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">{dialog.message}</p>
              <p className="mt-1 text-sm leading-6 text-secondary">Hệ thống chỉ tính các câu có trạng thái Sẵn sàng và khớp đủ chương, bài, yêu cầu cần đạt, loại câu và độ khó của từng dòng ma trận.</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost">
            <IconButtonContent icon={X}>Đóng</IconButtonContent>
          </Button>
        </div>

        {dialog.errors.length > 0 ? (
          <div className="mt-5 max-h-[52vh] space-y-3 overflow-auto pr-1">
            {dialog.errors.map((issue, index) => {
              const shortfall = formatMatrixIssueShortfall(issue);

              return (
                <div key={`${issue.chapter}-${issue.lesson}-${issue.questionType}-${index}`} className="rounded-[18px] border border-caution/18 bg-caution-muted p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-semibold text-primary">Thiếu {shortfall.missing} câu cho dòng ma trận {index + 1}</p>
                      <p className="text-sm leading-6 text-secondary">{formatMatrixIssueRequirement(issue)}</p>
                      {issue.message ? <p className="text-sm leading-6 text-caution">{issue.message}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="caution">Cần {shortfall.required}</Badge>
                      <Badge variant={shortfall.available > 0 ? "info" : "danger"}>Có {shortfall.available}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuestionEditDialog({ formValues, isDisabled, isSubmitting, onChange, onClose, onSubmit }) {
  if (!formValues?.id) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[24px] border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Sửa câu hỏi</h3>
            <p className="mt-1 text-sm text-secondary">Chỉnh sửa trong cửa sổ này để giữ nguyên vị trí câu hỏi đang thao tác.</p>
          </div>
          <Button onClick={onClose} variant="ghost">
            <IconButtonContent icon={X}>Đóng</IconButtonContent>
          </Button>
        </div>
        <BankQuestionForm
          formValues={formValues}
          isDisabled={isDisabled}
          isFramed={false}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onReset={onClose}
          onSubmit={onSubmit}
          resetLabel="Hủy"
          submitLabel="Cập nhật câu hỏi"
          title="Thông tin câu hỏi"
        />
      </div>
    </div>
  );
}

function DraftAnswerEditor({ answers, questionType, onChange }) {
  const isSingleCorrect = questionType === "SingleChoice" || questionType === "TrueFalse";
  const canAddAnswer = questionType !== "TrueFalse";
  const canRemoveAnswer = questionType !== "TrueFalse" && answers.length > 1;

  function updateAnswer(answerIndex, fieldName, value) {
    onChange(answers.map((answer, index) => index === answerIndex ? { ...answer, [fieldName]: value } : answer));
  }

  function updateCorrectAnswer(answerIndex, checked) {
    if (isSingleCorrect) {
      onChange(answers.map((answer, index) => ({ ...answer, isCorrect: index === answerIndex })));
      return;
    }

    updateAnswer(answerIndex, "isCorrect", checked);
  }

  function addAnswer() {
    onChange([...answers, { content: "", isCorrect: questionType === "ShortAnswer" }]);
  }

  function removeAnswer(answerIndex) {
    const nextAnswers = answers.filter((_, index) => index !== answerIndex);

    if (isSingleCorrect && nextAnswers.length > 0 && !nextAnswers.some((answer) => answer.isCorrect)) {
      nextAnswers[0] = { ...nextAnswers[0], isCorrect: true };
    }

    onChange(nextAnswers);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Đáp án trong đề nháp</p>
        {canAddAnswer ? <Button onClick={addAnswer} variant="secondary">Thêm đáp án</Button> : null}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {answers.map((answer, index) => (
          <div key={index} className="grid gap-3 rounded-[16px] border border-border bg-neutral p-3 md:grid-cols-[minmax(0,1fr)_112px_auto]">
            <TextInput
              id={`draft-answer-${index}`}
              label={`Đáp án ${index + 1}`}
              onChange={(event) => updateAnswer(index, "content", event.target.value)}
              value={answer.content}
            />
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-primary">
              <input
                checked={Boolean(answer.isCorrect)}
                className="h-4 w-4 accent-[var(--color-tertiary)]"
                name="draft-question-correct-answer"
                onChange={(event) => updateCorrectAnswer(index, event.target.checked)}
                type={isSingleCorrect ? "radio" : "checkbox"}
              />
              Đúng
            </label>
            {canRemoveAnswer ? <Button className="self-end" onClick={() => removeAnswer(index)} variant="ghost">Xóa</Button> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DraftQuestionEditDialog({ formValues, isSubmitting, onChange, onClose, onSubmit }) {
  if (!formValues?.id) {
    return null;
  }

  function updateField(fieldName, value) {
    onChange({ ...formValues, [fieldName]: value });
  }

  function updateQuestionType(nextQuestionType) {
    onChange({
      ...formValues,
      questionType: nextQuestionType,
      answers: buildDefaultAnswers(nextQuestionType),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[24px] border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Sửa câu trong đề nháp</h3>
            <p className="mt-1 text-sm text-secondary">Thay đổi chỉ áp dụng cho đề đang chuẩn bị tạo, không cập nhật ngân hàng câu hỏi.</p>
          </div>
          <Button onClick={onClose} variant="ghost">
            <IconButtonContent icon={X}>Đóng</IconButtonContent>
          </Button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <TextInput
            as="textarea"
            className="min-h-32"
            id="draft-question-content"
            label="Nội dung câu hỏi"
            onChange={(event) => updateField("content", event.target.value)}
            required
            value={formValues.content}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              id="draft-question-type"
              label="Loại câu"
              onChange={(event) => updateQuestionType(event.target.value)}
              options={QUESTION_TYPE_OPTIONS}
              value={formValues.questionType}
            />
            <TextInput
              id="draft-question-score"
              label="Điểm trong đề"
              min="0.25"
              onChange={(event) => updateField("defaultScore", event.target.value)}
              step="0.25"
              type="number"
              value={formValues.defaultScore}
            />
          </div>

          <DraftAnswerEditor
            answers={formValues.answers}
            onChange={(answers) => updateField("answers", answers)}
            questionType={formValues.questionType}
          />

          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={onClose} variant="secondary">Hủy</Button>
            <Button disabled={isSubmitting} type="submit">Lưu vào đề nháp</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GenerateExamConfirmDialog({ classroomOptions, dialog, formValues, isSubmitting, warnings, onCancel, onChange, onConfirm }) {
  if (!dialog) {
    return null;
  }

  function updateField(fieldName, value) {
    if (fieldName === "startTime") {
      onChange((previous) => ({
        ...previous,
        startTime: value,
        endTime: calculateEndTimeInputValue(value, dialog.durationMinutes) || previous.endTime,
      }));
      return;
    }

    onChange((previous) => ({ ...previous, [fieldName]: value }));
  }

  function updateSetting(fieldName, value) {
    onChange((previous) => ({
      ...previous,
      settings: { ...previous.settings, [fieldName]: value },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[24px] border border-border bg-surface p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Đặt lịch bài kiểm tra thật</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">Bài kiểm tra sẽ dùng đúng đề nháp đã chỉnh và được mở cho sinh viên theo thời gian bạn chọn.</p>
          </div>
          <Button onClick={onCancel} variant="ghost">
            <IconButtonContent icon={X}>Đóng</IconButtonContent>
          </Button>
        </div>

        <div className="mt-5 grid gap-3 rounded-[18px] border border-border bg-neutral p-4 text-sm text-secondary sm:grid-cols-2">
          <p><span className="font-semibold text-primary">Ma trận:</span> {dialog.matrixName}</p>
          <p><span className="font-semibold text-primary">Thời gian làm bài:</span> {dialog.durationMinutes} phút</p>
          <p><span className="font-semibold text-primary">Số câu đề nháp:</span> {dialog.totalQuestions}</p>
          <p><span className="font-semibold text-primary">Tổng điểm đề nháp:</span> {formatMatrixNumber(dialog.totalScore)}</p>
        </div>

        {warnings.length > 0 ? (
          <div className="mt-4 rounded-[18px] border border-caution/20 bg-caution-muted p-4 text-sm text-caution">
            <p className="font-semibold">Đề nháp có cảnh báo lệch ma trận nhưng vẫn có thể tạo bài kiểm tra.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {warnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onConfirm}>
          <Select id="exam-classroom-dialog" label="Lớp học" onChange={(event) => updateField("classroomId", event.target.value)} options={classroomOptions} value={formValues.classroomId} />
          <TextInput id="exam-title-dialog" label="Tiêu đề bài kiểm tra" onChange={(event) => updateField("title", event.target.value)} required value={formValues.title} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput id="exam-start-dialog" label="Mở đề" onChange={(event) => updateField("startTime", event.target.value)} required type="datetime-local" value={formValues.startTime} />
            <TextInput id="exam-end-dialog" label="Đóng đề" onChange={(event) => updateField("endTime", event.target.value)} type="datetime-local" value={formValues.endTime} />
            <TextInput id="exam-attempts-dialog" label="Số lần làm" min="1" onChange={(event) => updateSetting("maxAttempts", event.target.value)} type="number" value={formValues.settings.maxAttempts} />
          </div>
          <CheckboxField checked={formValues.enableAntiCheat} id="exam-anticheat-dialog" label="Bật giám sát gian lận" onChange={(event) => updateField("enableAntiCheat", event.target.checked)} />
          <CheckboxField checked={formValues.settings.shuffleQuestions} id="exam-shuffle-question-dialog" label="Trộn câu hỏi" onChange={(event) => updateSetting("shuffleQuestions", event.target.checked)} />
          <CheckboxField checked={formValues.settings.shuffleAnswers} id="exam-shuffle-answer-dialog" label="Trộn đáp án" onChange={(event) => updateSetting("shuffleAnswers", event.target.checked)} />

          <div className="flex flex-wrap justify-end gap-3">
            <Button disabled={isSubmitting} onClick={onCancel} variant="secondary">Hủy</Button>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Đang tạo bài kiểm tra..." : "Tạo bài kiểm tra thật"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function QuestionBankPage() {
  const { showToast } = useToast();
  const importFileRef = useRef(null);
  const matrixPanelRef = useRef(null);
  const sliderRef = useRef(null);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [banks, setBanks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [matrices, setMatrices] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedMatrixId, setSelectedMatrixId] = useState("");
  const [activeBankSection, setActiveBankSection] = useState("questions");
  const [expandedBankQuestionId, setExpandedBankQuestionId] = useState(null);
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [isQuestionComposerOpen, setIsQuestionComposerOpen] = useState(false);
  const [isQuestionEditDialogOpen, setIsQuestionEditDialogOpen] = useState(false);
  const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
  const [bankForm, setBankForm] = useState(EMPTY_BANK_FORM);
  const [editingBankId, setEditingBankId] = useState(null);
  const [questionForm, setQuestionForm] = useState(() => buildEmptyQuestionForm());
  const [filters, setFilters] = useState({ keyword: "", difficulty: "", questionType: "", status: "", chapter: "" });
  const [importDefaults, setImportDefaults] = useState(EMPTY_IMPORT_DEFAULTS);
  const [importFile, setImportFile] = useState(null);
  const [matrixForm, setMatrixForm] = useState(EMPTY_MATRIX_FORM);
  const [createExamForm, setCreateExamForm] = useState(EMPTY_CREATE_EXAM_FORM);
  const [validationResult, setValidationResult] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [draftExamQuestions, setDraftExamQuestions] = useState([]);
  const [draftQuestionForm, setDraftQuestionForm] = useState(null);
  const [editingDraftQuestionIndex, setEditingDraftQuestionIndex] = useState(null);
  const [matrixIssueDialog, setMatrixIssueDialog] = useState(null);
  const [generateExamDialog, setGenerateExamDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBankSubmitting, setIsBankSubmitting] = useState(false);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [isMatrixSubmitting, setIsMatrixSubmitting] = useState(false);
  const [isMatrixActionRunning, setIsMatrixActionRunning] = useState(false);
  const selectedBank = banks.find((bank) => Number(bank.id) === Number(selectedBankId)) ?? null;
  const selectedMatrix = matrices.find((matrix) => Number(matrix.id) === Number(selectedMatrixId)) ?? null;
  const matrixTotals = useMemo(() => {
    const totalQuestions = Number(matrixForm.totalQuestions) || 0;
    const totalScore = Number(matrixForm.totalScore) || 0;
    const scorePerQuestion = totalQuestions > 0 ? totalScore / totalQuestions : 0;
    const difficultySummary = [
      { difficulty: "Easy", label: "Dễ", questionCount: easyCount, totalScore: easyCount * scorePerQuestion },
      { difficulty: "Medium", label: "Trung bình", questionCount: mediumCount, totalScore: mediumCount * scorePerQuestion },
      { difficulty: "Hard", label: "Khó", questionCount: hardCount, totalScore: hardCount * scorePerQuestion },
    ];
    return {
      totalQuestions,
      totalScore,
      scorePerQuestion,
      difficultySummary,
    };
  }, [matrixForm.totalScore, matrixForm.totalQuestions, easyCount, mediumCount, hardCount]);
  const selectedMatrixTotals = useMemo(
    () => selectedMatrix ? calculateMatrixTotals(selectedMatrix.items, selectedMatrix.totalScore) : calculateMatrixTotals([], 0),
    [selectedMatrix],
  );
  const draftExamTotalScore = useMemo(
    () => draftExamQuestions.reduce((total, question) => total + (Number(question.score) || 0), 0),
    [draftExamQuestions],
  );
  const draftMatrixWarnings = useMemo(
    () => buildDraftMatrixWarnings(draftExamQuestions, selectedMatrix),
    [draftExamQuestions, selectedMatrix],
  );
  const approvedQuestionCount = questions.filter((question) => question.status === "Approved").length;
  const reviewedQuestionCount = questions.filter((question) => question.status === "Reviewed").length;

  async function loadPageData(options = {}) {
    const { showLoader = true } = options;
    if (showLoader) setIsLoading(true);

    try {
      const [bankResponse, matrixResponse, classroomResponse] = await Promise.all([
        questionBankApi.getBanks(),
        questionBankApi.getMatrices(),
        classroomApi.getAll(),
      ]);
      const nextBanks = bankResponse.data;
      const nextMatrices = matrixResponse.data;

      setBanks(nextBanks);
      setMatrices(nextMatrices);
      setClassrooms(classroomResponse.data);

      if (selectedBankId && !nextBanks.some((bank) => Number(bank.id) === Number(selectedBankId))) {
        setSelectedBankId("");
        setQuestions([]);
      }

      if (!selectedMatrixId && nextMatrices[0]) {
        setSelectedMatrixId(String(nextMatrices[0].id));
        setCreateExamForm((previous) => ({ ...previous, matrixId: String(nextMatrices[0].id) }));
      }
    } catch (error) {
      showToast({ tone: "danger", title: "Tải dữ liệu thất bại", message: error.message || "Không thể tải ngân hàng câu hỏi." });
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }

  async function loadBankQuestions(bankId = selectedBankId) {
    if (!bankId) {
      setQuestions([]);
      return;
    }

    try {
      const response = await questionBankApi.getQuestions(bankId, buildBankQuestionFilters(filters));
      setQuestions(response.data);
    } catch (error) {
      showToast({ tone: "danger", title: "Tải câu hỏi thất bại", message: error.message || "Không thể tải danh sách câu hỏi." });
    }
  }

  useEffect(() => { void loadPageData(); }, []);
  useEffect(() => { void loadBankQuestions(selectedBankId); }, [selectedBankId]);

  function resetQuestionForm(bank = selectedBank) {
    setQuestionForm(buildEmptyQuestionForm(bank));
  }

  function updateBankForm(fieldName, value) {
    setBankForm((previous) => ({ ...previous, [fieldName]: value }));
  }

  function updateMatrixForm(fieldName, value) {
    if (fieldName === "totalQuestions") {
      const total = Math.max(0, parseInt(value) || 0);
      setMatrixForm((prev) => ({ ...prev, totalQuestions: total }));

      if (total === 0) {
        setEasyCount(0);
        setMediumCount(0);
        setHardCount(0);
      } else {
        const currentTotal = easyCount + mediumCount + hardCount;
        if (currentTotal === 0) {
          const easy = Math.round(total * 0.4);
          const medium = Math.round(total * 0.4);
          const hard = total - easy - medium;
          setEasyCount(easy);
          setMediumCount(medium);
          setHardCount(hard);
        } else {
          let easy = Math.round((easyCount / currentTotal) * total);
          let medium = Math.round((mediumCount / currentTotal) * total);
          let hard = total - easy - medium;
          if (hard < 0) {
            medium += hard;
            hard = 0;
          }
          setEasyCount(easy);
          setMediumCount(medium);
          setHardCount(hard);
        }
      }
    } else {
      setMatrixForm((previous) => ({ ...previous, [fieldName]: value }));
    }
  }

  function updateMatrixItem(index, fieldName, value) {
    setMatrixForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => itemIndex === index ? { ...item, [fieldName]: value } : item),
    }));
  }

  function loadMatrixIntoForm(matrix) {
    if (!matrix) return;
    const formValues = buildMatrixFormFromMatrix(matrix);
    const parsed = parseMatrixItemsForForm(matrix.items || []);
    setMatrixForm(formValues);
    setEasyCount(parsed.easyCount);
    setMediumCount(parsed.mediumCount);
    setHardCount(parsed.hardCount);
  }

  function resetMatrixForm() {
    setMatrixForm(EMPTY_MATRIX_FORM);
    setEasyCount(0);
    setMediumCount(1);
    setHardCount(0);
  }

  function resetMatrixDraft() {
    setPreviewResult(null);
    setDraftExamQuestions([]);
    setDraftQuestionForm(null);
    setEditingDraftQuestionIndex(null);
    setGenerateExamDialog(null);
  }

  function selectMatrix(matrixId) {
    setSelectedMatrixId(matrixId);
    setCreateExamForm((previous) => ({ ...previous, matrixId }));
    setValidationResult(null);
    resetMatrixDraft();
    const foundMatrix = matrices.find((m) => String(m.id) === String(matrixId));
    if (foundMatrix) {
      loadMatrixIntoForm(foundMatrix);
    }
  }

  function handleStartDrag(e, handleIndex) {
    e.preventDefault();
    const handleMove = (moveEvent) => {
      if (!sliderRef.current || matrixTotals.totalQuestions === 0) return;
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = Math.round(percentage * matrixTotals.totalQuestions);

      if (handleIndex === 1) {
        const limit = easyCount + mediumCount;
        const nextEasy = Math.max(0, Math.min(rawValue, limit));
        const nextMedium = limit - nextEasy;
        setEasyCount(nextEasy);
        setMediumCount(nextMedium);
      } else if (handleIndex === 2) {
        const nextTotalEasyMedium = Math.max(easyCount, Math.min(rawValue, matrixTotals.totalQuestions));
        const nextMedium = nextTotalEasyMedium - easyCount;
        const nextHard = matrixTotals.totalQuestions - nextTotalEasyMedium;
        setMediumCount(nextMedium);
        setHardCount(nextHard);
      }
    };

    const handleEndDrag = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEndDrag);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEndDrag);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEndDrag);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEndDrag);
  }

  function buildAvailabilityRows(matrix = selectedMatrix) {
    if (!matrix) {
      return [];
    }

    if (Array.isArray(validationResult?.items) && validationResult.items.length > 0) {
      return validationResult.items.map((item, index) => ({ ...item, rowIndex: index + 1, checked: true }));
    }

    const issueByKey = new Map(
      (validationResult?.errors ?? []).map((issue) => [String(issue.matrixItemId || `${issue.chapter}-${issue.lesson}-${issue.difficulty}-${issue.questionType}`), issue]),
    );

    return matrix.items.map((item, index) => {
      const issue = issueByKey.get(String(item.id)) ?? issueByKey.get(`${item.chapter}-${item.lesson}-${item.difficulty}-${item.questionType}`);
      const required = Number(item.questionCount) || 0;

      return issue
        ? { ...issue, rowIndex: index + 1, checked: true }
        : {
            ...item,
            rowIndex: index + 1,
            matrixItemId: item.id,
            required,
            available: validationResult?.isValid ? required : 0,
            checked: Boolean(validationResult),
            message: "",
          };
    });
  }

  function canGenerateFromSelectedMatrix() {
    return Boolean(selectedBankId && selectedMatrixId);
  }

  function canOpenScheduleDialog() {
    return Boolean(selectedBankId && selectedMatrixId && draftExamQuestions.length > 0 && previewResult?.success === true);
  }

  function hasInvalidCreateExamTimeWindow() {
    return Boolean(createExamForm.startTime && createExamForm.endTime && createExamForm.endTime <= createExamForm.startTime);
  }

  function openBankForm(bank = null) {
    setEditingBankId(bank?.id ?? null);
    setBankForm(bank ? buildBankFormValues(bank) : EMPTY_BANK_FORM);
    setIsBankFormOpen(true);
  }

  function closeBankForm() {
    setEditingBankId(null);
    setBankForm(EMPTY_BANK_FORM);
    setIsBankFormOpen(false);
  }

  function openBankDetail(bank) {
    setSelectedBankId(String(bank.id));
    setActiveBankSection("questions");
    setExpandedBankQuestionId(null);
    setValidationResult(null);
    resetMatrixDraft();
    setIsQuestionComposerOpen(false);
    setIsQuestionEditDialogOpen(false);
    setIsImportPanelOpen(false);
    resetQuestionForm(bank);
  }

  function closeBankDetail() {
    setSelectedBankId("");
    setQuestions([]);
    setActiveBankSection("questions");
    setExpandedBankQuestionId(null);
    setIsQuestionEditDialogOpen(false);
    resetMatrixDraft();
    resetQuestionForm(null);
  }

  function openQuestionEditDialog(question) {
    setQuestionForm(buildQuestionFormFromQuestion(question));
    setIsQuestionComposerOpen(false);
    setIsQuestionEditDialogOpen(true);
  }

  function closeQuestionEditDialog() {
    setIsQuestionEditDialogOpen(false);
    resetQuestionForm();
  }

  function openDraftQuestionEditDialog(question, index) {
    setDraftQuestionForm(buildDraftQuestionForm(question));
    setEditingDraftQuestionIndex(index);
  }

  function closeDraftQuestionEditDialog() {
    setDraftQuestionForm(null);
    setEditingDraftQuestionIndex(null);
  }

  function handleSubmitDraftQuestion(event) {
    event.preventDefault();
    if (!draftQuestionForm) return;
    const validationError = getBankQuestionValidationError(draftQuestionForm);
    if (validationError) {
      showToast({ tone: "caution", title: "Câu hỏi trong đề nháp chưa hợp lệ", message: validationError });
      return;
    }

    setDraftExamQuestions((previous) => previous.map((question, index) => (
      index === editingDraftQuestionIndex ? buildDraftQuestionUpdate(question, draftQuestionForm) : question
    )));
    closeDraftQuestionEditDialog();
    showToast({ tone: "success", title: "Đã cập nhật đề nháp", message: "Thay đổi chỉ áp dụng cho bài kiểm tra sẽ tạo từ đề nháp này." });
  }

  function openMatrixSection() {
    setActiveBankSection("matrix");
    window.setTimeout(() => matrixPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function showMatrixIssueDialog(title, result) {
    setMatrixIssueDialog({
      title,
      message: result?.message || "Ma trận chưa đủ điều kiện để sinh đề từ ngân hàng câu hỏi đang chọn.",
      errors: Array.isArray(result?.errors) ? result.errors : [],
    });
  }

  async function handleSubmitBank(event) {
    event.preventDefault();
    if (!bankForm.name.trim()) return;
    setIsBankSubmitting(true);
    try {
      const response = editingBankId ? await questionBankApi.updateBank(editingBankId, bankForm) : await questionBankApi.createBank(bankForm);
      await loadPageData({ showLoader: false });
      setSelectedBankId(String(response.data.id));
      setActiveBankSection("questions");
      setQuestionForm(buildEmptyQuestionForm(response.data));
      closeBankForm();
      showToast({ tone: "success", title: editingBankId ? "Đã cập nhật ngân hàng" : "Đã tạo ngân hàng", message: editingBankId ? "Thông tin ngân hàng đã được cập nhật." : "Ngân hàng câu hỏi mới đã được tạo." });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu ngân hàng thất bại", message: error.message || "Không thể lưu ngân hàng câu hỏi." });
    } finally {
      setIsBankSubmitting(false);
    }
  }

  async function handleDeleteBank(bank) {
    if (!window.confirm(`Xóa ngân hàng "${bank.name}" và toàn bộ câu hỏi bên trong?`)) return;
    try {
      await questionBankApi.deleteBank(bank.id);
      const nextBanks = banks.filter((item) => item.id !== bank.id);
      setBanks(nextBanks);
      if (Number(selectedBankId) === Number(bank.id)) {
        closeBankDetail();
      }
      showToast({ tone: "success", title: "Đã xóa ngân hàng", message: "Ngân hàng câu hỏi đã được xóa." });
    } catch (error) {
      showToast({ tone: "danger", title: "Xóa ngân hàng thất bại", message: error.message || "Không thể xóa ngân hàng." });
    }
  }

  async function handleSubmitQuestion(event) {
    event.preventDefault();
    if (!selectedBankId) return;
    const validationError = getBankQuestionValidationError(questionForm);
    if (validationError) {
      showToast({ tone: "caution", title: "Câu hỏi chưa hợp lệ", message: validationError });
      return;
    }

    setIsQuestionSubmitting(true);
    try {
      await (questionForm.id ? questionBankApi.updateQuestion(questionForm.id, questionForm) : questionBankApi.createQuestion(selectedBankId, questionForm));
      await loadBankQuestions(selectedBankId);
      await loadPageData({ showLoader: false });
      resetQuestionForm();
      setIsQuestionComposerOpen(false);
      setIsQuestionEditDialogOpen(false);
      showToast({ tone: "success", title: questionForm.id ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi", message: questionForm.id ? "Nội dung câu hỏi đã được cập nhật." : "Câu hỏi đã được thêm vào ngân hàng." });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu câu hỏi thất bại", message: error.message || "Không thể lưu câu hỏi." });
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  async function handleArchiveQuestion(question) {
    try {
      await questionBankApi.archiveQuestion(question.id);
      await loadBankQuestions(selectedBankId);
      showToast({ tone: "success", title: "Đã lưu trữ câu hỏi", message: "Câu hỏi đã được chuyển vào trạng thái lưu trữ." });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu trữ thất bại", message: error.message || "Không thể lưu trữ câu hỏi." });
    }
  }

  async function handleImportQuestions(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!selectedBankId || !importFile) return;
    setIsImportSubmitting(true);
    try {
      await questionBankApi.importQuestions(selectedBankId, importFile, importDefaults);
      await loadBankQuestions(selectedBankId);
      await loadPageData({ showLoader: false });
      setImportFile(null);
      setIsImportPanelOpen(false);
      if (importFileRef.current) importFileRef.current.value = "";
      showToast({ tone: "success", title: "Đã nhập câu hỏi", message: "Tệp câu hỏi đã được nhập vào ngân hàng." });
    } catch (error) {
      const errors = Array.isArray(error.importResult?.errors) ? error.importResult.errors : [];
      showToast({ tone: "danger", title: "Nhập câu hỏi thất bại", message: errors[0]?.errorMessage || error.message || "Không thể nhập câu hỏi." });
    } finally {
      setIsImportSubmitting(false);
    }
  }

  async function handleSubmitMatrix(event) {
    event.preventDefault();
    if (matrixTotals.totalQuestions <= 0) {
      showToast({ tone: "caution", title: "Ma trận chưa hợp lệ", message: "Tổng số câu phải lớn hơn 0." });
      return;
    }

    if (matrixTotals.totalScore <= 0) {
      showToast({ tone: "caution", title: "Ma trận chưa hợp lệ", message: "Tổng điểm phải lớn hơn 0." });
      return;
    }

    const totalSliderQuestions = easyCount + mediumCount + hardCount;
    if (totalSliderQuestions !== matrixTotals.totalQuestions) {
      showToast({ tone: "caution", title: "Ma trận chưa hợp lệ", message: `Tổng số câu phân bổ theo độ khó (${totalSliderQuestions}) phải khớp với tổng số câu các dòng (${matrixTotals.totalQuestions}).` });
      return;
    }

    const singleItem = {
      chapter: matrixForm.chapter || "",
      lesson: matrixForm.lesson || "",
      learningOutcome: matrixForm.learningOutcome || "",
      questionType: matrixForm.questionType || "",
      questionCount: Number(matrixForm.totalQuestions) || 0,
    };
    const distributedItems = distributeDifficultyToItems([singleItem], easyCount, mediumCount, hardCount);
    const payload = {
      name: matrixForm.name,
      subject: matrixForm.subject,
      gradeLevel: matrixForm.gradeLevel,
      durationMinutes: Number(matrixForm.durationMinutes) || 45,
      totalQuestions: matrixTotals.totalQuestions,
      totalScore: matrixTotals.totalScore,
      items: distributedItems,
    };

    setIsMatrixSubmitting(true);
    try {
      const response = matrixForm.id ? await questionBankApi.updateMatrix(matrixForm.id, payload) : await questionBankApi.createMatrix(payload);
      await loadPageData({ showLoader: false });
      setSelectedMatrixId(String(response.data.id));
      setCreateExamForm((previous) => ({ ...previous, matrixId: String(response.data.id) }));
      loadMatrixIntoForm(response.data);
      resetMatrixDraft();

      if (selectedBankId) {
        const validationResponse = await questionBankApi.validateMatrix(response.data.id, selectedBankId);
        setValidationResult(validationResponse.data);
      } else {
        setValidationResult(null);
      }

      showToast({ tone: "success", title: matrixForm.id ? "Đã cập nhật ma trận" : "Đã tạo ma trận", message: matrixForm.id ? "Ma trận đề đã được cập nhật." : "Ma trận đề mới đã được tạo." });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu ma trận thất bại", message: error.message || "Không thể lưu ma trận đề." });
    } finally {
      setIsMatrixSubmitting(false);
    }
  }

  async function handleValidateMatrix() {
    if (!selectedMatrixId || !selectedBankId) return;
    setIsMatrixActionRunning(true);
    try {
      const response = await questionBankApi.validateMatrix(selectedMatrixId, selectedBankId);
      setValidationResult(response.data);
      if (!response.data.isValid) {
        resetMatrixDraft();
        showMatrixIssueDialog("Ma trận đang thiếu câu hỏi", response.data);
      }
      showToast({ tone: response.data.isValid ? "success" : "caution", title: "Đã kiểm tra ma trận", message: response.data.message });
    } catch (error) {
      showToast({ tone: "danger", title: "Kiểm tra thất bại", message: error.message || "Không thể kiểm tra ma trận." });
    } finally {
      setIsMatrixActionRunning(false);
    }
  }

  async function handleGeneratePreview() {
    if (!selectedMatrixId || !selectedBankId) return;
    setIsMatrixActionRunning(true);
    try {
      const response = await questionBankApi.generateMatrixPreview(selectedMatrixId, selectedBankId);
      setPreviewResult(response.data);
      setDraftExamQuestions(response.data.success ? buildDraftQuestionsFromPreview(response.data) : []);
      setDraftQuestionForm(null);
      setEditingDraftQuestionIndex(null);
      setGenerateExamDialog(null);
      if (!response.data.success) {
        showMatrixIssueDialog("Không thể tạo bản xem thử từ ma trận", response.data);
      }
      showToast({ tone: response.data.success ? "success" : "caution", title: response.data.success ? "Đã sinh đề nháp" : "Chưa thể sinh đề nháp", message: response.data.message });
    } catch (error) {
      showToast({ tone: "danger", title: "Sinh đề nháp thất bại", message: error.message || "Không thể sinh đề nháp." });
    } finally {
      setIsMatrixActionRunning(false);
    }
  }

  function handleOpenGenerateExamDialog() {
    const matrixId = createExamForm.matrixId || selectedMatrixId;
    if (!matrixId || !selectedBankId || draftExamQuestions.length === 0) return;

    if (previewResult?.success !== true) {
      showToast({ tone: "caution", title: "Chưa có đề nháp hợp lệ", message: "Vui lòng sinh đề nháp từ ma trận trước khi đặt lịch bài kiểm tra." });
      return;
    }

    setGenerateExamDialog({
      matrixName: selectedMatrix?.name ?? "Ma trận đang chọn",
      durationMinutes: selectedMatrix?.durationMinutes ?? 0,
      totalQuestions: draftExamQuestions.length,
      totalScore: draftExamTotalScore,
    });
  }

  async function handleConfirmCreateExamFromMatrix(event) {
    event.preventDefault();
    const matrixId = createExamForm.matrixId || selectedMatrixId;
    if (!matrixId || !selectedBankId || draftExamQuestions.length === 0) return;
    if (!createExamForm.classroomId) {
      showToast({ tone: "caution", title: "Chưa chọn lớp học", message: "Vui lòng chọn lớp sẽ làm bài kiểm tra này." });
      return;
    }
    if (!createExamForm.title.trim()) {
      showToast({ tone: "caution", title: "Chưa nhập tiêu đề", message: "Vui lòng nhập tiêu đề bài kiểm tra." });
      return;
    }
    if (!createExamForm.startTime) {
      showToast({ tone: "caution", title: "Chưa chọn giờ mở đề", message: "Vui lòng chọn thời gian bắt đầu làm bài trước khi tạo bài kiểm tra thật." });
      return;
    }
    if (hasInvalidCreateExamTimeWindow()) {
      showToast({ tone: "caution", title: "Thời gian chưa hợp lệ", message: "Thời gian đóng đề phải sau thời gian mở đề." });
      return;
    }
    setIsMatrixActionRunning(true);
    try {
      const response = await questionBankApi.createExamFromMatrix(matrixId, {
        ...createExamForm,
        questionBankId: selectedBankId,
        startTime: toVietnamISOString(createExamForm.startTime),
        endTime: toVietnamISOString(createExamForm.endTime),
        questions: draftExamQuestions,
      });
      setGenerateExamDialog(null);
      setDraftExamQuestions([]);
      setPreviewResult(null);
      showToast({ tone: "success", title: "Đã tạo bài kiểm tra thật", message: response.message || "Bài kiểm tra đã được tạo và lên lịch theo thời gian mở đề." });
    } catch (error) {
      showToast({ tone: "danger", title: "Tạo bài kiểm tra thất bại", message: error.message || "Không thể tạo bài kiểm tra từ đề nháp." });
    } finally {
      setIsMatrixActionRunning(false);
    }
  }

  const bankOptions = banks.map((bank) => ({ label: bank.name, value: String(bank.id) }));
  const matrixOptions = matrices.map((matrix) => ({ label: matrix.name, value: String(matrix.id) }));
  const classroomOptions = classrooms.map((classroom) => ({ label: classroom.name, value: String(classroom.id) }));

  function renderBankFormPanel() {
    if (!isBankFormOpen) {
      return null;
    }

    return (
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">{editingBankId ? "Sửa ngân hàng" : "Tạo ngân hàng mới"}</h3>
          <Button onClick={closeBankForm} variant="ghost">
            <IconButtonContent icon={X}>Đóng</IconButtonContent>
          </Button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmitBank}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextInput id="bank-name" label="Tên ngân hàng" onChange={(event) => updateBankForm("name", event.target.value)} required value={bankForm.name} />
            <TextInput id="bank-subject" label="Môn học" onChange={(event) => updateBankForm("subject", event.target.value)} value={bankForm.subject} />
            <TextInput id="bank-grade" label="Khối/lớp" onChange={(event) => updateBankForm("gradeLevel", event.target.value)} value={bankForm.gradeLevel} />
            <TextInput as="textarea" className="min-h-24 xl:col-span-1" id="bank-description" label="Mô tả" onChange={(event) => updateBankForm("description", event.target.value)} value={bankForm.description} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isBankSubmitting} type="submit">
              <IconButtonContent icon={editingBankId ? CheckCircle2 : Plus}>{isBankSubmitting ? "Đang lưu..." : editingBankId ? "Cập nhật" : "Tạo ngân hàng"}</IconButtonContent>
            </Button>
            <Button onClick={closeBankForm} variant="secondary">Hủy</Button>
          </div>
        </form>
      </Card>
    );
  }

  function renderBankListView() {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Giảng viên"
          title="Ngân hàng câu hỏi"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link className="eg-button eg-button-secondary" to={routeConfig.teacherExams}>Đi tới đề thi</Link>
              <Button onClick={() => openBankForm()}>
                <IconButtonContent icon={Plus}>Tạo ngân hàng mới</IconButtonContent>
              </Button>
            </div>
          }
        />

        {renderBankFormPanel()}

        {banks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {banks.map((bank) => (
              <Card key={bank.id} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-info/20 bg-info-muted text-info">
                    <BookOpen aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <Badge variant="info">{bank.questionCount} câu</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">{bank.name}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-secondary">{bank.description || "Ngân hàng này chưa có mô tả."}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{bank.subject || "Chưa gán môn"} · {bank.gradeLevel || "Chưa gán khối"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => openBankDetail(bank)}>
                    <IconButtonContent icon={LayoutList}>Mở ngân hàng</IconButtonContent>
                  </Button>
                  <Button onClick={() => openBankForm(bank)} variant="secondary">
                    <IconButtonContent icon={Pencil}>Sửa</IconButtonContent>
                  </Button>
                  <Button onClick={() => handleDeleteBank(bank)} variant="ghost">
                    <IconButtonContent icon={Trash2}>Xóa</IconButtonContent>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có ngân hàng câu hỏi."
            description="Tạo ngân hàng đầu tiên để bắt đầu lưu câu hỏi, import câu hỏi và dùng ma trận đề thi."
            action={<Button onClick={() => openBankForm()}><IconButtonContent icon={Plus}>Tạo ngân hàng mới</IconButtonContent></Button>}
          />
        )}
      </div>
    );
  }

  function renderQuestionList() {
    return (
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Câu hỏi trong ngân hàng</h3>
            <p className="mt-1 text-sm text-secondary">Danh sách rộng để rà nội dung, trạng thái, độ khó và số lần dùng.</p>
          </div>
          <Badge variant="info">{questions.length} câu</Badge>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((question) => {
              const isExpanded = expandedBankQuestionId === question.id;

              return (
                <div key={question.id} className="rounded-[18px] border border-border bg-neutral p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <button className="min-w-0 flex-1 space-y-3 text-left" onClick={() => setExpandedBankQuestionId(isExpanded ? null : question.id)} type="button">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeVariant(question.status)}>{getStatusBadgeMark(question.status)} {getStatusLabel(question.status)}</Badge>
                        <Badge variant={getDifficultyBadgeVariant(question.difficulty)}>{getDifficultyBadgeMark(question.difficulty)} {getDifficultyLabel(question.difficulty)}</Badge>
                        <Badge variant="info">{getQuestionTypeLabel(question.questionType)}</Badge>
                        <Badge variant="neutral">v{question.version}</Badge>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-primary">{question.content}</p>
                      <p className="text-sm text-secondary">{question.chapter || "Chưa gán chương"} · {question.lesson || "Chưa gán bài"} · {question.defaultScore} điểm · dùng {question.timesUsed} lần</p>
                    </button>
                    <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                      <Button onClick={() => setExpandedBankQuestionId(isExpanded ? null : question.id)} variant="ghost">
                        <IconButtonContent icon={isExpanded ? ChevronUp : ChevronDown}>{isExpanded ? "Thu gọn" : "Xem đáp án"}</IconButtonContent>
                      </Button>
                      <Button onClick={() => openQuestionEditDialog(question)} variant="secondary">
                        <IconButtonContent icon={Pencil}>Sửa</IconButtonContent>
                      </Button>
                      {question.status !== "Archived" ? (
                        <Button onClick={() => handleArchiveQuestion(question)} variant="ghost">
                          <IconButtonContent icon={Archive}>Lưu trữ</IconButtonContent>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
                      {question.answers.map((answer, index) => (
                        <div key={answer.id ?? `${question.id}-answer-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-surface px-4 py-3">
                          <p className="text-sm leading-6 text-secondary">{String.fromCharCode(65 + index)}. {answer.content}</p>
                          <Badge variant={answer.isCorrect ? "success" : "neutral"}>{answer.isCorrect ? "Đúng" : "Sai"}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Ngân hàng này chưa có câu hỏi phù hợp." description="Thêm câu hỏi, nhập tệp hoặc nới bộ lọc để xem dữ liệu." />
        )}
      </Card>
    );
  }

  function renderQuestionManager() {
    return (
      <div className="space-y-5">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Bộ lọc câu hỏi</h3>
            <Button disabled={!selectedBankId} onClick={() => loadBankQuestions(selectedBankId)} variant="secondary">
              <IconButtonContent icon={Search}>Áp dụng lọc</IconButtonContent>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <TextInput id="filter-keyword" label="Từ khóa" onChange={(event) => setFilters((previous) => ({ ...previous, keyword: event.target.value }))} value={filters.keyword} />
            <Select id="filter-difficulty" label="Độ khó" onChange={(event) => setFilters((previous) => ({ ...previous, difficulty: event.target.value }))} options={[{ label: "Tất cả độ khó", value: "" }, ...questionBankEnums.difficultyOptions]} value={filters.difficulty} />
            <Select id="filter-type" label="Loại câu" onChange={(event) => setFilters((previous) => ({ ...previous, questionType: event.target.value }))} options={QUESTION_TYPE_FILTER_OPTIONS} value={filters.questionType} />
            <Select id="filter-status" label="Trạng thái" onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))} options={QUESTION_STATUS_FILTER_OPTIONS} value={filters.status} />
            <TextInput id="filter-chapter" label="Chương" onChange={(event) => setFilters((previous) => ({ ...previous, chapter: event.target.value }))} value={filters.chapter} />
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { resetQuestionForm(); setIsQuestionComposerOpen((value) => !value); }} variant={isQuestionComposerOpen ? "secondary" : "primary"}>
            <IconButtonContent icon={isQuestionComposerOpen ? ChevronUp : Plus}>{isQuestionComposerOpen ? "Thu gọn khung nhập" : "Thêm câu hỏi"}</IconButtonContent>
          </Button>
          <Button onClick={() => setIsImportPanelOpen((value) => !value)} variant="secondary">
            <IconButtonContent icon={FilePlus2}>{isImportPanelOpen ? "Thu gọn nhập tệp" : "Nhập câu hỏi từ tệp"}</IconButtonContent>
          </Button>
        </div>

        {isQuestionComposerOpen ? (
          <BankQuestionForm
            formValues={questionForm}
            isDisabled={!selectedBankId}
            isSubmitting={isQuestionSubmitting}
            onChange={setQuestionForm}
            onReset={() => resetQuestionForm()}
            onSubmit={handleSubmitQuestion}
            title="Thêm câu hỏi vào ngân hàng"
          />
        ) : null}

        {isImportPanelOpen ? (
          <div className="space-y-6">
            <QuestionImportResources
              bankId={selectedBankId}
              onQuestionsGenerated={async () => {
                await loadBankQuestions(selectedBankId);
                await loadPageData({ showLoader: false });
                showToast({
                  tone: "success",
                  title: "Sinh câu hỏi thành công",
                  message: "Các câu hỏi đã được sinh bằng AI và thêm vào ngân hàng câu hỏi.",
                });
              }}
            />
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Cấu hình thông tin mặc định cho câu hỏi nhập từ tệp</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <Select id="import-status" label="Trạng thái" onChange={(event) => setImportDefaults((previous) => ({ ...previous, status: event.target.value }))} options={questionBankEnums.statusOptions} value={importDefaults.status} />
                <TextInput id="import-subject" label="Môn" onChange={(event) => setImportDefaults((previous) => ({ ...previous, subject: event.target.value }))} value={importDefaults.subject} />
                <TextInput id="import-chapter" label="Chương" onChange={(event) => setImportDefaults((previous) => ({ ...previous, chapter: event.target.value }))} value={importDefaults.chapter} />
                <TextInput id="import-lesson" label="Bài" onChange={(event) => setImportDefaults((previous) => ({ ...previous, lesson: event.target.value }))} value={importDefaults.lesson} />
              </div>
            </Card>
            <QuestionImportPanel
              acceptedExtensions={[".csv", ".xlsx", ".txt", ".docx", ".pdf"]}
              commitLabel="Nhập vào ngân hàng"
              isDisabled={!selectedBankId}
              isSubmitting={isImportSubmitting}
              maxFileSizeLabel="5 MB"
              onClearFile={() => setImportFile(null)}
              onCommitImport={() => handleImportQuestions()}
              onFileSelected={setImportFile}
              stagedFile={importFile}
              statusLabel="Review trước khi nhập"
              submittingLabel="Đang nhập..."
            />
          </div>
        ) : null}

        {renderQuestionList()}
      </div>
    );
  }

  function renderDifficultySummary(summary, title = "Thống kê theo độ khó") {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-primary">{title}</h4>
        <div className="grid gap-3 md:grid-cols-3">
          {summary.difficultySummary.map((item) => (
            <div key={item.difficulty} className="rounded-[16px] border border-border bg-neutral p-4">
              <p className="text-sm font-semibold text-primary">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{item.questionCount} câu</p>
              <p className="mt-1 text-sm text-secondary">{formatMatrixNumber(item.totalScore)} điểm</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderMatrixDetailPanel() {
    if (!selectedMatrix) {
      return <EmptyState title="Chưa chọn ma trận." description="Chọn một ma trận đã lưu để xem tổng quan, thống kê và trạng thái đủ câu." />;
    }

    const availabilityRows = buildAvailabilityRows(selectedMatrix);

    return (
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Chi tiết ma trận</h3>
            <p className="mt-1 text-sm text-secondary">Output chính sau khi tạo ma trận: tổng quan, thống kê độ khó, dòng chi tiết và trạng thái đủ/thiếu câu hỏi.</p>
          </div>
          <Badge variant={validationResult?.isValid ? "success" : validationResult ? "caution" : "neutral"}>
            {validationResult?.isValid ? "Đủ câu" : validationResult ? "Còn thiếu" : "Chưa kiểm tra"}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Tổng câu</p><p className="mt-2 text-2xl font-semibold text-primary">{selectedMatrixTotals.totalQuestions}</p></div>
          <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Tổng điểm</p><p className="mt-2 text-2xl font-semibold text-primary">{formatMatrixNumber(selectedMatrixTotals.totalScore)}</p></div>
          <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Điểm/câu</p><p className="mt-2 text-2xl font-semibold text-primary">{formatMatrixNumber(selectedMatrixTotals.scorePerQuestion, 4)}</p></div>
          <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Thời lượng</p><p className="mt-2 text-2xl font-semibold text-primary">{selectedMatrix.durationMinutes} phút</p></div>
        </div>

        <div className="rounded-[18px] border border-border bg-neutral p-4">
          <h4 className="text-sm font-semibold text-primary">Tổng quan ma trận</h4>
          <div className="mt-3 grid gap-2 text-sm text-secondary md:grid-cols-2">
            <p><span className="font-semibold text-primary">Tên:</span> {selectedMatrix.name}</p>
            <p><span className="font-semibold text-primary">Môn:</span> {selectedMatrix.subject || "Chưa gán"}</p>
            <p><span className="font-semibold text-primary">Khối/lớp:</span> {selectedMatrix.gradeLevel || "Chưa gán"}</p>
            <p><span className="font-semibold text-primary">Điểm/câu:</span> {formatMatrixNumber(selectedMatrixTotals.scorePerQuestion, 4)}</p>
          </div>
        </div>

        {renderDifficultySummary(selectedMatrixTotals)}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary">Chi tiết dòng ma trận</h4>
          <div className="overflow-auto rounded-[18px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-neutral text-left text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                <tr>
                  <th className="px-4 py-3">Chương</th>
                  <th className="px-4 py-3">Bài</th>
                  <th className="px-4 py-3">Yêu cầu cần đạt</th>
                  <th className="px-4 py-3">Loại câu</th>
                  <th className="px-4 py-3">Độ khó</th>
                  <th className="px-4 py-3 text-right">Số câu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {selectedMatrix.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3 text-primary">{item.chapter || "Bất kỳ"}</td>
                    <td className="px-4 py-3 text-secondary">{item.lesson || "Bất kỳ"}</td>
                    <td className="px-4 py-3 text-secondary">{item.learningOutcome || "Bất kỳ"}</td>
                    <td className="px-4 py-3 text-secondary">{getQuestionTypeLabel(item.questionType)}</td>
                    <td className="px-4 py-3 text-secondary">{getDifficultyLabel(item.difficulty)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{item.questionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-primary">Trạng thái ngân hàng câu hỏi</h4>
            <Button disabled={isMatrixActionRunning || !selectedBankId || !selectedMatrixId} onClick={handleValidateMatrix} variant="secondary">Kiểm tra đủ câu</Button>
          </div>
          <div className="overflow-auto rounded-[18px] border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-neutral text-left text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                <tr>
                  <th className="px-4 py-3">Dòng</th>
                  <th className="px-4 py-3">Điều kiện</th>
                  <th className="px-4 py-3 text-right">Cần</th>
                  <th className="px-4 py-3 text-right">Hiện có</th>
                  <th className="px-4 py-3 text-right">Thiếu</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {availabilityRows.map((row) => {
                  const shortfall = formatMatrixIssueShortfall(row);
                  const isMissing = row.checked && shortfall.missing > 0;
                  return (
                    <tr key={row.matrixItemId || row.rowIndex}>
                      <td className="px-4 py-3 font-semibold text-primary">{row.rowIndex}</td>
                      <td className="px-4 py-3 text-secondary">{formatMatrixIssueRequirement(row)}</td>
                      <td className="px-4 py-3 text-right text-primary">{shortfall.required}</td>
                      <td className="px-4 py-3 text-right text-primary">{row.checked ? shortfall.available : "-"}</td>
                      <td className="px-4 py-3 text-right text-primary">{row.checked ? shortfall.missing : "-"}</td>
                      <td className="px-4 py-3"><Badge variant={!row.checked ? "neutral" : isMissing ? "danger" : "success"}>{!row.checked ? "Chưa kiểm tra" : isMissing ? "Thiếu" : "Đủ"}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  }

  function renderMatrixManager() {
    const easyPercent = matrixTotals.totalQuestions > 0 ? (easyCount / matrixTotals.totalQuestions) * 100 : 0;
    const mediumPercent = matrixTotals.totalQuestions > 0 ? (mediumCount / matrixTotals.totalQuestions) * 100 : 0;
    const easyMediumPercent = matrixTotals.totalQuestions > 0 ? ((easyCount + mediumCount) / matrixTotals.totalQuestions) * 100 : 0;

    return (
      <div ref={matrixPanelRef} className="space-y-6">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-primary">Chọn ma trận làm việc</h3>
              <p className="text-sm text-secondary">Chọn ma trận đã lưu để chỉnh sửa, kiểm tra tương thích và sinh đề, hoặc tạo ma trận mới.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="eg-input min-w-56"
                value={selectedMatrixId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "new") {
                    setSelectedMatrixId("");
                    resetMatrixForm();
                  } else {
                    selectMatrix(val);
                  }
                }}
              >
                <option value="new">-- Tạo ma trận mới --</option>
                {matrices.map((matrix) => (
                  <option key={matrix.id} value={matrix.id}>
                    {matrix.name} ({matrix.totalQuestions} câu · {matrix.totalScore} điểm)
                  </option>
                ))}
              </select>
              {selectedMatrixId && (
                <Button onClick={() => { setSelectedMatrixId(""); resetMatrixForm(); }} variant="secondary">
                  Tạo mới
                </Button>
              )}
            </div>
          </div>
        </Card>
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">Ma trận đề thi</h3>
              <p className="mt-1 text-sm text-secondary">Ma trận dùng để mô tả đề cần bao nhiêu câu theo chương, bài, yêu cầu cần đạt, loại câu và độ khó.</p>
            </div>
            <Badge variant="info">{matrixTotals.totalQuestions} câu · {formatMatrixNumber(matrixTotals.totalScore)} điểm · {formatMatrixNumber(matrixTotals.scorePerQuestion, 4)} điểm/câu</Badge>
          </div>
          <form className="space-y-5" onSubmit={handleSubmitMatrix}>
            <div className="flex flex-col gap-2 max-w-md mb-2">
              <label className="text-sm font-semibold text-secondary" htmlFor="copy-matrix-select">
                Sao chép cấu hình từ ma trận có sẵn
              </label>
              <select
                id="copy-matrix-select"
                className="eg-input"
                onChange={(e) => {
                  const targetId = e.target.value;
                  if (!targetId) return;
                  const foundMatrix = matrices.find((m) => String(m.id) === String(targetId));
                  if (foundMatrix) {
                    loadMatrixIntoForm(foundMatrix);
                    showToast({ tone: "success", title: "Đã sao chép cấu hình", message: `Đã sao chép cấu hình của ma trận "${foundMatrix.name}"` });
                  }
                  e.target.value = "";
                }}
              >
                <option value="">-- Chọn ma trận để sao chép --</option>
                {matrices.map((matrix) => (
                  <option key={matrix.id} value={matrix.id}>
                    {matrix.name} ({matrix.totalQuestions} câu - {matrix.totalScore} điểm)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
              <TextInput id="matrix-name" label="Tên ma trận" onChange={(event) => updateMatrixForm("name", event.target.value)} required value={matrixForm.name} />
              <TextInput id="matrix-subject" label="Môn" onChange={(event) => updateMatrixForm("subject", event.target.value)} required value={matrixForm.subject} />
              <TextInput id="matrix-grade" label="Khối/lớp" onChange={(event) => updateMatrixForm("gradeLevel", event.target.value)} value={matrixForm.gradeLevel} />
              <TextInput id="matrix-duration" label="Thời lượng phút" min="1" onChange={(event) => updateMatrixForm("durationMinutes", event.target.value)} type="number" value={matrixForm.durationMinutes} />
              <TextInput id="matrix-total-questions" label="Tổng số câu" min="1" onChange={(event) => updateMatrixForm("totalQuestions", event.target.value)} required type="number" value={matrixForm.totalQuestions} />
              <TextInput id="matrix-total-score" label="Tổng điểm" min="0.25" onChange={(event) => updateMatrixForm("totalScore", event.target.value)} required step="0.25" type="number" value={matrixForm.totalScore} />
              <TextInput id="matrix-score-per-question" label="Điểm/câu" readOnly value={formatMatrixNumber(matrixTotals.scorePerQuestion, 4)} />
            </div>

            <div className="space-y-4 rounded-[18px] border border-border bg-neutral p-4">
              <label className="text-sm font-semibold text-primary block">Tỷ lệ độ khó (kéo các nút để phân bổ số câu)</label>
              <div 
                className="relative h-6 w-full rounded-full bg-slate-200 dark:bg-slate-700/50 border border-border select-none mt-2 overflow-visible" 
                ref={sliderRef}
              >
                {/* Segment 1: Easy (Blue) */}
                <div 
                  className="absolute top-0 bottom-0 left-0 rounded-l-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-90 transition-all"
                  style={{ width: `${easyPercent}%` }}
                />
                {/* Segment 2: Medium (Orange) */}
                <div 
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-90 transition-all"
                  style={{ 
                    left: `${easyPercent}%`, 
                    width: `${mediumPercent}%` 
                  }}
                />
                {/* Segment 3: Hard (Purple) */}
                <div 
                  className="absolute top-0 bottom-0 right-0 rounded-r-full bg-gradient-to-r from-violet-500 to-purple-500 opacity-90 transition-all"
                  style={{ 
                    left: `${easyMediumPercent}%`
                  }}
                />

                {/* Handle 1 (Easy / Medium boundary) */}
                {matrixTotals.totalQuestions > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10 flex items-center justify-center text-[10px] font-bold text-indigo-700"
                    style={{ left: `${easyPercent}%` }}
                    onMouseDown={(e) => handleStartDrag(e, 1)}
                    onTouchStart={(e) => handleStartDrag(e, 1)}
                  >
                    {easyCount}
                  </div>
                )}

                {/* Handle 2 (Medium / Hard boundary) */}
                {matrixTotals.totalQuestions > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-orange-500 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10 flex items-center justify-center text-[10px] font-bold text-orange-700"
                    style={{ left: `${easyMediumPercent}%` }}
                    onMouseDown={(e) => handleStartDrag(e, 2)}
                    onTouchStart={(e) => handleStartDrag(e, 2)}
                  >
                    {easyCount + mediumCount}
                  </div>
                )}
              </div>

              {/* Legend with question count */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs mt-3">
                <div className="rounded-[12px] bg-blue-500/10 border border-blue-500/20 p-2.5">
                  <span className="block font-semibold text-blue-500">Dễ (Easy)</span>
                  <span className="block text-sm font-bold text-primary mt-1">{easyCount} câu</span>
                </div>
                <div className="rounded-[12px] bg-orange-500/10 border border-orange-500/20 p-2.5">
                  <span className="block font-semibold text-orange-500">Trung bình (Medium)</span>
                  <span className="block text-sm font-bold text-primary mt-1">{mediumCount} câu</span>
                </div>
                <div className="rounded-[12px] bg-purple-500/10 border border-purple-500/20 p-2.5">
                  <span className="block font-semibold text-purple-500">Khó (Hard)</span>
                  <span className="block text-sm font-bold text-primary mt-1">{hardCount} câu</span>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-info/20 bg-info-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Tóm tắt realtime</p>
                  <p className="mt-1 text-sm text-secondary">{matrixTotals.totalQuestions} câu · {formatMatrixNumber(matrixTotals.totalScore)} điểm · {formatMatrixNumber(matrixTotals.scorePerQuestion, 4)} điểm/câu</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matrixTotals.difficultySummary.map((item) => (
                    <Badge key={item.difficulty} variant="info">{item.label}: {item.questionCount} câu</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mt-4">
              <TextInput id="matrix-chapter" label="Chương" onChange={(event) => updateMatrixForm("chapter", event.target.value)} value={matrixForm.chapter} />
              <TextInput id="matrix-lesson" label="Bài" onChange={(event) => updateMatrixForm("lesson", event.target.value)} value={matrixForm.lesson} />
              <TextInput id="matrix-outcome" label="Yêu cầu cần đạt" onChange={(event) => updateMatrixForm("learningOutcome", event.target.value)} value={matrixForm.learningOutcome} />
              <Select id="matrix-type" label="Loại câu" onChange={(event) => updateMatrixForm("questionType", event.target.value)} options={MATRIX_QUESTION_TYPE_OPTIONS} value={matrixForm.questionType} />
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <Button disabled={isMatrixSubmitting} type="submit">
                <IconButtonContent icon={Table2}>{isMatrixSubmitting ? "Đang lưu..." : matrixForm.id ? "Cập nhật ma trận" : "Tạo ma trận"}</IconButtonContent>
              </Button>
              {matrixForm.id ? (
                <Button onClick={() => { setSelectedMatrixId(""); resetMatrixForm(); }} variant="ghost">
                  Hủy sửa
                </Button>
              ) : null}
            </div>
          </form>
        </Card>



          {renderMatrixDetailPanel()}

          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-primary">Đề nháp từ ma trận</h3>
                <p className="mt-1 text-sm text-secondary">Sinh đề nháp để xem và sửa trước, sau đó mới xác nhận đặt lịch bài kiểm tra thật.</p>
              </div>
              <Badge variant={draftExamQuestions.length > 0 ? "info" : "neutral"}>{draftExamQuestions.length} câu nháp</Badge>
            </div>

            <div className="rounded-[16px] border border-border bg-neutral p-4 space-y-2 text-sm">
              <p><span className="font-semibold text-secondary">Ngân hàng hiện tại:</span> <span className="font-bold text-primary">{selectedBank?.name || "Bất kỳ"}</span></p>
              <p><span className="font-semibold text-secondary">Ma trận đang chọn:</span> <span className="font-bold text-primary">{selectedMatrix?.name || "Chưa lưu ma trận (Vui lòng điền thông tin và bấm Tạo ma trận ở trên)"}</span></p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button disabled={isMatrixActionRunning || !selectedBankId || !selectedMatrixId} onClick={handleValidateMatrix} variant="secondary">Kiểm tra đủ câu</Button>
              <Button disabled={isMatrixActionRunning || !selectedBankId || !selectedMatrixId || !canGenerateFromSelectedMatrix()} onClick={handleGeneratePreview} variant="secondary">{draftExamQuestions.length > 0 ? "Sinh lại đề nháp" : "Sinh đề nháp"}</Button>
            </div>

            {validationResult ? (
              <div className={`rounded-[16px] border p-4 text-sm ${validationResult.isValid ? "border-success/20 bg-success-muted text-success" : "border-caution/20 bg-caution-muted text-caution"}`}>{validationResult.message}</div>
            ) : (
              <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Kiểm tra đủ câu hoặc sinh đề nháp để hệ thống đối chiếu ngân hàng với ma trận đang chọn.</div>
            )}

            {draftMatrixWarnings.length > 0 ? (
              <div className="rounded-[18px] border border-caution/20 bg-caution-muted p-4 text-sm text-caution">
                <p className="font-semibold">Cảnh báo lệch ma trận</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {draftMatrixWarnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
                {draftMatrixWarnings.length > 5 ? <p className="mt-2">Còn {draftMatrixWarnings.length - 5} cảnh báo khác.</p> : null}
              </div>
            ) : null}

            {draftExamQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Số câu nháp</p><p className="mt-2 text-2xl font-semibold text-primary">{draftExamQuestions.length}</p></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Tổng điểm nháp</p><p className="mt-2 text-2xl font-semibold text-primary">{formatMatrixNumber(draftExamTotalScore)}</p></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">Cảnh báo</p><p className="mt-2 text-2xl font-semibold text-primary">{draftMatrixWarnings.length}</p></div>
                </div>

                <div className="max-h-[520px] space-y-3 overflow-auto rounded-[18px] border border-border bg-neutral p-4">
                  {draftExamQuestions.map((question, index) => (
                    <div key={question.draftId} className="rounded-[16px] border border-border bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="info">Câu {index + 1}</Badge>
                            <Badge variant="neutral">{getQuestionTypeLabel(question.questionType)}</Badge>
                            <Badge variant={getDifficultyBadgeVariant(question.difficulty)}>{getDifficultyLabel(question.difficulty)}</Badge>
                            <Badge variant="success">{formatMatrixNumber(question.score)} điểm</Badge>
                          </div>
                          <p className="text-sm font-semibold leading-6 text-primary">{question.content}</p>
                          <p className="text-xs leading-5 text-secondary">Chương: {question.chapter || "Bất kỳ"} · Bài: {question.lesson || "Bất kỳ"} · Yêu cầu cần đạt: {question.learningOutcome || "Bất kỳ"}</p>
                        </div>
                        <Button onClick={() => openDraftQuestionEditDialog(question, index)} variant="secondary">
                          <IconButtonContent icon={Pencil}>Sửa câu</IconButtonContent>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button disabled={isMatrixActionRunning || !canOpenScheduleDialog()} onClick={handleOpenGenerateExamDialog}>Xác nhận đề nháp và đặt lịch</Button>
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa có đề nháp." description="Bấm Sinh đề nháp để hệ thống lấy câu từ ngân hàng theo ma trận đang chọn." />
            )}
          </Card>
      </div>
    );
  }

  function renderBankDetailView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[24px] border border-border bg-surface p-6">
          <div className="min-w-0 space-y-3">
            <Button onClick={closeBankDetail} variant="ghost">
              <IconButtonContent icon={ArrowLeft}>Quay lại danh sách</IconButtonContent>
            </Button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">Ngân hàng câu hỏi</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">{selectedBank.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">{selectedBank.description || "Ngân hàng này chưa có mô tả."}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => openBankForm(selectedBank)} variant="secondary"><IconButtonContent icon={Pencil}>Sửa ngân hàng</IconButtonContent></Button>
            <Button onClick={openMatrixSection}><IconButtonContent icon={Table2}>Tạo ma trận đề thi</IconButtonContent></Button>
            <Link className="eg-button eg-button-secondary" to={routeConfig.teacherExams}>Tạo đề kiểm tra</Link>
            <Button onClick={() => handleDeleteBank(selectedBank)} variant="ghost"><IconButtonContent icon={Trash2}>Xóa ngân hàng</IconButtonContent></Button>
          </div>
        </div>

        {isBankFormOpen ? renderBankFormPanel() : null}

        <div className="flex flex-wrap gap-2">
          <button className={activeBankSection === "questions" ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"} onClick={() => setActiveBankSection("questions")} type="button">Câu hỏi trong ngân hàng</button>
          <button className={activeBankSection === "matrix" ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"} onClick={openMatrixSection} type="button">Ma trận đề thi</button>
        </div>

        {activeBankSection === "questions" ? renderQuestionManager() : renderMatrixManager()}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeader
          eyebrow="Giảng viên"
          title="Ngân hàng câu hỏi"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-11 w-11 rounded-[16px]" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-16 rounded-xl" />
                <Skeleton className="h-10 w-16 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedBank ? renderBankDetailView() : renderBankListView()}
      <MatrixIssueDialog dialog={matrixIssueDialog} onClose={() => setMatrixIssueDialog(null)} />
      {isQuestionEditDialogOpen ? (
        <QuestionEditDialog
          formValues={questionForm}
          isDisabled={!selectedBankId}
          isSubmitting={isQuestionSubmitting}
          onChange={setQuestionForm}
          onClose={closeQuestionEditDialog}
          onSubmit={handleSubmitQuestion}
        />
      ) : null}
      <DraftQuestionEditDialog
        formValues={draftQuestionForm}
        isSubmitting={false}
        onChange={setDraftQuestionForm}
        onClose={closeDraftQuestionEditDialog}
        onSubmit={handleSubmitDraftQuestion}
      />
      <GenerateExamConfirmDialog
        classroomOptions={classroomOptions}
        dialog={generateExamDialog}
        formValues={createExamForm}
        isSubmitting={isMatrixActionRunning}
        warnings={draftMatrixWarnings}
        onCancel={() => setGenerateExamDialog(null)}
        onChange={setCreateExamForm}
        onConfirm={handleConfirmCreateExamFromMatrix}
      />
    </>
  );
}
