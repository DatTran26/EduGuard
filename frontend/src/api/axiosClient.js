import axios from "axios";
import { refreshAccessTokenSilently } from "./auth-token-refresh-service";
import { clearStoredTokens, clearStoredUser, getStoredAccessToken } from "../utils/tokenStorage";
import { devLog } from "../utils/devLogger";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_BYPASS_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/refresh-token",
];

let isRefreshing = false;
let refreshWaitQueue = [];

function isAuthBypassRequest(url = "") {
  const normalizedUrl = url.replace(baseURL, "");
  return AUTH_BYPASS_PATHS.some((path) => normalizedUrl.includes(path));
}

function attachAccessToken(config) {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

function logApiRequest(config) {
  config.metadata = { startTime: Date.now() };
  const method = config.method?.toUpperCase() ?? "GET";
  const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
  devLog.api(`→ ${method} ${url}`, {
    params: config.params,
    data: config.data,
  });
  return config;
}

function logApiResponse(response) {
  const method = response.config.method?.toUpperCase() ?? "GET";
  const url = response.config.url ?? "";
  const duration = Date.now() - (response.config.metadata?.startTime ?? Date.now());
  devLog.api(`← ${response.status} ${method} ${url} (${duration}ms)`, response.data);
  return response;
}

function logApiError(error) {
  const config = error.config;
  const method = config?.method?.toUpperCase() ?? "REQ";
  const url = config?.url ?? "unknown";
  const duration = config?.metadata?.startTime ? Date.now() - config.metadata.startTime : 0;
  const status = error.response?.status ?? "network";
  devLog.warn("api", `← ${status} ${method} ${url} (${duration}ms)`, {
    message: error.response?.data?.message ?? error.message,
    data: error.response?.data,
  });
  return error;
}

function forceLogout() {
  clearStoredTokens();
  clearStoredUser();

  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

function resolveRefreshWaitQueue(error, accessToken = "") {
  refreshWaitQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(accessToken);
  });
  refreshWaitQueue = [];
}

async function handleUnauthorizedError(error) {
  const originalRequest = error.config;

  if (error.response?.status !== 401 || !originalRequest) {
    return Promise.reject(error);
  }

  if (originalRequest._skipAuthRefresh || isAuthBypassRequest(originalRequest.url)) {
    return Promise.reject(error);
  }

  if (originalRequest._retry) {
    devLog.auth("Refresh token thất bại lần 2 — logout");
    forceLogout();
    return Promise.reject(error);
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshWaitQueue.push({ resolve, reject });
    }).then((accessToken) => {
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosClient(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;
  devLog.auth("401 — đang refresh token", { url: originalRequest.url });

  try {
    const session = await refreshAccessTokenSilently();
    devLog.auth("Refresh token thành công", { url: originalRequest.url });
    resolveRefreshWaitQueue(null, session.accessToken);
    originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
    return axiosClient(originalRequest);
  } catch (refreshError) {
    devLog.auth("Refresh token thất bại — logout", refreshError);
    resolveRefreshWaitQueue(refreshError);
    forceLogout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

async function handleForbiddenMaybeStaleRole(error) {
  const originalRequest = error.config;

  if (error.response?.status !== 403 || !originalRequest || originalRequest._roleRefreshRetried) {
    return Promise.reject(error);
  }

  if (originalRequest._skipAuthRefresh || isAuthBypassRequest(originalRequest.url)) {
    return Promise.reject(error);
  }

  const apiMessage =
    error.response?.data?.message ||
    error.response?.data?.data?.message ||
    "";
  const isPermissionDenied =
    typeof apiMessage === "string" &&
    (apiMessage.includes("quyền") || apiMessage.toLowerCase().includes("permission"));

  if (!isPermissionDenied) {
    return Promise.reject(error);
  }

  originalRequest._roleRefreshRetried = true;
  devLog.auth("403 quyền — thử refresh token rồi gọi lại API", { url: originalRequest.url });

  try {
    const session = await refreshAccessTokenSilently();
    originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
    return axiosClient(originalRequest);
  } catch (refreshError) {
    devLog.auth("Refresh token sau 403 thất bại", refreshError);
    return Promise.reject(error);
  }
}

axiosClient.interceptors.request.use((config) => logApiRequest(attachAccessToken(config)), Promise.reject);
axiosClient.interceptors.response.use(logApiResponse, (error) => {
  logApiError(error);

  if (error.response?.status === 401) {
    return handleUnauthorizedError(error);
  }

  if (error.response?.status === 403) {
    return handleForbiddenMaybeStaleRole(error);
  }

  return Promise.reject(error);
});

export default axiosClient;
