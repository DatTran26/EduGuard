import { useCallback, useEffect, useRef, useState } from "react";

function resolveMicStatus(stream, audioRequested) {
  if (!audioRequested) {
    return "not-required";
  }

  if (!stream) {
    return "idle";
  }

  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack) {
    return "not-found";
  }

  return audioTrack.readyState === "live" ? "ready" : "off";
}

function isStreamReady(status, micStatus, audioRequested) {
  if (status !== "ready") {
    return false;
  }

  if (!audioRequested) {
    return true;
  }

  return micStatus === "ready";
}

export function useCameraStream({ enabled = true, audio = false } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [micStatus, setMicStatus] = useState(audio ? "idle" : "not-required");
  const [errorMessage, setErrorMessage] = useState("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!enabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setMicStatus(audio ? "unsupported" : "not-required");
      setErrorMessage("Trình duyệt không hỗ trợ camera.");
      return null;
    }

    setStatus("requesting");
    setMicStatus(audio ? "requesting" : "not-required");
    setErrorMessage("");

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio,
      });
      streamRef.current = stream;
      const nextMicStatus = resolveMicStatus(stream, audio);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      if (audio && nextMicStatus !== "ready") {
        setStatus("error");
        setMicStatus(nextMicStatus);
        setErrorMessage("Không tìm thấy micro hoặc micro chưa sẵn sàng.");
        return null;
      }

      setStatus("ready");
      setMicStatus(nextMicStatus);
      return stream;
    } catch (error) {
      const name = error?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setMicStatus(audio ? "denied" : "not-required");
        setErrorMessage(
          audio
            ? "Bạn chưa cấp quyền camera hoặc micro. Vui lòng cấp quyền trong trình duyệt và thử lại."
            : "Bạn chưa cấp quyền camera. Vui lòng cấp quyền trong trình duyệt và thử lại.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("not-found");
        setMicStatus(audio ? "not-found" : "not-required");
        setErrorMessage(
          audio
            ? "Không tìm thấy thiết bị camera hoặc micro."
            : "Không tìm thấy thiết bị camera.",
        );
      } else {
        setStatus("error");
        setMicStatus(audio ? "error" : "not-required");
        setErrorMessage(error?.message || "Không thể bật camera.");
      }
      return null;
    }
  }, [audio, enabled, stopStream]);

  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStatus("idle");
      setMicStatus(audio ? "idle" : "not-required");
      setErrorMessage("");
      return undefined;
    }

    // getUserMedia must run after mount when enabled flips on.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startStream();
    return () => stopStream();
  }, [audio, enabled, startStream, stopStream]);

  useEffect(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!enabled || !stream || !video || status !== "ready") {
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [enabled, status]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) {
      return undefined;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      return undefined;
    }

    const handleEnded = () => setStatus("off");
    videoTrack.addEventListener("ended", handleEnded);
    return () => videoTrack.removeEventListener("ended", handleEnded);
  }, [status]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream || !audio) {
      return undefined;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      return undefined;
    }

    const handleEnded = () => setMicStatus("off");
    audioTrack.addEventListener("ended", handleEnded);
    return () => audioTrack.removeEventListener("ended", handleEnded);
  }, [audio, micStatus, status]);

  const toggleCamera = useCallback(() => {
    const stream = streamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];

    if (!videoTrack) {
      void startStream();
      return;
    }

    const nextEnabled = !videoTrack.enabled;
    videoTrack.enabled = nextEnabled;
    setStatus(nextEnabled ? "ready" : "off");
    setErrorMessage("");
  }, [startStream]);

  const toggleMicrophone = useCallback(() => {
    const stream = streamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    const nextEnabled = !audioTrack.enabled;
    audioTrack.enabled = nextEnabled;
    setMicStatus(nextEnabled ? "ready" : "off");
  }, []);

  const isCameraOn = status === "ready";
  const isMicOn = !audio || micStatus === "ready";
  const isMicReady = !audio || micStatus === "ready";

  return {
    videoRef,
    streamRef,
    status: enabled ? status : "idle",
    micStatus: enabled ? micStatus : audio ? "idle" : "not-required",
    errorMessage,
    isMicReady,
    isCameraOn: enabled && isCameraOn,
    isMicOn: enabled && isMicOn,
    isReady: enabled && isStreamReady(status, micStatus, audio),
    startStream,
    stopStream,
    toggleCamera,
    toggleMicrophone,
  };
}
