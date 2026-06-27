import axiosClient from "./axiosClient";
import { requestApi } from "./apiHelpers";

function normalizeEmailSettings(data) {
  return {
    enabled: Boolean(data?.enabled),
    host: data?.host ?? "smtp.gmail.com",
    port: Number(data?.port) || 587,
    useSsl: data?.useSsl !== false,
    username: data?.username ?? "",
    hasPassword: Boolean(data?.hasPassword),
    fromAddress: data?.fromAddress ?? "",
    fromName: data?.fromName ?? "EduGuard",
    requireOnRegister: data?.requireOnRegister !== false,
    otpLength: Number(data?.otpLength) || 6,
    otpExpiryMinutes: Number(data?.otpExpiryMinutes) || 10,
    resendCooldownSeconds: Number(data?.resendCooldownSeconds) || 60,
  };
}

export const adminSettingsApi = {
  async getEmailSettings() {
    const apiResponse = await requestApi(() => axiosClient.get("/admin/email-settings"));
    return {
      ...apiResponse,
      data: normalizeEmailSettings(apiResponse.data),
    };
  },

  async updateEmailSettings(payload) {
    const apiResponse = await requestApi(() => axiosClient.put("/admin/email-settings", payload));
    return {
      ...apiResponse,
      data: normalizeEmailSettings(apiResponse.data),
    };
  },

  async sendTestEmail(payload) {
    return requestApi(() => axiosClient.post("/admin/email-settings/test", payload));
  },
};
