import { useCallback, useEffect, useRef } from "react";
import { proctoringApi } from "../../../api/proctoringApi";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { useProctoringHubConnection } from "./useProctoringHubConnection";

export function useStudentWebRtcPublisher({
  attemptId,
  enabled,
  mediaStream,
  enableAudio = false,
}) {
  const peerRef = useRef(null);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const invokeRef = useRef(null);
  const startPublishingRef = useRef(null);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const startPublishing = useCallback(
    async (withAudio) => {
      if (!mediaStream?.current) {
        return;
      }

      cleanupPeer();
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      peerRef.current = pc;

      mediaStream.current.getTracks().forEach((track) => {
        if (track.kind === "audio" && !withAudio && !enableAudio) {
          return;
        }
        pc.addTrack(track, mediaStream.current);
      });

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }
        invokeRef
          .current?.(EXAM_MONITORING_METHODS.sendIceCandidate, attemptId, event.candidate.toJSON())
          .catch(() => {});
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await invokeRef.current?.(EXAM_MONITORING_METHODS.sendOffer, attemptId, offer);
    },
    [attemptId, cleanupPeer, enableAudio, mediaStream],
  );

  useEffect(() => {
    startPublishingRef.current = startPublishing;
  }, [startPublishing]);

  const handleHubEvent = useCallback(
    async (eventName, payload) => {
      if (!enabled || Number(payload?.attemptId) !== Number(attemptId)) {
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.teacherRequestedWatch) {
        await startPublishingRef.current?.(Boolean(payload?.enableAudio));
        return;
      }

      if (eventName === EXAM_MONITORING_EVENTS.receiveWebRtcAnswer) {
        const pc = peerRef.current;
        if (!pc || pc.signalingState === "closed") {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
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
          // Ignore duplicate/late ICE candidates.
        }
      }
    },
    [attemptId, enabled],
  );

  const { isConnected, invoke } = useProctoringHubConnection({
    enabled,
    onEvent: handleHubEvent,
  });

  useEffect(() => {
    invokeRef.current = invoke;
  }, [invoke]);

  useEffect(() => {
    if (!enabled) {
      cleanupPeer();
      return undefined;
    }

    let isDisposed = false;

    async function bootstrap() {
      try {
        const configResponse = await proctoringApi.getWebRtcConfig();
        if (!isDisposed) {
          iceServersRef.current = configResponse.data.iceServers;
        }
      } catch {
        // Keep default STUN.
      }

      if (isConnected) {
        await invokeRef.current?.(EXAM_MONITORING_METHODS.studentJoinAttemptStream, attemptId);
      }
    }

    bootstrap();
    return () => {
      isDisposed = true;
      cleanupPeer();
    };
  }, [attemptId, cleanupPeer, enabled, isConnected]);

  useEffect(() => {
    const handleStop = () => cleanupPeer();
    return () => handleStop();
  }, [cleanupPeer]);
}
