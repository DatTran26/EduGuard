import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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

function stopMediaStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

export function useCameraStream({ enabled = true, audio = false } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const acquireGenerationRef = useRef(0);
  const [status, setStatus] = useState("idle");
  const [micStatus, setMicStatus] = useState(audio ? "idle" : "not-required");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaStream, setMediaStream] = useState(null);
  const [videoMountVersion, setVideoMountVersion] = useState(0);

  const stopStream = useCallback(() => {
    acquireGenerationRef.current += 1;
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setMediaStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const bindStreamToVideo = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || !enabled) {
      return false;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(() => {});
    }

    return true;
  }, [enabled]);

  const setVideoElement = useCallback(
    (node) => {
      videoRef.current = node;

      if (!node) {
        return;
      }

      setVideoMountVersion((previousValue) => previousValue + 1);
    },
    [],
  );

  const startStream = useCallback(async () => {
    if (!enabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setMicStatus(audio ? "unsupported" : "not-required");
      setErrorMessage("Trình duyệt không hỗ trợ camera.");
      setMediaStream(null);
      return null;
    }

    const generation = acquireGenerationRef.current + 1;
    acquireGenerationRef.current = generation;

    setStatus("requesting");
    setMicStatus(audio ? "requesting" : "not-required");
    setErrorMessage("");

    try {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      setMediaStream(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio,
      });

      if (acquireGenerationRef.current !== generation) {
        stopMediaStream(stream);
        return null;
      }

      streamRef.current = stream;
      setMediaStream(stream);
      const nextMicStatus = resolveMicStatus(stream, audio);
      bindStreamToVideo();

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
      if (acquireGenerationRef.current !== generation) {
        return null;
      }

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
      setMediaStream(null);
      return null;
    }
  }, [audio, bindStreamToVideo, enabled]);

  useEffect(() => {
    if (!enabled) {
      stopStream();
      setStatus("idle");
      setMicStatus(audio ? "idle" : "not-required");
      setErrorMessage("");
      return undefined;
    }

    void startStream();

    return () => {
      stopStream();
    };
  }, [audio, enabled, startStream, stopStream]);

  useLayoutEffect(() => {
    if (status !== "ready" || !mediaStream) {
      return;
    }

    if (bindStreamToVideo()) {
      return;
    }

    let frameId = 0;
    let attempts = 0;

    function retryBind() {
      if (bindStreamToVideo() || attempts >= 8) {
        return;
      }

      attempts += 1;
      frameId = window.requestAnimationFrame(retryBind);
    }

    frameId = window.requestAnimationFrame(retryBind);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [bindStreamToVideo, mediaStream, status, videoMountVersion]);

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
  }, [mediaStream, status]);

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
  }, [audio, mediaStream, micStatus, status]);

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
    setVideoElement,
    streamRef,
    mediaStream,
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
