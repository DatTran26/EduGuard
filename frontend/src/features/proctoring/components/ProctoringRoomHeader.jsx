import { FiCpu, FiFlag, FiPlay, FiRadio, FiRefreshCw, FiShield, FiX } from "react-icons/fi";
import Button from "../../../components/common/Button";
import { routeConfig } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { cn } from "../../../utils/cn";
import { useExamEndCountdown } from "../hooks/useExamEndCountdown";
import { resolveProctoringRealtimeBadge } from "../utils/proctoringRoomHelpers";

const REALTIME_BADGE_STYLES = {
  success: {
    container: "border-emerald-400/25 bg-emerald-500/10 shadow-[0_0_16px_rgba(52,211,153,0.12)]",
    label: "text-emerald-200",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
    icon: "text-emerald-400",
  },
  connecting: {
    container: "border-amber-400/25 bg-amber-500/10",
    label: "text-amber-200",
    dot: "bg-amber-400",
    icon: "text-amber-400",
  },
  neutral: {
    container: "border-slate-500/25 bg-slate-500/10",
    label: "text-slate-300",
    dot: "bg-slate-400",
    icon: "text-slate-400",
  },
};

const EXAM_TIME_CHIP_STYLES = {
  start: {
    container: "border-sky-400/20 bg-sky-500/[0.07]",
    iconWrap: "bg-sky-500/15 text-sky-300",
    label: "text-sky-400/75",
  },
  end: {
    container: "border-amber-400/20 bg-amber-500/[0.07]",
    iconWrap: "bg-amber-500/15 text-amber-300",
    label: "text-amber-400/75",
  },
};

function ExamTimeChip({ label, value, variant, icon: Icon }) {
  const styles = EXAM_TIME_CHIP_STYLES[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 backdrop-blur-sm",
        styles.container,
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg",
          styles.iconWrap,
        )}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className={cn("text-[0.62rem] font-semibold uppercase tracking-[0.14em]", styles.label)}>
          {label}
        </p>
        <p className="truncate text-[0.78rem] font-medium tabular-nums text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function RealtimeStatusBadge({ badge, compact = false }) {
  const styles = REALTIME_BADGE_STYLES[badge.tone] ?? REALTIME_BADGE_STYLES.neutral;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl border backdrop-blur-sm",
        compact ? "px-2 py-1" : "gap-2 px-2.5 py-1.5",
        styles.container,
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          compact ? "h-5 w-5" : "h-6 w-6",
        )}
      >
        {badge.pulse ? (
          <span
            className={cn("absolute inset-0 rounded-lg opacity-40 animate-ping", styles.dot)}
            aria-hidden="true"
          />
        ) : null}
        <span
          className={cn(
            "relative flex items-center justify-center rounded-lg bg-white/[0.06]",
            compact ? "h-5 w-5" : "h-6 w-6",
            styles.icon,
          )}
        >
          <FiRadio className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} aria-hidden="true" />
        </span>
      </span>
      <span
        className={cn(
          "font-medium leading-tight",
          compact ? "text-[0.72rem]" : "text-[0.78rem]",
          styles.label,
        )}
      >
        {badge.label}
      </span>
    </div>
  );
}

export default function ProctoringRoomHeader({
  examTitle,
  room,
  isHubConnected,
  isRoomLoading = false,
  sessionLive = null,
  sessionPhase = null,
  isRefreshing,
  canCloseExam = false,
  globalAiEnabled = false,
  allStudentsAiEnabled = true,
  onRefresh,
  onOpenCoProctor,
  onOpenClassReport,
  onCloseExam,
  onToggleAllStudentsAi,
}) {
  const countdown = useExamEndCountdown({
    endTime: room?.endTime,
    startTime: room?.startTime,
  });
  const realtimeBadge = resolveProctoringRealtimeBadge({
    isHubConnected,
    isRoomLoading,
    sessionLive,
    sessionPhase,
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070d18]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-sky-400/30 bg-sky-500/10 sm:flex">
            <FiShield className="h-5 w-5 text-sky-300" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sky-300/90">
              Phòng giám sát bài thi
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-white md:text-2xl">
                {examTitle ?? "Đang tải…"}
              </h1>
              <RealtimeStatusBadge badge={realtimeBadge} compact />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {room?.startTime ? (
                <ExamTimeChip
                  icon={FiPlay}
                  label="Bắt đầu"
                  value={formatShortDateTime(room.startTime)}
                  variant="start"
                />
              ) : null}
              {room?.endTime ? (
                <ExamTimeChip
                  icon={FiFlag}
                  label="Kết thúc"
                  value={formatShortDateTime(room.endTime)}
                  variant="end"
                />
              ) : null}
            </div>
          </div>
        </div>

        {countdown ? (
          <div
            aria-live="polite"
            className={cn(
              "flex shrink-0 flex-col items-center justify-center rounded-[16px] border px-5 py-2.5 sm:px-7 sm:py-3",
              countdown.isExpired
                ? "border-slate-500/30 bg-slate-500/10"
                : countdown.mode === "untilStart"
                  ? "border-sky-400/35 bg-sky-500/12 shadow-[0_0_24px_rgba(56,189,248,0.12)]"
                  : countdown.isUrgent
                    ? "border-rose-400/40 bg-rose-500/15 shadow-[0_0_24px_rgba(244,63,94,0.15)]"
                    : "border-amber-400/35 bg-amber-500/12 shadow-[0_0_24px_rgba(245,158,11,0.12)]",
            )}
            title={
              countdown.isExpired
                ? countdown.label
                : countdown.mode === "untilStart"
                  ? `Bắt đầu sau: ${countdown.timeDisplay}`
                  : `Thời gian còn lại: ${countdown.timeDisplay}`
            }
          >
            <span
              className={cn(
                "text-[0.7rem] font-semibold uppercase tracking-[0.2em]",
                countdown.isExpired
                  ? "text-slate-500"
                  : countdown.mode === "untilStart"
                    ? "text-sky-300/90"
                    : countdown.isUrgent
                      ? "text-rose-300/90"
                      : "text-amber-300/90",
              )}
            >
              {countdown.isExpired
                ? "Hết giờ"
                : countdown.mode === "untilStart"
                  ? "Bắt đầu sau"
                  : "Còn lại"}
            </span>
            <span
              className={cn(
                "font-mono text-3xl font-bold leading-none tabular-nums tracking-tight sm:text-4xl md:text-5xl",
                countdown.isExpired
                  ? "text-slate-400"
                  : countdown.mode === "untilStart"
                    ? "text-sky-100"
                    : countdown.isUrgent
                      ? "text-rose-100"
                      : "text-amber-100",
              )}
            >
              {countdown.isExpired ? "00:00" : countdown.timeDisplay}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {globalAiEnabled ? (
            <Button
              className="!border !border-black !bg-emerald-500 !text-white hover:!bg-emerald-600"
              onClick={onToggleAllStudentsAi}
              title={
                allStudentsAiEnabled
                  ? "Tắt giám sát AI cho tất cả học sinh"
                  : "Bật giám sát AI cho tất cả học sinh"
              }
              variant="secondary"
            >
              <FiCpu className="mr-2 h-4 w-4" />
              {allStudentsAiEnabled ? "Tắt AI" : "Bật AI"}
            </Button>
          ) : null}
          <Button
            className="!border !border-black !bg-blue-500 !text-white hover:!bg-blue-600"
            onClick={onOpenClassReport}
            variant="secondary"
          >
            Báo cáo lớp
          </Button>
          <Button
            className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
            onClick={onOpenCoProctor}
            variant="secondary"
          >
            Giám thị phụ
          </Button>
          <Button
            className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
            disabled={isRefreshing}
            onClick={onRefresh}
            variant="secondary"
          >
            <FiRefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Làm mới
          </Button>
          {canCloseExam ? (
            <Button
              className="border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
              onClick={onCloseExam}
              variant="danger"
            >
              Đóng bài thi
            </Button>
          ) : null}
          <a
            aria-label="Đóng phòng"
            className="eg-button inline-flex !h-10 !w-10 !min-h-0 shrink-0 items-center justify-center !p-0 border border-yellow-500/40 bg-yellow-400 hover:bg-yellow-300"
            href={routeConfig.teacherMonitoring}
            title="Đóng phòng"
          >
            <FiX aria-hidden="true" color="#000000" size={22} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </header>
  );
}
