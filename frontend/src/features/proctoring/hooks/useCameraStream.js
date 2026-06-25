import { useCallback, useEffect, useRef, useState } from "react";

export function useCameraStream({ enabled = true, audio = false } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");
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
      setErrorMessage("Trình duyệt không hỗ trợ camera.");
      return null;
    }

    setStatus("requesting");
    setErrorMessage("");

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setStatus("ready");
      return stream;
    } catch (error) {
      const name = error?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage("Bạn chưa cấp quyền camera. Vui lòng cấp quyền trong trình duyệt và thử lại.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("not-found");
        setErrorMessage("Không tìm thấy thiết bị camera.");
      } else {
        setStatus("error");
        setErrorMessage(error?.message || "Không thể bật camera.");
      }
      return null;
    }
  }, [audio, enabled, stopStream]);

  useEffect(() => {
    if (!enabled) {
      stopStream();
      setStatus("idle");
      return undefined;
    }

    startStream();
    return () => stopStream();
  }, [enabled, startStream, stopStream]);

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

  return {
    videoRef,
    streamRef,
    status,
    errorMessage,
    isReady: status === "ready",
    startStream,
    stopStream,
  };
}
