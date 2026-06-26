import { useEffect, useState } from "react";
import { getExamCountdownState } from "../utils/proctoringRoomHelpers";

export function useExamEndCountdown(endTime) {
  const [countdown, setCountdown] = useState(() => getExamCountdownState(endTime));

  useEffect(() => {
    setCountdown(getExamCountdownState(endTime));

    if (!endTime) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCountdown(getExamCountdownState(endTime));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [endTime]);

  return countdown;
}
