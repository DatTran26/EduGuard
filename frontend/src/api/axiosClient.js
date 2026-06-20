import axios from "axios";
import { refreshAccessTokenSilently } from "./auth-token-refresh-service";
import { clearStoredTokens, clearStoredUser, getStoredAccessToken } from "../utils/tokenStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_BYPASS_PATHS = ["/auth/login", "/auth/register", "/auth/refresh-token"];

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

  try {
    const session = await refreshAccessTokenSilently();
    resolveRefreshWaitQueue(null, session.accessToken);
    originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
    return axiosClient(originalRequest);
  } catch (refreshError) {
    resolveRefreshWaitQueue(refreshError);
    forceLogout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

axiosClient.interceptors.request.use(attachAccessToken, Promise.reject);
axiosClient.interceptors.response.use((response) => response, handleUnauthorizedError);

export default axiosClient;
