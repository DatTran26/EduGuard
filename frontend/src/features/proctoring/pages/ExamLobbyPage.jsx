import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../../api/examApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import {
  buildStudentDeviceCheckPath,
  buildStudentExamDetailPath,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import CameraPreview from "../components/CameraPreview";
import { useCameraStream } from "../hooks/useCameraStream";
import { isProctoringRequired } from "../utils/proctoringRouting";

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ExamLobbyPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [exam, setExam] = useState(null);
  const [lobbyStatus, setLobbyStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
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
          navigate(buildStudentDeviceCheckPath(examId), { replace: true });
          return;
        }

        if (isReady) {
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
  }, [examId, isReady, navigate, showToast]);

  useEffect(() => {
    if (!examId || !isReady) {
      return;
    }

    proctoringApi.joinLobby(examId, true).catch(() => {});
  }, [examId, isReady]);

  const countdownLabel = useMemo(
    () => formatCountdown(lobbyStatus?.secondsUntilOpen ?? 0),
    [lobbyStatus?.secondsUntilOpen],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="p-6 text-sm text-secondary">Đang tải phòng chờ…</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <PageHeader
        actions={
          <Button as={Link} to={buildStudentExamDetailPath(examId)} variant="secondary">
            Quay lại đề thi
          </Button>
        }
        description="Bật camera sớm và chờ đến giờ mở đề. Khi đến giờ, hệ thống sẽ chuyển bạn sang bước kiểm tra thiết bị."
        eyebrow="Phòng chờ trước giờ thi"
        title={exam?.title ?? lobbyStatus?.examTitle ?? "Phòng chờ bài thi"}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="caution">Chờ mở đề</Badge>
            <Badge variant="neutral">Còn {countdownLabel}</Badge>
            {lobbyStatus?.waitingStudentCount ? (
              <Badge variant="neutral">{lobbyStatus.waitingStudentCount} người đang chờ</Badge>
            ) : null}
          </div>

          <CameraPreview
            errorMessage={errorMessage}
            label="Camera phòng chờ"
            status={cameraStatus}
            videoRef={videoRef}
          />

          {!isReady ? (
            <Button onClick={startStream} type="button" variant="secondary">
              Thử bật camera lại
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
              Đề thi này yêu cầu camera. Hệ thống có thể ghi nhận hành vi bất thường, hiển thị
              camera cho giáo viên trong quá trình thi và chụp ảnh bằng chứng khi phát hiện dấu
              hiệu rủi ro. Các cảnh báo chỉ được dùng để giáo viên xem xét, không tự động kết
              luận gian lận.
            </span>
          </label>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="text-base font-semibold text-primary">Thông tin buổi thi</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Giờ mở đề</dt>
              <dd className="font-medium text-primary">
                {lobbyStatus?.startTime ? formatShortDateTime(lobbyStatus.startTime) : "Chưa đặt"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Giờ đóng đề</dt>
              <dd className="font-medium text-primary">
                {lobbyStatus?.endTime ? formatShortDateTime(lobbyStatus.endTime) : "Chưa đặt"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Camera</dt>
              <dd className="font-medium text-primary">
                {isProctoringRequired(exam) || lobbyStatus?.requireCamera ? "Bắt buộc" : "Không bắt buộc"}
              </dd>
            </div>
          </dl>

          <p className="text-sm leading-6 text-secondary">
            Khi đến giờ mở đề, bạn sẽ được chuyển tự động sang màn kiểm tra thiết bị rồi vào làm
            bài.
          </p>
        </Card>
      </div>
    </div>
  );
}
