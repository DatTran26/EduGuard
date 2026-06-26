import { useCallback, useEffect, useRef, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import { devLog } from "../../../utils/devLogger";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { createExamMonitoringConnection } from "../../../signalr/examMonitoringConnection";

export function useProctoringHubConnection({ enabled = true, onEvent } = {}) {
  const connectionRef = useRef(null);
  const onEventRef = useRef(onEvent);
  const extraHandlersRef = useRef(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const registerHandler = useCallback((handler) => {
    if (typeof handler !== "function") {
      return () => {};
    }

    extraHandlersRef.current.add(handler);
    return () => {
      extraHandlersRef.current.delete(handler);
    };
  }, []);

  const dispatchEvent = useCallback((eventName, payload) => {
    onEventRef.current?.(eventName, payload);
    extraHandlersRef.current.forEach((handler) => {
      handler(eventName, payload);
    });
  }, []);

  const invoke = useCallback(async (method, ...args) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      throw new Error("Chưa kết nối realtime giám sát.");
    }
    return connection.invoke(method, ...args);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return undefined;
    }

    let isDisposed = false;
    const connection = createExamMonitoringConnection();
    connectionRef.current = connection;

    const eventNames = Object.values(EXAM_MONITORING_EVENTS);
    eventNames.forEach((eventName) => {
      connection.on(eventName, (payload) => {
        dispatchEvent(eventName, payload);
      });
    });

    connection
      .start()
      .then(() => {
        if (!isDisposed) {
          setIsConnected(true);
          devLog.proctoring("Exam monitoring hub connected");
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setIsConnected(false);
          devLog.error("proctoring", "Exam monitoring hub connect failed", error);
        }
      });

    return () => {
      isDisposed = true;
      setIsConnected(false);
      devLog.proctoring("Exam monitoring hub disconnecting");
      eventNames.forEach((eventName) => connection.off(eventName));
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [dispatchEvent, enabled]);

  return {
    connectionRef,
    isConnected,
    invoke,
    registerHandler,
    methods: EXAM_MONITORING_METHODS,
    events: EXAM_MONITORING_EVENTS,
  };
}

export async function loadWebRtcIceServers() {
  const response = await proctoringApi.getWebRtcConfig();
  return response.data.iceServers;
}
