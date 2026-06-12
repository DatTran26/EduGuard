import axiosClient from "./axiosClient";
import { requestApi } from "./apiHelpers";
import { normalizeAntiCheatEventType } from "../features/anti-cheat/antiCheatHelpers";

// INTEGRATION STATUS:
// - File này đã map đầy đủ các anti-cheat endpoints thật của backend.
// - Teacher dashboard/detail có thể dùng ngay file này để lấy log, score và summary theo đề thi.

function normalizeCheatingLogDto(logItem) {
  return {
    id: Number(logItem?.id) || 0,
    examAttemptId: Number(logItem?.examAttemptId) || 0,
    type: normalizeAntiCheatEventType(logItem?.type),
    description: logItem?.description ?? "",
    suspicionPoint: Number(logItem?.suspicionPoint) || 0,
    metadata: logItem?.metadata ?? "",
    occurredAt: logItem?.occurredAt ?? null,
  };
}

function normalizeAttemptSummaryDto(attempt) {
  return {
    attemptId: Number(attempt?.attemptId) || 0,
    studentId: Number(attempt?.studentId) || 0,
    studentName: attempt?.studentName ?? "",
    suspicionScore: Number(attempt?.suspicionScore) || 0,
    logCount: Number(attempt?.logCount) || 0,
    status: attempt?.status ?? "",
  };
}

export const antiCheatApi = {
  async log(payload) {
    const apiResponse = await requestApi(() =>
      axiosClient.post("/anti-cheat/logs", {
        examAttemptId: Number(payload.examAttemptId) || 0,
        type: payload.type?.trim() ?? "",
        description: payload.description?.trim() ?? "",
        metadata: payload.metadata?.trim() || null,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeCheatingLogDto(apiResponse.data),
    };
  },

  async getLogsByAttempt(attemptId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/anti-cheat/attempts/${attemptId}/logs`),
    );

    return {
      ...apiResponse,
      data: Array.isArray(apiResponse.data)
        ? apiResponse.data.map((logItem) => normalizeCheatingLogDto(logItem))
        : [],
    };
  },

  async getScoreByAttempt(attemptId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/anti-cheat/attempts/${attemptId}/score`),
    );

    return {
      ...apiResponse,
      data: {
        examAttemptId: Number(apiResponse.data?.examAttemptId) || 0,
        suspicionScore: Number(apiResponse.data?.suspicionScore) || 0,
        logCount: Number(apiResponse.data?.logCount) || 0,
      },
    };
  },

  async getExamSummary(examId) {
    const apiResponse = await requestApi(() =>
      axiosClient.get(`/anti-cheat/exams/${examId}/summary`),
    );

    return {
      ...apiResponse,
      data: {
        examId: Number(apiResponse.data?.examId) || 0,
        examTitle: apiResponse.data?.examTitle ?? "",
        totalAttempts: Number(apiResponse.data?.totalAttempts) || 0,
        flaggedAttempts: Number(apiResponse.data?.flaggedAttempts) || 0,
        totalLogs: Number(apiResponse.data?.totalLogs) || 0,
        attempts: Array.isArray(apiResponse.data?.attempts)
          ? apiResponse.data.attempts.map((attempt) => normalizeAttemptSummaryDto(attempt))
          : [],
      },
    };
  },
};
