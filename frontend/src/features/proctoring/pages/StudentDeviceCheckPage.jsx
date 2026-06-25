import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import {
  buildStudentExamAttemptPath,
  buildStudentExamDetailPath,
} from "../../../routes/routeConfig";
import CameraPreview from "../components/CameraPreview";
import { useCameraStream } from "../hooks/useCameraStream";

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
  const { videoRef, status: cameraStatus, errorMessage, isReady, startStream } = useCameraStream({
    enabled: true,
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
    function syncFullscreen() {
      setIsFullscreenReady(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    syncFullscreen();
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const requireCamera = Boolean(exam?.settings?.requireCamera || exam?.settings?.enableLiveProctoring);
  const requireFullscreen = Boolean(exam?.settings?.requireFullscreen);
  const canStart =
    hasAcceptedRules &&
    (!requireCamera || isReady) &&
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

      if (requireCamera) {
        await proctoringApi.startProctoring(attemptId);
      }

      navigate(buildStudentExamAttemptPath(attemptId), { replace: true });
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="p-6 text-sm text-secondary">Đang tải kiểm tra thiết bị…</Card>
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
        description="Hoàn tất kiểm tra camera và quy định trước khi vào màn hình làm bài."
        eyebrow="Kiểm tra thiết bị"
        title={exam?.title ?? "Kiểm tra trước khi thi"}
      />

      <Card className="space-y-6 p-6">
        <CameraPreview
          errorMessage={errorMessage}
          status={cameraStatus}
          videoRef={videoRef}
        />

        {!isReady ? (
          <Button onClick={startStream} type="button" variant="secondary">
            Thử bật camera lại
          </Button>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[12px] border border-border bg-neutral p-4">
            <p className="text-xs text-secondary">Camera</p>
            <Badge className="mt-2" variant={isReady ? "success" : "danger"}>
              {isReady ? "Đã sẵn sàng" : "Chưa sẵn sàng"}
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
            Tôi hiểu đề thi có thể được giám sát bằng camera và các cảnh báo chỉ giúp giáo viên
            xem xét, không tự kết luận gian lận.
          </span>
        </label>

        <Button disabled={!canStart || isStarting} onClick={handleStartExam} type="button">
          {isStarting ? "Đang bắt đầu…" : "Bắt đầu làm bài"}
        </Button>
      </Card>
    </div>
  );
}
