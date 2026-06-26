import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";
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
}) {
  if (!student) {
    return null;
  }

  const isRoom = variant === "room";
  const isPaused = student.attemptStatus === "PausedByProctor";

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
              Attempt #{student.attemptId}
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
                  "absolute inset-0 flex items-center justify-center text-sm",
                  isRoom ? "bg-[#060b14]/90 text-slate-400" : "bg-surface/80 text-secondary",
                )}
              >
                {remoteStatus === "connecting" ? "Đang kết nối live…" : "Chưa có live stream"}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge riskLevel={student.riskLevel} score={student.suspicionScore} />
            <Badge variant="neutral">{student.cameraStatus}</Badge>
            <Badge variant="neutral">{remoteStatus}</Badge>
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
