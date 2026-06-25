import { useEffect, useRef } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import { captureVideoFrame } from "../utils/captureVideoFrame";

export function useProctoringHeartbeat({
  attemptId,
  enabled,
  intervalMs = 10000,
  cameraStatus = "On",
  fullscreenStatus = "Unknown",
  connectionStatus = "Online",
  videoRef,
}) {
  const payloadRef = useRef({ cameraStatus, fullscreenStatus, connectionStatus });
  const isUploadingRef = useRef(false);

  useEffect(() => {
    payloadRef.current = { cameraStatus, fullscreenStatus, connectionStatus };
  }, [cameraStatus, connectionStatus, fullscreenStatus]);

  useEffect(() => {
    if (!enabled || !attemptId) {
      return undefined;
    }

    let isDisposed = false;

    async function uploadAutoSnapshot() {
      const video = videoRef?.current;
      if (!video || isUploadingRef.current) {
        return;
      }

      const file = await captureVideoFrame(video);
      if (!file) {
        return;
      }

      isUploadingRef.current = true;
      try {
        await proctoringApi.uploadEvidence(attemptId, file, {
          evidenceType: "AutoSnapshot",
          captureSource: "AutoPolicy",
          triggerEventType: "PolicyViolation",
        });
      } catch {
        // Ignore auto snapshot failures to avoid interrupting the attempt.
      } finally {
        isUploadingRef.current = false;
      }
    }

    async function sendHeartbeat() {
      try {
        const response = await proctoringApi.heartbeatProctoring(attemptId, payloadRef.current);
        if (!isDisposed && response.data?.requiresAutoSnapshot) {
          await uploadAutoSnapshot();
        }
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
  }, [attemptId, enabled, intervalMs, videoRef]);
}
