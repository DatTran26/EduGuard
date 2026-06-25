import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { proctoringApi } from "../../../api/proctoringApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { routeConfig } from "../../../routes/routeConfig";
import AttemptProctorDrawer from "../components/AttemptProctorDrawer";
import CoProctorPanel from "../components/CoProctorPanel";
import ProctoringReasonDialog from "../components/ProctoringReasonDialog";
import StudentCameraGrid from "../components/StudentCameraGrid";
import { useTeacherClipRecorder } from "../hooks/useTeacherClipRecorder";
import { useTeacherWebRtcViewer } from "../hooks/useTeacherWebRtcViewer";

function sortStudents(students = []) {
  const priority = { Critical: 0, Warning: 1, Watch: 2, Normal: 3 };
  return [...students].sort((a, b) => {
    const riskDiff = (priority[a.riskLevel] ?? 9) - (priority[b.riskLevel] ?? 9);
    if (riskDiff !== 0) {
      return riskDiff;
    }
    return (b.suspicionScore ?? 0) - (a.suspicionScore ?? 0);
  });
}

export default function TeacherProctoringRoomPage() {
  const { examId } = useParams();
  const { showToast } = useToast();
  const [room, setRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reasonText, setReasonText] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const liveVideoRef = useRef(null);

  const sortedStudents = useMemo(() => sortStudents(students), [students]);
  const activeAttemptId = selectedStudent?.attemptId ?? null;

  const { remoteStream, remoteStatus, requestWatch, stopWatch } = useTeacherWebRtcViewer({
    attemptId: activeAttemptId,
    enabled: Boolean(activeAttemptId),
    enableAudio: isAudioEnabled,
    videoRef: liveVideoRef,
  });

  const {
    elapsedSeconds: clipElapsedSeconds,
    isRecording: isClipRecording,
    startRecording: startClipRecording,
    stopRecording: stopClipRecording,
  } = useTeacherClipRecorder({
    stream: remoteStream,
    maxSeconds: 30,
  });

  const refreshRoom = useCallback(async () => {
    const [roomResponse, statesResponse] = await Promise.all([
      proctoringApi.getRoom(examId),
      proctoringApi.getStates(examId),
    ]);
    setRoom(roomResponse.data);
    setStudents(statesResponse.data);
  }, [examId]);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function load() {
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

    let isMounted = true;
    proctoringApi
      .getAttemptDetail(selectedStudent.attemptId)
      .then((response) => {
        if (isMounted) {
          setDetail(response.data);
        }
      })
      .catch(() => {});

    requestWatch().catch((error) => {
      showToast({
        tone: "danger",
        title: "Không thể xem live",
        message: error.message,
      });
    });

    return () => {
      isMounted = false;
      stopWatch().catch(() => {});
    };
  }, [requestWatch, selectedStudent?.attemptId, showToast, stopWatch]);

  function handleCloseDrawer() {
    stopWatch().catch(() => {});
    setSelectedStudent(null);
    setDetail(null);
  }

  async function handleRequestWatch(student) {
    setSelectedStudent(student);
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
    if (!video || remoteStatus !== "connected" || !selectedStudent?.attemptId) {
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
    if (remoteStatus !== "connected") {
      return;
    }
    const started = startClipRecording();
    if (!started) {
      showToast({ tone: "danger", title: "Không thể bắt đầu ghi clip" });
    }
  }

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
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button as={Link} to={routeConfig.teacherMonitoring} variant="secondary">
            Về giám sát
          </Button>
        }
        description="Live camera là trung tâm. Tile rủi ro cao được ưu tiên lên đầu."
        eyebrow="Phòng giám sát bài thi"
        title={room?.examTitle ?? "Phòng giám sát"}
      />

      <Card className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Đang làm" value={room?.inProgressCount ?? 0} />
        <Metric label="Live" value={room?.liveSessionCount ?? 0} />
        <Metric label="Tạm dừng" value={room?.pausedCount ?? 0} />
        <Metric label="Đã nộp" value={room?.submittedCount ?? 0} />
        <Metric label="Slot live" value={room?.maxActiveLiveTiles ?? 9} />
      </Card>

      <CoProctorPanel examId={examId} />

      <StudentCameraGrid
        activeAttemptId={activeAttemptId}
        onRequestWatch={handleRequestWatch}
        onSelectStudent={setSelectedStudent}
        remoteStatus={remoteStatus}
        remoteStream={remoteStream}
        students={sortedStudents}
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
        remoteStatus={remoteStatus}
        student={selectedStudent}
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

function Metric({ label, value }) {
  return (
    <div className="rounded-[12px] border border-border bg-neutral px-4 py-3">
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}
