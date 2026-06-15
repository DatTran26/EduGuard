import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { examApi } from "../../../api/examApi";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Input from "../../../components/common/Input";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import {
  buildExamDetailPathByRole,
  getExamListPathByRole,
} from "../../../routes/routeConfig";
import { getStoredAccessToken } from "../../../utils/tokenStorage";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  ANTI_CHEAT_EVENT_TYPES,
  getAntiCheatEventMeta,
  getSuspicionScoreMeta,
} from "../../anti-cheat/antiCheatHelpers";
import {
  buildAttemptAnswerState,
  calculateAttemptEndTime,
  countAnsweredQuestions,
  formatRemainingDuration,
  formatSaveBanner,
  getAttemptAnswerPayload,
  getRemainingTimeVariant,
  isAttemptAnswerPayloadReady,
  isQuestionAnswered,
} from "../attemptHelpers";
import { getQuestionTypeLabel } from "../../exams/examHelpers";

const QUESTION_SAVE_DELAY_MS = 700;
const ANTI_CHEAT_THROTTLE_MS = 4000;

function buildDefaultSaveState() {
  return {
    status: "idle",
    message: "",
    lastSavedAt: "",
  };
}

function buildQuestionAnswerState(question, answerState) {
  if (question.questionType === "ShortAnswer") {
    return {
      answerIds: [],
      textAnswer: answerState?.textAnswer ?? "",
    };
  }

  return {
    answerIds: Array.isArray(answerState?.answerIds) ? answerState.answerIds : [],
    textAnswer: "",
  };
}

function toggleAnswerSelection(currentAnswerIds, answerId) {
  if (currentAnswerIds.includes(answerId)) {
    return currentAnswerIds.filter((id) => id !== answerId);
  }

  return [...currentAnswerIds, answerId];
}

function buildKeepAliveLogUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
  return `${baseUrl.replace(/\/$/, "")}/anti-cheat/logs`;
}

function buildUnansweredQuestionIndexes(questions = [], answersByQuestionId = {}) {
  return questions
    .filter((question) => !isQuestionAnswered(question, answersByQuestionId[question.id]))
    .map((question) => question.orderIndex);
}

export default function ExamAttemptPage() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState(buildDefaultSaveState);
  const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window === "undefined" ? true : window.navigator.onLine,
  );
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document === "undefined" ? false : Boolean(document.fullscreenElement),
  );
  const [lastWarning, setLastWarning] = useState(null);
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
  const [clockTickMs, setClockTickMs] = useState(Date.now());
  const attemptRef = useRef(null);
  const examRef = useRef(null);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const questionSaveTimersRef = useRef(new Map());
  const dirtyQuestionIdsRef = useRef(new Set());
  const antiCheatThrottleRef = useRef(new Map());
  const offlineStartedAtRef = useRef(0);
  const hasAutoSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  const answeredQuestionCount = useMemo(
    () => countAnsweredQuestions(questions, answersByQuestionId),
    [answersByQuestionId, questions],
  );
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const attemptEndTime = calculateAttemptEndTime(attempt, exam?.durationMinutes);
  const remainingTimeMs = attemptEndTime ? Math.max(attemptEndTime - clockTickMs, 0) : 0;
  const unansweredQuestionIndexes = useMemo(
    () => buildUnansweredQuestionIndexes(questions, answersByQuestionId),
    [answersByQuestionId, questions],
  );
  const timeBadgeVariant = getRemainingTimeVariant(remainingTimeMs);
  const suspicionMeta = getSuspicionScoreMeta(attempt?.suspicionScore ?? 0);
  const latestWarningMeta = getAntiCheatEventMeta(lastWarning?.type);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    answersRef.current = answersByQuestionId;
  }, [answersByQuestionId]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    let isMounted = true;

    async function loadAttemptPage() {
      try {
        const attemptResponse = await examAttemptApi.getById(attemptId);

        if (!isMounted) {
          return;
        }

        const attemptData = attemptResponse.data;
        const examResponse = await examApi.getById(attemptData.examId);

        if (!isMounted) {
          return;
        }

        const initialAnswers = buildAttemptAnswerState(attemptData.savedAnswers);
        let nextResult = null;

        if (attemptData.status === "Submitted") {
          const resultResponse = await examAttemptApi.getResult(attemptId);
          nextResult = resultResponse.data;
        }

        setAttempt(attemptData);
        setExam(examResponse.data);
        setQuestions(attemptData.questions);
        setAnswersByQuestionId(initialAnswers);
        setResult(nextResult);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAttempt(null);
        setExam(null);
        setQuestions([]);
        setResult(null);
        setLoadErrorMessage(error.message || "Không thể tải phòng làm bài.");
        showToast({
          tone: "danger",
          title: "Tải phòng làm bài thất bại",
          message: error.message || "Không thể tải phòng làm bài.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAttemptPage();

    return () => {
      isMounted = false;
    };
  }, [attemptId, showToast]);

  useEffect(() => {
    if (attempt?.status !== "InProgress") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClockTickMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [attempt?.status]);

  useEffect(() => {
    if (attempt?.status !== "InProgress" || !attemptEndTime || remainingTimeMs > 0) {
      return;
    }

    if (hasAutoSubmittedRef.current || isSubmittingRef.current) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    handleSubmitAttempt({ isAutoSubmit: true });
  }, [attempt?.status, attemptEndTime, handleSubmitAttempt, remainingTimeMs]);

  useEffect(() => {
    const activeTimers = questionSaveTimersRef.current;

    return () => {
      activeTimers.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (attempt?.status !== "InProgress") {
      return undefined;
    }

    function handleOffline() {
      offlineStartedAtRef.current = Date.now();
      setIsOnline(false);
    }

    function handleOnline() {
      const disconnectedDurationMs = offlineStartedAtRef.current
        ? Date.now() - offlineStartedAtRef.current
        : 0;
      offlineStartedAtRef.current = 0;
      setIsOnline(true);
      flushDirtyAnswers();

      if (examRef.current?.enableAntiCheat) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.disconnected,
          description: "Hệ thống ghi nhận mất kết nối trong lúc làm bài.",
          metadata:
            disconnectedDurationMs > 0
              ? JSON.stringify({
                  disconnectedDurationSeconds: Math.round(disconnectedDurationMs / 1000),
                })
              : "",
        });
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [attempt?.status, flushDirtyAnswers, logAntiCheatEvent]);

  useEffect(() => {
    if (attempt?.status !== "InProgress" || !exam?.enableAntiCheat) {
      return undefined;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.tabSwitch,
          description: "Hệ thống ghi nhận bạn rời màn hình làm bài.",
        });
      }
    }

    function handleClipboardEvent(event) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.copyPaste,
        description: "Hệ thống ghi nhận thao tác copy / cut / paste trong lúc làm bài.",
        metadata: JSON.stringify({ eventType: event.type }),
      });
    }

    function handleFullscreenChange() {
      const nextIsFullscreen = Boolean(document.fullscreenElement);
      const previousIsFullscreen = isFullscreen;
      setIsFullscreen(nextIsFullscreen);

      if (previousIsFullscreen && !nextIsFullscreen) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.exitFullscreen,
          description: "Hệ thống ghi nhận bạn đã thoát chế độ toàn màn hình.",
        });
      }
    }

    function handleBeforeUnload() {
      postKeepAliveLog({
        examAttemptId: Number(attemptRef.current?.id) || 0,
        type: ANTI_CHEAT_EVENT_TYPES.pageReload,
        description: "Hệ thống ghi nhận trang làm bài bị tải lại hoặc đóng đột ngột.",
      });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleClipboardEvent);
    document.addEventListener("cut", handleClipboardEvent);
    document.addEventListener("paste", handleClipboardEvent);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleClipboardEvent);
      document.removeEventListener("cut", handleClipboardEvent);
      document.removeEventListener("paste", handleClipboardEvent);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [attempt?.status, exam?.enableAntiCheat, isFullscreen, logAntiCheatEvent, postKeepAliveLog]);

  function setAnswerState(questionId, nextAnswerState) {
    setAnswersByQuestionId((previousValue) => {
      const nextValue = {
        ...previousValue,
        [questionId]: nextAnswerState,
      };
      answersRef.current = nextValue;
      return nextValue;
    });
  }

  function scheduleQuestionSave(questionId) {
    const matchedTimer = questionSaveTimersRef.current.get(questionId);

    if (matchedTimer) {
      window.clearTimeout(matchedTimer);
    }

    dirtyQuestionIdsRef.current.add(questionId);

    const timeoutId = window.setTimeout(() => {
      saveQuestion(questionId);
    }, QUESTION_SAVE_DELAY_MS);

    questionSaveTimersRef.current.set(questionId, timeoutId);
  }

  const saveQuestion = useCallback(async (questionId) => {
    const nextAttempt = attemptRef.current;
    const question = questionsRef.current.find((item) => item.id === questionId);

    if (!nextAttempt || nextAttempt.status !== "InProgress" || !question) {
      return;
    }

    const payload = getAttemptAnswerPayload(question, answersRef.current[questionId]);

    if (!isAttemptAnswerPayloadReady(question, payload)) {
      dirtyQuestionIdsRef.current.delete(questionId);
      return;
    }

    setSaveState((previousValue) => ({
      ...previousValue,
      status: "saving",
      message: "",
    }));

    try {
      await examAttemptApi.saveAnswer(nextAttempt.id, payload);
      dirtyQuestionIdsRef.current.delete(questionId);
      setSaveState({
        status: "saved",
        message: "",
        lastSavedAt: new Date().toISOString(),
      });
    } catch (error) {
      setSaveState((previousValue) => ({
        ...previousValue,
        status: "error",
        message: error.message || "Lỗi lưu, thử lại.",
      }));
    }
  }, []);

  const flushDirtyAnswers = useCallback(async () => {
    const dirtyQuestionIds = Array.from(dirtyQuestionIdsRef.current);

    if (dirtyQuestionIds.length === 0) {
      return;
    }

    await Promise.all(dirtyQuestionIds.map((questionId) => saveQuestion(questionId)));
  }, [saveQuestion]);

  const logAntiCheatEvent = useCallback(async ({ type, description, metadata = "" }) => {
    const nextAttempt = attemptRef.current;
    const nextExam = examRef.current;

    if (!nextAttempt || nextAttempt.status !== "InProgress" || !nextExam?.enableAntiCheat) {
      return;
    }

    const lastLoggedAt = antiCheatThrottleRef.current.get(type) ?? 0;
    const now = Date.now();

    if (now - lastLoggedAt < ANTI_CHEAT_THROTTLE_MS) {
      return;
    }

    antiCheatThrottleRef.current.set(type, now);
    setLastWarning({
      type,
      occurredAt: new Date().toISOString(),
    });

    try {
      const response = await antiCheatApi.log({
        examAttemptId: nextAttempt.id,
        type,
        description,
        metadata,
      });

      setAttempt((previousAttempt) =>
        previousAttempt
          ? {
              ...previousAttempt,
              suspicionScore:
                Number(previousAttempt.suspicionScore || 0) +
                Number(response.data?.suspicionPoint || 0),
            }
          : previousAttempt,
      );
    } catch {
      // Bo qua de khong lam gian doan luong lam bai.
    }
  }, []);

  const postKeepAliveLog = useCallback((payload) => {
    const accessToken = getStoredAccessToken();

    if (!accessToken || !payload.examAttemptId) {
      return;
    }

    try {
      window.fetch(buildKeepAliveLogUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // Khong can chan dong trang.
    }
  }, []);

  function handleSelectSingleAnswer(questionId, answerId) {
    setAnswerState(questionId, {
      answerIds: [answerId],
      textAnswer: "",
    });
    scheduleQuestionSave(questionId);
  }

  function handleToggleMultipleAnswer(questionId, answerId) {
    const currentAnswerState = buildQuestionAnswerState(
      currentQuestion,
      answersByQuestionId[questionId],
    );
    const nextAnswerIds = toggleAnswerSelection(currentAnswerState.answerIds, answerId);

    setAnswerState(questionId, {
      answerIds: nextAnswerIds,
      textAnswer: "",
    });
    scheduleQuestionSave(questionId);
  }

  function handleShortAnswerChange(questionId, value) {
    setAnswerState(questionId, {
      answerIds: [],
      textAnswer: value,
    });
    scheduleQuestionSave(questionId);
  }

  const handleSubmitAttempt = useCallback(async ({ isAutoSubmit = false } = {}) => {
    if (!attemptRef.current) {
      return;
    }

    setIsSubmitting(true);

    try {
      await flushDirtyAnswers();
      const response = await examAttemptApi.submit(attemptRef.current.id);

      setAttempt(response.data.attempt);
      setResult(response.data);
      setIsConfirmingSubmit(false);
      showToast({
        tone: "success",
        title: isAutoSubmit ? "Hệ thống đã tự nộp bài" : "Đã nộp bài",
        message: isAutoSubmit
          ? "Thời gian đã hết. Hệ thống đã tự động nộp bài."
          : "Bài làm đã được ghi nhận.",
      });
    } catch (error) {
      if (isAutoSubmit) {
        hasAutoSubmittedRef.current = false;
      }

      showToast({
        tone: "danger",
        title: "Nộp bài thất bại",
        message: error.message || "Không thể nộp bài lúc này.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [flushDirtyAnswers, showToast]);

  async function handleStartFullscreen() {
    if (!document.documentElement.requestFullscreen) {
      showToast({
        tone: "danger",
        title: "Không hỗ trợ toàn màn hình",
        message: "Trình duyệt hiện tại không hỗ trợ toàn màn hình.",
      });
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      showToast({
        tone: "danger",
        title: "Không thể bật toàn màn hình",
        message: "Trình duyệt đã chặn chế độ toàn màn hình.",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
          Đang tải phòng làm bài...
        </div>
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="min-h-screen bg-neutral px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <EmptyState
            title="Không thể mở phòng làm bài."
            description={loadErrorMessage}
            action={
              <Link className="eg-button eg-button-primary" to={getExamListPathByRole(user?.role)}>
                Quay lại danh sách đề thi
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (attempt.status === "Submitted") {
    return (
      <div className="min-h-screen bg-neutral px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-secondary">
                  Kết quả bài thi
                </p>
                <h1 className="text-[2.6rem] font-semibold leading-tight tracking-tight text-primary">
                  {exam.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Đã nộp bài</Badge>
                <Badge variant={suspicionMeta.variant}>{suspicionMeta.label}</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-[0.82rem] font-medium text-secondary">Điểm</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">
                  {typeof result?.attempt?.score === "number" ? result.attempt.score : "--"}
                </p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-[0.82rem] font-medium text-secondary">Nộp bài</p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {attempt.submittedAt ? formatShortDateTime(attempt.submittedAt) : "--"}
                </p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-[0.82rem] font-medium text-secondary">Số câu đã làm</p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {answeredQuestionCount}/{questions.length}
                </p>
              </div>
              <div className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-[0.82rem] font-medium text-secondary">Điểm nghi ngờ</p>
                <p className="mt-3 text-sm font-semibold text-primary">{attempt.suspicionScore}</p>
              </div>
            </div>
          </Card>

          {result?.questions?.length > 0 ? (
            <div className="space-y-4">
              {result.questions.map((questionResult, index) => (
                <Card key={questionResult.questionId} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={questionResult.isCorrect ? "success" : "caution"}>
                        {questionResult.isCorrect ? "Đạt điểm tối đa" : "Cần xem lại"}
                      </Badge>
                      <Badge variant="neutral">
                        Câu {index + 1} • {questionResult.earnedScore}/{questionResult.score} điểm
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary">
                      {questionResult.selectedAnswerIds.length > 0
                        ? `${questionResult.selectedAnswerIds.length} lua chon`
                        : questionResult.textAnswer
                          ? "Đã nhập tự luận"
                          : "Bỏ trống"}
                    </p>
                  </div>

                  <p className="text-sm leading-6 text-primary">{questionResult.content}</p>

                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    {questionResult.textAnswer
                      ? questionResult.textAnswer
                      : questionResult.selectedAnswerIds.length > 0
                        ? `Đã chọn ID đáp án: ${questionResult.selectedAnswerIds.join(", ")}`
                        : "Không có câu trả lời."}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-sm text-secondary">
              Hệ thống đã ghi nhận điểm. Chi tiết đáp án hiện đang được ẩn theo cấu hình đề thi.
            </Card>
          )}

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">Liên kết nhanh</h2>
            <div className="flex flex-wrap gap-3">
              <Link className="eg-button eg-button-primary" to={getExamListPathByRole(user?.role)}>
                Danh sách đề thi
              </Link>
              <Link
                className="eg-button eg-button-secondary"
                to={buildExamDetailPathByRole(user?.role, exam.id)}
              >
                Quay lại chi tiết đề
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral pb-24">
      <div className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={timeBadgeVariant}>{formatRemainingDuration(remainingTimeMs)}</Badge>
              <Badge variant={isOnline ? "success" : "danger"}>
                {isOnline ? "Đang kết nối" : "Đang mất kết nối"}
              </Badge>
              <Badge variant={saveState.status === "error" ? "danger" : "info"}>
                {formatSaveBanner(saveState)}
              </Badge>
              {exam.enableAntiCheat ? (
                <Badge variant={suspicionMeta.variant}>{suspicionMeta.label}</Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-[2rem]">
                {exam.title}
              </h1>
              <p className="text-sm text-secondary">
                Đã trả lời {answeredQuestionCount}/{questions.length} câu • Bắt đầu{" "}
                {formatShortDateTime(attempt.startedAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {exam.settings.requireFullscreen ? (
              <Button onClick={handleStartFullscreen} variant="secondary">
                {isFullscreen ? "Đang toàn màn hình" : "Bật toàn màn hình"}
              </Button>
            ) : null}
            <Button
              disabled={isSubmitting}
              onClick={() => setIsConfirmingSubmit(true)}
            >
              {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {exam.settings.requireFullscreen && !isFullscreen ? (
              <Card className="space-y-3 border-caution/30 bg-caution-muted">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="caution">Cần bật toàn màn hình</Badge>
                  <Button onClick={handleStartFullscreen} variant="secondary">
                    Bật ngay
                  </Button>
                </div>
              </Card>
            ) : null}

            {lastWarning ? (
              <Card className="space-y-2 border-caution/30 bg-caution-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={latestWarningMeta.variant}>{latestWarningMeta.label}</Badge>
                  <p className="text-sm text-secondary">
                    {formatShortDateTime(lastWarning.occurredAt)}
                  </p>
                </div>
              </Card>
            ) : null}

            {currentQuestion ? (
              <Card className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">Câu {currentQuestion.orderIndex}</Badge>
                    <Badge variant="neutral">
                      {getQuestionTypeLabel(currentQuestion.questionType)}
                    </Badge>
                    <Badge variant="neutral">{currentQuestion.score} điểm</Badge>
                  </div>
                  <p className="text-sm text-secondary">
                    {currentQuestionIndex + 1}/{questions.length}
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-lg font-semibold leading-8 text-primary">
                    {currentQuestion.content}
                  </p>

                  {currentQuestion.questionType === "ShortAnswer" ? (
                    <div className="space-y-3">
                      <label
                        className="text-sm font-semibold text-primary"
                        htmlFor={`question-${currentQuestion.id}-text`}
                      >
                        Câu trả lời
                      </label>
                      <Input
                        as="textarea"
                        id={`question-${currentQuestion.id}-text`}
                        placeholder="Nhập câu trả lời của bạn"
                        value={answersByQuestionId[currentQuestion.id]?.textAnswer ?? ""}
                        onChange={(event) =>
                          handleShortAnswerChange(currentQuestion.id, event.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentQuestion.answers.map((answer, index) => {
                        const isChecked =
                          answersByQuestionId[currentQuestion.id]?.answerIds?.includes(answer.id) ??
                          false;
                        const isSingleSelect =
                          currentQuestion.questionType === "SingleChoice" ||
                          currentQuestion.questionType === "TrueFalse";

                        return (
                          <label
                            key={answer.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-[16px] border px-4 py-4 transition-colors duration-200 ${
                              isChecked
                                ? "border-tertiary bg-info-muted"
                                : "border-border bg-neutral hover:bg-surface-sunken"
                            }`}
                            htmlFor={`question-${currentQuestion.id}-answer-${answer.id}`}
                          >
                            <input
                              checked={isChecked}
                              className="mt-1 h-4 w-4 accent-[var(--color-tertiary)]"
                              id={`question-${currentQuestion.id}-answer-${answer.id}`}
                              name={`question-${currentQuestion.id}`}
                              type={isSingleSelect ? "radio" : "checkbox"}
                              onChange={() =>
                                isSingleSelect
                                  ? handleSelectSingleAnswer(currentQuestion.id, answer.id)
                                  : handleToggleMultipleAnswer(currentQuestion.id, answer.id)
                              }
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-primary">Lua chon {index + 1}</p>
                              <p className="text-sm leading-6 text-secondary">{answer.content}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((previousValue) => previousValue - 1)}
                    variant="secondary"
                  >
                    Câu trước
                  </Button>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="xl:hidden"
                      onClick={() => setIsQuestionSheetOpen(true)}
                      variant="ghost"
                    >
                      Danh sách câu hỏi
                    </Button>
                    <Button
                      disabled={currentQuestionIndex === questions.length - 1}
                      onClick={() => setCurrentQuestionIndex((previousValue) => previousValue + 1)}
                      variant="secondary"
                    >
                      Câu tiếp
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>

          <aside className="hidden xl:block">
            <Card className="sticky top-6 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-primary">Danh sách câu hỏi</h2>
                <p className="text-sm text-secondary">
                  {answeredQuestionCount}/{questions.length} câu đã trả lời
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {questions.map((question, index) => {
                  const isAnswered = isQuestionAnswered(
                    question,
                    answersByQuestionId[question.id],
                  );
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      className={`rounded-[14px] border px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
                        isCurrent
                          ? "border-tertiary bg-info-muted text-link"
                          : isAnswered
                            ? "border-success bg-success-muted text-success"
                            : "border-border bg-neutral text-secondary hover:bg-surface-sunken"
                      }`}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {question.orderIndex}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                <p>
                  <span className="font-semibold text-primary">Con lai:</span>{" "}
                  {formatRemainingDuration(remainingTimeMs)}
                </p>
                <p>
                  <span className="font-semibold text-primary">Chưa trả lời:</span>{" "}
                  {unansweredQuestionIndexes.length > 0 ? unansweredQuestionIndexes.join(", ") : "Không có"}
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {isQuestionSheetOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/35 xl:hidden"
          onClick={() => setIsQuestionSheetOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border border-border bg-surface p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">Danh sách câu hỏi</h2>
              <Button onClick={() => setIsQuestionSheetOpen(false)} variant="ghost">
                Đóng
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {questions.map((question, index) => {
                const isAnswered = isQuestionAnswered(
                  question,
                  answersByQuestionId[question.id],
                );

                return (
                  <button
                    key={question.id}
                    className={`rounded-[14px] border px-3 py-3 text-sm font-semibold ${
                      index === currentQuestionIndex
                        ? "border-tertiary bg-info-muted text-link"
                        : isAnswered
                          ? "border-success bg-success-muted text-success"
                          : "border-border bg-neutral text-secondary"
                    }`}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setIsQuestionSheetOpen(false);
                    }}
                  >
                    {question.orderIndex}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {isConfirmingSubmit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsConfirmingSubmit(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-[24px] border border-border bg-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-primary">Xác nhận nộp bài</h2>
              <div className="space-y-2 text-sm leading-6 text-secondary">
                <p>
                  Đã trả lời {answeredQuestionCount}/{questions.length} câu.
                </p>
                <p>
                  Chưa trả lời:{" "}
                  {unansweredQuestionIndexes.length > 0
                    ? unansweredQuestionIndexes.join(", ")
                    : "Không có"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                disabled={isSubmitting}
                onClick={() => setIsConfirmingSubmit(false)}
                variant="secondary"
              >
                Quay lại bài làm
              </Button>
              <Button disabled={isSubmitting} onClick={() => handleSubmitAttempt()}>
                {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
