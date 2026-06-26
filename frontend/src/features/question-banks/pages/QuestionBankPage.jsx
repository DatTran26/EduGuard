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
import { buildTeacherTasksPath } from "../../../routes/routeConfig";
import { toVietnamISOString } from "../../exams/examHelpers";
import BankQuestionForm from "../components/BankQuestionForm";
import {
  EMPTY_BANK_FORM,
  EMPTY_CREATE_EXAM_FORM,
  EMPTY_IMPORT_DEFAULTS,
  EMPTY_MATRIX_FORM,
  EMPTY_MATRIX_ITEM,
  MATRIX_QUESTION_TYPE_OPTIONS,
  QUESTION_STATUS_FILTER_OPTIONS,
  QUESTION_TYPE_FILTER_OPTIONS,
  buildBankQuestionFilters,
  buildEmptyQuestionForm,
  buildMatrixFormFromMatrix,
  buildQuestionFormFromQuestion,
  calculateMatrixTotals,
  formatMatrixIssueRequirement,
  formatMatrixIssueShortfall,
  getDifficultyBadgeMark,
  getDifficultyBadgeVariant,
  getDifficultyLabel,
  getQuestionTypeLabel,
  getStatusBadgeMark,
  getStatusBadgeVariant,
  getStatusLabel,
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

export default function QuestionBankPage() {
  const { showToast } = useToast();
  const importFileRef = useRef(null);
  const matrixPanelRef = useRef(null);
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
  const [matrixIssueDialog, setMatrixIssueDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBankSubmitting, setIsBankSubmitting] = useState(false);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [isMatrixSubmitting, setIsMatrixSubmitting] = useState(false);
  const [isMatrixActionRunning, setIsMatrixActionRunning] = useState(false);
  const selectedBank = banks.find((bank) => Number(bank.id) === Number(selectedBankId)) ?? null;
  const selectedMatrix = matrices.find((matrix) => Number(matrix.id) === Number(selectedMatrixId)) ?? null;
  const matrixTotals = useMemo(() => calculateMatrixTotals(matrixForm.items), [matrixForm.items]);
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
    setMatrixForm((previous) => ({ ...previous, [fieldName]: value }));
  }

  function updateMatrixItem(index, fieldName, value) {
    setMatrixForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => itemIndex === index ? { ...item, [fieldName]: value } : item),
    }));
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
    setPreviewResult(null);
    setIsQuestionComposerOpen(false);
    setIsImportPanelOpen(false);
    resetQuestionForm(bank);
  }

  function closeBankDetail() {
    setSelectedBankId("");
    setQuestions([]);
    setActiveBankSection("questions");
    setExpandedBankQuestionId(null);
    resetQuestionForm(null);
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
      showToast({ tone: "success", title: editingBankId ? "Đã cập nhật ngân hàng" : "Đã tạo ngân hàng", message: response.message });
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
    setIsQuestionSubmitting(true);
    try {
      const response = questionForm.id ? await questionBankApi.updateQuestion(questionForm.id, questionForm) : await questionBankApi.createQuestion(selectedBankId, questionForm);
      await loadBankQuestions(selectedBankId);
      await loadPageData({ showLoader: false });
      resetQuestionForm();
      setIsQuestionComposerOpen(false);
      showToast({ tone: "success", title: questionForm.id ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi", message: response.message });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu câu hỏi thất bại", message: error.message || "Không thể lưu câu hỏi." });
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  async function handleArchiveQuestion(question) {
    try {
      const response = await questionBankApi.archiveQuestion(question.id);
      await loadBankQuestions(selectedBankId);
      showToast({ tone: "success", title: "Đã lưu trữ câu hỏi", message: response.message });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu trữ thất bại", message: error.message || "Không thể lưu trữ câu hỏi." });
    }
  }

  async function handleImportQuestions(event) {
    event.preventDefault();
    if (!selectedBankId || !importFile) return;
    setIsImportSubmitting(true);
    try {
      const response = await questionBankApi.importQuestions(selectedBankId, importFile, importDefaults);
      await loadBankQuestions(selectedBankId);
      await loadPageData({ showLoader: false });
      setImportFile(null);
      setIsImportPanelOpen(false);
      if (importFileRef.current) importFileRef.current.value = "";
      showToast({ tone: "success", title: "Đã import câu hỏi", message: response.message });
    } catch (error) {
      const errors = Array.isArray(error.importResult?.errors) ? error.importResult.errors : [];
      showToast({ tone: "danger", title: "Import thất bại", message: errors[0]?.errorMessage || error.message || "Không thể import câu hỏi." });
    } finally {
      setIsImportSubmitting(false);
    }
  }

  async function handleSubmitMatrix(event) {
    event.preventDefault();
    const payload = { ...matrixForm, totalQuestions: matrixTotals.totalQuestions, totalScore: matrixTotals.totalScore };
    setIsMatrixSubmitting(true);
    try {
      const response = matrixForm.id ? await questionBankApi.updateMatrix(matrixForm.id, payload) : await questionBankApi.createMatrix(payload);
      await loadPageData({ showLoader: false });
      setSelectedMatrixId(String(response.data.id));
      setCreateExamForm((previous) => ({ ...previous, matrixId: String(response.data.id) }));
      setMatrixForm(EMPTY_MATRIX_FORM);
      showToast({ tone: "success", title: matrixForm.id ? "Đã cập nhật ma trận" : "Đã tạo ma trận", message: response.message });
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
      if (!response.data.success) {
        showMatrixIssueDialog("Không thể tạo preview từ ma trận", response.data);
      }
      showToast({ tone: response.data.success ? "success" : "caution", title: "Đã tạo preview", message: response.data.message });
    } catch (error) {
      showToast({ tone: "danger", title: "Tạo preview thất bại", message: error.message || "Không thể tạo preview." });
    } finally {
      setIsMatrixActionRunning(false);
    }
  }

  async function handleCreateExamFromMatrix(event) {
    event.preventDefault();
    const matrixId = createExamForm.matrixId || selectedMatrixId;
    if (!matrixId || !selectedBankId || !createExamForm.classroomId || !createExamForm.title.trim()) return;
    setIsMatrixActionRunning(true);
    try {
      const response = await questionBankApi.createExamFromMatrix(matrixId, {
        ...createExamForm,
        questionBankId: selectedBankId,
        startTime: toVietnamISOString(createExamForm.startTime),
        endTime: toVietnamISOString(createExamForm.endTime),
      });
      showToast({ tone: "success", title: "Đã tạo đề từ ma trận", message: response.message || "Đề thi mới đã được tạo ở trạng thái nháp." });
    } catch (error) {
      showToast({ tone: "danger", title: "Tạo đề thất bại", message: error.message || "Không thể tạo đề từ ma trận." });
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
          eyebrow="Teacher"
          title="Ngân hàng câu hỏi"
          actions={
            <div className="flex flex-wrap gap-2">
                  <Link className="eg-button eg-button-secondary" to={buildTeacherTasksPath("exam")}>Đi tới đề thi</Link>
              <Button onClick={() => openBankForm()}>
                <IconButtonContent icon={Plus}>Tạo ngân hàng mới</IconButtonContent>
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card><p className="text-sm text-secondary">Ngân hàng</p><p className="mt-2 text-3xl font-semibold text-primary">{banks.length}</p></Card>
          <Card><p className="text-sm text-secondary">Tổng câu hỏi</p><p className="mt-2 text-3xl font-semibold text-primary">{banks.reduce((total, bank) => total + Number(bank.questionCount || 0), 0)}</p></Card>
          <Card><p className="text-sm text-secondary">Ma trận đề thi</p><p className="mt-2 text-3xl font-semibold text-primary">{matrices.length}</p></Card>
        </div>

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
            <h3 className="text-lg font-semibold text-primary">Câu hỏi trong bank</h3>
            <p className="mt-1 text-sm text-secondary">Danh sách rộng để scan nội dung, trạng thái, độ khó và số lần dùng.</p>
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
                      <Button onClick={() => { setQuestionForm(buildQuestionFormFromQuestion(question)); setIsQuestionComposerOpen(true); }} variant="secondary">
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
          <EmptyState title="Bank này chưa có câu hỏi phù hợp." description="Thêm câu hỏi, import file hoặc nới bộ lọc để xem dữ liệu." />
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
            <IconButtonContent icon={isQuestionComposerOpen ? ChevronUp : Plus}>{isQuestionComposerOpen ? "Thu gọn form" : "Thêm câu hỏi"}</IconButtonContent>
          </Button>
          <Button onClick={() => setIsImportPanelOpen((value) => !value)} variant="secondary">
            <IconButtonContent icon={FilePlus2}>{isImportPanelOpen ? "Thu gọn import" : "Import câu hỏi"}</IconButtonContent>
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
            title={questionForm.id ? "Sửa câu hỏi bank" : "Thêm câu hỏi vào bank"}
          />
        ) : null}

        {isImportPanelOpen ? (
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Import câu hỏi vào bank</h3>
            <form className="space-y-4" onSubmit={handleImportQuestions}>
              <input ref={importFileRef} accept=".csv,.xlsx,.txt,.docx,.pdf" className="eg-input w-full" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} type="file" />
              <div className="grid gap-4 md:grid-cols-4">
                <Select id="import-difficulty" label="Độ khó" onChange={(event) => setImportDefaults((previous) => ({ ...previous, difficulty: event.target.value }))} options={questionBankEnums.difficultyOptions} value={importDefaults.difficulty} />
                <Select id="import-status" label="Trạng thái" onChange={(event) => setImportDefaults((previous) => ({ ...previous, status: event.target.value }))} options={questionBankEnums.statusOptions} value={importDefaults.status} />
                <TextInput id="import-subject" label="Môn" onChange={(event) => setImportDefaults((previous) => ({ ...previous, subject: event.target.value }))} value={importDefaults.subject} />
                <TextInput id="import-chapter" label="Chương" onChange={(event) => setImportDefaults((previous) => ({ ...previous, chapter: event.target.value }))} value={importDefaults.chapter} />
              </div>
              <Button disabled={isImportSubmitting || !selectedBankId || !importFile} type="submit">
                <IconButtonContent icon={FilePlus2}>{isImportSubmitting ? "Đang import..." : "Import vào ngân hàng"}</IconButtonContent>
              </Button>
            </form>
          </Card>
        ) : null}

        {renderQuestionList()}
      </div>
    );
  }

  function renderMatrixManager() {
    return (
      <div ref={matrixPanelRef} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">Ma trận đề thi</h3>
              <p className="mt-1 text-sm text-secondary">Ma trận dùng để mô tả đề cần bao nhiêu câu theo chương, bài, chuẩn đầu ra, loại câu và độ khó.</p>
            </div>
            <Badge variant="info">{matrixTotals.totalQuestions} câu · {matrixTotals.totalScore} điểm</Badge>
          </div>
          <form className="space-y-5" onSubmit={handleSubmitMatrix}>
            <div className="grid gap-4 md:grid-cols-4">
              <TextInput id="matrix-name" label="Tên ma trận" onChange={(event) => updateMatrixForm("name", event.target.value)} required value={matrixForm.name} />
              <TextInput id="matrix-subject" label="Môn" onChange={(event) => updateMatrixForm("subject", event.target.value)} value={matrixForm.subject} />
              <TextInput id="matrix-grade" label="Khối/lớp" onChange={(event) => updateMatrixForm("gradeLevel", event.target.value)} value={matrixForm.gradeLevel} />
              <TextInput id="matrix-duration" label="Thời lượng phút" min="1" onChange={(event) => updateMatrixForm("durationMinutes", event.target.value)} type="number" value={matrixForm.durationMinutes} />
            </div>
            {matrixForm.items.map((item, index) => (
              <div key={index} className="rounded-[18px] border border-border bg-neutral p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">Dòng ma trận {index + 1}</p>
                  {matrixForm.items.length > 1 ? <Button onClick={() => setMatrixForm((previous) => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }))} variant="ghost">Xóa dòng</Button> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  <TextInput id={`matrix-chapter-${index}`} label="Chương" onChange={(event) => updateMatrixItem(index, "chapter", event.target.value)} value={item.chapter} />
                  <TextInput id={`matrix-lesson-${index}`} label="Bài" onChange={(event) => updateMatrixItem(index, "lesson", event.target.value)} value={item.lesson} />
                  <TextInput id={`matrix-outcome-${index}`} label="Chuẩn đầu ra" onChange={(event) => updateMatrixItem(index, "learningOutcome", event.target.value)} value={item.learningOutcome} />
                  <Select id={`matrix-type-${index}`} label="Loại câu" onChange={(event) => updateMatrixItem(index, "questionType", event.target.value)} options={MATRIX_QUESTION_TYPE_OPTIONS} value={item.questionType} />
                  <Select id={`matrix-difficulty-${index}`} label="Độ khó" onChange={(event) => updateMatrixItem(index, "difficulty", event.target.value)} options={questionBankEnums.difficultyOptions} value={item.difficulty} />
                  <TextInput id={`matrix-count-${index}`} label="Số câu" min="1" onChange={(event) => updateMatrixItem(index, "questionCount", event.target.value)} type="number" value={item.questionCount} />
                  <TextInput id={`matrix-score-${index}`} label="Điểm/câu" min="0.25" onChange={(event) => updateMatrixItem(index, "scorePerQuestion", event.target.value)} step="0.25" type="number" value={item.scorePerQuestion} />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setMatrixForm((previous) => ({ ...previous, items: [...previous.items, { ...EMPTY_MATRIX_ITEM }] }))} variant="secondary">
                <IconButtonContent icon={Plus}>Thêm dòng</IconButtonContent>
              </Button>
              <Button disabled={isMatrixSubmitting} type="submit">
                <IconButtonContent icon={Table2}>{isMatrixSubmitting ? "Đang lưu..." : matrixForm.id ? "Cập nhật ma trận" : "Tạo ma trận"}</IconButtonContent>
              </Button>
              {matrixForm.id ? <Button onClick={() => setMatrixForm(EMPTY_MATRIX_FORM)} variant="ghost">Hủy sửa</Button> : null}
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Ma trận đã lưu</h3>
            {matrices.length > 0 ? (
              <div className="space-y-3">
                {matrices.map((matrix) => (
                  <div key={matrix.id} className={`rounded-[18px] border p-4 ${Number(selectedMatrixId) === matrix.id ? "border-tertiary bg-info-muted" : "border-border bg-neutral"}`}>
                    <p className="text-sm font-semibold text-primary">{matrix.name}</p>
                    <p className="mt-1 text-sm text-secondary">{matrix.totalQuestions} câu · {matrix.totalScore} điểm · {matrix.durationMinutes} phút</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={() => { setSelectedMatrixId(String(matrix.id)); setCreateExamForm((previous) => ({ ...previous, matrixId: String(matrix.id) })); }} variant="secondary">Chọn</Button>
                      <Button onClick={() => setMatrixForm(buildMatrixFormFromMatrix(matrix))} variant="ghost">Sửa</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="Chưa có ma trận đề." />}
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Kiểm tra và tạo đề</h3>
            <Select id="matrix-bank" label="Ngân hàng" onChange={(event) => setSelectedBankId(event.target.value)} options={bankOptions} value={selectedBankId} />
            <Select id="matrix-select" label="Ma trận" onChange={(event) => { setSelectedMatrixId(event.target.value); setCreateExamForm((previous) => ({ ...previous, matrixId: event.target.value })); }} options={matrixOptions} value={selectedMatrixId} />
            {selectedMatrix ? <p className="text-sm text-secondary">Đang chọn: {selectedMatrix.name}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button disabled={isMatrixActionRunning || !selectedBankId || !selectedMatrixId} onClick={handleValidateMatrix} variant="secondary">Kiểm tra đủ câu</Button>
              <Button disabled={isMatrixActionRunning || !selectedBankId || !selectedMatrixId} onClick={handleGeneratePreview} variant="secondary">Tạo preview</Button>
            </div>
            {validationResult ? (
              <div className={`rounded-[16px] border p-4 text-sm ${validationResult.isValid ? "border-success/20 bg-success-muted text-success" : "border-caution/20 bg-caution-muted text-caution"}`}>{validationResult.message}</div>
            ) : null}
            {previewResult?.questions?.length > 0 ? (
              <div className="max-h-72 space-y-2 overflow-auto rounded-[16px] border border-border bg-neutral p-4">
                {previewResult.questions.map((item, index) => (
                  <div key={`${item.question.id}-${index}`} className="rounded-[14px] border border-border bg-surface px-3 py-2 text-sm text-secondary">
                    <span className="font-semibold text-primary">{index + 1}.</span> {item.question.content}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Tạo đề từ ma trận</h3>
            <form className="space-y-4" onSubmit={handleCreateExamFromMatrix}>
              <Select id="exam-classroom" label="Lớp học" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, classroomId: event.target.value }))} options={classroomOptions} value={createExamForm.classroomId} />
              <TextInput id="exam-title" label="Tiêu đề đề thi" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, title: event.target.value }))} required value={createExamForm.title} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput id="exam-start" label="Mở đề" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, startTime: event.target.value }))} type="datetime-local" value={createExamForm.startTime} />
                <TextInput id="exam-end" label="Đóng đề" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, endTime: event.target.value }))} type="datetime-local" value={createExamForm.endTime} />
                <TextInput id="exam-attempts" label="Số lần làm" min="1" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, settings: { ...previous.settings, maxAttempts: event.target.value } }))} type="number" value={createExamForm.settings.maxAttempts} />
              </div>
              <CheckboxField checked={createExamForm.enableAntiCheat} id="exam-anticheat" label="Bật anti-cheat" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, enableAntiCheat: event.target.checked }))} />
              <CheckboxField checked={createExamForm.settings.shuffleQuestions} id="exam-shuffle-question" label="Trộn câu hỏi" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, settings: { ...previous.settings, shuffleQuestions: event.target.checked } }))} />
              <CheckboxField checked={createExamForm.settings.shuffleAnswers} id="exam-shuffle-answer" label="Trộn đáp án" onChange={(event) => setCreateExamForm((previous) => ({ ...previous, settings: { ...previous.settings, shuffleAnswers: event.target.checked } }))} />
              <Button disabled={isMatrixActionRunning || !selectedBankId || !createExamForm.matrixId} type="submit">{isMatrixActionRunning ? "Đang tạo..." : "Tạo đề nháp"}</Button>
            </form>
          </Card>
        </div>
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
            <Button onClick={() => openBankForm(selectedBank)} variant="secondary"><IconButtonContent icon={Pencil}>Sửa bank</IconButtonContent></Button>
            <Button onClick={openMatrixSection}><IconButtonContent icon={Table2}>Tạo ma trận đề thi</IconButtonContent></Button>
                  <Link className="eg-button eg-button-secondary" to={buildTeacherTasksPath("exam")}>Tạo đề kiểm tra</Link>
            <Button onClick={() => handleDeleteBank(selectedBank)} variant="ghost"><IconButtonContent icon={Trash2}>Xóa bank</IconButtonContent></Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><p className="text-sm text-secondary">Câu hỏi</p><p className="mt-2 text-3xl font-semibold text-primary">{questions.length}</p></Card>
          <Card><p className="text-sm text-secondary">Đã duyệt</p><p className="mt-2 text-3xl font-semibold text-primary">{approvedQuestionCount}</p></Card>
          <Card><p className="text-sm text-secondary">Đã review</p><p className="mt-2 text-3xl font-semibold text-primary">{reviewedQuestionCount}</p></Card>
          <Card><p className="text-sm text-secondary">Ma trận</p><p className="mt-2 text-3xl font-semibold text-primary">{matrices.length}</p></Card>
        </div>

        {isBankFormOpen ? renderBankFormPanel() : null}

        <div className="flex flex-wrap gap-2">
          <button className={activeBankSection === "questions" ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"} onClick={() => setActiveBankSection("questions")} type="button">Câu hỏi trong bank</button>
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
          eyebrow="Teacher"
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
    </>
  );
}
