import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import Skeleton from "../../../components/common/Skeleton";
import {
  buildStudentExamAttemptPath,
  buildStudentExamDetailPath,
  buildStudentExamLobbyPath,
} from "../../../routes/routeConfig";
import CameraPreview from "../components/CameraPreview";
import { useCameraStream } from "../hooks/useCameraStream";
import {
  isExamLobbyRequired,
  isLateExamJoin,
  isLiveProctoringRoomAvailable,
  markExamDeviceCheckPassed,
  requiresProctoringCamera,
  requiresProctoringMicrophone,
} from "../utils/proctoringRouting";

async function requestFullscreenIfNeeded(required) {
  if (!required || typeof document === "undefined") {
    return true;
  }

  if (document.fullscreenElement) {
    return true;
  }

  try {
    await document.documentElement.requestFullscreen();
    return Boolean(document.fullscreenElement);
  } catch {
    return false;
  }
}

export default function StudentDeviceCheckPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const requireCamera = useMemo(() => requiresProctoringCamera(exam), [exam]);
  const requireMicrophone = useMemo(() => requiresProctoringMicrophone(exam), [exam]);
  const isLateJoin = useMemo(() => isLateExamJoin(exam), [exam]);
  const requireFullscreen = Boolean(exam?.settings?.requireFullscreen);
  const needsMediaCheck = requireCamera || requireMicrophone;

  const {
    videoRef,
    status: cameraStatus,
    errorMessage,
    isReady,
    isMicReady,
    startStream,
  } = useCameraStream({
    enabled: needsMediaCheck,
    audio: requireMicrophone,
  });

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
          message: error.message || "Không thể mở kiểm tra thiết bị.",
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
    if (!exam || isLoading) {
      return;
    }

    if (isExamLobbyRequired(exam)) {
      navigate(buildStudentExamLobbyPath(examId), { replace: true });
    }
  }, [exam, examId, isLoading, navigate]);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreenReady(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    syncFullscreen();
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const canStart =
    hasAcceptedRules &&
    (!requireCamera || isReady) &&
    (!requireMicrophone || isMicReady) &&
    (!requireFullscreen || isFullscreenReady) &&
    window.navigator.onLine;

  async function handleEnableFullscreen() {
    const ok = await requestFullscreenIfNeeded(true);
    setIsFullscreenReady(ok);
    if (!ok) {
      showToast({
        tone: "danger",
        title: "Chưa bật toàn màn hình",
        message: "Đề thi yêu cầu fullscreen để bắt đầu.",
      });
    }
  }

  async function handleStartExam() {
    if (!canStart) {
      return;
    }

    setIsStarting(true);
    try {
      const startResponse = await examAttemptApi.start(examId);
      const attemptId = startResponse.data?.attempt?.id;
      if (!attemptId) {
        throw new Error("Không nhận được mã lượt làm bài.");
      }

      if (isLiveProctoringRoomAvailable(exam)) {
        await proctoringApi.startProctoring(attemptId);
      }

      markExamDeviceCheckPassed(examId, attemptId);
      navigate(buildStudentExamAttemptPath(attemptId), {
        replace: true,
        state: {
          isLateJoin: startResponse.data?.isLateJoin || isLateJoin,
          requireCamera,
        },
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không thể bắt đầu",
        message: error.message || "Không thể vào phòng thi lúc này.",
      });
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 animate-pulse">
        <div className="flex justify-between items-center border-b border-border/60 pb-5">
          <div className="space-y-3 w-1/3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[280px] w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <PageHeader
        actions={
          <Button as={Link} to={buildStudentExamDetailPath(examId)} variant="secondary">
            Quay lại
          </Button>
        }
        description="Hoàn tất kiểm tra camera, micro và quy định trước khi vào màn hình làm bài."
        eyebrow="Kiểm tra thiết bị"
        title={exam?.title ?? "Kiểm tra trước khi thi"}
      />

      <Card className="space-y-6 p-6">
        {isLateJoin ? (
          <div
            className="rounded-[var(--radius-md)] border border-caution/35 bg-caution-muted px-4 py-3 text-sm leading-6 text-caution"
            role="alert"
          >
            <p className="font-semibold">Bạn đang vào thi sau giờ mở đề.</p>
            <p className="mt-1">
              {requireCamera
                ? "Đề này yêu cầu bật camera trước khi làm bài. Giảng viên sẽ được thông báo bạn vào trễ."
                : "Giảng viên sẽ được thông báo bạn vào trễ so với giờ mở đề."}
            </p>
          </div>
        ) : null}

        {needsMediaCheck ? (
          <>
            <CameraPreview
              errorMessage={errorMessage}
              status={cameraStatus}
              videoRef={videoRef}
            />

            {!isReady ? (
              <Button onClick={startStream} type="button" variant="secondary">
                Thử bật camera{requireMicrophone ? " và micro" : ""} lại
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-6 text-secondary">
            Đề thi này không yêu cầu kiểm tra camera trước khi làm bài.
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[12px] border border-border bg-neutral p-4">
            <p className="text-xs text-secondary">Camera</p>
            <Badge className="mt-2" variant={!requireCamera || isReady ? "success" : "danger"}>
              {!requireCamera ? "Không yêu cầu" : isReady ? "Đã sẵn sàng" : "Chưa sẵn sàng"}
            </Badge>
          </div>
          <div className="rounded-[12px] border border-border bg-neutral p-4">
            <p className="text-xs text-secondary">Micro</p>
            <Badge className="mt-2" variant={!requireMicrophone || isMicReady ? "success" : "danger"}>
              {!requireMicrophone ? "Không yêu cầu" : isMicReady ? "Đã sẵn sàng" : "Chưa sẵn sàng"}
            </Badge>
          </div>
          <div className="rounded-[12px] border border-border bg-neutral p-4">
            <p className="text-xs text-secondary">Toàn màn hình</p>
            <Badge className="mt-2" variant={isFullscreenReady ? "success" : "caution"}>
              {requireFullscreen ? (isFullscreenReady ? "Đã bật" : "Chưa bật") : "Không yêu cầu"}
            </Badge>
          </div>
          <div className="rounded-[12px] border border-border bg-neutral p-4">
            <p className="text-xs text-secondary">Kết nối</p>
            <Badge className="mt-2" variant={window.navigator.onLine ? "success" : "danger"}>
              {window.navigator.onLine ? "Ổn định" : "Không ổn định"}
            </Badge>
          </div>
        </div>

        {requireFullscreen && !isFullscreenReady ? (
          <Button onClick={handleEnableFullscreen} type="button" variant="secondary">
            Bật toàn màn hình
          </Button>
        ) : null}

        <label className="flex items-start gap-3 text-sm leading-6 text-secondary">
          <input
            checked={hasAcceptedRules}
            className="mt-1"
            onChange={(event) => setHasAcceptedRules(event.target.checked)}
            type="checkbox"
          />
          <span>
            Tôi hiểu đề thi có thể được giám sát bằng camera
            {requireMicrophone ? " và micro" : ""}, và các cảnh báo chỉ giúp giáo viên xem xét,
            không tự kết luận gian lận.
          </span>
        </label>

        <Button disabled={!canStart || isStarting} onClick={handleStartExam} type="button">
          {isStarting ? "Đang bắt đầu…" : "Bắt đầu làm bài"}
        </Button>
      </Card>
    </div>
  );
}
