import { FiCpu, FiRefreshCw, FiShield, FiX } from "react-icons/fi";
import Button from "../../../components/common/Button";
import { routeConfig } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { cn } from "../../../utils/cn";
import { useExamEndCountdown } from "../hooks/useExamEndCountdown";
import { resolveProctoringRealtimeBadge } from "../utils/proctoringRoomHelpers";

const BADGE_TONE_CLASS_NAMES = {
  success: "bg-emerald-500/15 text-emerald-300",
  connecting: "bg-amber-500/15 text-amber-300",
  neutral: "bg-slate-500/15 text-slate-300",
};

const BADGE_DOT_CLASS_NAMES = {
  success: "bg-emerald-400 animate-pulse",
  connecting: "bg-amber-400",
  neutral: "bg-slate-400",
};

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
            <h1 className="truncate text-xl font-semibold tracking-tight text-white md:text-2xl">
              {examTitle ?? "Đang tải…"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              {room?.startTime ? (
                <span>Bắt đầu {formatShortDateTime(room.startTime)}</span>
              ) : null}
              {room?.endTime ? <span>Kết thúc {formatShortDateTime(room.endTime)}</span> : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium",
                  BADGE_TONE_CLASS_NAMES[realtimeBadge.tone] ?? BADGE_TONE_CLASS_NAMES.neutral,
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    BADGE_DOT_CLASS_NAMES[realtimeBadge.tone] ?? BADGE_DOT_CLASS_NAMES.neutral,
                  )}
                />
                {realtimeBadge.label}
              </span>
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
              className={cn(
                "border-white/15 hover:bg-white/10",
                allStudentsAiEnabled
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                  : "bg-white/5 text-slate-100",
              )}
              onClick={onToggleAllStudentsAi}
              title={
                allStudentsAiEnabled
                  ? "Tắt giám sát AI cho tất cả học sinh"
                  : "Bật giám sát AI cho tất cả học sinh"
              }
              variant="secondary"
            >
              <FiCpu className="mr-2 h-4 w-4" />
              Bật tắt AI
            </Button>
          ) : null}
          <Button
            className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
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
            className="eg-button eg-button-ghost border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
            href={routeConfig.teacherMonitoring}
          >
            <FiX className="mr-2 h-4 w-4" />
            Đóng phòng
          </a>
        </div>
      </div>
    </header>
  );
}
