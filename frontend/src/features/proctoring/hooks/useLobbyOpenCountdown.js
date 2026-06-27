import { useEffect, useState } from "react";
import { getExamCountdownState } from "../utils/proctoringRoomHelpers";

const OPEN_STATE = {
  label: "Đang mở đề",
  timeDisplay: "00:00",
  isExpired: true,
  isUrgent: false,
  totalSeconds: 0,
  mode: "untilStart",
};

export function useLobbyOpenCountdown(startTime) {
  const [countdown, setCountdown] = useState(() => getExamCountdownState({ startTime }) ?? OPEN_STATE);

  useEffect(() => {
    if (!startTime) {
      setCountdown(OPEN_STATE);
      return undefined;
    }

    const tick = () => {
      setCountdown(getExamCountdownState({ startTime }) ?? OPEN_STATE);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startTime]);

  return countdown;
}
