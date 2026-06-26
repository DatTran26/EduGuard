import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proctoringApi } from "../../../api/proctoringApi";
import { useToast } from "../../../hooks/useToast";
import {
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import {
  buildStudentExamAttemptPath,
  buildStudentExamDetailPath,
  buildStudentExamPausedPath,
} from "../../../routes/routeConfig";
import { useProctoringHubConnection } from "./useProctoringHubConnection";
import { useStudentSfuPublisher } from "./useStudentSfuPublisher";

export function useStudentAttemptProctoring({
  attemptId,
  examId,
  controlEventsEnabled = false,
  publishEnabled = false,
  mediaStream,
  cameraReady = false,
  enableAudio = false,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const peerRef = useRef(null);
  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const invokeRef = useRef(null);
  const startPublishingRef = useRef(null);
  const pendingWatchRef = useRef(null);
  const sfuEnabledRef = useRef(false);
  const hubEnabled = Boolean(attemptId) && (controlEventsEnabled || publishEnabled);

  const [sfuPublishEnabled, setSfuPublishEnabled] = useState(false);

  const { isConnected: isSfuConnected } = useStudentSfuPublisher({
    attemptId,
    cameraReady,
    enableAudio,
    enabled: publishEnabled && sfuPublishEnabled,
    mediaStream,
  });

  useEffect(() => {
    sfuEnabledRef.current = isSfuConnected;
  }, [isSfuConnected]);

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
      if (sfuEnabledRef.current) {
        return;
      }

      if (!publishEnabled || !mediaStream?.current) {
        pendingWatchRef.current = { enableAudio: withAudio };
        return;
      }

      pendingWatchRef.current = null;
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
    [attemptId, cleanupPeer, enableAudio, mediaStream, publishEnabled],
  );

  useEffect(() => {
    startPublishingRef.current = startPublishing;
  }, [startPublishing]);

  const handleHubEvent = useCallback(
    async (eventName, payload) => {
      if (Number(payload?.attemptId) !== Number(attemptId)) {
        return;
      }

      if (controlEventsEnabled) {
        if (eventName === EXAM_MONITORING_EVENTS.receiveProctoringWarning) {
          showToast({
            tone: "caution",
            title: "Nhắc nhở từ giáo viên",
            message: payload?.message ?? payload?.reason ?? "Hãy tập trung làm bài.",
          });
          return;
        }

        if (eventName === EXAM_MONITORING_EVENTS.studentMovedToWaitingRoom) {
          navigate(buildStudentExamPausedPath(attemptId), { replace: true });
          return;
        }

        if (eventName === EXAM_MONITORING_EVENTS.studentAttemptResumed) {
          showToast({
            tone: "success",
            title: "Được phép tiếp tục",
            message: payload?.reason ?? "Giáo viên đã cho bạn làm bài tiếp.",
          });
          navigate(buildStudentExamAttemptPath(attemptId), { replace: true });
          return;
        }

        if (eventName === EXAM_MONITORING_EVENTS.studentAttemptTerminated) {
          showToast({
            tone: "danger",
            title: "Bài làm đã kết thúc",
            message: payload?.reason ?? "Giáo viên đã kết thúc bài làm của bạn.",
          });
          if (examId) {
            navigate(buildStudentExamDetailPath(examId), { replace: true });
          }
          return;
        }
      }

      if (!publishEnabled) {
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
    [attemptId, controlEventsEnabled, examId, navigate, publishEnabled, showToast],
  );

  const { isConnected, invoke } = useProctoringHubConnection({
    enabled: hubEnabled,
    onEvent: handleHubEvent,
  });

  useEffect(() => {
    invokeRef.current = invoke;
  }, [invoke]);

  useEffect(() => {
    if (!hubEnabled) {
      cleanupPeer();
      pendingWatchRef.current = null;
      return undefined;
    }

    let isDisposed = false;

    async function bootstrap() {
      try {
        const [configResponse, sfuConfigResponse] = await Promise.all([
          proctoringApi.getWebRtcConfig(),
          proctoringApi.getSfuConfig(),
        ]);
        if (!isDisposed) {
          iceServersRef.current = configResponse.data.iceServers;
          setSfuPublishEnabled(Boolean(sfuConfigResponse.data?.enabled));
        }
      } catch {
        // Keep default STUN / P2P fallback.
      }
    }

    bootstrap();
    return () => {
      isDisposed = true;
      cleanupPeer();
      pendingWatchRef.current = null;
    };
  }, [cleanupPeer, hubEnabled]);

  useEffect(() => {
    if (!hubEnabled || !isConnected || !attemptId) {
      return;
    }

    invoke(EXAM_MONITORING_METHODS.studentJoinAttemptStream, attemptId).catch(() => {});
  }, [attemptId, hubEnabled, invoke, isConnected]);

  useEffect(() => {
    if (!publishEnabled || !cameraReady || !pendingWatchRef.current) {
      return;
    }

    const pendingWatch = pendingWatchRef.current;
    startPublishingRef.current?.(pendingWatch.enableAudio).catch(() => {});
  }, [cameraReady, publishEnabled]);

  return { isHubConnected: isConnected };
}
