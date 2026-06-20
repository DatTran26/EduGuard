import axios from "axios";
import {
  normalizeLoginResponseData,
  unwrapApiResponse,
} from "./auth-response-helpers";
import {
  getStoredRefreshToken,
  setStoredTokens,
  setStoredUser,
} from "../utils/tokenStorage";

export const AUTH_SESSION_REFRESHED_EVENT = "eduguard:session-refreshed";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

let refreshPromise = null;

function dispatchSessionRefreshed(session) {
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_REFRESHED_EVENT, {
      detail: session,
    }),
  );
}

function persistRefreshedSession(session) {
  setStoredTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
  setStoredUser(session.user);
  dispatchSessionRefreshed(session);
}

export async function refreshAccessTokenSilently() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("Không có refresh token.");
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await axios.post(
      `${baseURL}/auth/refresh-token`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const apiResponse = unwrapApiResponse(response);
    const session = normalizeLoginResponseData(apiResponse.data);
    persistRefreshedSession(session);
    return session;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
