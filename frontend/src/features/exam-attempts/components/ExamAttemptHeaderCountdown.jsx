import { useMemo } from "react";
import { FiClock } from "react-icons/fi";
import { cn } from "../../../utils/cn";
import { splitRemainingDuration } from "../attemptHelpers";

function getCountdownTone(totalSeconds) {
  if (totalSeconds <= 60) {
    return "critical";
  }

  if (totalSeconds <= 5 * 60) {
    return "urgent";
  }

  return "normal";
}

const TONE_STYLES = {
  normal: {
    shell: "border-slate-200/90 bg-white/90 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]",
    label:
      "border-slate-200/80 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 shadow-sm",
    icon: "text-slate-500",
    digit: "border-slate-700 bg-slate-800 text-white shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)]",
    colon: "text-slate-400",
  },
  urgent: {
    shell: "border-amber-200/90 bg-amber-50/50 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.22)]",
    label:
      "border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-100/90 text-amber-800 shadow-sm",
    icon: "text-amber-600",
    digit: "border-amber-500 bg-amber-500 text-white shadow-[0_8px_20px_-10px_rgba(217,119,6,0.55)]",
    colon: "text-amber-500",
  },
  critical: {
    shell: "border-rose-200/90 bg-rose-50/60 shadow-[0_10px_30px_-18px_rgba(225,29,72,0.24)]",
    label:
      "border-rose-200/90 bg-gradient-to-r from-rose-50 to-rose-100/90 text-rose-800 shadow-sm",
    icon: "text-rose-600",
    digit: "border-rose-500 bg-rose-600 text-white shadow-[0_8px_20px_-10px_rgba(225,29,72,0.55)]",
    colon: "text-rose-500",
  },
};

function CountdownLabel({ tone, isExpired, compact = false }) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border shadow-sm",
        compact ? "gap-1 px-2 py-0.5" : "gap-1.5 px-3 py-1",
        styles.label,
      )}
    >
      <FiClock
        aria-hidden="true"
        className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5", styles.icon)}
      />
      <span
        className={cn(
          "font-semibold leading-none tracking-[0.02em]",
          compact ? "text-[0.62rem]" : "text-[0.72rem]",
        )}
      >
        {isExpired ? "Hết giờ" : compact ? "Còn lại" : "Thời gian còn lại"}
      </span>
    </div>
  );
}

function CountdownDigit({ value, tone, compact = false }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border-2 font-mono font-bold tabular-nums leading-none",
        compact
          ? "h-8 w-[1.95rem] text-[1.05rem]"
          : "h-12 w-[2.85rem] rounded-xl text-[1.65rem] sm:h-14 sm:w-[3.15rem] sm:text-[1.9rem]",
        TONE_STYLES[tone].digit,
      )}
    >
      {value}
    </div>
  );
}

function CountdownColon({ tone, blink, compact = false }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-mono font-bold leading-none",
        compact ? "pb-0 text-[1.05rem]" : "pb-0.5 text-[1.65rem] sm:text-[1.9rem]",
        TONE_STYLES[tone].colon,
        blink ? "animate-pulse" : null,
      )}
    >
      :
    </span>
  );
}

export default function ExamAttemptHeaderCountdown({ remainingMs = 0, compact = false }) {
  const parts = useMemo(() => splitRemainingDuration(remainingMs), [remainingMs]);
  const tone = getCountdownTone(parts.totalSeconds);
  const isExpired = parts.totalSeconds <= 0;
  const styles = TONE_STYLES[tone];

  return (
    <div
      aria-label={isExpired ? "Hết giờ" : `Thời gian còn lại ${parts.timeDisplay}`}
      aria-live="polite"
      className={cn(
        "rounded-xl border",
        compact
          ? "flex items-center gap-2 px-2.5 py-1.5"
          : "flex flex-col items-center gap-2.5 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5",
        styles.shell,
      )}
      role="timer"
    >
      <CountdownLabel compact={compact} isExpired={isExpired} tone={tone} />

      <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-1 sm:gap-1.5")}>
        {parts.showHours ? (
          <>
            <CountdownDigit compact={compact} tone={tone} value={parts.hours} />
            <CountdownColon compact={compact} tone={tone} />
          </>
        ) : null}
        <CountdownDigit compact={compact} tone={tone} value={parts.minutes} />
        <CountdownColon blink={tone === "critical"} compact={compact} tone={tone} />
        <CountdownDigit compact={compact} tone={tone} value={parts.seconds} />
      </div>
    </div>
  );
}
