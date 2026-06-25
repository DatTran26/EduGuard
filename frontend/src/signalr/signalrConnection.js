import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { getStoredAccessToken } from "../utils/tokenStorage";

function getSignalRBaseUrl() {
  return import.meta.env.VITE_SIGNALR_URL?.trim() || "/hubs";
}

function buildHubUrl(hubPath) {
  const baseUrl = getSignalRBaseUrl().replace(/\/$/, "");
  const normalizedHubPath = hubPath.replace(/^\//, "");

  return `${baseUrl}/${normalizedHubPath}`;
}

export function createSignalRConnection(hubPath) {
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl(hubPath), {
      accessTokenFactory: () => getStoredAccessToken(),
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();
}
