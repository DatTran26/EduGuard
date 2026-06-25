import { useEffect, useRef } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import { captureVideoFrame } from "../utils/captureVideoFrame";

export function useProctoringAutoDetection({
  attemptId,
  enabled,
  intervalMs = 4000,
  videoRef,
}) {
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled || !attemptId) {
      return undefined;
    }

    let isDisposed = false;

    async function runDetection() {
      if (isRunningRef.current || isDisposed) {
        return;
      }

      const video = videoRef?.current;
      if (!video || video.readyState < 2) {
        return;
      }

      const file = await captureVideoFrame(video);
      if (!file) {
        return;
      }

      isRunningRef.current = true;
      try {
        await proctoringApi.detectFrame(attemptId, file);
      } catch {
        // Detection failures should not block the attempt UI.
      } finally {
        isRunningRef.current = false;
      }
    }

    runDetection();
    const intervalId = window.setInterval(runDetection, intervalMs);
    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [attemptId, enabled, intervalMs, videoRef]);
}
