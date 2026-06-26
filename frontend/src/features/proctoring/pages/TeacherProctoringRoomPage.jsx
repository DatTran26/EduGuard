import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import { examApi } from "../../../api/examApi";
import AttemptProctorDrawer from "../components/AttemptProctorDrawer";
import CoProctorDialog from "../components/CoProctorDialog";
import ExamClassReportDialog from "../components/ExamClassReportDialog";
import ProctoringAiAlertFeed from "../components/ProctoringAiAlertFeed";
import ProctoringFilterBar from "../components/ProctoringFilterBar";
import ProctoringReasonDialog from "../components/ProctoringReasonDialog";
import ProctoringRoomHeader from "../components/ProctoringRoomHeader";
import ProctoringStatusBar from "../components/ProctoringStatusBar";
import StudentCameraGrid from "../components/StudentCameraGrid";
import CloseExamDialog from "../../exams/components/CloseExamDialog";
import { useTeacherClipRecorder } from "../hooks/useTeacherClipRecorder";
import { useProctoringHubConnection } from "../hooks/useProctoringHubConnection";
import { useTeacherWebRtcViewer } from "../hooks/useTeacherWebRtcViewer";
import { useTeacherSfuViewer } from "../hooks/useTeacherSfuViewer";
import { useToast } from "../../../hooks/useToast";
import { useParams } from "react-router-dom";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import {
  computeRoomStats,
  filterStudents,
  getProctoringRoomSessionPhase,
  isProctoringRoomSessionLive,
  sortStudentsByRisk,
} from "../utils/proctoringRoomHelpers";
import { canWatchStudentLive } from "../utils/proctoringStudentStatus";
import { devLog } from "../../../utils/devLogger";
import { normalizeAiDetectionEvent } from "../utils/proctoringAiHelpers";
import { normalizeAntiCheatEventType } from "../../anti-cheat/antiCheatHelpers";

export default function TeacherProctoringRoomPage() {
  const { examId } = useParams();
  const { showToast } = useToast();
  const [room, setRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reasonText, setReasonText] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("auto");
  const [isCoProctorOpen, setIsCoProctorOpen] = useState(false);
  const [isRoomLoading, setIsRoomLoading] = useState(true);
  const [isDrawerDismissed, setIsDrawerDismissed] = useState(false);
  const [isCloseExamDialogOpen, setIsCloseExamDialogOpen] = useState(false);
  const [isClosingExam, setIsClosingExam] = useState(false);
  const [isClassReportOpen, setIsClassReportOpen] = useState(false);
  const [reportRefreshToken, setReportRefreshToken] = useState(0);
  const [aiEvents, setAiEvents] = useState([]);
  const [violationEvents, setViolationEvents] = useState([]);
  const liveVideoRef = useRef(null);
  const requestWatchRef = useRef(null);
  const stopWatchRef = useRef(null);

  const activeAttemptId = selectedStudent?.attemptId ?? null;
  const sessionPhase = useMemo(() => getProctoringRoomSessionPhase(room), [room]);
  const sessionLive = useMemo(() => isProctoringRoomSessionLive(room), [room]);

  const refreshRoom = useCallback(async () => {
    const [roomResponse, statesResponse] = await Promise.all([
      proctoringApi.getRoom(examId),
      proctoringApi.getStates(examId),
    ]);
    setRoom(roomResponse.data);
    setStudents(statesResponse.data);
  }, [examId]);

  const handleRoomHubEvent = useCallback(
    (eventName, payload) => {
      if (eventName === EXAM_MONITORING_EVENTS.receiveAiDetection) {
        const event = normalizeAiDetectionEvent(payload);
        devLog.proctoring("AI detection result", event);
        setAiEvents((previous) => [event, ...previous].slice(0, 80));
        if (event.isFlagged) {
          showToast({
            tone: "danger",
            title: `AI: ${event.studentName}`,
            message: `${event.detectionType} (${Math.round(event.confidence * 100)}%)`,
          });
        }
        refreshRoom().catch(() => {});
        setReportRefreshToken((value) => value + 1);
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.receiveAntiCheatWarning) {
        const warning = {
          id: Number(payload?.logId) || Date.now(),
          examAttemptId: Number(payload?.examAttemptId) || 0,
          studentName: payload?.studentName ?? "",
          type: normalizeAntiCheatEventType(payload?.type),
          description: payload?.description ?? "",
          occurredAt: payload?.occurredAt ?? new Date().toISOString(),
        };
        setViolationEvents((previous) => [warning, ...previous].slice(0, 80));
        refreshRoom().catch(() => {});
        setReportRefreshToken((value) => value + 1);
        return;
      }

      if (
        eventName === EXAM_MONITORING_EVENTS.studentJoinedExamLate ||
        eventName === EXAM_MONITORING_EVENTS.liveStreamConnected ||
        eventName === EXAM_MONITORING_EVENTS.liveStreamStopped ||
        eventName === EXAM_MONITORING_EVENTS.liveStreamFailed ||
        eventName === EXAM_MONITORING_EVENTS.receiveProctoringWarning
      ) {
        refreshRoom().catch(() => {});
        setReportRefreshToken((value) => value + 1);
      }
    },
    [refreshRoom, showToast],
  );

  const roomHub = useProctoringHubConnection({
    enabled: Boolean(examId) && sessionLive !== false,
    onEvent: handleRoomHubEvent,
  });
  const { isConnected: isRoomHubConnected, invoke: invokeRoomHub } = roomHub;

  useEffect(() => {
    if (!isRoomHubConnected || !examId) {
      return undefined;
    }

    let isMounted = true;
    invokeRoomHub(EXAM_MONITORING_METHODS.joinExam, Number(examId)).catch(() => {
      if (isMounted) {
        showToast({
          tone: "danger",
          title: "Không kết nối được realtime",
          message: "Thử làm mới trang hoặc kiểm tra backend SignalR.",
        });
      }
    });

    return () => {
      isMounted = false;
      invokeRoomHub(EXAM_MONITORING_METHODS.leaveExam, Number(examId)).catch(() => {});
    };
  }, [examId, invokeRoomHub, isRoomHubConnected, showToast]);

  const maxActiveLiveTiles = room?.maxActiveLiveTiles ?? 9;

  const {
    sfuEnabled,
    connectionStatus: sfuConnectionStatus,
    getStreamForAttempt,
    getStatusForAttempt,
    activeRemoteStream,
  } = useTeacherSfuViewer({
    examId: Number(examId),
    enabled: Boolean(examId) && sessionLive !== false,
    enableAudio: isAudioEnabled,
    maxTiles: maxActiveLiveTiles,
  });

  const { remoteStream, remoteStatus, requestWatch, stopWatch } = useTeacherWebRtcViewer({
    attemptId: activeAttemptId,
    enabled: Boolean(activeAttemptId) && !sfuEnabled,
    enableAudio: isAudioEnabled,
    sharedHub: roomHub,
    videoRef: liveVideoRef,
  });

  useEffect(() => {
    requestWatchRef.current = requestWatch;
    stopWatchRef.current = stopWatch;
  }, [requestWatch, stopWatch]);

  const selectedRemoteStream = sfuEnabled
    ? activeRemoteStream(activeAttemptId)
    : remoteStream;
  const selectedRemoteStatus = sfuEnabled
    ? getStatusForAttempt(activeAttemptId)
    : remoteStatus;

  useEffect(() => {
    if (!sfuEnabled || !liveVideoRef.current) {
      return;
    }
    if (selectedRemoteStream && selectedRemoteStatus === "connected") {
      liveVideoRef.current.srcObject = selectedRemoteStream;
      liveVideoRef.current.play().catch(() => {});
      return;
    }
    liveVideoRef.current.srcObject = null;
  }, [selectedRemoteStatus, selectedRemoteStream, sfuEnabled]);

  const {
    elapsedSeconds: clipElapsedSeconds,
    isRecording: isClipRecording,
    startRecording: startClipRecording,
    stopRecording: stopClipRecording,
  } = useTeacherClipRecorder({
    stream: selectedRemoteStream,
    maxSeconds: 30,
  });

  useEffect(() => {
    const previousTitle = document.title;
    const title = room?.examTitle
      ? `Giám sát · ${room.examTitle} · EduGuard`
      : "Phòng giám sát · EduGuard";
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [room?.examTitle]);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function load() {
      setIsRoomLoading(true);
      try {
        await refreshRoom();
      } catch (error) {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được phòng giám sát",
            message: error.message,
          });
        }
      } finally {
        if (isMounted) {
          setIsRoomLoading(false);
        }
      }
    }

    load();
    intervalId = window.setInterval(() => {
      refreshRoom().catch(() => {});
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [examId, refreshRoom, showToast]);

  useEffect(() => {
    if (!selectedStudent?.attemptId) {
      return undefined;
    }

    const attemptId = selectedStudent.attemptId;
    let isMounted = true;
    proctoringApi
      .getAttemptDetail(attemptId)
      .then((response) => {
        if (isMounted) {
          setDetail(response.data);
        }
      })
      .catch(() => {});

    if (isRoomHubConnected && canWatchStudentLive(selectedStudent)) {
      requestWatchRef.current?.().catch((error) => {
        showToast({
          tone: "danger",
          title: "Không thể xem live",
          message: error.message,
        });
      });
    }

    return () => {
      isMounted = false;
      stopWatchRef.current?.().catch(() => {});
    };
  }, [isRoomHubConnected, selectedStudent?.attemptId, showToast]);

  useEffect(() => {
    if (!isRoomHubConnected || isRoomLoading || selectedStudent || students.length === 0 || isDrawerDismissed) {
      return;
    }

    const firstWatchable = students.find((student) => canWatchStudentLive(student));
    if (firstWatchable) {
      setSelectedStudent(firstWatchable);
    }
  }, [isDrawerDismissed, isRoomHubConnected, isRoomLoading, selectedStudent, students]);

  const sortedStudents = useMemo(() => sortStudentsByRisk(students), [students]);
  const filteredStudents = useMemo(
    () => filterStudents(sortedStudents, activeFilter),
    [activeFilter, sortedStudents],
  );
  const roomStats = useMemo(() => computeRoomStats(students, room), [room, students]);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    try {
      await refreshRoom();
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Làm mới thất bại",
        message: error.message,
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleCloseDrawer() {
    stopWatch().catch(() => {});
    setSelectedStudent(null);
    setDetail(null);
    setIsDrawerDismissed(true);
  }

  function handleSelectStudentFromFeed(attemptId) {
    const matchedStudent = students.find((student) => student.attemptId === attemptId);
    if (matchedStudent) {
      handleSelectStudent(matchedStudent);
    }
  }

  function handleSelectStudent(student) {
    setIsDrawerDismissed(false);
    setSelectedStudent(student);
  }

  async function handleRequestWatch(student) {
    setIsDrawerDismissed(false);
    const isSameStudent = selectedStudent?.attemptId === student.attemptId;
    setSelectedStudent(student);

    if (isRoomHubConnected && canWatchStudentLive(student) && isSameStudent) {
      try {
        await requestWatch();
      } catch (error) {
        showToast({
          tone: "danger",
          title: "Không thể xem live",
          message: error.message,
        });
      }
    }
  }

  function openReasonDialog(type, student) {
    setReasonDialog({ type, student });
    setReasonText("");
  }

  async function confirmReasonDialog() {
    if (!reasonDialog?.student || !reasonText.trim()) {
      return;
    }

    const { type, student } = reasonDialog;
    setIsActionSubmitting(true);
    try {
      if (type === "pause") {
        await proctoringApi.pauseAttempt(student.attemptId, reasonText.trim());
        showToast({ tone: "success", title: "Đã tạm dừng bài làm" });
      } else if (type === "warn") {
        await proctoringApi.warnStudent(student.attemptId, reasonText.trim());
        showToast({ tone: "success", title: "Đã gửi nhắc nhở" });
      } else if (type === "terminate") {
        await proctoringApi.terminateAttempt(student.attemptId, reasonText.trim());
        setSelectedStudent(null);
        showToast({ tone: "success", title: "Đã kết thúc bài làm" });
      }
      setReasonDialog(null);
      await refreshRoom();
    } catch (error) {
      showToast({ tone: "danger", title: "Thao tác thất bại", message: error.message });
    } finally {
      setIsActionSubmitting(false);
    }
  }

  async function handlePause(student) {
    openReasonDialog("pause", student);
  }

  async function handleResume(student) {
    try {
      await proctoringApi.resumeAttempt(student.attemptId, "Giáo viên cho tiếp tục làm bài");
      await refreshRoom();
      showToast({ tone: "success", title: "Đã cho tiếp tục làm bài" });
    } catch (error) {
      showToast({ tone: "danger", title: "Tiếp tục thất bại", message: error.message });
    }
  }

  async function handleWarn(student) {
    openReasonDialog("warn", student);
  }

  async function handleTerminate(student) {
    openReasonDialog("terminate", student);
  }

  async function handleSnapshot() {
    const video = liveVideoRef.current;
    if (!video || selectedRemoteStatus !== "connected" || !selectedStudent?.attemptId) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      showToast({ tone: "danger", title: "Không chụp được ảnh" });
      return;
    }

    try {
      const file = new File([blob], `snapshot-${selectedStudent.attemptId}.jpg`, { type: "image/jpeg" });
      const response = await proctoringApi.uploadEvidence(selectedStudent.attemptId, file);
      const detailResponse = await proctoringApi.getAttemptDetail(selectedStudent.attemptId);
      setDetail(detailResponse.data);
      showToast({ tone: "success", title: "Đã lưu ảnh chụp", message: response.data?.fileUrl });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu ảnh thất bại", message: error.message });
    }
  }

  async function handleStartClip() {
    if (selectedRemoteStatus !== "connected") {
      return;
    }
    const started = startClipRecording();
    if (!started) {
      showToast({ tone: "danger", title: "Không thể bắt đầu ghi clip" });
    }
  }

  async function handleCloseExam() {
    setIsClosingExam(true);
    try {
      const response = await examApi.closeEarly(examId);
      setRoom((previous) =>
        previous
          ? {
              ...previous,
              endTime: response.data?.endTime ?? previous.endTime,
            }
          : previous,
      );
      setIsCloseExamDialogOpen(false);
      showToast({ tone: "success", title: "Đã đóng bài thi" });
      await refreshRoom();
    } catch (error) {
      showToast({ tone: "danger", title: "Đóng bài thi thất bại", message: error.message });
    } finally {
      setIsClosingExam(false);
    }
  }

  const canCloseExam = sessionLive !== false;

  async function handleStopClip() {
    if (!selectedStudent?.attemptId) {
      return;
    }

    const blob = await stopClipRecording();
    if (!blob) {
      showToast({ tone: "danger", title: "Clip trống hoặc quá ngắn" });
      return;
    }

    try {
      const file = new File([blob], `clip-${selectedStudent.attemptId}.webm`, { type: blob.type || "video/webm" });
      await proctoringApi.uploadEvidence(selectedStudent.attemptId, file, {
        evidenceType: "Clip",
        captureSource: "TeacherManual",
        triggerEventType: "ManualClip",
      });
      const detailResponse = await proctoringApi.getAttemptDetail(selectedStudent.attemptId);
      setDetail(detailResponse.data);
      showToast({ tone: "success", title: "Đã lưu clip giám sát" });
    } catch (error) {
      showToast({ tone: "danger", title: "Lưu clip thất bại", message: error.message });
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ProctoringRoomHeader
        canCloseExam={canCloseExam}
        examTitle={room?.examTitle}
        isHubConnected={isRoomHubConnected}
        isRoomLoading={isRoomLoading}
        isRefreshing={isRefreshing}
        onCloseExam={() => setIsCloseExamDialogOpen(true)}
        onRefresh={handleManualRefresh}
        onOpenCoProctor={() => setIsCoProctorOpen(true)}
        onOpenClassReport={() => setIsClassReportOpen(true)}
        room={room}
        sessionLive={sessionLive}
        sessionPhase={sessionPhase}
      />

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-5 px-4 py-5 md:px-6 md:py-6">
        {room && room.cameraMonitoringEnabled === false ? (
          <div
            className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-50"
            role="alert"
          >
            <p className="font-semibold text-amber-100">Đề thi chưa bật giám sát camera</p>
            <p className="mt-1 text-amber-100/90">
              Đề này chỉ bật anti-cheat. Học sinh không gửi heartbeat camera nên trạng thái luôn hiển thị{" "}
              <strong>Chưa rõ</strong>. Vào chỉnh sửa đề và bật{" "}
              <strong>Phòng giám sát live</strong> hoặc <strong>Giám sát camera trong lúc thi</strong>, rồi yêu
              cầu học sinh tải lại trang làm bài.
            </p>
          </div>
        ) : null}

        <ProctoringStatusBar stats={roomStats} />

        <ProctoringAiAlertFeed
          aiEvents={aiEvents}
          onSelectStudent={handleSelectStudentFromFeed}
          violationEvents={violationEvents}
        />

        <ProctoringFilterBar
          activeFilter={activeFilter}
          activeViewMode={viewMode}
          filteredCount={filteredStudents.length}
          onFilterChange={setActiveFilter}
          onViewModeChange={setViewMode}
          totalCount={students.length}
        />

        <StudentCameraGrid
          activeAttemptId={activeAttemptId}
          getStatusForAttempt={sfuEnabled ? getStatusForAttempt : undefined}
          getStreamForAttempt={sfuEnabled ? getStreamForAttempt : undefined}
          isAudioEnabled={isAudioEnabled}
          onRequestWatch={handleRequestWatch}
          onSelectStudent={handleSelectStudent}
          remoteStatus={selectedRemoteStatus}
          remoteStream={selectedRemoteStream}
          sfuConnectionStatus={sfuEnabled ? sfuConnectionStatus : null}
          sfuEnabled={sfuEnabled}
          students={filteredStudents}
          viewMode={viewMode}
        />
      </div>

      <CoProctorDialog
        examId={examId}
        isOpen={isCoProctorOpen}
        onClose={() => setIsCoProctorOpen(false)}
      />

      <ExamClassReportDialog
        examId={Number(examId)}
        examTitle={room?.examTitle}
        isOpen={isClassReportOpen}
        onClose={() => setIsClassReportOpen(false)}
        refreshToken={reportRefreshToken}
      />

      <AttemptProctorDrawer
        clipElapsedSeconds={clipElapsedSeconds}
        detail={detail}
        isAudioEnabled={isAudioEnabled}
        isClipRecording={isClipRecording}
        liveVideoRef={liveVideoRef}
        onClose={handleCloseDrawer}
        onPause={handlePause}
        onResume={handleResume}
        onSnapshot={handleSnapshot}
        onStartClip={handleStartClip}
        onStopClip={handleStopClip}
        onTerminate={handleTerminate}
        onToggleAudio={() => setIsAudioEnabled((value) => !value)}
        onWarn={handleWarn}
        remoteStatus={selectedRemoteStatus}
        student={selectedStudent}
        variant="room"
        violationRefreshToken={reportRefreshToken}
      />

      <CloseExamDialog
        isOpen={isCloseExamDialogOpen}
        isSubmitting={isClosingExam}
        onCancel={() => setIsCloseExamDialogOpen(false)}
        onConfirm={handleCloseExam}
        variant="room"
      />

      <ProctoringReasonDialog
        confirmLabel={
          reasonDialog?.type === "terminate"
            ? "Kết thúc bài"
            : reasonDialog?.type === "pause"
              ? "Tạm dừng"
              : "Gửi nhắc nhở"
        }
        confirmVariant={reasonDialog?.type === "warn" ? "secondary" : "danger"}
        description={
          reasonDialog?.type === "terminate"
            ? "Học sinh sẽ nộp bài ngay sau khi xác nhận."
            : undefined
        }
        isOpen={Boolean(reasonDialog)}
        isSubmitting={isActionSubmitting}
        onCancel={() => setReasonDialog(null)}
        onConfirm={confirmReasonDialog}
        onReasonChange={setReasonText}
        reason={reasonText}
        title={
          reasonDialog?.type === "terminate"
            ? "Kết thúc bài làm"
            : reasonDialog?.type === "pause"
              ? "Tạm dừng bài làm"
              : "Nhắc nhở học sinh"
        }
      />
    </div>
  );
}
