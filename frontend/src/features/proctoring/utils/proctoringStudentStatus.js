const ATTEMPT_STATUS_META = {
  InProgress: {
    label: "Đang làm bài",
    variant: "caution",
    canWatchLive: true,
  },
  Submitted: {
    label: "Đã nộp bài",
    variant: "success",
    canWatchLive: false,
  },
  PausedByProctor: {
    label: "Tạm dừng bởi GV",
    variant: "danger",
    canWatchLive: true,
  },
};

const CAMERA_STATUS_META = {
  On: { label: "Bật", variant: "success", hint: "Camera đang hoạt động" },
  Off: { label: "Tắt", variant: "danger", hint: "Học sinh đã tắt camera" },
  Denied: { label: "Bị chặn", variant: "danger", hint: "Trình duyệt chặn quyền camera" },
  Error: { label: "Lỗi", variant: "danger", hint: "Không truy cập được camera" },
  Unknown: {
    label: "Chưa rõ",
    variant: "neutral",
    hint: "Chưa nhận tín hiệu camera từ học sinh",
  },
};

const CONNECTION_STATUS_META = {
  Online: { label: "Ổn định", variant: "success", hint: "Kết nối ổn định" },
  Offline: { label: "Mất mạng", variant: "danger", hint: "Học sinh đang offline" },
  Unstable: { label: "Chập chờn", variant: "caution", hint: "Kết nối không ổn định" },
  Disconnected: { label: "Ngắt kết nối", variant: "danger", hint: "Mất kết nối giám sát" },
  Unknown: {
    label: "Chưa rõ",
    variant: "neutral",
    hint: "Chưa nhận heartbeat từ học sinh",
  },
};

const LIVE_STATUS_META = {
  Active: { label: "Đang phát", variant: "success", hint: "Luồng live đang hoạt động" },
  Connected: { label: "Đã kết nối", variant: "success", hint: "Đã kết nối phòng live" },
  Streaming: { label: "Đang stream", variant: "success", hint: "Đang phát video" },
  Inactive: { label: "Chưa phát", variant: "neutral", hint: "Học sinh chưa bật luồng camera" },
  Requested: { label: "Đang chờ", variant: "caution", hint: "Đang chờ học sinh phản hồi" },
};

function normalizeStatusKey(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "Unknown";
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function resolveMeta(map, value, fallbackKey = "Unknown") {
  const key = normalizeStatusKey(value);
  return map[key] ?? map[fallbackKey] ?? { label: key, variant: "neutral", hint: "" };
}

export function getAttemptStatusMeta(status) {
  return resolveMeta(ATTEMPT_STATUS_META, status, "InProgress");
}

export function getCameraStatusMeta(status) {
  return resolveMeta(CAMERA_STATUS_META, status, "Unknown");
}

export function getConnectionStatusMeta(status) {
  return resolveMeta(CONNECTION_STATUS_META, status, "Unknown");
}

export function getLiveStatusMeta(status) {
  return resolveMeta(LIVE_STATUS_META, status, "Inactive");
}

export function canWatchStudentLive(student) {
  return getAttemptStatusMeta(student?.attemptStatus).canWatchLive;
}

export function resolveTileVideoPlaceholder({
  student,
  remoteStatus,
  showLiveVideo,
  sfuEnabled = false,
  isActive = false,
}) {
  if (showLiveVideo) {
    return null;
  }

  const attemptMeta = getAttemptStatusMeta(student?.attemptStatus);
  if (!attemptMeta.canWatchLive) {
    return {
      title: "Không còn camera live",
      detail: `${attemptMeta.label}. Học sinh đã rời phiên làm bài.`,
    };
  }

  if (remoteStatus === "connecting") {
    return {
      title: "Đang kết nối camera…",
      detail: sfuEnabled
        ? "Đang nhận luồng từ phòng SFU."
        : "Đang yêu cầu học sinh phát camera.",
    };
  }

  if (student?.watchedByTeacherName && !isActive) {
    return {
      title: `GV ${student.watchedByTeacherName} đang xem`,
      detail: "Chọn học sinh để chuyển luồng xem.",
    };
  }

  const cameraMeta = getCameraStatusMeta(student?.cameraStatus);
  const liveMeta = getLiveStatusMeta(student?.liveStatus);

  if (String(student?.cameraStatus ?? "").toLowerCase() === "off") {
    return {
      title: "Camera đang tắt",
      detail: cameraMeta.hint,
    };
  }

  if (sfuEnabled) {
    return {
      title: "Đang chờ camera",
      detail:
        liveMeta.hint ||
        "Học sinh cần mở trang làm bài và bật camera để phát lên phòng giám sát.",
    };
  }

  if (isActive) {
    return {
      title: "Chưa có hình ảnh",
      detail: "Đã chọn học sinh — đang chờ học sinh phát camera qua kết nối trực tiếp.",
    };
  }

  return {
    title: "Chọn để xem live",
    detail: "Chế độ P2P chỉ xem được 1 học sinh mỗi lần. Bấm ô này để bật camera.",
  };
}

export const PROCTORING_SIGNAL_ITEMS = [
  { id: "camera", label: "Camera", getMeta: (student) => getCameraStatusMeta(student?.cameraStatus) },
  {
    id: "connection",
    label: "Mạng",
    getMeta: (student) => getConnectionStatusMeta(student?.connectionStatus),
  },
  { id: "live", label: "Live", getMeta: (student) => getLiveStatusMeta(student?.liveStatus) },
];
