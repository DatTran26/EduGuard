import { useEffect, useState } from "react";
import { getExamCountdownState } from "../utils/proctoringRoomHelpers";

export function useExamEndCountdown({ startTime, endTime } = {}) {
  const [countdown, setCountdown] = useState(() => getExamCountdownState({ startTime, endTime }));

  useEffect(() => {
    setCountdown(getExamCountdownState({ startTime, endTime }));

    if (!startTime && !endTime) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCountdown(getExamCountdownState({ startTime, endTime }));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [endTime, startTime]);

  return countdown;
}
