import { useEffect, useState } from "react";
import "./ExamLobbyCountdown.css";

function pad(value) {
  return String(value).padStart(2, "0");
}

function splitCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return { hours, minutes, seconds, showHours: hours > 0 };
}

export default function ExamLobbyCountdown({ secondsUntilOpen = 0 }) {
  const [displaySeconds, setDisplaySeconds] = useState(secondsUntilOpen);
  const { hours, minutes, seconds, showHours } = splitCountdown(displaySeconds);

  useEffect(() => {
    setDisplaySeconds(secondsUntilOpen);
  }, [secondsUntilOpen]);

  useEffect(() => {
    if (displaySeconds <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setDisplaySeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [displaySeconds > 0]);

  return (
    <div className="exam-lobby-countdown" role="timer" aria-live="polite">
      <p className="exam-lobby-countdown__label">Còn</p>
      <div className="exam-lobby-countdown__digits" aria-hidden="true">
        {showHours ? (
          <>
            <span className="exam-lobby-countdown__unit">{pad(hours)}</span>
            <span className="exam-lobby-countdown__sep">:</span>
          </>
        ) : null}
        <span className="exam-lobby-countdown__unit">{pad(minutes)}</span>
        <span className="exam-lobby-countdown__sep">:</span>
        <span className="exam-lobby-countdown__unit">{pad(seconds)}</span>
      </div>
      <p className="exam-lobby-countdown__hint">đến giờ mở đề</p>
    </div>
  );
}
