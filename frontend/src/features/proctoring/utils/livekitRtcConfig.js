function iceServerUrls(server) {
  if (!server) {
    return [];
  }
  if (Array.isArray(server.urls)) {
    return server.urls;
  }
  if (typeof server.urls === "string") {
    return [server.urls];
  }
  return [];
}

export function hasTurnIceServers(iceServers = []) {
  return iceServers.some((server) =>
    iceServerUrls(server).some((url) => String(url).toLowerCase().startsWith("turn")),
  );
}

export function buildLiveKitConnectOptions(iceServers = []) {
  if (!hasTurnIceServers(iceServers)) {
    return { autoSubscribe: true };
  }

  return {
    autoSubscribe: true,
    rtcConfig: { iceServers },
  };
}

export function buildLiveKitPublisherConnectOptions(iceServers = []) {
  if (!hasTurnIceServers(iceServers)) {
    return { autoSubscribe: false };
  }

  return {
    autoSubscribe: false,
    rtcConfig: { iceServers },
  };
}
