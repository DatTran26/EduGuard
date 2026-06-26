import { useEffect, useState } from "react";
import { antiCheatApi } from "../../../api/antiCheatApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getAntiCheatEventMeta } from "../../anti-cheat/antiCheatHelpers";
import {
  formatAiConfidence,
  getAiDetectionMeta,
  parseAiDetectionMetadata,
} from "../utils/proctoringAiHelpers";
import {
  getAttemptStatusMeta,
  getCameraStatusMeta,
  getConnectionStatusMeta,
  getLiveStatusMeta,
  resolveTileVideoPlaceholder,
} from "../utils/proctoringStudentStatus";
import AuthenticatedEvidenceMedia from "./AuthenticatedEvidenceMedia";
import RiskBadge from "./RiskBadge";

export default function AttemptProctorDrawer({
  student,
  detail,
  liveVideoRef,
  remoteStatus,
  isAudioEnabled,
  isClipRecording,
  clipElapsedSeconds,
  onClose,
  onPause,
  onResume,
  onWarn,
  onTerminate,
  onSnapshot,
  onStartClip,
  onStopClip,
  onToggleAudio,
  variant = "default",
  violationRefreshToken = 0,
}) {
  const [violationLogs, setViolationLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (!student?.attemptId) {
      setViolationLogs([]);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingLogs(true);
    antiCheatApi
      .getLogsByAttempt(student.attemptId)
      .then((response) => {
        if (isMounted) {
          setViolationLogs(response.data ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setViolationLogs([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLogs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [student?.attemptId, violationRefreshToken]);

  if (!student) {
    return null;
  }

  const isRoom = variant === "room";
  const isPaused = student.attemptStatus === "PausedByProctor";
  const attemptMeta = getAttemptStatusMeta(student.attemptStatus);
  const cameraMeta = getCameraStatusMeta(student.cameraStatus);
  const connectionMeta = getConnectionStatusMeta(student.connectionStatus);
  const liveMeta = getLiveStatusMeta(student.liveStatus);
  const latestDetectionType = detail?.state?.latestDetectionType ?? student.latestDetectionType;
  const latestDetectionMeta = latestDetectionType ? getAiDetectionMeta(latestDetectionType) : null;
  const videoPlaceholder = resolveTileVideoPlaceholder({
    student,
    remoteStatus,
    showLiveVideo: remoteStatus === "connected",
    sfuEnabled: false,
    isActive: true,
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-full max-w-[420px] border-l shadow-2xl",
        isRoom ? "border-white/10 bg-[#0b1220]" : "border-border bg-surface",
      )}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex items-center justify-between border-b px-5 py-4",
            isRoom ? "border-white/10" : "border-border",
          )}
        >
          <div>
            <h2 className={cn("text-lg font-semibold", isRoom ? "text-white" : "text-primary")}>
              {student.studentName}
            </h2>
            <p className={cn("text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
              {attemptMeta.label} · #{student.attemptId}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost">
            Đóng
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div
            className={cn(
              "relative aspect-video overflow-hidden rounded-[16px] border",
              isRoom ? "border-white/10 bg-[#060b14]" : "border-border bg-surface-sunken",
            )}
          >
            <video
              ref={liveVideoRef}
              autoPlay
              className="h-full w-full object-cover"
              muted={!isAudioEnabled}
              playsInline
            />
            {remoteStatus !== "connected" ? (
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm",
                  isRoom ? "bg-[#060b14]/90 text-slate-400" : "bg-surface/80 text-secondary",
                )}
              >
                <p className="font-semibold text-slate-300">
                  {remoteStatus === "connecting"
                    ? "Đang kết nối live…"
                    : videoPlaceholder?.title ?? "Chưa có live stream"}
                </p>
                {videoPlaceholder?.detail ? (
                  <p className="text-xs leading-relaxed opacity-80">{videoPlaceholder.detail}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge riskLevel={student.riskLevel} score={student.suspicionScore} />
            <Badge title={cameraMeta.hint} variant={cameraMeta.variant}>
              Camera: {cameraMeta.label}
            </Badge>
            <Badge title={connectionMeta.hint} variant={connectionMeta.variant}>
              Mạng: {connectionMeta.label}
            </Badge>
            <Badge title={liveMeta.hint} variant={liveMeta.variant}>
              Live: {liveMeta.label}
            </Badge>
            {latestDetectionMeta ? (
              <Badge variant={latestDetectionMeta.variant}>AI: {latestDetectionMeta.label}</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={remoteStatus !== "connected"} onClick={onSnapshot} variant="secondary">
              Chụp ảnh
            </Button>
            {isClipRecording ? (
              <Button onClick={onStopClip} variant="danger">
                Dừng ghi ({clipElapsedSeconds}s)
              </Button>
            ) : (
              <Button disabled={remoteStatus !== "connected"} onClick={onStartClip} variant="secondary">
                Ghi clip
              </Button>
            )}
            <Button onClick={onToggleAudio} variant="secondary">
              {isAudioEnabled ? "Tắt mic" : "Bật mic"}
            </Button>
            <Button onClick={() => onWarn?.(student)} variant="secondary">
              Nhắc nhở
            </Button>
            {isPaused ? (
              <Button onClick={() => onResume?.(student)}>Cho tiếp tục</Button>
            ) : (
              <Button onClick={() => onPause?.(student)} variant="danger">
                Tạm dừng thi
              </Button>
            )}
            <Button onClick={() => onTerminate?.(student)} variant="danger">
              Kết thúc bài
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className={cn("text-sm font-semibold", isRoom ? "text-slate-200" : "text-primary")}>
              Bằng chứng
            </h3>
            {(detail?.evidence ?? []).length ? (
              <ul className="grid grid-cols-2 gap-2">
                {detail.evidence.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "overflow-hidden rounded-[12px] border",
                      isRoom ? "border-white/10" : "border-border",
                    )}
                  >
                    <AuthenticatedEvidenceMedia
                      attemptId={student.attemptId}
                      className="aspect-video w-full object-cover"
                      evidenceId={item.id}
                      evidenceType={item.evidenceType}
                      fileUrl={item.fileUrl}
                    />
                    <p className={cn("px-2 py-1 text-[11px]", isRoom ? "text-slate-500" : "text-secondary")}>
                      {item.evidenceType}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>Chưa có bằng chứng.</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className={cn("text-sm font-semibold", isRoom ? "text-slate-200" : "text-primary")}>
              Lịch sử vi phạm
            </h3>
            {isLoadingLogs ? (
              <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>Đang tải log…</p>
            ) : violationLogs.length ? (
              <ul className={cn("space-y-2 text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
                {violationLogs.map((log) => {
                  const meta = getAntiCheatEventMeta(log.type);
                  const aiMeta = parseAiDetectionMetadata(log.metadata);

                  return (
                    <li
                      key={log.id}
                      className={cn(
                        "rounded-[12px] border px-3 py-2",
                        isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-neutral",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="text-[11px] text-slate-500">{formatShortDateTime(log.occurredAt)}</span>
                      </div>
                      <p className={cn("mt-1", isRoom ? "text-slate-300" : "text-primary")}>{log.description}</p>
                      {aiMeta ? (
                        <p className="mt-1 text-xs text-slate-500">
                          AI: {formatAiConfidence(aiMeta.confidence)}
                          {aiMeta.labels?.length ? ` · ${aiMeta.labels.join(", ")}` : ""}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
                Chưa có vi phạm ghi nhận.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className={cn("text-sm font-semibold", isRoom ? "text-slate-200" : "text-primary")}>
              Timeline gần đây
            </h3>
            {(detail?.recentActions ?? []).length ? (
              <ul className={cn("space-y-2 text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
                {detail.recentActions.map((action) => (
                  <li
                    key={action.id}
                    className={cn(
                      "rounded-[12px] border px-3 py-2",
                      isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-neutral",
                    )}
                  >
                    <p className={cn("font-medium", isRoom ? "text-slate-200" : "text-primary")}>
                      {action.actionType}
                    </p>
                    <p>{action.reason || "Không có ghi chú"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
                Chưa có thao tác giáo viên.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
