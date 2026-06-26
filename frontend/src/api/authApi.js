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
      data: normalizeAuthUser(apiResponse.data),
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
