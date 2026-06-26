import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { getStoredAccessToken } from "../utils/tokenStorage";
import { devLog } from "../utils/devLogger";

function getSignalRBaseUrl() {
  return import.meta.env.VITE_SIGNALR_URL?.trim() || "/hubs";
}

function buildHubUrl(hubPath) {
  const baseUrl = getSignalRBaseUrl().replace(/\/$/, "");
  const normalizedHubPath = hubPath.replace(/^\//, "");

  return `${baseUrl}/${normalizedHubPath}`;
}

function attachDevSignalRLogging(connection, hubPath) {
  if (!devLog.isEnabled) {
    return connection;
  }

  connection.onclose((error) => {
    devLog.signalr(`Hub closed: ${hubPath}`, error ?? undefined);
  });

  connection.onreconnecting((error) => {
    devLog.signalr(`Hub reconnecting: ${hubPath}`, error ?? undefined);
  });

  connection.onreconnected((connectionId) => {
    devLog.signalr(`Hub reconnected: ${hubPath}`, { connectionId });
  });

  const originalOn = connection.on.bind(connection);
  connection.on = (methodName, handler) =>
    originalOn(methodName, (...args) => {
      devLog.signalr(`← event ${hubPath}/${methodName}`, args.length === 1 ? args[0] : args);
      return handler(...args);
    });

  const originalInvoke = connection.invoke.bind(connection);
  connection.invoke = async (methodName, ...args) => {
    devLog.signalr(`→ invoke ${hubPath}/${methodName}`, args);
    try {
      const result = await originalInvoke(methodName, ...args);
      devLog.signalr(`← invoke ok ${hubPath}/${methodName}`, result);
      return result;
    } catch (error) {
      devLog.error("signalr", `← invoke fail ${hubPath}/${methodName}`, error);
      throw error;
    }
  };

  return connection;
}

export function createSignalRConnection(hubPath) {
  const connection = new HubConnectionBuilder()
    .withUrl(buildHubUrl(hubPath), {
      accessTokenFactory: () => getStoredAccessToken(),
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();

  attachDevSignalRLogging(connection, hubPath);
  devLog.signalr(`Hub created: ${hubPath}`, { url: buildHubUrl(hubPath) });

  return connection;
}
