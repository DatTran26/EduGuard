import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiRadio, FiVideo, FiWifi } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import { cn } from "../../../utils/cn";
import {
  canWatchStudentLive,
  getAttemptStatusMeta,
  PROCTORING_SIGNAL_ITEMS,
  resolveTileVideoPlaceholder,
} from "../utils/proctoringStudentStatus";
import RiskBadge from "./RiskBadge";
import { getAiDetectionMeta } from "../utils/proctoringAiHelpers";

const TILE_BORDER = {
  Normal: "border-white/10",
  Watch: "border-amber-400/35",
  Warning: "border-rose-400/45",
  Critical: "border-rose-500 ring-2 ring-rose-500/35",
};

const SIGNAL_ICONS = {
  camera: FiVideo,
  connection: FiWifi,
  live: FiRadio,
};

const SIGNAL_VARIANT_CLASS_NAMES = {
  success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  caution: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  neutral: "border-white/10 bg-white/[0.03] text-slate-300",
};

function ProctoringSignalChip({ item, student }) {
  const meta = item.getMeta(student);
  const Icon = SIGNAL_ICONS[item.id] ?? FiVideo;

  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-[12px] border px-2.5 py-2",
        SIGNAL_VARIANT_CLASS_NAMES[meta.variant] ?? SIGNAL_VARIANT_CLASS_NAMES.neutral,
      )}
      title={meta.hint || `${item.label}: ${meta.label}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
        <Icon className="h-3 w-3 shrink-0" />
        <span>{item.label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-semibold">{meta.label}</p>
    </div>
  );
}

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
  onViewViolationHistory,
}) {
  const videoRef = useRef(null);
  const riskLevel = student.riskLevel ?? "Normal";
  const showLiveVideo = Boolean(remoteStream) && remoteStatus === "connected";
  const attemptMeta = getAttemptStatusMeta(student.attemptStatus);
  const latestDetectionMeta = student.latestDetectionType
    ? getAiDetectionMeta(student.latestDetectionType)
    : null;
  const watchable = canWatchStudentLive(student);
  const placeholder = resolveTileVideoPlaceholder({
    student,
    remoteStatus,
    showLiveVideo,
    sfuEnabled,
    isActive,
  });

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
        isActive ? "shadow-[0_0_0_1px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/20" : "hover:border-white/20",
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
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border",
                watchable
                  ? "border-sky-400/25 bg-sky-500/10 text-sky-300"
                  : "border-white/10 bg-white/[0.03] text-slate-500",
              )}
            >
              <FiVideo className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-300">{placeholder?.title}</p>
              {!compact && placeholder?.detail ? (
                <p className="text-[11px] leading-relaxed text-slate-500">{placeholder.detail}</p>
              ) : null}
            </div>
          </div>
        )}
        {showLiveVideo ? (
          <div className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white">
            LIVE
          </div>
        ) : null}
        {isActive && !showLiveVideo && watchable ? (
          <div className="absolute left-2 top-2 rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-1 text-[10px] font-semibold text-sky-200">
            Đang chọn
          </div>
        ) : null}
        {riskLevel === "Critical" ? (
          <div className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white">
            Cần xem xét
          </div>
        ) : null}
      </div>

      <div className={cn("space-y-3", compact ? "flex flex-1 flex-col justify-center p-3" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1.5">
            <p className="truncate font-semibold text-slate-100">{student.studentName}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={attemptMeta.variant}>{attemptMeta.label}</Badge>
              {student.isLateJoin ? (
                <Badge variant="caution">Vào trễ {student.lateByMinutes || 1} phút</Badge>
              ) : null}
            </div>
          </div>
          <RiskBadge riskLevel={riskLevel} score={student.suspicionScore} />
        </div>

        {!compact ? (
          <div className="flex gap-2">
            {PROCTORING_SIGNAL_ITEMS.map((item) => (
              <ProctoringSignalChip key={item.id} item={item} student={student} />
            ))}
          </div>
        ) : null}

        {!compact && student.warningCount ? (
          <Badge variant="caution">{student.warningCount} cảnh báo</Badge>
        ) : null}

        {!compact && latestDetectionMeta && latestDetectionMeta.variant !== "success" ? (
          <Badge variant={latestDetectionMeta.variant}>AI: {latestDetectionMeta.label}</Badge>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {watchable && !student.watchedByTeacherId ? (
            <span
              className="inline-flex text-xs font-semibold text-sky-300 hover:text-sky-200"
              onClick={(event) => {
                event.stopPropagation();
                onRequestWatch?.(student);
              }}
              role="presentation"
            >
              {isActive ? "Kết nối lại live" : sfuEnabled ? "Chọn để ưu tiên xem" : "Bật xem live"}
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200/90 hover:text-amber-100"
            onClick={(event) => {
              event.stopPropagation();
              onViewViolationHistory?.(student);
            }}
            role="presentation"
            title="Xem lịch sử vi phạm AI và hành vi"
          >
            <FiAlertTriangle className="h-3 w-3" />
            Lịch sử vi phạm
          </span>
        </div>
      </div>
    </button>
  );
}
