import { useCallback, useEffect, useState } from "react";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiInfo } from "react-icons/fi";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import {
  getExamListPathByRole,
  buildStudentExamAttemptPath,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import AttemptMonitorPanel from "../../anti-cheat/components/AttemptMonitorPanel";
import ExamForm from "../components/ExamForm";
import TeacherQuestionWorkspace from "../components/TeacherQuestionWorkspace";
import { validateQuestionImportFile } from "../components/teacher-question-workspace-helpers";
import { buildDraftQuestion, resequenceDraftQuestions } from "./exam-create-draft-helpers";
import {
  buildExamPublishIssueList,
  getExamStatusVariant,
  splitPublishErrorMessage,
} from "../examHelpers";
import Skeleton, { SkeletonText } from "../../../components/common/Skeleton";

function buildEditableImportPreviewQuestions(questions = []) {
  return resequenceDraftQuestions(
    questions.map((question, index) => buildDraftQuestion(question, index + 1)),
  );
}

// Hàm này dựng danh sách settings ngắn gọn để card thông tin chi tiết dễ render hơn.
function buildSettingItems(exam) {
  return [
    {
      label: "Random câu hỏi",
      value: exam.settings.shuffleQuestions ? "Có" : "Không",
    },
    {
      label: "Random đáp án",
      value: exam.settings.shuffleAnswers ? "Có" : "Không",
    },
    {
      label: "Số lần làm tối đa",
      value: `${exam.settings.maxAttempts} lần`,
    },
    {
      label: "Hiện kết quả sau khi nộp",
      value: exam.settings.showResultAfterSubmit ? "Có" : "Không",
    },
    {
      label: "Yêu cầu fullscreen",
      value: exam.settings.requireFullscreen ? "Có" : "Không",
    },
  ];
}

// Hàm này kiểm tra role hiện tại có được mở question bank ở trang chi tiết đề thi hay không.
function canRoleInspectQuestionBank(role) {
  return role === "Admin" || role === "Teacher";
}

// Hàm này tính điểm trung bình từ danh sách attempt đã có điểm để hiển thị đúng hơn ở exam detail.
function calculateAverageScore(attempts = []) {
  const scoredAttempts = attempts
    .map((attempt) => attempt.score)
    .filter((scoreValue) => typeof scoreValue === "number");

  if (scoredAttempts.length === 0) {
    return null;
  }

  const totalValue = scoredAttempts.reduce((sumValue, scoreValue) => sumValue + scoreValue, 0);
  return Math.round((totalValue / scoredAttempts.length) * 10) / 10;
}

function getPublishStatusMeta(exam, publishIssueCount, serverIssueCount) {
  if (exam?.isPublished) {
    return {
      label: "Đã publish",
      variant: "success",
    };
  }

  if (!exam?.canEdit && !exam?.canViewQuestionBank) {
    return {
      label: "Bản nháp",
      variant: "neutral",
    };
  }

  if (serverIssueCount > 0) {
    return {
      label: "Backend đang chặn",
      variant: "danger",
    };
  }

  if (publishIssueCount === 0) {
    return {
      label: "Sẵn sàng publish",
      variant: "success",
    };
  }

  return {
    label: "Chưa đủ điều kiện",
    variant: "caution",
  };
}

function buildAdditionalInfoItems(exam) {
  return [
    {
      label: "Lớp học",
      value: exam.classroomName || "Chưa gắn lớp học",
    },
    {
      label: "Giảng viên",
      value: exam.teacherName || "Chưa xác định",
    },
    {
      label: "Mở đề (UTC+7)",
      value: exam.startTime ? formatShortDateTime(exam.startTime) : "Chưa đặt lịch",
    },
    {
      label: "Đóng đề (UTC+7)",
      value: exam.endTime ? formatShortDateTime(exam.endTime) : "Chưa đặt lịch",
    },
    {
      label: "Thời lượng",
      value: `${exam.durationMinutes} phút`,
    },
    {
      label: "Số lượt làm",
      value: `${exam.attemptCount} lượt`,
    },
  ];
}


// Trang này là màn chi tiết bài kiểm tra, đồng thời là nơi teacher chỉnh sửa exam metadata và question bank.
const FLAGGED_SUSPICION_THRESHOLD = 10;

export default function ExamDetailPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [antiCheatSummary, setAntiCheatSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [armedDeleteQuestionId, setArmedDeleteQuestionId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [isStartingAttempt, setIsStartingAttempt] = useState(false);
  const [publishServerIssues, setPublishServerIssues] = useState([]);
  const [questionWorkspaceMode, setQuestionWorkspaceMode] = useState("manual");
  const [questionWorkspaceFilter, setQuestionWorkspaceFilter] = useState("All");
  const [questionWorkspaceSort, setQuestionWorkspaceSort] = useState("OrderAsc");
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [composerRevision, setComposerRevision] = useState(0);
  const [isComposerDirty, setIsComposerDirty] = useState(false);
  const [stagedImportFile, setStagedImportFile] = useState(null);
  const [importInfoMessage, setImportInfoMessage] = useState("");
  const [importPreviewQuestions, setImportPreviewQuestions] = useState([]);
  const [importReviewMessage, setImportReviewMessage] = useState("");
  const [importResultErrors, setImportResultErrors] = useState([]);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [managementPanelState, setManagementPanelState] = useState({
    examId: null,
    isOpen: false,
  });
  const isManagementPanelOpen =
    managementPanelState.examId === examId && managementPanelState.isOpen;

  // Hàm này gọi song song các endpoint cần thiết cho detail page để dữ liệu metadata và question bank đi cùng nhau.
  const fetchExamDetailData = useCallback(async () => {
    const requestList = [examApi.getById(examId), classroomApi.getAll()];

    if (canRoleInspectQuestionBank(user?.role)) {
      requestList.push(examApi.getQuestionList(examId));
    }

    const [examResponse, classroomResponse, questionResponse] = await Promise.all(requestList);
    const questions = questionResponse?.data ?? [];
    let nextExam = {
      ...examResponse.data,
      totalQuestionScore: questions.length > 0 ? examApi.calculateTotalQuestionScore(questions) : null,
    };
    let nextAntiCheatSummary = null;
    let nextAttempts = [];

    if (nextExam.canEdit) {
      try {
        const attemptsResponse = await examAttemptApi.getByExam(examId);
        nextAttempts = attemptsResponse.data;

        nextExam = {
          ...nextExam,
          averageScore: calculateAverageScore(nextAttempts),
        };
      } catch {
        // Đoạn này mình chủ động bỏ qua để trang chi tiết vẫn mở được dù API attempt tạm thời chưa phản hồi.
      }
    }

    if (nextExam.canEdit && nextExam.enableAntiCheat) {
      try {
        const antiCheatResponse = await antiCheatApi.getExamSummary(examId);
        nextAntiCheatSummary = antiCheatResponse.data;
      } catch {
        nextAntiCheatSummary = null;
      }
    }

    return {
      classrooms: classroomResponse.data,
      exam: nextExam,
      questions,
      antiCheatSummary: nextAntiCheatSummary,
      attempts: nextAttempts,
    };
  }, [examId, user?.role]);

  function applyExamDetailState(nextData) {
    setExam(nextData.exam);
    setClassrooms(nextData.classrooms);
    setQuestions(nextData.questions);
    setAntiCheatSummary(nextData.antiCheatSummary);
    setAttempts(nextData.attempts);
    setPublishServerIssues([]);
    setLoadErrorMessage("");
  }

  // Hàm này tải detail exam và question bank để các thao tác CRUD sau đó chỉ cần gọi reload lại một nơi.
  async function loadExamDetail(options = {}) {
    const { showPageLoader = true } = options;

    if (showPageLoader) {
      setIsLoading(true);
    }

    try {
      const nextData = await fetchExamDetailData();
      applyExamDetailState(nextData);
    } catch (error) {
      setExam(null);
      setQuestions([]);
      setAntiCheatSummary(null);
      setAttempts([]);
      setPublishServerIssues([]);
      const nextMessage = error.message || "Không thể tải chi tiết bài kiểm tra.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải đề thi thất bại",
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
    const loadingTimeoutId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    }, 0);

    // Hàm này lấy dữ liệu ngay khi đổi exam id để detail page luôn đúng record hiện tại.
    async function loadInitialExamDetail() {
      try {
        const nextData = await fetchExamDetailData();

        if (!isMounted) {
          return;
        }

        applyExamDetailState(nextData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setExam(null);
        setQuestions([]);
        setAntiCheatSummary(null);
        setAttempts([]);
        setPublishServerIssues([]);
        const nextMessage = error.message || "Không thể tải chi tiết bài kiểm tra.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải đề thi thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialExamDetail();

    return () => {
      window.clearTimeout(loadingTimeoutId);
      isMounted = false;
    };
  }, [fetchExamDetailData, showToast]);


  // Hàm này lưu chỉnh sửa exam của teacher rồi tải lại detail để card thông tin luôn mới.
  async function handleUpdateExam(payload) {
    setIsSaving(true);

    try {
      const response = await examApi.update(examId, payload);
      await loadExamDetail({ showPageLoader: false });
      showToast({
        tone: "success",
        title: "Đã cập nhật đề thi",
        message: response.message,
      });
      setIsDeleteArmed(false);
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật đề thi thất bại",
        message: error.message || "Không thể cập nhật bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // Hàm này thêm câu hỏi mới vào đề hiện tại rồi reload lại summary và danh sách question ngay sau đó.
  async function handleCreateQuestion(payload) {
    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.createQuestion(examId, payload);
      await loadExamDetail({ showPageLoader: false });
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

  // Hàm này lưu thay đổi của một câu hỏi cùng toàn bộ đáp án của nó.
  async function handleUpdateQuestion(questionId, payload) {
    setIsQuestionSubmitting(true);

    try {
      const response = await examApi.updateQuestion(examId, questionId, payload);
      await loadExamDetail({ showPageLoader: false });
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

  // Hàm này dùng xác nhận 2 bước để tránh teacher xóa nhầm câu hỏi khỏi đề thi.
  async function handleDeleteQuestion(questionId) {
    if (armedDeleteQuestionId !== questionId) {
      if (editingQuestionId !== null && !confirmDiscardQuestionDraft()) {
        return;
      }

      setEditingQuestionId(null);
      setArmedDeleteQuestionId(questionId);
      return;
    }

    setIsQuestionSubmitting(true);
    setDeletingQuestionId(questionId);

    try {
      const response = await examApi.deleteQuestion(examId, questionId);
      await loadExamDetail({ showPageLoader: false });
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

  async function handlePreviewImportedQuestions(file) {
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

      setImportPreviewQuestions(buildEditableImportPreviewQuestions(previewQuestions));
      setImportInfoMessage("");
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

  function handleClearImportFile() {
    setStagedImportFile(null);
    setImportInfoMessage("");
    setImportPreviewQuestions([]);
    setImportReviewMessage("");
    setImportResultErrors([]);
  }

  async function handleUpdateImportPreviewQuestion(questionIndex, payload) {
    let didUpdate = false;

    setImportPreviewQuestions((previousQuestions) => {
      const currentQuestion = previousQuestions[questionIndex];

      if (!currentQuestion) {
        return previousQuestions;
      }

      didUpdate = true;

      return buildEditableImportPreviewQuestions(
        previousQuestions.map((question, index) =>
          index === questionIndex
            ? {
                ...currentQuestion,
                ...payload,
                id: currentQuestion.id,
              }
            : question,
        ),
      );
    });

    if (!didUpdate) {
      return { didSave: false, shouldReset: false };
    }

    showToast({
      tone: "success",
      title: "Đã cập nhật câu review",
      message: "Câu hỏi import đã được cập nhật trong danh sách review.",
    });

    return { didSave: true, shouldReset: false };
  }

  async function persistImportPreviewQuestionsToExam(startOrderIndex = questions.length + 1) {
    const previewQuestionsToPersist = buildEditableImportPreviewQuestions(importPreviewQuestions).map(
      (question, index) => ({
        ...question,
        orderIndex: startOrderIndex + index,
      }),
    );

    for (const question of previewQuestionsToPersist) {
      await examApi.createQuestion(examId, question);
    }

    return previewQuestionsToPersist.length;
  }

  async function handleCommitImportedQuestions() {
    if (importPreviewQuestions.length === 0) {
      setImportReviewMessage("Chưa có câu hỏi hợp lệ để commit. Hãy upload file để backend review trước.");
      return;
    }

    setIsImportSubmitting(true);
    setImportReviewMessage("");
    setImportResultErrors([]);

    try {
      await persistImportPreviewQuestionsToExam(questions.length + 1);
      await loadExamDetail({ showPageLoader: false });
      setStagedImportFile(null);
      setImportInfoMessage("");
      setImportPreviewQuestions([]);
      setQuestionWorkspaceMode("manual");
      setQuestionWorkspaceFilter("All");
      setQuestionWorkspaceSort("OrderAsc");
      setExpandedQuestionId(null);
      setComposerRevision((previousValue) => previousValue + 1);
      showToast({
        tone: "success",
        title: "Đã import câu hỏi",
        message: "Các câu hỏi đã được thêm vào đề sau khi review.",
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

  // Hàm này xóa exam sau khi teacher đã xác nhận 2 bước để tránh bấm nhầm.
  async function handleDeleteExam() {
    if (!isDeleteArmed) {
      setIsDeleteArmed(true);
      return;
    }

    setIsSaving(true);

    try {
      const response = await examApi.delete(examId);
      navigate(getExamListPathByRole(user?.role), {
        replace: true,
        state: { message: response.message },
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa đề thi thất bại",
        message: error.message || "Không thể xóa bài kiểm tra.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishExam() {
    if (!exam) {
      return;
    }

    const nextPublishIssues = buildExamPublishIssueList(exam, questions);

    if (nextPublishIssues.length > 0) {
      setPublishServerIssues([]);
      showToast({
        tone: "danger",
        title: "Đề chưa thể publish",
        message: "Hoàn thiện checklist publish trước khi phát hành đề thi.",
      });
      return;
    }

    setIsPublishing(true);
    setPublishServerIssues([]);

    try {
      const response = await examApi.publish(examId);
      await loadExamDetail({ showPageLoader: false });
      showToast({
        tone: "success",
        title: "Đã publish đề thi",
        message: response.message,
      });
    } catch (error) {
      const nextServerIssues = splitPublishErrorMessage(error.message);
      setPublishServerIssues(nextServerIssues);
      showToast({
        tone: "danger",
        title: "Publish thất bại",
        message: nextServerIssues[0] || error.message || "Không thể publish đề thi.",
      });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleStartAttempt() {
    setIsStartingAttempt(true);

    try {
      const response = await examAttemptApi.start(examId);
      navigate(buildStudentExamAttemptPath(response.data.attempt.id));
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không thể vào phòng thi",
        message: error.message || "Không thể bắt đầu làm bài lúc này.",
      });
    } finally {
      setIsStartingAttempt(false);
    }
  }

  function handleToggleManagementPanel() {
    if (isManagementPanelOpen && !confirmDiscardQuestionDraft()) {
      return;
    }

    setManagementPanelState((previousValue) => ({
      examId,
      isOpen: previousValue.examId === examId ? !previousValue.isOpen : true,
    }));
  }

  const handleRealtimeAntiCheatWarning = useCallback((warning) => {
    setAttempts((previousAttempts) =>
      previousAttempts.map((attempt) =>
        attempt.id === warning.examAttemptId
          ? {
              ...attempt,
              studentName: attempt.studentName || warning.studentName,
              suspicionScore: warning.suspicionScore,
            }
          : attempt,
      ),
    );

    setAntiCheatSummary((previousSummary) => {
      if (!previousSummary || Number(previousSummary.examId) !== warning.examId) {
        return previousSummary;
      }

      let hasMatchedAttempt = false;
      let shouldIncreaseFlaggedCount = false;
      const nextAttempts = previousSummary.attempts.map((attempt) => {
        if (attempt.attemptId !== warning.examAttemptId) {
          return attempt;
        }

        hasMatchedAttempt = true;
        shouldIncreaseFlaggedCount =
          Number(attempt.suspicionScore || 0) < FLAGGED_SUSPICION_THRESHOLD &&
          warning.suspicionScore >= FLAGGED_SUSPICION_THRESHOLD;

        return {
          ...attempt,
          logCount: warning.logCount,
          studentName: attempt.studentName || warning.studentName,
          suspicionScore: warning.suspicionScore,
        };
      });

      return {
        ...previousSummary,
        attempts: nextAttempts,
        flaggedAttempts: shouldIncreaseFlaggedCount
          ? Math.min(
              Number(previousSummary.flaggedAttempts || 0) + 1,
              Number(previousSummary.totalAttempts || nextAttempts.length),
            )
          : previousSummary.flaggedAttempts,
        totalLogs: Number(previousSummary.totalLogs || 0) + (hasMatchedAttempt ? 1 : 0),
      };
    });
  }, []);

  const averageScoreLabel = typeof exam?.averageScore === "number" ? exam.averageScore : "--";
  const totalQuestionScoreLabel =
    typeof exam?.totalQuestionScore === "number" ? exam.totalQuestionScore : "--";
  const publishIssueList = exam ? buildExamPublishIssueList(exam, questions) : [];
  const publishStatusMeta = getPublishStatusMeta(
    exam,
    publishIssueList.length,
    publishServerIssues.length,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Chi tiết bài kiểm tra" title="Đang tải thông tin..." />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="eg-card space-y-5">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="eg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="eg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>

            <div className="eg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <EmptyState
        title="Không tìm thấy bài kiểm tra."
        description={loadErrorMessage}
        action={
          <Link className="eg-button eg-button-primary" to={getExamListPathByRole(user?.role)}>
            Quay lại danh sách đề thi
          </Link>
        }
      />
    );
  }

  const additionalInfoItems = buildAdditionalInfoItems(exam);
  const canOpenManagementPanel = Boolean(exam.canEdit || exam.canViewQuestionBank);
  const questionCountLabel = exam.questionCount > 0 ? exam.questionCount : questions.length;
  const managementPanelToggleLabel = exam.canEdit
    ? isManagementPanelOpen
      ? "Ẩn chỉnh sửa bài kiểm tra"
      : "Chỉnh sửa bài kiểm tra"
    : isManagementPanelOpen
      ? "Ẩn workspace câu hỏi"
      : "Xem workspace câu hỏi";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chi tiết bài kiểm tra"
        title={exam.title}
        actions={
          user?.role === "Student" ? (
            <Button disabled={isStartingAttempt} onClick={handleStartAttempt}>
              {isStartingAttempt ? "Đang vào phòng thi..." : "Bắt đầu làm bài"}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={getExamStatusVariant(exam.statusLabel)}>{exam.statusLabel}</Badge>
                  <Badge variant={exam.isPublished ? "info" : "neutral"}>
                    {exam.isPublished ? "Đã publish" : "Chưa publish"}
                  </Badge>
                  <Badge variant={exam.enableAntiCheat ? "caution" : "neutral"}>
                    {exam.enableAntiCheat ? "Anti-cheat bật" : "Anti-cheat tắt"}
                  </Badge>
                </div>

                {exam.description ? (
                  <p className="max-w-3xl text-sm leading-6 text-secondary">{exam.description}</p>
                ) : (
                  <p className="max-w-3xl text-sm leading-6 text-secondary">
                    Bài kiểm tra này hiện chưa có mô tả bổ sung.
                  </p>
                )}
              </div>

              <div className="group relative">
                <button
                  aria-label="Xem thông tin thêm của bài kiểm tra"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-secondary transition hover:border-tertiary hover:text-primary focus:outline-none focus:ring-2 focus:ring-tertiary/30"
                  type="button"
                >
                  <FiInfo className="h-4 w-4" />
                </button>

                <div className="invisible absolute right-0 top-full z-10 mt-3 w-[320px] rounded-[20px] border border-border bg-surface p-4 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-primary">Thông tin thêm</p>
                    <div className="space-y-3">
                      {additionalInfoItems.map((item) => (
                        <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-3">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-primary">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-border bg-surface-sunken p-4 text-sm text-secondary">
              Tạo lúc {formatShortDateTime(exam.createdAt)} • Cập nhật{" "}
              {formatShortDateTime(exam.updatedAt || exam.createdAt)}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Cấu hình bài kiểm tra</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {buildSettingItems(exam).map((item) => (
                <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-4">
                  <p className="text-sm font-semibold text-primary">{item.label}</p>
                  <p className="mt-2 text-sm text-secondary">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {isManagementPanelOpen && exam.canEdit ? (
            <ExamForm
              classroomOptions={classrooms}
              exam={exam}
              isSubmitting={isSaving}
              key={`${exam.id}-${exam.updatedAt || exam.createdAt}`}
              onSubmitExam={handleUpdateExam}
              showDescriptions={false}
              submitLabel="Lưu thay đổi"
              title="Chỉnh sửa bài kiểm tra"
            />
          ) : null}

          {isManagementPanelOpen && exam.canDelete ? (
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Nguy hiểm</h3>
              {isDeleteArmed ? (
                <p className="text-sm text-danger">
                  Bạn bấm thêm một lần nữa để xác nhận xóa đề thi này.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button disabled={isSaving} onClick={handleDeleteExam} variant="danger">
                  {isSaving ? "Đang xử lý..." : isDeleteArmed ? "Xác nhận xóa đề thi" : "Xóa đề thi"}
                </Button>
                {isDeleteArmed ? (
                  <Button
                    disabled={isSaving}
                    onClick={() => setIsDeleteArmed(false)}
                    variant="secondary"
                  >
                    Hủy thao tác xóa
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {canOpenManagementPanel ? (
            <div className="flex justify-end">
              <Button
                onClick={handleToggleManagementPanel}
                variant={isManagementPanelOpen ? "secondary" : "primary"}
              >
                {managementPanelToggleLabel}
              </Button>
            </div>
          ) : null}

          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-primary">Trạng thái publish</h3>
              <Badge variant={publishStatusMeta.variant}>{publishStatusMeta.label}</Badge>
            </div>

            {exam.canEdit || exam.canViewQuestionBank ? (
              exam.isPublished ? (
                <div className="rounded-[16px] border border-success/20 bg-success-muted p-4 text-sm leading-6 text-success">
                  Đề thi đã được publish. Sinh viên có thể vào làm bài khi đến đúng thời gian mở đề.
                </div>
              ) : publishIssueList.length === 0 ? (
                <div className="rounded-[16px] border border-success/20 bg-success-muted p-4 text-sm leading-6 text-success">
                  Đề đã đủ điều kiện publish theo checklist frontend. Bạn có thể phát hành ngay bây giờ.
                </div>
              ) : (
                <div className="rounded-[16px] border border-caution/20 bg-caution-muted p-4 text-sm leading-6 text-caution">
                  <p className="font-semibold">Cần hoàn thiện các mục sau trước khi publish:</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                    {publishIssueList.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )
            ) : exam.isPublished ? (
              <div className="rounded-[16px] border border-success/20 bg-success-muted p-4 text-sm leading-6 text-success">
                Đề thi đã được publish và đang hiển thị cho sinh viên theo lịch mở đề.
              </div>
            ) : (
              <div className="rounded-[16px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-secondary">
                Đề thi hiện vẫn ở trạng thái nháp. Chỉ giảng viên phụ trách mới có thể chỉnh sửa và publish đề này.
              </div>
            )}

            {publishServerIssues.length > 0 ? (
              <div className="rounded-[16px] border border-danger/20 bg-danger-muted p-4 text-sm leading-6 text-danger">
                <p className="font-semibold">Backend đang chặn publish vì các lỗi sau:</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                  {publishServerIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!exam.isPublished && exam.canEdit ? (
              <Button
                className="w-full sm:w-auto"
                disabled={
                  isPublishing ||
                  isSaving ||
                  isQuestionSubmitting ||
                  publishIssueList.length > 0
                }
                onClick={handlePublishExam}
              >
                {isPublishing ? "Đang publish..." : "Publish đề"}
              </Button>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Tóm tắt đề thi</h3>
            <div className="space-y-3 text-sm text-secondary">
              <p>
                <span className="font-semibold text-primary">Số câu hỏi:</span> {questionCountLabel} câu
              </p>
              <p>
                <span className="font-semibold text-primary">Tổng điểm:</span> {totalQuestionScoreLabel}
              </p>
              <p>
                <span className="font-semibold text-primary">Điểm trung bình:</span> {averageScoreLabel}
              </p>
              <p>
                <span className="font-semibold text-primary">Publish:</span>{" "}
                {exam.isPublished ? "Đã bật" : "Đang ở trạng thái nháp"}
              </p>
            </div>
          </Card>

          {exam.enableAntiCheat ? (
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Tóm tắt anti-cheat</h3>
              {antiCheatSummary ? (
                <div className="space-y-3 text-sm text-secondary">
                  <p>
                    <span className="font-semibold text-primary">Tổng lượt làm:</span>{" "}
                    {antiCheatSummary.totalAttempts}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Lượt bị gắn cờ:</span>{" "}
                    {antiCheatSummary.flaggedAttempts}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Tổng log:</span>{" "}
                    {antiCheatSummary.totalLogs}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-secondary">Chưa có dữ liệu anti-cheat.</p>
              )}
            </Card>
          ) : null}
        </div>
      </div>

      {isManagementPanelOpen && exam.canViewQuestionBank ? (
        <TeacherQuestionWorkspace
          armedDeleteQuestionId={armedDeleteQuestionId}
          canManage={exam.canEdit}
          composerRevision={composerRevision}
          deletingQuestionId={deletingQuestionId}
          editingQuestionId={editingQuestionId}
          exam={exam}
          expandedQuestionId={expandedQuestionId}
          importInfoMessage={importInfoMessage}
          importPreviewQuestions={importPreviewQuestions}
          importResultErrors={importResultErrors}
          importReviewMessage={importReviewMessage}
          isImportSubmitting={isImportSubmitting}
          isImportCommitDisabled={importPreviewQuestions.length === 0}
          isQuestionSubmitting={isQuestionSubmitting}
          onChangeMode={handleChangeQuestionWorkspaceMode}
          onClearFile={handleClearImportFile}
          onCommitImport={handleCommitImportedQuestions}
          onDeleteQuestion={handleDeleteQuestion}
          onEditQuestion={handleStartEditingQuestion}
          onFileSelected={handlePreviewImportedQuestions}
          onFilterChange={setQuestionWorkspaceFilter}
          onQuestionDirtyChange={setIsComposerDirty}
          onRequestCreateNew={handleReturnToCreateQuestion}
          onSortChange={setQuestionWorkspaceSort}
          onSubmitCreateQuestion={handleCreateQuestion}
          onSubmitUpdateImportQuestion={handleUpdateImportPreviewQuestion}
          onSubmitUpdateQuestion={handleUpdateQuestion}
          onToggleExpand={handleToggleQuestionExpand}
          questionWorkspaceFilter={questionWorkspaceFilter}
          questionWorkspaceMode={questionWorkspaceMode}
          questionWorkspaceSort={questionWorkspaceSort}
          questions={questions}
          stagedImportFile={stagedImportFile}
        />
      ) : null}

      {exam.canEdit ? (
        <AttemptMonitorPanel
          antiCheatSummary={antiCheatSummary}
          exam={exam}
          onAntiCheatWarning={handleRealtimeAntiCheatWarning}
          showToast={showToast}
          attempts={attempts}
        />
      ) : null}
    </div>
  );
}
