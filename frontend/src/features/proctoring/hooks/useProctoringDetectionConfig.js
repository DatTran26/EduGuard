import { useEffect, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";

const DEFAULT_INTERVAL_MS = 4000;

export function useProctoringDetectionConfig(enabled) {
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isDisposed = false;

    proctoringApi
      .getDetectionConfig()
      .then((response) => {
        if (isDisposed) {
          return;
        }

        const seconds = Number(response.data?.detectionIntervalSeconds) || 4;
        setIntervalMs(Math.max(seconds, 2) * 1000);
        setAiEnabled(Boolean(response.data?.enableYoloDetection));
      })
      .catch(() => {
        if (!isDisposed) {
          setIntervalMs(DEFAULT_INTERVAL_MS);
          setAiEnabled(true);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [enabled]);

  return { intervalMs, aiEnabled };
}
