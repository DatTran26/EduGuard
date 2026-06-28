import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import CameraPreview from "../components/CameraPreview";
import { useCameraStream } from "../hooks/useCameraStream";
import { useProctoringHeartbeat } from "../hooks/useProctoringHeartbeat";
import { useStudentAttemptProctoring } from "../hooks/useStudentAttemptProctoring";
import { resolveStudentAttemptEntryPath } from "../utils/proctoringRouting";

export default function ExamPausedPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attemptStatus, setAttemptStatus] = useState("PausedByProctor");
  const { videoRef, status: cameraStatus, errorMessage } = useCameraStream({ enabled: true });

  const canResume = attemptStatus === "InProgress";
  const isTerminated = attemptStatus === "Submitted";

  useProctoringHeartbeat({
    attemptId,
    enabled: Boolean(attemptId),
    cameraStatus: cameraStatus === "ready" ? "On" : "Off",
    connectionStatus: window.navigator.onLine ? "Online" : "Offline",
    fullscreenStatus: "Unknown",
    intervalMs: 10000,
  });

  useStudentAttemptProctoring({
    attemptId,
    controlEventsEnabled: Boolean(attemptId),
    publishEnabled: false,
    cameraReady: cameraStatus === "ready",
  });

  useEffect(() => {
    if (!attemptId) {
      return undefined;
    }

    let isMounted = true;

    async function refreshAttempt() {
      try {
        const response = await examAttemptApi.getById(attemptId);
        if (!isMounted) {
          return;
        }

        const nextStatus = response.data.status;
        setAttemptStatus(nextStatus);

        if (nextStatus === "InProgress" || nextStatus === "Submitted") {
          const targetPath = resolveStudentAttemptEntryPath(response.data);
          if (targetPath) {
            navigate(targetPath, { replace: true });
          }
        }
      } catch {
        // Keep waiting view if polling fails temporarily.
      }
    }

    refreshAttempt();
    const intervalId = window.setInterval(refreshAttempt, 3000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [attemptId, navigate]);

  function handleContinueExam() {
    if (!canResume || !attemptId) {
      return;
    }

    navigate(`/student/attempts/${attemptId}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        description="Giáo viên đã tạm dừng bài làm của bạn. Vui lòng chờ được cho phép tiếp tục — bài làm chưa được nộp."
        eyebrow="Tạm dừng bài làm"
        title="Phòng chờ kiểm tra"
      />

      <Card className="space-y-5 p-6">
        <Badge variant={isTerminated ? "danger" : "caution"}>
          {isTerminated ? "Bài làm đã kết thúc" : "Đang chờ giáo viên xem xét"}
        </Badge>

        <p className="text-sm leading-6 text-secondary">
          Bạn tạm thời không thể trả lời câu hỏi. Thời gian làm bài và câu trả lời đã lưu vẫn được
          giữ. Khi giáo viên cho phép tiếp tục, hệ thống sẽ tự chuyển bạn về màn làm bài hoặc bạn
          có thể bấm nút bên dưới.
        </p>

        <CameraPreview
          errorMessage={errorMessage}
          label="Camera giám sát"
          status={cameraStatus}
          videoRef={videoRef}
        />

        <div className="rounded-[18px] border border-border bg-surface-sunken px-4 py-4 text-sm text-secondary">
          <p className="font-semibold text-primary">Lưu ý quan trọng</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bài làm của bạn chưa được nộp.</li>
            <li>Giữ tab này mở để nhận thông báo khi được phép tiếp tục.</li>
            <li>Không rời khỏi phòng chờ trừ khi giáo viên hướng dẫn.</li>
          </ul>
        </div>

        <Button className="w-full" disabled={!canResume} onClick={handleContinueExam} type="button">
          {canResume ? "Tiếp tục làm bài" : "Đang chờ giáo viên cho tiếp tục…"}
        </Button>
      </Card>
    </div>
  );
}
