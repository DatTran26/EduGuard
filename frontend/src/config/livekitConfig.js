const DEFAULT_LIVEKIT_URL = "ws://localhost:7880";

/**
 * LiveKit WebSocket URL for the browser.
 * Priority: VITE_LIVEKIT_URL → API response → derived host → ws://localhost:7880
 */
export function resolveLiveKitUrl(apiUrl) {
  const fromEnv = import.meta.env.VITE_LIVEKIT_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromApi = typeof apiUrl === "string" ? apiUrl.trim() : "";
  if (fromApi && !isLocalhostLiveKitUrl(fromApi)) {
    return fromApi;
  }

  if (typeof window !== "undefined") {
    const derived = deriveLiveKitUrlFromPage(window.location, fromApi);
    if (derived) {
      return derived;
    }
  }

  if (fromApi) {
    return fromApi;
  }

  return DEFAULT_LIVEKIT_URL;
}

function isLocalhostLiveKitUrl(url) {
  return /^(ws|wss):\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}

function deriveLiveKitUrlFromPage(location, apiUrl) {
  const host = location.hostname?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (!apiUrl || isLocalhostLiveKitUrl(apiUrl)) {
      return `${protocol}//${host}:7880`;
    }
    return null;
  }

  const hostParts = host.split(".").filter(Boolean);
  if (hostParts.length >= 2 && (!apiUrl || isLocalhostLiveKitUrl(apiUrl))) {
    const baseDomain = hostParts.slice(-2).join(".");
    return `${protocol}//livekit.${baseDomain}`;
  }

  return null;
}

export function getConfiguredLiveKitUrl() {
  return resolveLiveKitUrl(null);
}
