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

function CountdownLabel({ tone, isExpired }) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        styles.label,
      )}
    >
      <FiClock aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} />
      <span className="text-[0.72rem] font-semibold leading-none tracking-[0.02em]">
        {isExpired ? "Hết giờ làm bài" : "Thời gian còn lại"}
      </span>
    </div>
  );
}

function CountdownDigit({ value, tone }) {
  return (
    <div
      className={cn(
        "flex h-12 w-[2.85rem] items-center justify-center rounded-xl border-2 font-mono text-[1.65rem] font-bold tabular-nums leading-none sm:h-14 sm:w-[3.15rem] sm:text-[1.9rem]",
        TONE_STYLES[tone].digit,
      )}
    >
      {value}
    </div>
  );
}

function CountdownColon({ tone, blink }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pb-0.5 font-mono text-[1.65rem] font-bold leading-none sm:text-[1.9rem]",
        TONE_STYLES[tone].colon,
        blink ? "animate-pulse" : null,
      )}
    >
      :
    </span>
  );
}

export default function ExamAttemptHeaderCountdown({ remainingMs = 0 }) {
  const parts = useMemo(() => splitRemainingDuration(remainingMs), [remainingMs]);
  const tone = getCountdownTone(parts.totalSeconds);
  const isExpired = parts.totalSeconds <= 0;
  const styles = TONE_STYLES[tone];

  return (
    <div
      aria-label={isExpired ? "Hết giờ" : `Thời gian còn lại ${parts.timeDisplay}`}
      aria-live="polite"
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5",
        styles.shell,
      )}
      role="timer"
    >
      <CountdownLabel isExpired={isExpired} tone={tone} />

      <div className="flex items-center gap-1 sm:gap-1.5">
        {parts.showHours ? (
          <>
            <CountdownDigit tone={tone} value={parts.hours} />
            <CountdownColon tone={tone} />
          </>
        ) : null}
        <CountdownDigit tone={tone} value={parts.minutes} />
        <CountdownColon blink={tone === "critical"} tone={tone} />
        <CountdownDigit tone={tone} value={parts.seconds} />
      </div>
    </div>
  );
}
