import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_MAX_SECONDS = 30;

export function useTeacherClipRecorder({ stream, maxSeconds = DEFAULT_MAX_SECONDS }) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        setIsRecording(false);
        setElapsedSeconds(0);
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        chunksRef.current = [];
        resolve(blob.size > 0 ? blob : null);
      };
      recorder.stop();
    });
  }, [clearTimer]);

  const startRecording = useCallback(() => {
    if (!stream || isRecording) {
      return false;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start(1000);
    setIsRecording(true);
    setElapsedSeconds(0);
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return true;
  }, [clearTimer, isRecording, stream]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    if (elapsedSeconds >= maxSeconds) {
      stopRecording();
    }

    return undefined;
  }, [elapsedSeconds, isRecording, maxSeconds, stopRecording]);

  useEffect(
    () => () => {
      clearTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    },
    [clearTimer],
  );

  return {
    elapsedSeconds,
    isRecording,
    startRecording,
    stopRecording,
  };
}
