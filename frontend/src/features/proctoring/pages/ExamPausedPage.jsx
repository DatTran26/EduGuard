import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { getExamListPathByRole } from "../../../routes/routeConfig";
import { useAuth } from "../../../hooks/useAuth";
import CameraPreview from "../components/CameraPreview";
import { useCameraStream } from "../hooks/useCameraStream";
import { useProctoringHeartbeat } from "../hooks/useProctoringHeartbeat";

export default function ExamPausedPage() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const { videoRef, status: cameraStatus, errorMessage } = useCameraStream({ enabled: true });

  useProctoringHeartbeat({
    attemptId,
    enabled: Boolean(attemptId),
    cameraStatus: cameraStatus === "ready" ? "On" : "Off",
    connectionStatus: window.navigator.onLine ? "Online" : "Offline",
    fullscreenStatus: "Unknown",
    intervalMs: 10000,
  });

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function refreshAttempt() {
      try {
        const response = await examAttemptApi.getById(attemptId);
        if (!isMounted) {
          return;
        }

        if (response.data.status === "InProgress") {
          window.location.replace(`/student/attempts/${attemptId}`);
        }
      } catch {
        // Keep waiting view if polling fails temporarily.
      }
    }

    refreshAttempt();
    intervalId = window.setInterval(refreshAttempt, 5000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [attemptId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        description="Giáo viên đã tạm dừng bài làm của bạn. Vui lòng chờ được cho tiếp tục."
        eyebrow="Tạm dừng bài làm"
        title="Phòng chờ kiểm tra"
      />

      <Card className="space-y-5 p-6">
        <Badge variant="caution">Đang chờ giáo viên xem xét</Badge>
        <p className="text-sm leading-6 text-secondary">
          Bạn tạm thời không thể trả lời câu hỏi. Camera vẫn có thể được giữ để giáo viên theo dõi
          theo quy định đề thi.
        </p>

        <CameraPreview
          errorMessage={errorMessage}
          label="Camera giám sát"
          status={cameraStatus}
          videoRef={videoRef}
        />

        <Link className="text-sm font-semibold text-primary" to={getExamListPathByRole(user?.role)}>
          Về danh sách đề thi
        </Link>
      </Card>
    </div>
  );
}
