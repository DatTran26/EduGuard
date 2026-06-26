import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useToast } from "../../../hooks/useToast";
import {
  buildStudentDeviceCheckPath,
  buildStudentExamAttemptPath,
  buildStudentExamDetailPath,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import CameraPreview from "../components/CameraPreview";
import ExamLobbyCountdown from "../components/ExamLobbyCountdown";
import MediaStreamControls from "../components/MediaStreamControls";
import { useCameraStream } from "../hooks/useCameraStream";
import {
  isProctoringRequired,
  requiresProctoringCamera,
  requiresProctoringMicrophone,
} from "../utils/proctoringRouting";

function LobbyRequirementNote({ requireCamera, requireMicrophone, isCameraOn, isMicOn }) {
  if (!requireCamera && !requireMicrophone) {
    return null;
  }

  const messages = [];
  if (requireCamera && !isCameraOn) {
    messages.push("Bật camera trước giờ mở đề.");
  }
  if (requireMicrophone && !isMicOn) {
    messages.push("Bật micro trước giờ mở đề.");
  }

  const requirementParts = [];
  if (requireCamera) {
    requirementParts.push("camera");
  }
  if (requireMicrophone) {
    requirementParts.push("micro");
  }

  return (
    <div
      className="rounded-[var(--radius-md)] border border-danger/35 bg-danger-muted px-4 py-3 text-sm leading-6 text-danger"
      role="alert"
    >
      <p className="font-semibold">
        Bắt buộc: Đề thi này yêu cầu bật {requirementParts.join(" và ")}.
      </p>
      {messages.length > 0 ? <p className="mt-1">{messages.join(" ")}</p> : null}
    </div>
  );
}

export default function ExamLobbyPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [exam, setExam] = useState(null);
  const [lobbyStatus, setLobbyStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const requireCamera = useMemo(
    () => requiresProctoringCamera(exam) || Boolean(lobbyStatus?.requireCamera),
    [exam, lobbyStatus?.requireCamera],
  );
  const requireMicrophone = requiresProctoringMicrophone(exam);
  const needsDeviceCheck = isProctoringRequired(exam);

  const {
    videoRef,
    status: cameraStatus,
    micStatus,
    errorMessage,
    isCameraOn,
    isMicOn,
    isReady,
    startStream,
    toggleCamera,
    toggleMicrophone,
  } = useCameraStream({
    audio: true,
    enabled: true,
  });

  const cameraReadyForLobby = requireCamera && isCameraOn;

  useEffect(() => {
    let isMounted = true;

    async function loadExam() {
      setIsLoading(true);
      try {
        const response = await examApi.getById(examId);
        if (isMounted) {
          setExam(response.data);
        }
      } catch (error) {
        showToast({
          tone: "danger",
          title: "Không tải được đề thi",
          message: error.message || "Không thể mở phòng chờ.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExam();
    return () => {
      isMounted = false;
    };
  }, [examId, showToast]);

  useEffect(() => {
    if (!examId) {
      return undefined;
    }

    let isMounted = true;

    async function refreshLobby() {
      try {
        const response = await proctoringApi.getLobbyStatus(examId);
        if (!isMounted) {
          return;
        }

        setLobbyStatus(response.data);

        if (response.data.isOpen) {
          if (exam && needsDeviceCheck) {
            navigate(buildStudentDeviceCheckPath(examId), { replace: true });
          } else if (exam) {
            const startResponse = await examAttemptApi.start(examId);
            navigate(buildStudentExamAttemptPath(startResponse.data.attempt.id), { replace: true });
          }
          return;
        }

        if (cameraReadyForLobby) {
          await proctoringApi.heartbeatLobby(examId, true);
        } else {
          await proctoringApi.joinLobby(examId, false);
        }
      } catch (error) {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Phòng chờ lỗi",
            message: error.message || "Không thể cập nhật phòng chờ.",
          });
        }
      }
    }

    refreshLobby();
    const intervalId = window.setInterval(refreshLobby, 5000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      proctoringApi.leaveLobby(examId).catch(() => {});
    };
  }, [cameraReadyForLobby, exam, examId, navigate, needsDeviceCheck, showToast]);

  useEffect(() => {
    if (!examId || !cameraReadyForLobby) {
      return;
    }

    proctoringApi.joinLobby(examId, true).catch(() => {});
  }, [cameraReadyForLobby, examId]);

  const examTitle = exam?.title ?? lobbyStatus?.examTitle ?? "Phòng chờ bài thi";
  const openTimeLabel = lobbyStatus?.startTime ? formatShortDateTime(lobbyStatus.startTime) : null;
  const micToggleAvailable = micStatus !== "not-required" && micStatus !== "unsupported";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card className="p-6 text-center text-sm text-secondary">Đang tải phòng chờ…</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-secondary">Phòng chờ</p>
        <Button as={Link} className="text-sm" to={buildStudentExamDetailPath(examId)} variant="ghost">
          Quay lại
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold leading-snug text-primary sm:text-2xl">{examTitle}</h1>
          {openTimeLabel ? (
            <p className="text-sm text-secondary">Mở đề lúc {openTimeLabel}</p>
          ) : null}
        </div>

        <ExamLobbyCountdown secondsUntilOpen={lobbyStatus?.secondsUntilOpen ?? 0} />

        <LobbyRequirementNote
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          requireCamera={requireCamera}
          requireMicrophone={requireMicrophone}
        />

        <Card className="space-y-4 p-5">
          <CameraPreview
            errorMessage={errorMessage}
            label="Camera phòng chờ"
            status={cameraStatus}
            videoRef={videoRef}
          />

          <MediaStreamControls
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            onToggleCamera={toggleCamera}
            onToggleMicrophone={toggleMicrophone}
            showMicrophone={micToggleAvailable}
          />

          {!isReady && cameraStatus !== "off" ? (
            <Button className="w-full" onClick={startStream} type="button" variant="secondary">
              Thử bật lại thiết bị
            </Button>
          ) : null}
        </Card>

        <p className="text-center text-sm leading-6 text-secondary">
          {cameraReadyForLobby
            ? "Thiết bị đã sẵn sàng. Hệ thống sẽ tự chuyển bạn khi đến giờ mở đề."
            : "Giữ tab này mở. Khi đến giờ, hệ thống sẽ tự chuyển bạn" +
              (needsDeviceCheck ? " sang kiểm tra thiết bị" : " vào làm bài") +
              "."}
        </p>
      </div>
    </div>
  );
}
