function formatDuration(startTime) {
  if (!startTime) {
    return "";
  }

  return ` (${Date.now() - startTime}ms)`;
}

function truncateText(text, maxLength = 320) {
  if (!text || text.length <= maxLength) {
    return text ?? "";
  }

  return `${text.slice(0, maxLength)}…`;
}

export function createDevProxyOptions(target, { webSocket = false } = {}) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    ws: webSocket,
    configure(proxy) {
      proxy.on("proxyReq", (proxyReq, req) => {
        req._eduguardProxyStart = Date.now();
        console.log(`[eduguard-proxy] → ${req.method} ${req.url}`);
      });

      proxy.on("proxyRes", (proxyRes, req) => {
        console.log(
          `[eduguard-proxy] ← ${proxyRes.statusCode} ${req.method} ${req.url}${formatDuration(req._eduguardProxyStart)}`,
        );
      });

      proxy.on("proxyReqWs", (proxyReq, req) => {
        console.log(`[eduguard-proxy] ↔ WS connect ${req.url}`);
      });

      proxy.on("close", () => {
        console.log("[eduguard-proxy] ↔ WS closed");
      });

      proxy.on("error", (error, req) => {
        const method = req?.method ?? "WS";
        const url = req?.url ?? "";
        console.error(`[eduguard-proxy] ✗ ${method} ${url} — ${error.message}`);
      });
    },
  };
}

export function devServerLogger(backendTarget) {
  const clientLogPath = "/__eduguard-client-log";

  return {
    name: "eduguard-dev-server-logger",
    configureServer(server) {
      server.middlewares.use(clientLogPath, (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const entry = JSON.parse(body);
            const detailText =
              entry.detail === undefined || entry.detail === null
                ? ""
                : ` ${truncateText(
                    typeof entry.detail === "string" ? entry.detail : JSON.stringify(entry.detail),
                  )}`;
            const line = `[eduguard:${entry.channel}] ${entry.message}${detailText}`;

            if (entry.level === "error") {
              console.error(line);
            } else if (entry.level === "warn") {
              console.warn(line);
            } else {
              console.log(line);
            }
          } catch {
            // ignore malformed client log payloads
          }

          res.statusCode = 204;
          res.end();
        });
      });

      server.httpServer?.once("listening", () => {
        console.log("");
        console.log("[eduguard-dev] Vite dev server ready");
        console.log(`[eduguard-dev] Proxy /api  → ${backendTarget}`);
        console.log(`[eduguard-dev] Proxy /hubs → ${backendTarget} (WebSocket)`);
        console.log("[eduguard-dev] App logs → terminal [eduguard:api|auth|signalr|proctoring|route]");
        console.log("[eduguard-dev] Proxy logs → terminal [eduguard-proxy]");
        console.log("");
      });
    },
  };
}
