import { useEffect, useRef } from "react";
import Badge from "../../../components/common/Badge";
import { cn } from "../../../utils/cn";
import RiskBadge from "./RiskBadge";

const TILE_BORDER = {
  Normal: "border-white/10",
  Watch: "border-amber-400/35",
  Warning: "border-rose-400/45",
  Critical: "border-rose-500 ring-2 ring-rose-500/35",
};

export default function StudentLiveTile({
  student,
  isActive,
  isAudioEnabled = false,
  isFocused = false,
  compact = false,
  remoteStream,
  remoteStatus,
  sfuEnabled = false,
  onSelect,
  onRequestWatch,
}) {
  const videoRef = useRef(null);
  const riskLevel = student.riskLevel ?? "Normal";
  const showLiveVideo = Boolean(remoteStream) && remoteStatus === "connected";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (showLiveVideo) {
      video.srcObject = remoteStream;
      video.play().catch(() => {});
      return;
    }
    video.srcObject = null;
  }, [remoteStream, showLiveVideo]);

  return (
    <button
      className={cn(
        "flex flex-col overflow-hidden rounded-[16px] border bg-[#0f1728] text-left transition-all",
        TILE_BORDER[riskLevel] ?? TILE_BORDER.Normal,
        isActive ? "shadow-[0_0_0_1px_rgba(56,189,248,0.35)]" : "hover:border-white/20",
        isFocused ? "min-h-[420px]" : "",
        compact ? "flex-row items-stretch" : "",
      )}
      onClick={() => onSelect?.(student)}
      type="button"
    >
      <div
        className={cn(
          "relative bg-[#060b14]",
          compact ? "aspect-video w-36 shrink-0" : "aspect-video w-full",
          isFocused ? "min-h-[360px] flex-1" : "",
        )}
      >
        {showLiveVideo ? (
          <video
            ref={videoRef}
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
            muted={!isAudioEnabled}
            playsInline
          />
        ) : remoteStatus === "connecting" ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">
            Đang kết nối live…
          </div>
        ) : isActive ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">
            Chưa có live stream
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-slate-500">
            {student.watchedByTeacherName
              ? `GV ${student.watchedByTeacherName} đang xem`
              : sfuEnabled
                ? "Đang chờ camera"
                : "Bấm để xem live"}
          </div>
        )}
        {showLiveVideo ? (
          <div className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white">
            LIVE
          </div>
        ) : null}
        {riskLevel === "Critical" ? (
          <div className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white">
            Cần xem xét
          </div>
        ) : null}
      </div>
      <div className={cn("space-y-2", compact ? "flex flex-1 flex-col justify-center p-3" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("font-semibold text-slate-100", compact ? "text-sm" : "text-sm")}>
              {student.studentName}
            </p>
            <p className="text-xs text-slate-500">{student.attemptStatus}</p>
          </div>
          <RiskBadge riskLevel={riskLevel} score={student.suspicionScore} />
        </div>
        {!compact ? (
          <div className="flex flex-wrap gap-2">
            {student.isLateJoin ? (
              <Badge variant="caution">Vào trễ {student.lateByMinutes || 1} phút</Badge>
            ) : null}
            <Badge variant="neutral">{student.cameraStatus}</Badge>
            <Badge variant="neutral">{student.connectionStatus}</Badge>
            {student.warningCount ? <Badge variant="caution">{student.warningCount} cảnh báo</Badge> : null}
          </div>
        ) : null}
        {!student.watchedByTeacherId ? (
          <span
            className="text-xs font-semibold text-sky-300"
            onClick={(event) => {
              event.stopPropagation();
              onRequestWatch?.(student);
            }}
            role="presentation"
          >
            Bật xem live
          </span>
        ) : null}
      </div>
    </button>
  );
}
