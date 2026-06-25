import axiosClient from "./axiosClient";
import { requestApi } from "./apiHelpers";

function normalizeLobbyStatus(data) {
  return {
    examId: Number(data?.examId) || 0,
    examTitle: data?.examTitle ?? "",
    startTime: data?.startTime ?? null,
    endTime: data?.endTime ?? null,
    isOpen: Boolean(data?.isOpen),
    requireCamera: Boolean(data?.requireCamera),
    requireFullscreen: Boolean(data?.requireFullscreen),
    secondsUntilOpen: Number(data?.secondsUntilOpen) || 0,
    waitingStudentCount: Number(data?.waitingStudentCount) || 0,
  };
}

function normalizeProctoringState(data) {
  return {
    cameraStatus: data?.cameraStatus ?? "Unknown",
    liveStatus: data?.liveStatus ?? "Inactive",
    fullscreenStatus: data?.fullscreenStatus ?? "Unknown",
    connectionStatus: data?.connectionStatus ?? "Unknown",
    environmentStatus: data?.environmentStatus ?? "Normal",
    latestDetectionType: data?.latestDetectionType ?? null,
    warningCount: Number(data?.warningCount) || 0,
    evidenceCount: Number(data?.evidenceCount) || 0,
    suspicionScore: Number(data?.suspicionScore) || 0,
    riskLevel: data?.riskLevel ?? "Normal",
    lastHeartbeatAt: data?.lastHeartbeatAt ?? null,
    latestWarningAt: data?.latestWarningAt ?? null,
  };
}

export const proctoringApi = {
  async getLobbyStatus(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/lobby`));
    return { ...apiResponse, data: normalizeLobbyStatus(apiResponse.data) };
  },

  async joinLobby(examId, cameraReady) {
    return requestApi(() =>
      axiosClient.post(`/exams/${examId}/lobby/join`, { cameraReady: Boolean(cameraReady) }),
    );
  },

  async heartbeatLobby(examId, cameraReady) {
    return requestApi(() =>
      axiosClient.post(`/exams/${examId}/lobby/heartbeat`, { cameraReady: Boolean(cameraReady) }),
    );
  },

  async leaveLobby(examId) {
    return requestApi(() => axiosClient.post(`/exams/${examId}/lobby/leave`));
  },

  async startProctoring(attemptId) {
    return requestApi(() => axiosClient.post(`/attempts/${attemptId}/proctoring/start`));
  },

  async heartbeatProctoring(attemptId, payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/heartbeat`, payload),
    );
    return { ...apiResponse, data: normalizeProctoringState(apiResponse.data) };
  },

  async stopProctoring(attemptId) {
    return requestApi(() => axiosClient.post(`/attempts/${attemptId}/proctoring/stop`));
  },

  async getAttemptState(attemptId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/attempts/${attemptId}/proctoring/state`),
    );
    return { ...apiResponse, data: normalizeProctoringState(apiResponse.data) };
  },

  async getWebRtcConfig() {
    const apiResponse = await requestApi(() => axiosClient.get("/proctoring/webrtc-config"));
    return {
      ...apiResponse,
      data: {
        iceServers: apiResponse.data?.iceServers ?? [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };
  },
};
