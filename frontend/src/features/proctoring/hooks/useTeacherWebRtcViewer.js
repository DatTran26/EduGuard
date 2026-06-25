import { useCallback, useEffect, useRef, useState } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { useProctoringHubConnection } from "./useProctoringHubConnection";

export function useTeacherWebRtcViewer({ attemptId, enabled, enableAudio = false, videoRef }) {
  const peerRef = useRef(null);
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
          if (videoRef?.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setRemoteStatus("connected");
        };

        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            return;
          }
          invoke(EXAM_MONITORING_METHODS.sendIceCandidate, attemptId, event.candidate.toJSON()).catch(
            () => {},
          );
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await invoke(EXAM_MONITORING_METHODS.sendAnswer, attemptId, answer);
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
    [attemptId, cleanupPeer, enabled, invoke, videoRef],
  );

  const { isConnected, invoke } = useProctoringHubConnection({
    enabled,
    onEvent: handleHubEvent,
  });

  const requestWatch = useCallback(async () => {
    if (!isConnected) {
      throw new Error("Chưa kết nối hub giám sát.");
    }
    await invoke(EXAM_MONITORING_METHODS.teacherRequestWatch, attemptId, enableAudio);
  }, [attemptId, enableAudio, invoke, isConnected]);

  const stopWatch = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    await invoke(EXAM_MONITORING_METHODS.teacherStopWatch, attemptId);
    cleanupPeer();
  }, [attemptId, cleanupPeer, invoke, isConnected]);

  useEffect(() => {
    if (!enabled) {
      cleanupPeer();
      return undefined;
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
    remoteStatus,
    isHubConnected: isConnected,
    requestWatch,
    stopWatch,
  };
}
