import { useEffect, useRef } from "react";
import { proctoringApi } from "../../../api/proctoringApi";

export function useProctoringHeartbeat({
  attemptId,
  enabled,
  intervalMs = 10000,
  cameraStatus = "On",
  fullscreenStatus = "Unknown",
  connectionStatus = "Online",
}) {
  const payloadRef = useRef({ cameraStatus, fullscreenStatus, connectionStatus });

  useEffect(() => {
    payloadRef.current = { cameraStatus, fullscreenStatus, connectionStatus };
  }, [cameraStatus, connectionStatus, fullscreenStatus]);

  useEffect(() => {
    if (!enabled || !attemptId) {
      return undefined;
    }

    let isDisposed = false;

    async function sendHeartbeat() {
      try {
        await proctoringApi.heartbeatProctoring(attemptId, payloadRef.current);
      } catch {
        if (!isDisposed) {
          payloadRef.current = {
            ...payloadRef.current,
            connectionStatus: "Unstable",
          };
        }
      }
    }

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, intervalMs);
    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [attemptId, enabled, intervalMs]);
}
