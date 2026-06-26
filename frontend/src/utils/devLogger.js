const isDev = import.meta.env.DEV;
const loggingEnabled = isDev && import.meta.env.VITE_DEV_LOG !== "false";
const terminalLoggingEnabled =
  loggingEnabled && import.meta.env.VITE_DEV_LOG_TERMINAL !== "false";

const CLIENT_LOG_PATH = "/__eduguard-client-log";

const CHANNEL_STYLES = {
  api: "color:#2563eb;font-weight:700",
  signalr: "color:#7c3aed;font-weight:700",
  auth: "color:#059669;font-weight:700",
  proctoring: "color:#d97706;font-weight:700",
  route: "color:#64748b;font-weight:700",
  app: "color:#0284c7;font-weight:700",
};

function formatTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
}

function summarizePayload(payload) {
  if (payload === null || typeof payload === "undefined") {
    return undefined;
  }

  try {
    const text = JSON.stringify(payload);
    if (text.length <= 500) {
      return payload;
    }

    return `${text.slice(0, 500)}… (${text.length} chars)`;
  } catch {
    return payload;
  }
}

function forwardToTerminal(channel, message, detail, level = "info") {
  if (!terminalLoggingEnabled || typeof fetch === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    channel,
    message: `${formatTime()} ${message}`,
    detail: summarizePayload(detail),
    level,
  });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        CLIENT_LOG_PATH,
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }
  } catch {
    // fall through to fetch
  }

  fetch(CLIENT_LOG_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

function write(channel, message, detail) {
  if (!loggingEnabled) {
    return;
  }

  forwardToTerminal(channel, message, detail, "info");

  const label = `%c[EduGuard:${channel}]%c ${formatTime()} ${message}`;
  const channelStyle = CHANNEL_STYLES[channel] ?? "color:#475569;font-weight:700";

  if (typeof detail === "undefined") {
    console.log(label, channelStyle, "color:inherit");
    return;
  }

  console.groupCollapsed(label, channelStyle, "color:inherit");
  console.log(summarizePayload(detail));
  console.groupEnd();
}

export const devLog = {
  isEnabled: loggingEnabled,

  api(message, detail) {
    write("api", message, detail);
  },

  signalr(message, detail) {
    write("signalr", message, detail);
  },

  auth(message, detail) {
    write("auth", message, detail);
  },

  proctoring(message, detail) {
    write("proctoring", message, detail);
  },

  route(message, detail) {
    write("route", message, detail);
  },

  app(message, detail) {
    write("app", message, detail);
  },

  warn(channel, message, detail) {
    if (!loggingEnabled) {
      return;
    }

    forwardToTerminal(channel, message, detail, "warn");

    const label = `[EduGuard:${channel}] ${formatTime()} ${message}`;
    if (typeof detail === "undefined") {
      console.warn(label);
      return;
    }

    console.warn(label, summarizePayload(detail));
  },

  error(channel, message, detail) {
    if (!loggingEnabled) {
      return;
    }

    forwardToTerminal(channel, message, detail, "error");

    const label = `[EduGuard:${channel}] ${formatTime()} ${message}`;
    if (typeof detail === "undefined") {
      console.error(label);
      return;
    }

    console.error(label, detail);
  },
};

export function logDevBanner() {
  if (!loggingEnabled) {
    return;
  }

  console.info(
    "%c EduGuard dev logging ON %c Terminal CMD + Browser console — tắt: VITE_DEV_LOG=false ",
    "background:#0f172a;color:#f8fafc;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:700",
    "background:#e2e8f0;color:#334155;padding:4px 8px;border-radius:0 4px 4px 0",
  );
  devLog.app("Frontend dev mode", {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
    signalrUrl: import.meta.env.VITE_SIGNALR_URL || "/hubs",
    apiTarget: import.meta.env.VITE_DEV_API_TARGET || "http://127.0.0.1:5157 (vite proxy default)",
  });
}
