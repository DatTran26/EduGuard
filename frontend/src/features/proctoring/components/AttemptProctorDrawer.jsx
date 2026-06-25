import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
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
}) {
  if (!student) {
    return null;
  }

  const isPaused = student.attemptStatus === "PausedByProctor";

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] border-l border-border bg-surface shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">{student.studentName}</h2>
            <p className="text-sm text-secondary">Attempt #{student.attemptId}</p>
          </div>
          <Button onClick={onClose} variant="ghost">
            Đóng
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="relative aspect-video overflow-hidden rounded-[16px] border border-border bg-surface-sunken">
            <video ref={liveVideoRef} autoPlay className="h-full w-full object-cover" playsInline />
            {remoteStatus !== "connected" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm text-secondary">
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
            <h3 className="text-sm font-semibold text-primary">Bằng chứng</h3>
            {(detail?.evidence ?? []).length ? (
              <ul className="grid grid-cols-2 gap-2">
                {detail.evidence.map((item) => (
                  <li key={item.id} className="overflow-hidden rounded-[12px] border border-border">
                    {item.fileUrl.match(/\.(webm|mp4)$/i) ? (
                      <video className="aspect-video w-full object-cover" controls src={item.fileUrl} />
                    ) : (
                      <img alt={item.evidenceType} className="aspect-video w-full object-cover" src={item.fileUrl} />
                    )}
                    <p className="px-2 py-1 text-[11px] text-secondary">{item.evidenceType}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary">Chưa có bằng chứng.</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">Timeline gần đây</h3>
            {(detail?.recentActions ?? []).length ? (
              <ul className="space-y-2 text-sm text-secondary">
                {detail.recentActions.map((action) => (
                  <li key={action.id} className="rounded-[12px] border border-border bg-neutral px-3 py-2">
                    <p className="font-medium text-primary">{action.actionType}</p>
                    <p>{action.reason || "Không có ghi chú"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary">Chưa có thao tác giáo viên.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
