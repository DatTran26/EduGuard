import { useCallback, useEffect, useRef, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { useProctoringHubConnection } from "./useProctoringHubConnection";

export function useTeacherWebRtcViewer({
  attemptId,
  enabled,
  enableAudio = false,
  sharedHub = null,
  videoRef,
}) {
  const peerRef = useRef(null);
  const invokeRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteStatus, setRemoteStatus] = useState("idle");
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    if (videoRef?.current) {
      videoRef.current.srcObject = null;
    }
    setRemoteStream(null);
    setRemoteStatus("idle");
  }, [videoRef]);

  const handleHubEvent = useCallback(
    async (eventName, payload) => {
      if (!enabled || Number(payload?.attemptId) !== Number(attemptId)) {
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.receiveWebRtcOffer) {
        cleanupPeer();
        const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
        peerRef.current = pc;
        setRemoteStatus("connecting");

        pc.ontrack = (event) => {
          const [stream] = event.streams;
          if (!stream) {
            return;
          }
          setRemoteStream(stream);
          if (videoRef?.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setRemoteStatus("connected");
        };

        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            return;
          }
          invokeRef
            .current?.(EXAM_MONITORING_METHODS.sendIceCandidate, attemptId, event.candidate.toJSON())
            .catch(() => {});
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await invokeRef.current?.(EXAM_MONITORING_METHODS.sendAnswer, attemptId, answer);
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.receiveIceCandidate && payload?.candidate) {
        const pc = peerRef.current;
        if (!pc || pc.signalingState === "closed") {
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Ignore duplicate ICE.
        }
      }

      if (eventName === EXAM_MONITORING_EVENTS.teacherStoppedWatch) {
        cleanupPeer();
      }
    },
    [attemptId, cleanupPeer, enabled, videoRef],
  );

  const internalHub = useProctoringHubConnection({
    enabled: enabled && !sharedHub,
    onEvent: handleHubEvent,
  });
  const activeHub = sharedHub ?? internalHub;
  const { isConnected, invoke, registerHandler } = activeHub;

  useEffect(() => {
    if (!sharedHub || !enabled) {
      return undefined;
    }

    return registerHandler(handleHubEvent);
  }, [enabled, handleHubEvent, registerHandler, sharedHub]);

  useEffect(() => {
    invokeRef.current = invoke;
  }, [invoke]);

  const requestWatch = useCallback(async () => {
    if (!isConnected) {
      throw new Error("Chưa kết nối hub giám sát.");
    }
    await invokeRef.current?.(EXAM_MONITORING_METHODS.teacherRequestWatch, attemptId, enableAudio);
  }, [attemptId, enableAudio, isConnected]);

  const stopWatch = useCallback(async () => {
    if (!isConnected) {
      cleanupPeer();
      return;
    }
    await invokeRef.current?.(EXAM_MONITORING_METHODS.teacherStopWatch, attemptId);
    cleanupPeer();
  }, [attemptId, cleanupPeer, isConnected]);

  useEffect(() => {
    if (!enabled) {
      return () => cleanupPeer();
    }

    let isDisposed = false;
    proctoringApi
      .getWebRtcConfig()
      .then((response) => {
        if (!isDisposed) {
          iceServersRef.current = response.data.iceServers;
        }
      })
      .catch(() => {});

    return () => {
      isDisposed = true;
      cleanupPeer();
    };
  }, [cleanupPeer, enabled]);

  return {
    remoteStream,
    remoteStatus,
    isHubConnected: isConnected,
    requestWatch,
    stopWatch,
  };
}
