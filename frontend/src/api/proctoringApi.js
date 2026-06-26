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
    requiresAutoSnapshot: Boolean(data?.requiresAutoSnapshot),
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

  async getSfuConfig() {
    const apiResponse = await requestApi(() => axiosClient.get("/proctoring/sfu-config"));
    return {
      ...apiResponse,
      data: {
        enabled: Boolean(apiResponse.data?.enabled),
        mode: apiResponse.data?.mode ?? "livekit",
        url: apiResponse.data?.url ?? null,
        iceServers: apiResponse.data?.iceServers ?? [{ urls: "stun:stun.l.google.com:19302" }],
      },
    };
  },

  async getTeacherSfuToken(examId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/exams/${examId}/proctoring/sfu-token`),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async getStudentSfuToken(attemptId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/attempts/${attemptId}/proctoring/sfu-token`),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async getRoom(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/proctoring/room`));
    return { ...apiResponse, data: apiResponse.data };
  },

  async getStates(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/proctoring/states`));
    return { ...apiResponse, data: apiResponse.data ?? [] };
  },

  async getAttemptDetail(attemptId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/attempts/${attemptId}/proctoring/detail`),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async requestWatch(attemptId) {
    return requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/live-proctoring/request`),
    );
  },

  async stopWatch(attemptId) {
    return requestApi(() => axiosClient.post(`/attempts/${attemptId}/live-proctoring/stop`));
  },

  async pauseAttempt(attemptId, reason) {
    return requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/move-to-waiting-room`, { reason }),
    );
  },

  async resumeAttempt(attemptId, reason = "") {
    return requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/resume`, { reason }),
    );
  },

  async warnStudent(attemptId, reason) {
    return requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/warn`, { reason }),
    );
  },

  async getProctors(examId) {
    const apiResponse = await requestApi(() => axiosClient.get(`/exams/${examId}/proctors`));
    return { ...apiResponse, data: apiResponse.data ?? [] };
  },

  async getProctorCandidates(examId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/exams/${examId}/proctors/candidates`),
    );
    return { ...apiResponse, data: apiResponse.data ?? [] };
  },

  async getAssignedExams() {
    const apiResponse = await requestApi(() =>
      axiosClient.get("/teacher/proctoring/assigned-exams"),
    );
    return { ...apiResponse, data: apiResponse.data ?? [] };
  },

  async addProctor(examId, teacherId) {
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/exams/${examId}/proctors`, { teacherId }),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async removeProctor(examId, teacherId) {
    return requestApi(() => axiosClient.delete(`/exams/${examId}/proctors/${teacherId}`));
  },

  async terminateAttempt(attemptId, reason) {
    return requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/terminate`, { reason }),
    );
  },

  async uploadEvidence(attemptId, file, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("evidenceType", options.evidenceType ?? "Snapshot");
    formData.append("captureSource", options.captureSource ?? "TeacherManual");
    if (options.triggerEventType) {
      formData.append("triggerEventType", options.triggerEventType);
    }

    const apiResponse = await requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async detectFrame(attemptId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const apiResponse = await requestApi(() =>
      axiosClient.post(`/attempts/${attemptId}/proctoring/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
    return { ...apiResponse, data: apiResponse.data };
  },

  async getAiSettings() {
    const apiResponse = await requestApi(() => axiosClient.get("/admin/proctoring/ai-settings"));
    return { ...apiResponse, data: apiResponse.data };
  },

  async updateAiSettings(payload) {
    const apiResponse = await requestApi(() => axiosClient.put("/admin/proctoring/ai-settings", payload));
    return { ...apiResponse, data: apiResponse.data };
  },
};
