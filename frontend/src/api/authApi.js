import axiosClient from "./axiosClient";
import {
  normalizeAuthUser,
  normalizeLoginResponseData,
  unwrapApiResponse,
} from "./auth-response-helpers";
import { createApiClientError } from "../utils/apiErrorMessage";

function buildClientError(error) {
  return createApiClientError(error, "Đã có lỗi xảy ra trong lúc gọi API.");
}

async function requestAuthApi(requestFactory) {
  try {
    const response = await requestFactory();
    return unwrapApiResponse(response);
  } catch (error) {
    throw buildClientError(error);
  }
}

export const authApi = {
  async login(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/login", {
        email: payload.email?.trim() ?? "",
        password: payload.password ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: normalizeLoginResponseData(apiResponse.data),
    };
  },

  async register(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/register", {
        fullName: payload.fullName?.trim() ?? "",
        email: payload.email?.trim() ?? "",
        password: payload.password ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: {
        user: normalizeAuthUser(apiResponse.data?.user ?? apiResponse.data),
        requiresEmailVerification: Boolean(apiResponse.data?.requiresEmailVerification),
      },
    };
  },

  async verifyEmail(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/verify-email", {
        email: payload.email?.trim() ?? "",
        code: payload.code?.trim() ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: normalizeLoginResponseData(apiResponse.data),
    };
  },

  async resendVerification(payload) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/resend-verification", {
        email: payload.email?.trim() ?? "",
      }),
    );

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },

  async me() {
    const apiResponse = await requestAuthApi(() => axiosClient.get("/auth/me"));

    return {
      ...apiResponse,
      data: normalizeAuthUser(apiResponse.data),
    };
  },

  async refreshToken(refreshToken) {
    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/refresh-token", {
        refreshToken,
      }),
    );

    return {
      ...apiResponse,
      data: normalizeLoginResponseData(apiResponse.data),
    };
  },

  async logout(refreshToken) {
    if (!refreshToken) {
      return {
        success: true,
        message: "Đăng xuất thành công.",
        data: null,
      };
    }

    const apiResponse = await requestAuthApi(() =>
      axiosClient.post("/auth/logout", {
        refreshToken,
      }),
    );

    return {
      ...apiResponse,
      data: apiResponse.data ?? null,
    };
  },
};
