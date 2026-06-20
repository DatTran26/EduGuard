import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { SkeletonExamCard } from "../../../components/common/Skeleton";
import Select from "../../../components/forms/Select";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { getClassroomListPathByRole } from "../../../routes/routeConfig";
import ExamCard from "../components/ExamCard";
import ExamForm from "../components/ExamForm";
import TeacherQuestionWorkspace from "../components/TeacherQuestionWorkspace";
import { buildExamFormValues } from "../components/exam-form-helpers";
import { validateQuestionImportFile } from "../components/teacher-question-workspace-helpers";
import { buildDraftQuestion, resequenceDraftQuestions } from "./exam-create-draft-helpers";

// Hàm này tính vài con số nhanh cho đầu trang danh sách đề thi để màn hình bớt khô hơn.
function buildSummaryItems(exams, role) {
  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const openCount = exams.filter((exam) => exam.statusLabel === "Đang mở").length;
  const antiCheatCount = exams.filter((exam) => exam.enableAntiCheat).length;

  const baseItems = [
    { label: "Tổng đề", value: exams.length, tone: "info" },
    { label: "Đã publish", value: publishedCount, tone: "success" },
    { label: "Đang mở", value: openCount, tone: "caution" },
  ];

  if (role === "Teacher") {
    return baseItems;
  }

  return [...baseItems, { label: "Anti-cheat bật", value: antiCheatCount, tone: "neutral" }];
}

function filterExamsByScheduleStatus(exams, scheduleStatus) {
  if (!scheduleStatus) {
    return exams;
  }

  return exams.filter((exam) => {
    if (scheduleStatus === "upcoming") {
      return exam.statusLabel === "Sắp mở";
    }

    if (scheduleStatus === "open") {
      return exam.statusLabel === "Đang mở";
    }

    if (scheduleStatus === "closed") {
      return exam.statusLabel === "Đã đóng";
    }

    return true;
  });
}

// Hàm này trả tiêu đề đầu trang tùy theo role đang truy cập.
function getPageCopyByRole(role) {
  if (role === "Admin") {
    return {
      title: "Đề thi toàn hệ thống",
    };
  }

  if (role === "Teacher") {
    return {
      title: "Đề thi",
    };
  }

  return {
    title: "Đề thi của bạn",
  };
}

function buildExamListFilters(classroomId) {
  return classroomId ? { classroomId } : {};
}

// Trang này là trung tâm CRUD đề thi cho Teacher và là trang xem danh sách cho Admin/Student.
export default function ExamListPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState(null);
  const [activeCreateExam, setActiveCreateExam] = useState(null);
  const [createDraftExamValues, setCreateDraftExamValues] = useState(null);
  const [createFlowQuestions, setCreateFlowQuestions] = useState([]);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [armedDeleteQuestionId, setArmedDeleteQuestionId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [questionWorkspaceMode, setQuestionWorkspaceMode] = useState("manual");
  const [questionWorkspaceFilter, setQuestionWorkspaceFilter] = useState("All");
  const [questionWorkspaceSort, setQuestionWorkspaceSort] = useState("OrderAsc");
  const [composerRevision, setComposerRevision] = useState(0);
  const [isComposerDirty, setIsComposerDirty] = useState(false);
  const [stagedImportFile, setStagedImportFile] = useState(null);
  const [importInfoMessage, setImportInfoMessage] = useState("");
  const [importPreviewQuestions, setImportPreviewQuestions] = useState([]);
  const [importReviewMessage, setImportReviewMessage] = useState("");
  const [importResultErrors, setImportResultErrors] = useState([]);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const selectedClassroomId = searchParams.get("classroomId") ?? "";
  const selectedScheduleStatus = searchParams.get("scheduleStatus") ?? "";
  const isCreateFormVisible = searchParams.get("create") === "1";
  const defaultCreateClassroomId = selectedClassroomId || classrooms[0]?.id || "";
  const summaryItems = buildSummaryItems(exams, user?.role);
  const pageCopy = getPageCopyByRole(user?.role);
  const isTeacherView = user?.role === "Teacher";
  const isStudentView = user?.role === "Student";
  const canCreateExam = isTeacherView && classrooms.length > 0;
  const isCreateFlowDraftMode = isCreateFormVisible && !activeCreateExam;
  const visibleExams = isStudentView
    ? filterExamsByScheduleStatus(exams, selectedScheduleStatus)
    : exams;
  const hasCreateFormDraft =
    Boolean(stagedImportFile) ||
    createFlowQuestions.length > 0 ||
    (createDraftExamValues
      ? JSON.stringify(createDraftExamValues) !==
        JSON.stringify(buildExamFormValues(null, defaultCreateClassroomId))
      : false);
  const createFormKey = activeCreateExam
    ? `create-flow-${activeCreateExam.id}-${activeCreateExam.updatedAt || activeCreateExam.createdAt}`
    : `create-${selectedClassroomId || "all"}-${classrooms.length}`;
  const createToggleLabel = isCreateFormVisible
    ? "Ẩn form tạo bài kiểm tra"
    : activeCreateExam || hasCreateFormDraft
      ? "Tiếp tục soạn bài kiểm tra"
      : "Tạo bài kiểm tra";

  useEffect(() => {
    if (!location.state?.message) {
      return;
    }

    showToast({
      tone: "success",
      title: "Thao tác thành công",
      message: location.state.message,
    });
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      { replace: true, state: null },
    );
  }, [location.pathname, location.search, location.state, navigate, showToast]);

  // Hàm này tải song song lớp học và đề thi theo quyền hiện tại để page có đủ dữ liệu hiển thị.
  async function loadExamPageData(filters = {}, options = {}) {
    const { showPageLoader = true } = options;

    if (showPageLoader) {
      setIsLoading(true);
    }

    try {
      const [classroomResponse, examResponse] = await Promise.all([
        classroomApi.getAll(),
        examApi.getAll(filters),
      ]);

      setClassrooms(classroomResponse.data);
      setExams(examResponse.data);
    } catch (error) {
      const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
      showToast({
        tone: "danger",
        title: "Tải dữ liệu thất bại",
        message: nextMessage,
      });
    } finally {
      if (showPageLoader) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    const nextFilters = buildExamListFilters(selectedClassroomId);

    // Hàm này lấy dữ liệu ban đầu hoặc khi filter lớp đổi mà không bị warning effect.
    async function loadInitialExamData() {
      try {
        const [classroomResponse, examResponse] = await Promise.all([
          classroomApi.getAll(),
          examApi.getAll(nextFilters),
        ]);

        if (!isMounted) {
          return;
        }

        setClassrooms(classroomResponse.data);
        setExams(examResponse.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
        showToast({
          tone: "danger",
          title: "Tải dữ liệu thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialExamData();

    return () => {
      isMounted = false;
    };
  }, [selectedClassroomId, showToast]);

  function resetCreateFlowQuestionUi() {
    setEditingQuestionId(null);
    setArmedDeleteQuestionId(null);
    setDeletingQuestionId(null);
    setExpandedQuestionId(null);
    setQuestionWorkspaceMode("manual");
    setQuestionWorkspaceFilter("All");
    setQuestionWorkspaceSort("OrderAsc");
    setComposerRevision((previousValue) => previousValue + 1);
    setIsComposerDirty(false);
    setStagedImportFile(null);
    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportReviewMessage("");
    setImportResultErrors([]);
  }

  async function refreshCreateFlowExam(examId = activeCreateExam?.id) {
    if (!examId) {
      return null;
    }

    const [examResponse, questionResponse] = await Promise.all([
      examApi.getById(examId),
      examApi.getQuestionList(examId),
    ]);

    setActiveCreateExam(examResponse.data);
    setCreateDraftExamValues(null);
    setCreateFlowQuestions(questionResponse.data);

    return {
      exam: examResponse.data,
      questions: questionResponse.data,
    };
  }

  async function syncExamListSilently() {
    await loadExamPageData(buildExamListFilters(selectedClassroomId), { showPageLoader: false });
  }

  function handleToggleCreateForm() {
    if (isCreateFormVisible && questionWorkspaceMode === "manual" && !confirmDiscardQuestionDraft()) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    if (isCreateFormVisible) {
      nextParams.delete("create");
    } else {
      nextParams.set("create", "1");
    }

    setSearchParams(nextParams);
  }

  // Hàm này đổi filter lớp học trên URL để user refresh trang vẫn giữ được ngữ cảnh hiện tại.
  function updateExamListSearchParams(nextClassroomId, nextScheduleStatus) {
    const nextParams = {};

    if (nextClassroomId) {
      nextParams.classroomId = nextClassroomId;
    }

    if (nextScheduleStatus) {
      nextParams.scheduleStatus = nextScheduleStatus;
    }

    setSearchParams(nextParams);
  }

  function handleClassroomFilterChange(nextClassroomId) {
    setIsLoading(true);
    updateExamListSearchParams(nextClassroomId, selectedScheduleStatus);
  }

  function handleScheduleStatusFilterChange(nextScheduleStatus) {
    updateExamListSearchParams(selectedClassroomId, nextScheduleStatus);
  }

  function handleResetStudentFilters() {
    if (selectedClassroomId) {
      setIsLoading(true);
    }

    updateExamListSearchParams("", "");
  }

  // Hàm này tạo bài kiểm tra mới rồi giữ luôn teacher ở cùng màn để tiếp tục thêm câu hỏi.
  async function handleCreateExam(payload) {
    setIsSubmitting(true);

    try {
      const response = await examApi.create({
        ...payload,
        questions: createFlowQuestions,
      });
      const shouldSwitchFilter =
        selectedClassroomId && Number(selectedClassroomId) !== Number(payload.classroomId);

      await refreshCreateFlowExam(response.data.id);
      resetCreateFlowQuestionUi();
      setCreateDraftExamValues(null);

      if (shouldSwitchFilter) {
        setIsLoading(true);
        setSearchParams({ classroomId: String(payload.classroomId) });
      } else {
        await loadExamPageData(buildExamListFilters(selectedClassroomId), { showPageLoader: false });
      }

      showToast({
        tone: "success",
        title: "Đã lưu đề thi",
        message:
          createFlowQuestions.length > 0
            ? "Đề thi và toàn bộ câu hỏi nháp đã được lưu thành công. Bạn có thể tiếp tục chỉnh sửa sau."
            : response.message,
      });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo đề thi thất bại",
        message: error.message || "Không thể tạo bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateCreateFlowExam(payload) {
    if (!activeCreateExam) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await examApi.update(activeCreateExam.id, payload);
      setActiveCreateExam(response.data);
      await syncExamListSilently();
      showToast({
        tone: "success",
        title: "Đã cập nhật đề thi",
        message: response.message,
      });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật đề thi thất bại",
        message: error.message || "Không thể cập nhật bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDiscardQuestionDraft() {
    return (
      !isComposerDirty ||
      window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn bỏ chúng để chuyển sang thao tác khác?")
    );
  }

  function handleChangeQuestionWorkspaceMode(nextMode) {
    if (nextMode === questionWorkspaceMode) {
      return;
    }

    if (questionWorkspaceMode === "manual" && !confirmDiscardQuestionDraft()) {
      return;
    }

    setArmedDeleteQuestionId(null);
    setEditingQuestionId(null);
    setComposerRevision((previousValue) => previousValue + 1);
    setQuestionWorkspaceMode(nextMode);
  }

  function handleToggleQuestionExpand(questionId) {
    setExpandedQuestionId((previousQuestionId) =>
      previousQuestionId === questionId ? null : questionId,
    );
  }

  function handleStartEditingQuestion(questionId) {
    if (editingQuestionId === questionId) {
      setExpandedQuestionId(questionId);
      return;
    }

    if (questionWorkspaceMode === "manual" && !confirmDiscardQuestionDraft()) {
      return;
    }

    setQuestionWorkspaceMode("manual");
    setArmedDeleteQuestionId(null);
    setExpandedQuestionId(questionId);
    setEditingQuestionId(questionId);
    setComposerRevision((previousValue) => previousValue + 1);
  }

  function handleReturnToCreateQuestion() {
    if (!confirmDiscardQuestionDraft()) {
      return;
    }

    setEditingQuestionId(null);
    setComposerRevision((previousValue) => previousValue + 1);
  }

  async function handleCreateDraftQuestion(payload) {
    const createdQuestion = buildDraftQuestion(payload, createFlowQuestions.length + 1);

    setCreateFlowQuestions((previousQuestions) =>
      resequenceDraftQuestions([...previousQuestions, createdQuestion]),
    );

    setExpandedQuestionId(createdQuestion.id);
    setQuestionWorkspaceMode("manual");
    setQuestionWorkspaceFilter("All");
    setQuestionWorkspaceSort("OrderAsc");
    showToast({
      tone: "success",
      title: "Đã thêm câu hỏi vào nháp",
      message: "Câu hỏi đã được đưa vào đề nháp. Khi hoàn tất toàn bộ nội dung, bạn chỉ cần lưu đề một lần.",
    });

    return { didSave: true, shouldReset: true };
  }

  async function handleUpdateDraftQuestion(questionId, payload) {
    setCreateFlowQuestions((previousQuestions) => {
      const currentQuestion = previousQuestions.find((question) => question.id === questionId);

      if (!currentQuestion) {
        return previousQuestions;
      }

      const updatedQuestion = buildDraftQuestion(
        {
          ...currentQuestion,
          ...payload,
          id: currentQuestion.id,
        },
        Number(payload.orderIndex) || currentQuestion.orderIndex,
      );

      return resequenceDraftQuestions(
        previousQuestions.map((question) =>
          question.id === questionId ? updatedQuestion : question,
        ),
      );
    });

    setArmedDeleteQuestionId(null);
    setExpandedQuestionId(questionId);
    setComposerRevision((previousValue) => previousValue + 1);
    showToast({
      tone: "success",
      title: "Đã cập nhật câu nháp",
      message: "Thay đổi của câu hỏi đã được cập nhật trong đề nháp.",
    });

    return { didSave: true, shouldReset: false };
  }

  async function handleDeleteDraftQuestion(questionId) {
    if (armedDeleteQuestionId !== questionId) {
      if (editingQuestionId !== null && !confirmDiscardQuestionDraft()) {
        return;
      }

      setEditingQuestionId(null);
      setArmedDeleteQuestionId(questionId);
      return;
    }

    setCreateFlowQuestions((previousQuestions) =>
      resequenceDraftQuestions(
        previousQuestions.filter((question) => question.id !== questionId),
      ),
    );
    setArmedDeleteQuestionId(null);

    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
      setComposerRevision((previousValue) => previousValue + 1);
    }

    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    }

    showToast({
      tone: "success",
      title: "Đã xóa câu nháp",
      message: "Câu hỏi đã được gỡ khỏi đề nháp.",
    });
  }

  async function handleCreateFlowCreateQuestion(payload) {
    if (!activeCreateExam) {
      return { didSave: false, shouldReset: false };
    }

    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.createQuestion(activeCreateExam.id, payload);
      await refreshCreateFlowExam(activeCreateExam.id);
      await syncExamListSilently();
      setExpandedQuestionId(response.data?.id ?? null);
      setQuestionWorkspaceMode("manual");
      setQuestionWorkspaceFilter("All");
      setQuestionWorkspaceSort("OrderAsc");
      showToast({
        tone: "success",
        title: "Đã thêm câu hỏi",
        message: response.message,
      });

      return { didSave: true, shouldReset: true };
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Thêm câu hỏi thất bại",
        message: error.message || "Không thể thêm câu hỏi mới.",
      });
      return { didSave: false, shouldReset: false };
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  async function handleUpdateCreateFlowQuestion(questionId, payload) {
    if (!activeCreateExam) {
      return { didSave: false, shouldReset: false };
    }

    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.updateQuestion(activeCreateExam.id, questionId, payload);
      await refreshCreateFlowExam(activeCreateExam.id);
      await syncExamListSilently();
      setArmedDeleteQuestionId(null);
      setExpandedQuestionId(questionId);
      setComposerRevision((previousValue) => previousValue + 1);
      showToast({
        tone: "success",
        title: "Đã cập nhật câu hỏi",
        message: response.message,
      });
      return { didSave: true, shouldReset: false };
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật câu hỏi thất bại",
        message: error.message || "Không thể cập nhật câu hỏi.",
      });
      return { didSave: false, shouldReset: false };
    } finally {
      setIsQuestionSubmitting(false);
    }
  }

  async function handleDeleteCreateFlowQuestion(questionId) {
    if (armedDeleteQuestionId !== questionId) {
      if (editingQuestionId !== null && !confirmDiscardQuestionDraft()) {
        return;
      }

      setEditingQuestionId(null);
      setArmedDeleteQuestionId(questionId);
      return;
    }

    if (!activeCreateExam) {
      return;
    }

    setIsQuestionSubmitting(true);
    setDeletingQuestionId(questionId);

    try {
      const response = await examApi.deleteQuestion(activeCreateExam.id, questionId);
      await refreshCreateFlowExam(activeCreateExam.id);
      await syncExamListSilently();
      setArmedDeleteQuestionId(null);
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
        setComposerRevision((previousValue) => previousValue + 1);
      }
      if (expandedQuestionId === questionId) {
        setExpandedQuestionId(null);
      }
      showToast({
        tone: "success",
        title: "Đã xóa câu hỏi",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa câu hỏi thất bại",
        message: error.message || "Không thể xóa câu hỏi.",
      });
    } finally {
      setDeletingQuestionId(null);
      setIsQuestionSubmitting(false);
    }
  }

  function handleStageImportFile(file) {
    const nextValidationMessage = validateQuestionImportFile(file);

    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportResultErrors([]);
    setImportReviewMessage(nextValidationMessage);

    if (nextValidationMessage) {
      setStagedImportFile(null);
      return;
    }

    setQuestionWorkspaceMode("import");
    setStagedImportFile(file);
  }

  function handleClearImportFile() {
    setStagedImportFile(null);
    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportReviewMessage("");
    setImportResultErrors([]);
  }

  async function handlePreviewDraftImportedQuestions(file) {
    const nextValidationMessage = validateQuestionImportFile(file);

    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportResultErrors([]);
    setImportReviewMessage(nextValidationMessage);

    if (nextValidationMessage) {
      setStagedImportFile(null);
      return;
    }

    setIsImportSubmitting(true);
    setQuestionWorkspaceMode("import");
    setStagedImportFile(file);

    try {
      const response = await examApi.previewQuestionImportFile(file);
      const previewQuestions = Array.isArray(response.data?.questions) ? response.data.questions : [];

      setImportPreviewQuestions(previewQuestions);
      setImportInfoMessage(
        `Đã review ${previewQuestions.length} câu hỏi từ file. Bấm thêm vào đề nháp để nhập toàn bộ vào bản soạn hiện tại.`,
      );
      showToast({
        tone: "success",
        title: "Đã review file import",
        message: response.message,
      });
    } catch (error) {
      setImportReviewMessage(error.message || "Không thể review file câu hỏi.");
      setImportResultErrors(Array.isArray(error.importResult?.errors) ? error.importResult.errors : []);
      showToast({
        tone: "danger",
        title: "Review import thất bại",
        message: error.message || "Không thể review file câu hỏi.",
      });
    } finally {
      setIsImportSubmitting(false);
    }
  }

  async function handleCommitDraftImportedQuestions() {
    if (importPreviewQuestions.length === 0) {
      setImportReviewMessage("Chưa có câu hỏi hợp lệ để thêm vào đề nháp.");
      return;
    }

    setCreateFlowQuestions((previousQuestions) => {
      const nextQuestions = [
        ...previousQuestions,
        ...importPreviewQuestions.map((question, index) =>
          buildDraftQuestion(question, previousQuestions.length + index + 1),
        ),
      ];

      return resequenceDraftQuestions(nextQuestions);
    });

    setQuestionWorkspaceMode("manual");
    setQuestionWorkspaceFilter("All");
    setQuestionWorkspaceSort("OrderAsc");
    setExpandedQuestionId(null);
    setComposerRevision((previousValue) => previousValue + 1);
    setStagedImportFile(null);
    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportReviewMessage("");
    setImportResultErrors([]);
    showToast({
      tone: "success",
      title: "Đã thêm câu hỏi import vào nháp",
      message: "Các câu hỏi từ file đã được thêm vào đề nháp. Bạn có thể tiếp tục chỉnh sửa trước khi lưu đề.",
    });
  }

  async function handleCommitImportedQuestions() {
    if (!activeCreateExam) {
      return;
    }

    const nextValidationMessage = validateQuestionImportFile(stagedImportFile);

    if (nextValidationMessage) {
      setImportReviewMessage(nextValidationMessage);
      return;
    }

    setIsImportSubmitting(true);
    setImportReviewMessage("");
    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportResultErrors([]);

    try {
      const response = await examApi.importQuestionFile(activeCreateExam.id, stagedImportFile);
      await refreshCreateFlowExam(activeCreateExam.id);
      await syncExamListSilently();
      setStagedImportFile(null);
      setQuestionWorkspaceMode("manual");
      setQuestionWorkspaceFilter("All");
      setQuestionWorkspaceSort("OrderAsc");
      setExpandedQuestionId(null);
      setComposerRevision((previousValue) => previousValue + 1);
      showToast({
        tone: "success",
        title: "Đã import câu hỏi",
        message: response.message,
      });
    } catch (error) {
      setImportReviewMessage(error.message || "Không thể import file câu hỏi.");
      setImportResultErrors(Array.isArray(error.importResult?.errors) ? error.importResult.errors : []);
      showToast({
        tone: "danger",
        title: "Import thất bại",
        message: error.message || "Không thể import file câu hỏi.",
      });
    } finally {
      setIsImportSubmitting(false);
    }
  }

  async function handleDeleteExam(examId, examTitle) {
    const hasConfirmed = window.confirm(`Bạn có chắc muốn xóa bài kiểm tra "${examTitle}" không?`);

    if (!hasConfirmed) {
      return;
    }

    setDeletingExamId(examId);

    try {
      const response = await examApi.delete(examId);
      await loadExamPageData(buildExamListFilters(selectedClassroomId), { showPageLoader: false });

      if (activeCreateExam?.id === examId) {
        setActiveCreateExam(null);
        setCreateDraftExamValues(null);
        setCreateFlowQuestions([]);
        resetCreateFlowQuestionUi();
      }

      showToast({
        tone: "success",
        title: "Đã xóa bài kiểm tra",
        message: response.message || `Đã xóa bài kiểm tra ${examTitle}.`,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa bài kiểm tra thất bại",
        message: error.message || "Không thể xóa bài kiểm tra.",
      });
    } finally {
      setDeletingExamId(null);
    }
  }

  const filterOptions = [
    { label: "Tất cả lớp học", value: "" },
    ...classrooms.map((classroom) => ({
      label: classroom.name,
      value: String(classroom.id),
    })),
  ];
  const scheduleFilterOptions = [
    { label: "Tất cả trạng thái", value: "" },
    { label: "Sắp diễn ra", value: "upcoming" },
    { label: "Đang diễn ra", value: "open" },
    { label: "Đã đóng", value: "closed" },
  ];

  return (
    <div className="space-y-6">
      {isTeacherView ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
              {getRoleLabel(user?.role)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.2rem]">
              {pageCopy.title}
            </h1>
          </div>

          {canCreateExam ? (
            <Button
              onClick={handleToggleCreateForm}
              variant={isCreateFormVisible ? "secondary" : "primary"}
            >
              {createToggleLabel}
            </Button>
          ) : null}
        </div>
      ) : isStudentView ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
              {getRoleLabel(user?.role)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.2rem]">
              {pageCopy.title}
            </h1>
          </div>
        </div>
      ) : (
        <PageHeader
          actions={
            canCreateExam ? (
              <Button
                onClick={handleToggleCreateForm}
                variant={isCreateFormVisible ? "secondary" : "primary"}
              >
                {createToggleLabel}
              </Button>
            ) : null
          }
          title={pageCopy.title}
        />
      )}

      {!isStudentView ? (
        <div
          className={`grid gap-4 md:grid-cols-2 ${summaryItems.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
        >
          {summaryItems.map((item) => (
            <div key={item.label} className={`eg-exam-summary-card eg-exam-summary-card-${item.tone}`}>
              <span aria-hidden="true" className="eg-exam-summary-card-bar" />
              <div className="space-y-1">
                <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
                <p className="text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        <div className={`grid gap-4 ${isStudentView ? "lg:grid-cols-2" : "max-w-md"}`}>
          <Select
            id="exam-list-classroom-filter"
            label="Lớp học"
            onChange={(event) => handleClassroomFilterChange(event.target.value)}
            options={filterOptions}
            value={selectedClassroomId}
          />
          {isStudentView ? (
            <Select
              id="exam-list-schedule-status-filter"
              label="Trạng thái lịch thi"
              onChange={(event) => handleScheduleStatusFilterChange(event.target.value)}
              options={scheduleFilterOptions}
              value={selectedScheduleStatus}
            />
          ) : null}
        </div>
      </Card>

      {isTeacherView ? (
        classrooms.length > 0 ? (
          isCreateFormVisible ? (
            <div className="space-y-5">
              <ExamForm
                classroomOptions={classrooms}
                defaultClassroomId={defaultCreateClassroomId}
                exam={activeCreateExam}
                initialFormValues={activeCreateExam ? null : createDraftExamValues}
                isSubmitting={isSubmitting}
                key={createFormKey}
                onFormValuesChange={activeCreateExam ? null : setCreateDraftExamValues}
                onSubmitExam={activeCreateExam ? handleUpdateCreateFlowExam : handleCreateExam}
                showDescriptions={false}
                submitLabel={activeCreateExam ? "Lưu thay đổi" : "Lưu toàn bộ đề thi"}
                title={activeCreateExam ? "Thông tin đề thi" : "Tạo bài kiểm tra mới"}
              />

              <TeacherQuestionWorkspace
                armedDeleteQuestionId={armedDeleteQuestionId}
                canManage
                composerRevision={composerRevision}
                deletingQuestionId={deletingQuestionId}
                editingQuestionId={editingQuestionId}
                exam={activeCreateExam}
                expandedQuestionId={expandedQuestionId}
                importCommitLabel={activeCreateExam ? "Commit vào đề" : "Thêm vào đề nháp"}
                importInfoMessage={importInfoMessage}
                importReadyBadgeLabel={activeCreateExam ? "Sẵn sàng commit" : "Sẵn sàng thêm vào nháp"}
                importStatusLabel={activeCreateExam ? "Review trước khi commit" : "Review trước khi thêm vào nháp"}
                importSubmittingLabel={activeCreateExam ? "Đang commit..." : "Đang review..."}
                importResultErrors={importResultErrors}
                importReviewMessage={importReviewMessage}
                isImportSubmitting={isImportSubmitting}
                isDraftMode={isCreateFlowDraftMode}
                isImportCommitDisabled={isCreateFlowDraftMode && importPreviewQuestions.length === 0}
                isQuestionSubmitting={isQuestionSubmitting}
                isReady
                onChangeMode={handleChangeQuestionWorkspaceMode}
                onClearFile={handleClearImportFile}
                onCommitImport={activeCreateExam ? handleCommitImportedQuestions : handleCommitDraftImportedQuestions}
                onDeleteQuestion={activeCreateExam ? handleDeleteCreateFlowQuestion : handleDeleteDraftQuestion}
                onEditQuestion={handleStartEditingQuestion}
                onFileSelected={activeCreateExam ? handleStageImportFile : handlePreviewDraftImportedQuestions}
                onFilterChange={setQuestionWorkspaceFilter}
                onQuestionDirtyChange={setIsComposerDirty}
                onRequestCreateNew={handleReturnToCreateQuestion}
                onSortChange={setQuestionWorkspaceSort}
                onSubmitCreateQuestion={activeCreateExam ? handleCreateFlowCreateQuestion : handleCreateDraftQuestion}
                onSubmitUpdateQuestion={activeCreateExam ? handleUpdateCreateFlowQuestion : handleUpdateDraftQuestion}
                onToggleExpand={handleToggleQuestionExpand}
                questionWorkspaceFilter={questionWorkspaceFilter}
                questionWorkspaceMode={questionWorkspaceMode}
                questionWorkspaceSort={questionWorkspaceSort}
                questions={createFlowQuestions}
                stagedImportFile={stagedImportFile}
              />
            </div>
          ) : null
        ) : (
          <EmptyState
            title="Bạn chưa có lớp học để tạo đề thi."
            action={
              <Link className="eg-button eg-button-primary" to={getClassroomListPathByRole(user?.role)}>
                Đi tới lớp học
              </Link>
            }
          />
        )
      ) : null}

      {isLoading ? (
        <div className="grid gap-6">
          <SkeletonExamCard />
          <SkeletonExamCard />
          <SkeletonExamCard />
        </div>
      ) : visibleExams.length > 0 ? (
        <div className="grid gap-6">
          {visibleExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              isDeleting={deletingExamId === exam.id}
              onDeleteExam={handleDeleteExam}
            />
          ))}
        </div>
      ) : isStudentView && exams.length > 0 ? (
        <EmptyState
          title="Không có bài kiểm tra phù hợp với bộ lọc."
          action={
            <Button variant="secondary" onClick={handleResetStudentFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState title="Chưa có bài kiểm tra nào." />
      )}
    </div>
  );
}
