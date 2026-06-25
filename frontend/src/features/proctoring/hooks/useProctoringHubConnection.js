import { useCallback, useEffect, useRef, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { createExamMonitoringConnection } from "../../../signalr/examMonitoringConnection";

export function useProctoringHubConnection({ enabled = true, onEvent } = {}) {
  const connectionRef = useRef(null);
  const onEventRef = useRef(onEvent);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const invoke = useCallback(async (method, ...args) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      throw new Error("Chưa kết nối realtime giám sát.");
    }
    return connection.invoke(method, ...args);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isDisposed = false;
    const connection = createExamMonitoringConnection();
    connectionRef.current = connection;

    const eventNames = Object.values(EXAM_MONITORING_EVENTS);
    eventNames.forEach((eventName) => {
      connection.on(eventName, (payload) => {
        onEventRef.current?.(eventName, payload);
      });
    });

    connection
      .start()
      .then(() => {
        if (!isDisposed) {
          setIsConnected(true);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setIsConnected(false);
        }
      });

    return () => {
      isDisposed = true;
      setIsConnected(false);
      eventNames.forEach((eventName) => connection.off(eventName));
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [enabled]);

  return {
    connectionRef,
    isConnected,
    invoke,
    methods: EXAM_MONITORING_METHODS,
    events: EXAM_MONITORING_EVENTS,
  };
}

export async function loadWebRtcIceServers() {
  const response = await proctoringApi.getWebRtcConfig();
  return response.data.iceServers;
}
