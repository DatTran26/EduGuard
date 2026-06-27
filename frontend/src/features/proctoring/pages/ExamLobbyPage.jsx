import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiUsers, FiVideo } from "react-icons/fi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { useToast } from "../../../hooks/useToast";
import Skeleton from "../../../components/common/Skeleton";
import {
  buildStudentDeviceCheckPath,
  buildStudentExamAttemptPath,
  buildStudentExamDetailPath,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { cn } from "../../../utils/cn";
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
      className="rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 to-orange-50 px-4 py-3.5 text-sm leading-6 text-rose-700 shadow-sm"
      role="alert"
    >
      <p className="font-semibold">
        Bắt buộc: Đề thi này yêu cầu bật {requirementParts.join(" và ")}.
      </p>
      {messages.length > 0 ? <p className="mt-1 text-rose-600">{messages.join(" ")}</p> : null}
    </div>
  );
}

function StatusPill({ icon: Icon, label, tone = "neutral" }) {
  const toneClasses = {
    success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    caution: "border-amber-200/80 bg-amber-50 text-amber-700",
    neutral: "border-slate-200 bg-white text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        toneClasses[tone] ?? toneClasses.neutral,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
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
  const deviceReady =
    (!requireCamera || isCameraOn) && (!requireMicrophone || isMicOn) && (isReady || cameraStatus === "off");

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
  const startTime = lobbyStatus?.startTime ?? exam?.startTime ?? null;
  const openTimeLabel = startTime ? formatShortDateTime(startTime) : null;
  const waitingCount = lobbyStatus?.waitingStudentCount ?? 0;
  const micToggleAvailable = micStatus !== "not-required" && micStatus !== "unsupported";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 animate-pulse">
        <div className="flex justify-between items-center border-b border-border/60 pb-5">
          <div className="space-y-3 w-1/3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex justify-center py-8">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-gradient-to-b from-sky-50/80 via-slate-50 to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.18),transparent)]"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button
            as={Link}
            className="gap-2 text-sm text-slate-600 hover:bg-white/70"
            to={buildStudentExamDetailPath(examId)}
            variant="ghost"
          >
            <FiArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className="rounded-full border border-sky-200/80 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm backdrop-blur-sm">
            Phòng chờ
          </span>
        </div>

        <div className="space-y-6">
          <header className="space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                {examTitle}
              </h1>
              {openTimeLabel ? (
                <p className="text-sm text-slate-500">
                  Mở đề lúc <span className="font-medium text-slate-700">{openTimeLabel}</span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <StatusPill
                icon={deviceReady ? FiCheckCircle : FiVideo}
                label={deviceReady ? "Thiết bị sẵn sàng" : "Đang chuẩn bị thiết bị"}
                tone={deviceReady ? "success" : "caution"}
              />
              {waitingCount > 0 ? (
                <StatusPill icon={FiUsers} label={`${waitingCount} thí sinh đang chờ`} />
              ) : null}
            </div>
          </header>

          <ExamLobbyCountdown startTime={startTime} />

          <LobbyRequirementNote
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            requireCamera={requireCamera}
            requireMicrophone={requireMicrophone}
          />

          <Card className="overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] backdrop-blur-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">Kiểm tra thiết bị</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Xác nhận camera và micro hoạt động trước giờ mở đề
              </p>
            </div>

            <div className="space-y-4 p-5">
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
            </div>
          </Card>

          <p className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-center text-sm leading-6 text-slate-500 backdrop-blur-sm">
            {cameraReadyForLobby
              ? "Thiết bị đã sẵn sàng. Hệ thống sẽ tự chuyển bạn khi đến giờ mở đề."
              : "Giữ tab này mở. Khi đến giờ, hệ thống sẽ tự chuyển bạn" +
                (needsDeviceCheck ? " sang kiểm tra thiết bị" : " vào làm bài") +
                "."}
          </p>
        </div>
      </div>
    </div>
  );
}
