import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { examApi } from "../../../api/examApi";
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
  buildStudentExamPausedPath,
  getExamListPathByRole,
} from "../../../routes/routeConfig";
import CameraPreview from "../../proctoring/components/CameraPreview";
import ExamWatermark from "../../proctoring/components/ExamWatermark";
import { useCameraStream } from "../../proctoring/hooks/useCameraStream";
import { useProctoringAutoDetection } from "../../proctoring/hooks/useProctoringAutoDetection";
import { useProctoringHeartbeat } from "../../proctoring/hooks/useProctoringHeartbeat";
import { useStudentWebRtcPublisher } from "../../proctoring/hooks/useStudentWebRtcPublisher";
import { useStudentProctoringEvents } from "../../proctoring/hooks/useStudentProctoringEvents";
import {
  getProctoringHeartbeatIntervalMs,
  isProctoringRequired,
} from "../../proctoring/utils/proctoringRouting";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getStoredAccessToken } from "../../../utils/tokenStorage";
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
  isQuestionAnswered,
} from "../attemptHelpers";
import { getQuestionTypeLabel } from "../../exams/examHelpers";

const QUESTION_SAVE_DELAY_MS = 700;
const ANTI_CHEAT_THROTTLE_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 30000;
const ANSWER_CHOICE_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function buildDefaultSaveState() {
  return {
    status: "idle",
    message: "",
    lastSavedAt: "",
  };
}

function buildQuestionAnswerState(question, answerState) {
  if (question?.questionType === "ShortAnswer") {
    return {
      answerIds: [],
      textAnswer: answerState?.textAnswer ?? "",
    };
  }

  return {
    answerIds: Array.isArray(answerState?.answerIds)
      ? answerState.answerIds
      : [],
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

function buildUnansweredQuestionIndexes(
  questions = [],
  answersByQuestionId = {},
) {
  return questions.reduce((result, question, index) => {
    if (!isQuestionAnswered(question, answersByQuestionId[question.id])) {
      result.push(index + 1);
    }

    return result;
  }, []);
}

function buildAttemptSettingItems(exam) {
  if (!exam?.settings) {
    return [];
  }

  return [
    {
      label: "Random câu hỏi",
      value: exam.settings.shuffleQuestions ? "Bật" : "Tắt",
    },
    {
      label: "Random đáp án",
      value: exam.settings.shuffleAnswers ? "Bật" : "Tắt",
    },
    {
      label: "Hiện kết quả",
      value: exam.settings.showResultAfterSubmit ? "Có" : "Ẩn",
    },
    {
      label: "Toàn màn hình",
      value: exam.settings.requireFullscreen ? "Bắt buộc" : "Không bắt buộc",
    },
    {
      label: "Anti-cheat",
      value: exam.enableAntiCheat ? "Bật" : "Tắt",
    },
  ];
}

function getQuestionSelectionHint(questionType) {
  if (questionType === "MultipleChoice") {
    return "Có thể chọn nhiều đáp án.";
  }

  if (questionType === "ShortAnswer") {
    return "Câu trả lời sẽ được tự lưu khi bạn nhập.";
  }

  return "Chọn một đáp án phù hợp nhất.";
}

function getAnswerChoiceLabel(index) {
  return ANSWER_CHOICE_LABELS[index] ?? `${index + 1}`;
}

function formatResultAnswerSummary(questionResult) {
  if (questionResult.textAnswer) {
    return questionResult.textAnswer;
  }

  if (questionResult.selectedAnswerIds.length > 0) {
    return `Đã chọn ${questionResult.selectedAnswerIds.length} lựa chọn.`;
  }

  return "Bỏ trống.";
}

export default function ExamAttemptPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
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
    typeof document === "undefined"
      ? false
      : Boolean(document.fullscreenElement),
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
  const fullscreenRequestAttemptedRef = useRef(false);
  const previousFullscreenStateRef = useRef(
    typeof document === "undefined"
      ? false
      : Boolean(document.fullscreenElement),
  );

  const answeredQuestionCount = useMemo(
    () => countAnsweredQuestions(questions, answersByQuestionId),
    [answersByQuestionId, questions],
  );
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const attemptEndTime = calculateAttemptEndTime(
    attempt,
    exam?.durationMinutes,
  );
  const remainingTimeMs = attemptEndTime
    ? Math.max(attemptEndTime - clockTickMs, 0)
    : 0;
  const unansweredQuestionIndexes = useMemo(
    () => buildUnansweredQuestionIndexes(questions, answersByQuestionId),
    [answersByQuestionId, questions],
  );
  const timeBadgeVariant = getRemainingTimeVariant(remainingTimeMs);
  const suspicionMeta = getSuspicionScoreMeta(attempt?.suspicionScore ?? 0);
  const latestWarningMeta = getAntiCheatEventMeta(lastWarning?.type);
  const attemptSettingItems = useMemo(() => buildAttemptSettingItems(exam), [exam]);
  const proctoringEnabled =
    attempt?.status === "InProgress" && isProctoringRequired(exam);
  const { videoRef, status: cameraStatus, streamRef } = useCameraStream({ enabled: proctoringEnabled });
  useProctoringHeartbeat({
    attemptId,
    enabled: proctoringEnabled,
    intervalMs: getProctoringHeartbeatIntervalMs(exam),
    cameraStatus: cameraStatus === "ready" ? "On" : "Off",
    fullscreenStatus: isFullscreen ? "On" : "Off",
    connectionStatus: isOnline ? "Online" : "Offline",
    videoRef,
  });
  useProctoringAutoDetection({
    attemptId,
    enabled: proctoringEnabled && Boolean(exam?.settings?.enableExternalDeviceDetection),
    intervalMs: 4000,
    videoRef,
  });
  useStudentWebRtcPublisher({
    attemptId,
    enabled: proctoringEnabled,
    mediaStream: streamRef,
  });
  useStudentProctoringEvents({
    attemptId,
    examId: exam?.id,
    enabled: proctoringEnabled,
  });
  const orderedResultQuestions = useMemo(() => {
    if (!Array.isArray(result?.questions) || result.questions.length === 0) {
      return [];
    }

    const orderMap = new Map(
      questions.map((question, index) => [question.id, index]),
    );

    return [...result.questions].sort((firstQuestion, secondQuestion) => {
      const firstOrder =
        orderMap.get(firstQuestion.questionId) ?? Number.MAX_SAFE_INTEGER;
      const secondOrder =
        orderMap.get(secondQuestion.questionId) ?? Number.MAX_SAFE_INTEGER;
      return firstOrder - secondOrder;
    });
  }, [questions, result?.questions]);

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

  const saveQuestion = useCallback(async (questionId) => {
    const nextAttempt = attemptRef.current;
    const question = questionsRef.current.find(
      (item) => item.id === questionId,
    );

    questionSaveTimersRef.current.delete(questionId);

    if (!nextAttempt || nextAttempt.status !== "InProgress" || !question) {
      dirtyQuestionIdsRef.current.delete(questionId);
      return;
    }

    const payload = getAttemptAnswerPayload(
      question,
      answersRef.current[questionId],
    );

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
    questionSaveTimersRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    questionSaveTimersRef.current.clear();

    const dirtyQuestionIds = Array.from(dirtyQuestionIdsRef.current);

    if (dirtyQuestionIds.length === 0) {
      return;
    }

    await Promise.all(
      dirtyQuestionIds.map((questionId) => saveQuestion(questionId)),
    );
  }, [saveQuestion]);

  const logAntiCheatEvent = useCallback(
    async ({ type, description, metadata = "" }) => {
      const nextAttempt = attemptRef.current;
      const nextExam = examRef.current;

      if (
        !nextAttempt ||
        nextAttempt.status !== "InProgress" ||
        !nextExam?.enableAntiCheat
      ) {
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
        description,
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
        // Khong chan luong lam bai neu anti-cheat log gap loi tam thoi.
      }
    },
    [],
  );

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
      // Bo qua vi day la log khong dong bo khi dong trang.
    }
  }, []);

  const handleStartFullscreen = useCallback(
    async ({ silent = false } = {}) => {
      if (!document.documentElement.requestFullscreen) {
        if (!silent) {
          showToast({
            tone: "danger",
            title: "Không hỗ trợ toàn màn hình",
            message: "Trình duyệt hiện tại không hỗ trợ chế độ toàn màn hình.",
          });
        }
        return;
      }

      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        if (!silent) {
          showToast({
            tone: "danger",
            title: "Không thể bật toàn màn hình",
            message:
              "Trình duyệt đã chặn chế độ toàn màn hình cho phiên làm bài này.",
          });
        }
      }
    },
    [showToast],
  );

  const handleSubmitAttempt = useCallback(
    async ({ isAutoSubmit = false } = {}) => {
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
        setIsQuestionSheetOpen(false);
        setSaveState(buildDefaultSaveState());
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
    },
    [flushDirtyAnswers, showToast],
  );

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

  function handleSelectSingleAnswer(questionId, answerId) {
    setAnswerState(questionId, {
      answerIds: [answerId],
      textAnswer: "",
    });
    scheduleQuestionSave(questionId);
  }

  function handleToggleMultipleAnswer(questionId, answerId) {
    const question = questionsRef.current.find(
      (item) => item.id === questionId,
    );

    if (!question) {
      return;
    }

    const currentAnswerState = buildQuestionAnswerState(
      question,
      answersRef.current[questionId],
    );
    const nextAnswerIds = toggleAnswerSelection(
      currentAnswerState.answerIds,
      answerId,
    );

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

  useEffect(() => {
    if (
      attempt?.status === "Submitted" &&
      exam &&
      !exam.settings?.showResultAfterSubmit
    ) {
      navigate(getExamListPathByRole(user?.role), { replace: true });
    }
  }, [attempt?.status, exam, navigate, user?.role]);

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
    setCurrentQuestionIndex((previousValue) =>
      Math.min(previousValue, Math.max(questions.length - 1, 0)),
    );
  }, [questions.length]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadAttemptPage() {
      try {
        const attemptResponse = await examAttemptApi.getById(attemptId);

        if (!isMounted) {
          return;
        }

        const attemptData = attemptResponse.data;

        if (attemptData.status === "PausedByProctor") {
          navigate(buildStudentExamPausedPath(attemptId), { replace: true });
          return;
        }

        const examResponse = await examApi.getById(attemptData.examId);

        if (!isMounted) {
          return;
        }

        const initialAnswers = buildAttemptAnswerState(
          attemptData.savedAnswers,
        );
        let nextResult = null;

        if (attemptData.status === "Submitted") {
          const resultResponse = await examAttemptApi.getResult(attemptId);
          nextResult = resultResponse.data;
        }

        hasAutoSubmittedRef.current = false;
        fullscreenRequestAttemptedRef.current = false;
        previousFullscreenStateRef.current = Boolean(
          document.fullscreenElement,
        );
        setAttempt(attemptData);
        setExam(examResponse.data);
        setQuestions(attemptData.questions);
        setAnswersByQuestionId(initialAnswers);
        setResult(nextResult);
        setCurrentQuestionIndex(0);
        setSaveState(buildDefaultSaveState());
        setLastWarning(null);
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
  }, [attemptId, navigate, showToast]);

  useEffect(() => {
    if (attempt?.status !== "InProgress" || !attemptId) {
      return undefined;
    }

    let isMounted = true;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await examAttemptApi.getById(attemptId);
        if (!isMounted) {
          return;
        }

        if (response.data.status === "PausedByProctor") {
          navigate(buildStudentExamPausedPath(attemptId), { replace: true });
        }
      } catch {
        // Ignore transient polling errors.
      }
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [attempt?.status, attemptId, navigate]);

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
    if (
      attempt?.status !== "InProgress" ||
      !attemptEndTime ||
      remainingTimeMs > 0
    ) {
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
                  disconnectedDurationSeconds: Math.round(
                    disconnectedDurationMs / 1000,
                  ),
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
    if (attempt?.status !== "InProgress") {
      return undefined;
    }

    function sendHeartbeat() {
      if (document.hidden) {
        return;
      }

      const currentAttemptId = Number(attemptRef.current?.id) || 0;
      if (!currentAttemptId) {
        return;
      }

      examAttemptApi.sendHeartbeat(currentAttemptId, { client: "web" }).catch(() => {});
    }

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [attempt?.status]);

  useEffect(() => {
    if (attempt?.status !== "InProgress") {
      return undefined;
    }

    function handleFullscreenChange() {
      const nextIsFullscreen = Boolean(document.fullscreenElement);
      const previousIsFullscreen = previousFullscreenStateRef.current;
      previousFullscreenStateRef.current = nextIsFullscreen;
      setIsFullscreen(nextIsFullscreen);

      if (
        previousIsFullscreen &&
        !nextIsFullscreen &&
        examRef.current?.enableAntiCheat
      ) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.exitFullscreen,
          description: "Hệ thống ghi nhận bạn đã thoát chế độ toàn màn hình.",
        });
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attempt?.status, logAntiCheatEvent]);

  useEffect(() => {
    if (
      attempt?.status !== "InProgress" ||
      !exam?.settings.requireFullscreen ||
      isFullscreen ||
      fullscreenRequestAttemptedRef.current
    ) {
      return undefined;
    }

    fullscreenRequestAttemptedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      handleStartFullscreen({ silent: true });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    attempt?.status,
    exam?.settings.requireFullscreen,
    handleStartFullscreen,
    isFullscreen,
  ]);

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

    function handleWindowBlur() {
      if (!document.hidden) {
        logAntiCheatEvent({
          type: ANTI_CHEAT_EVENT_TYPES.windowBlur,
          description: "Hệ thống ghi nhận cửa sổ làm bài bị mất focus.",
        });
      }
    }

    function handleClipboardEvent(event) {
      logAntiCheatEvent({
        type: ANTI_CHEAT_EVENT_TYPES.copyPaste,
        description:
          "Hệ thống ghi nhận thao tác copy / cut / paste trong lúc làm bài.",
        metadata: JSON.stringify({ eventType: event.type }),
      });
    }

    function handleBeforeUnload() {
      postKeepAliveLog({
        examAttemptId: Number(attemptRef.current?.id) || 0,
        type: ANTI_CHEAT_EVENT_TYPES.pageReload,
        description:
          "Hệ thống ghi nhận trang làm bài bị tải lại hoặc đóng đột ngột.",
      });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("copy", handleClipboardEvent);
    document.addEventListener("cut", handleClipboardEvent);
    document.addEventListener("paste", handleClipboardEvent);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("copy", handleClipboardEvent);
      document.removeEventListener("cut", handleClipboardEvent);
      document.removeEventListener("paste", handleClipboardEvent);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    attempt?.status,
    exam?.enableAntiCheat,
    logAntiCheatEvent,
    postKeepAliveLog,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-sunken px-4 py-6 md:px-6 lg:px-8">
        <div className="eg-feedback-panel mx-auto max-w-[1280px]">
          Đang tải phòng làm bài...
        </div>
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="min-h-screen bg-surface-sunken px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <EmptyState
            title="Không thể mở phòng làm bài."
            description={loadErrorMessage}
            action={
              <Link
                className="eg-button eg-button-primary"
                to={getExamListPathByRole(user?.role)}
              >
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_44%),linear-gradient(180deg,#f8fafc_0%,#eef4f7_100%)] px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-secondary">
                  Kết quả bài thi
                </p>
                <h1 className="text-[2.2rem] font-semibold leading-tight tracking-tight text-primary md:text-[2.7rem]">
                  {exam.title}
                </h1>
                <p className="text-sm text-secondary">
                  Bài làm đã được ghi nhận lúc{" "}
                  {attempt.submittedAt
                    ? formatShortDateTime(attempt.submittedAt)
                    : "--"}
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Đã nộp bài</Badge>
                <Badge variant={suspicionMeta.variant}>
                  {suspicionMeta.label}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                <p className="text-[0.82rem] font-medium text-secondary">
                  Điểm
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">
                  {typeof result?.attempt?.score === "number"
                    ? result.attempt.score
                    : "--"}
                </p>
              </div>
              <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                <p className="text-[0.82rem] font-medium text-secondary">
                  Đã trả lời
                </p>
                <p className="mt-3 text-lg font-semibold text-primary">
                  {answeredQuestionCount}/{questions.length} câu
                </p>
              </div>
              <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                <p className="text-[0.82rem] font-medium text-secondary">
                  Điểm nghi ngờ
                </p>
                <p className="mt-3 text-lg font-semibold text-primary">
                  {attempt.suspicionScore}
                </p>
              </div>
              <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                <p className="text-[0.82rem] font-medium text-secondary">
                  Hiển thị kết quả
                </p>
                <p className="mt-3 text-lg font-semibold text-primary">
                  {exam.settings.showResultAfterSubmit ? "Đang bật" : "Đang ẩn"}
                </p>
              </div>
            </div>
          </Card>

          {orderedResultQuestions.length > 0 ? (
            <div className="space-y-4">
              {orderedResultQuestions.map((questionResult, index) => (
                <Card key={questionResult.questionId} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          questionResult.isCorrect ? "success" : "caution"
                        }
                      >
                        {questionResult.isCorrect
                          ? "Đạt điểm tối đa"
                          : "Cần xem lại"}
                      </Badge>
                      <Badge variant="neutral">
                        Câu {index + 1} • {questionResult.earnedScore}/
                        {questionResult.score} điểm
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary">
                      {formatResultAnswerSummary(questionResult)}
                    </p>
                  </div>

                  <p className="text-sm leading-7 text-primary">
                    {questionResult.content}
                  </p>

                  <div className="rounded-[18px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-secondary">
                    {formatResultAnswerSummary(questionResult)}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="space-y-3 text-sm leading-6 text-secondary">
              <Badge
                variant={
                  exam.settings.showResultAfterSubmit ? "info" : "neutral"
                }
              >
                {exam.settings.showResultAfterSubmit
                  ? "Đã ghi nhận điểm"
                  : "Chi tiết đáp án đang ẩn"}
              </Badge>
              <p>
                {exam.settings.showResultAfterSubmit
                  ? "Hệ thống đã chấm bài xong, nhưng hiện chưa có chi tiết câu hỏi để hiển thị thêm."
                  : "Giảng viên đã tắt chế độ hiển thị chi tiết kết quả sau khi nộp bài."}
              </p>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              className="eg-button eg-button-primary"
              to={getExamListPathByRole(user?.role)}
            >
              Danh sách đề thi
            </Link>
            <Link
              className="eg-button eg-button-secondary"
              to={buildExamDetailPathByRole(user?.role, exam.id)}
            >
              Quay lại chi tiết đề
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.08),_transparent_44%),linear-gradient(180deg,#f8fafc_0%,#eef4f7_100%)] pb-24">
      <div className="sticky top-0 z-30 border-b border-border bg-surface/92 backdrop-blur">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={timeBadgeVariant}>
                {formatRemainingDuration(remainingTimeMs)}
              </Badge>
              <Badge variant={isOnline ? "success" : "danger"}>
                {isOnline ? "Đang kết nối" : "Đang mất kết nối"}
              </Badge>
              <Badge variant={saveState.status === "error" ? "danger" : "info"}>
                {formatSaveBanner(saveState)}
              </Badge>
              {exam.enableAntiCheat ? (
                <Badge variant={suspicionMeta.variant}>
                  {suspicionMeta.label}
                </Badge>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-[2rem]">
                {exam.title}
              </h1>
              <p className="text-sm text-secondary">
                Câu {currentQuestionIndex + 1}/{questions.length} • Đã trả lời{" "}
                {answeredQuestionCount}/{questions.length} câu • Bắt đầu{" "}
                {formatShortDateTime(attempt.startedAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {exam.settings.requireFullscreen ? (
              <Button
                onClick={() => handleStartFullscreen()}
                variant="secondary"
              >
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
        <div className="relative">
          {proctoringEnabled ? (
            <ExamWatermark attemptId={attempt.id} examId={exam.id} />
          ) : null}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {lastWarning ? (
              <Card className="space-y-3 border-caution/28 bg-caution-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={latestWarningMeta.variant}>
                    {latestWarningMeta.label}
                  </Badge>
                  <span className="text-sm text-secondary">
                    {formatShortDateTime(lastWarning.occurredAt)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-secondary">
                  {lastWarning.description}
                </p>
              </Card>
            ) : null}

            {currentQuestion ? (
              <Card className="space-y-6 border-white/70 bg-white/92 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.45)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">
                        Câu {currentQuestionIndex + 1}
                      </Badge>
                      <Badge variant="neutral">
                        {getQuestionTypeLabel(currentQuestion.questionType)}
                      </Badge>
                      <Badge variant="neutral">
                        {currentQuestion.score} điểm
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {getQuestionSelectionHint(currentQuestion.questionType)}
                      </p>
                      <h2 className="mt-3 text-xl font-semibold leading-8 text-primary md:text-[1.55rem]">
                        {currentQuestion.content}
                      </h2>
                    </div>
                  </div>

                  <Button
                    className="xl:hidden"
                    onClick={() => setIsQuestionSheetOpen(true)}
                    variant="ghost"
                  >
                    Danh sách câu hỏi
                  </Button>
                </div>

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
                      className="min-h-44"
                      id={`question-${currentQuestion.id}-text`}
                      placeholder="Nhập câu trả lời của bạn"
                      value={
                        answersByQuestionId[currentQuestion.id]?.textAnswer ??
                        ""
                      }
                      onChange={(event) =>
                        handleShortAnswerChange(
                          currentQuestion.id,
                          event.target.value,
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer, index) => {
                      const isChecked =
                        answersByQuestionId[
                          currentQuestion.id
                        ]?.answerIds?.includes(answer.id) ?? false;
                      const isSingleSelect =
                        currentQuestion.questionType === "SingleChoice" ||
                        currentQuestion.questionType === "TrueFalse";

                      return (
                        <label
                          key={answer.id}
                          className={`flex cursor-pointer items-start gap-4 rounded-[20px] border px-4 py-4 transition-colors duration-200 ${
                            isChecked
                              ? "border-tertiary bg-info-muted shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]"
                              : "border-border bg-surface hover:bg-surface-sunken"
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
                                ? handleSelectSingleAnswer(
                                    currentQuestion.id,
                                    answer.id,
                                  )
                                : handleToggleMultipleAnswer(
                                    currentQuestion.id,
                                    answer.id,
                                  )
                            }
                          />

                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-primary">
                              {getAnswerChoiceLabel(index)}
                            </span>
                            <p className="text-sm leading-7 text-primary">
                              {answer.content}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Button
                    disabled={currentQuestionIndex === 0}
                    onClick={() =>
                      setCurrentQuestionIndex(
                        (previousValue) => previousValue - 1,
                      )
                    }
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
                      Điều hướng câu
                    </Button>
                    <Button
                      disabled={currentQuestionIndex === questions.length - 1}
                      onClick={() =>
                        setCurrentQuestionIndex(
                          (previousValue) => previousValue + 1,
                        )
                      }
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
            <Card className="sticky top-24 space-y-5 border-white/70 bg-white/92 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.45)]">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-primary">
                  Tổng quan phiên làm bài
                </h2>
                <p className="text-sm text-secondary">
                  Theo đúng cấu hình mà giảng viên đã đặt.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">
                    Đã trả lời
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-primary">
                    {answeredQuestionCount}/{questions.length}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border bg-surface-sunken p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">
                    Còn lại
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-primary">
                    {questions.length - answeredQuestionCount}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-[18px] border border-border bg-surface-sunken p-4 text-sm text-secondary">
                <p>
                  <span className="font-semibold text-primary">
                    Thời gian còn lại:
                  </span>{" "}
                  {formatRemainingDuration(remainingTimeMs)}
                </p>
                <p>
                  <span className="font-semibold text-primary">
                    Chưa trả lời:
                  </span>{" "}
                  {unansweredQuestionIndexes.length > 0
                    ? unansweredQuestionIndexes.join(", ")
                    : "Không có"}
                </p>
                {/* {exam.enableAntiCheat ? (
                  <p>
                    <span className="font-semibold text-primary">Mức nghi ngờ:</span>{" "}
                    {attempt.suspicionScore}
                  </p>
                ) : null} */}
              </div>

              {/* <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-secondary">
                  Cấu hình đang áp dụng
                </h3>
                <div className="grid gap-3">
                  {attemptSettingItems.map((item) => (
                    <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-secondary">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div> */}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-primary">
                    Danh sách câu hỏi
                  </h3>
                  <span className="text-sm text-secondary">
                    {questions.length} câu
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-3">
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
                              : "border-border bg-surface text-secondary hover:bg-surface-sunken"
                        }`}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => setIsConfirmingSubmit(true)}
              >
                {isSubmitting ? "Đang nộp..." : "Nộp bài ngay"}
              </Button>
            </Card>
          </aside>
        </div>
        </div>
      </div>

      {proctoringEnabled ? (
        <div className="fixed bottom-4 right-4 z-40 w-[240px] rounded-[16px] border border-border bg-surface p-3 shadow-lg">
          <CameraPreview
            errorMessage=""
            label="Camera giám sát"
            status={cameraStatus}
            videoRef={videoRef}
          />
        </div>
      ) : null}

      {exam.settings.requireFullscreen && !isFullscreen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/58 px-4">
          <div className="w-full max-w-[560px] rounded-[28px] border border-caution/25 bg-surface p-6 shadow-[0_36px_90px_-45px_rgba(15,23,42,0.75)]">
            <div className="space-y-4">
              <Badge variant="caution">Yêu cầu toàn màn hình</Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-primary">
                Bật toàn màn hình để tiếp tục làm bài
              </h2>
              <p className="text-sm leading-6 text-secondary">
                Đề thi này được giảng viên cấu hình bắt buộc toàn màn hình. Nếu
                thoát khỏi chế độ này trong lúc làm bài, hệ thống có thể ghi
                nhận sự kiện anti-cheat.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button onClick={() => handleStartFullscreen()}>
                Bật toàn màn hình
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Điều hướng câu hỏi
                </h2>
                <p className="text-sm text-secondary">
                  Đã trả lời {answeredQuestionCount}/{questions.length} câu
                </p>
              </div>
              <Button
                onClick={() => setIsQuestionSheetOpen(false)}
                variant="ghost"
              >
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
                          : "border-border bg-surface text-secondary"
                    }`}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setIsQuestionSheetOpen(false);
                    }}
                  >
                    {index + 1}
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
              <h2 className="text-2xl font-semibold tracking-tight text-primary">
                Xác nhận nộp bài
              </h2>
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
              <Button
                disabled={isSubmitting}
                onClick={() => handleSubmitAttempt()}
              >
                {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
