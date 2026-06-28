import { useMemo } from "react";
import { FiClock } from "react-icons/fi";
import { cn } from "../../../utils/cn";
import { useLobbyOpenCountdown } from "../hooks/useLobbyOpenCountdown";

function pad(value) {
  return String(value).padStart(2, "0");
}

function splitTimeDisplay(timeDisplay) {
  const parts = String(timeDisplay ?? "00:00").split(":");
  if (parts.length === 3) {
    return { hours: parts[0], minutes: parts[1], seconds: parts[2], showHours: true };
  }

  return { hours: "00", minutes: parts[0] ?? "00", seconds: parts[1] ?? "00", showHours: false };
}

function CountdownDigit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-[4.25rem] w-[3.4rem] items-center justify-center overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-b from-white to-sky-50 shadow-[0_8px_24px_-8px_rgba(14,116,214,0.25)] sm:h-[5rem] sm:w-[3.75rem]">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/40" />
        <span className="relative font-mono text-[2rem] font-bold tabular-nums tracking-tight text-slate-900 sm:text-[2.35rem]">
          {value}
        </span>
      </div>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator({ urgent }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mb-5 font-mono text-3xl font-bold leading-none text-sky-300 sm:text-4xl",
        urgent ? "animate-pulse" : "opacity-70",
      )}
    >
      :
    </span>
  );
}

export default function ExamLobbyCountdown({ startTime }) {
  const countdown = useLobbyOpenCountdown(startTime);
  const { hours, minutes, seconds, showHours } = useMemo(
    () => splitTimeDisplay(countdown.timeDisplay),
    [countdown.timeDisplay],
  );

  const isOpening = countdown.isExpired;
  const isUrgent = !isOpening && countdown.totalSeconds <= 300;
  const isCritical = !isOpening && countdown.totalSeconds <= 60;

  return (
    <section
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-[24px] border px-5 py-7 sm:px-8 sm:py-8",
        isOpening
          ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
          : isCritical
            ? "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-orange-50"
            : isUrgent
              ? "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-sky-50"
              : "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50",
      )}
      role="timer"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl",
          isOpening
            ? "bg-emerald-300/30"
            : isCritical
              ? "bg-rose-300/35"
              : isUrgent
                ? "bg-amber-300/30"
                : "bg-sky-300/30",
        )}
      />

      <div className="relative space-y-5">
        <div className="flex items-center justify-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full",
              isOpening
                ? "bg-emerald-100 text-emerald-600"
                : isCritical
                  ? "bg-rose-100 text-rose-600"
                  : isUrgent
                    ? "bg-amber-100 text-amber-600"
                    : "bg-sky-100 text-sky-600",
            )}
          >
            <FiClock className="h-4 w-4" />
          </span>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.22em]",
              isOpening
                ? "text-emerald-600"
                : isCritical
                  ? "text-rose-600"
                  : isUrgent
                    ? "text-amber-600"
                    : "text-sky-600",
            )}
          >
            {isOpening ? "Đang mở đề" : isCritical ? "Sắp mở đề" : "Đếm ngược mở đề"}
          </p>
        </div>

        {isOpening ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]" />
            </div>
            <p className="text-center text-sm font-medium text-emerald-700">
              Hệ thống đang chuyển bạn vào bài thi…
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {showHours ? (
              <>
                <CountdownDigit label="Giờ" value={hours} />
                <CountdownSeparator urgent={isCritical} />
              </>
            ) : null}
            <CountdownDigit label="Phút" value={minutes} />
            <CountdownSeparator urgent={isCritical} />
            <CountdownDigit label="Giây" value={seconds} />
          </div>
        )}

        <p className="text-center text-sm text-slate-500">
          {isOpening
            ? "Vui lòng giữ tab này mở"
            : isCritical
              ? "Chuẩn bị sẵn sàng — giờ mở đề sắp đến"
              : "Hệ thống tự chuyển bạn khi đến giờ mở đề"}
        </p>
      </div>
    </section>
  );
}
