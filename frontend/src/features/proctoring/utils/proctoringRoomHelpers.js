const RISK_PRIORITY = { Critical: 0, Warning: 1, Watch: 2, Normal: 3 };

export const PROCTORING_FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "live", label: "Đang live" },
  { id: "highRisk", label: "Rủi ro cao" },
  { id: "critical", label: "Cần xem xét" },
  { id: "cameraError", label: "Camera lỗi" },
  { id: "disconnected", label: "Mất kết nối" },
  { id: "external", label: "Thiết bị ngoài" },
  { id: "submitted", label: "Đã nộp" },
];

export const PROCTORING_VIEW_MODES = [
  { id: "auto", label: "Ưu tiên rủi ro" },
  { id: "grid", label: "Lưới đều" },
  { id: "focused", label: "Tập trung" },
];

export function sortStudentsByRisk(students = []) {
  return [...students].sort((a, b) => {
    const riskDiff = (RISK_PRIORITY[a.riskLevel] ?? 9) - (RISK_PRIORITY[b.riskLevel] ?? 9);
    if (riskDiff !== 0) {
      return riskDiff;
    }
    return (b.suspicionScore ?? 0) - (a.suspicionScore ?? 0);
  });
}

function isLiveStudent(student) {
  const liveStatus = String(student?.liveStatus ?? "").toLowerCase();
  return liveStatus === "active" || liveStatus === "connected" || liveStatus === "streaming";
}

function isCameraError(student) {
  const status = String(student?.cameraStatus ?? "").toLowerCase();
  return status === "off" || status === "error" || status === "denied";
}

function isDisconnected(student) {
  const status = String(student?.connectionStatus ?? "").toLowerCase();
  return status === "offline" || status === "disconnected";
}

function isExternalDevice(student) {
  const status = String(student?.environmentStatus ?? "").toLowerCase();
  return status.includes("external") || status.includes("suspicious");
}

function isHighRisk(student) {
  return student?.riskLevel === "Warning" || student?.riskLevel === "Critical";
}

export function filterStudents(students = [], filterId = "all") {
  switch (filterId) {
    case "live":
      return students.filter(isLiveStudent);
    case "highRisk":
      return students.filter(isHighRisk);
    case "critical":
      return students.filter((student) => student.riskLevel === "Critical");
    case "cameraError":
      return students.filter(isCameraError);
    case "disconnected":
      return students.filter(isDisconnected);
    case "external":
      return students.filter(isExternalDevice);
    case "submitted":
      return students.filter((student) => student.attemptStatus === "Submitted");
    default:
      return students;
  }
}

export function computeRoomStats(students = [], room = null) {
  return {
    inProgress: room?.inProgressCount ?? 0,
    live: room?.liveSessionCount ?? 0,
    submitted: room?.submittedCount ?? 0,
    paused: room?.pausedCount ?? 0,
    slots: room?.maxActiveLiveTiles ?? 9,
    cameraError: students.filter(isCameraError).length,
    disconnected: students.filter(isDisconnected).length,
    highRisk: students.filter(isHighRisk).length,
    critical: students.filter((student) => student.riskLevel === "Critical").length,
    external: students.filter(isExternalDevice).length,
    warnings: students.reduce((sum, student) => sum + (student.warningCount ?? 0), 0),
    evidence: students.reduce((sum, student) => sum + (student.evidenceCount ?? 0), 0),
  };
}

function formatCountdownTimeDisplay(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function buildCountdownState(diffMs, { labelPrefix, mode, urgentThresholdSeconds = 300 }) {
  if (diffMs <= 0) {
    return {
      label: "Đã hết giờ",
      timeDisplay: "00:00",
      isExpired: true,
      isUrgent: false,
      totalSeconds: 0,
      mode,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const timeDisplay = formatCountdownTimeDisplay(totalSeconds);

  return {
    label: `${labelPrefix} ${timeDisplay}`,
    timeDisplay,
    isExpired: false,
    isUrgent: mode === "untilEnd" && totalSeconds <= urgentThresholdSeconds,
    totalSeconds,
    mode,
  };
}

export function getExamCountdownState({ startTime, endTime } = {}, now = Date.now()) {
  const start = startTime ? new Date(startTime) : null;
  if (start && !Number.isNaN(start.getTime()) && start.getTime() > now) {
    return buildCountdownState(start.getTime() - now, {
      labelPrefix: "Bắt đầu sau",
      mode: "untilStart",
    });
  }

  if (!endTime) {
    return null;
  }

  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) {
    return null;
  }

  return buildCountdownState(end.getTime() - now, {
    labelPrefix: "Còn",
    mode: "untilEnd",
  });
}

export function getProctoringRoomSessionPhase(room, now = Date.now()) {
  if (!room) {
    return null;
  }

  if ((room.inProgressCount ?? 0) > 0 || (room.liveSessionCount ?? 0) > 0) {
    return "live";
  }

  const endTime = room.endTime ? new Date(room.endTime) : null;
  if (endTime && !Number.isNaN(endTime.getTime()) && endTime.getTime() <= now) {
    return "ended";
  }

  const startTime = room.startTime ? new Date(room.startTime) : null;
  if (startTime && !Number.isNaN(startTime.getTime()) && startTime.getTime() > now) {
    return "upcoming";
  }

  return "live";
}

export function isProctoringRoomSessionLive(room, now = Date.now()) {
  const phase = getProctoringRoomSessionPhase(room, now);
  if (phase === null) {
    return null;
  }

  return phase !== "ended";
}

export function resolveProctoringRealtimeBadge({
  isRoomLoading,
  sessionPhase = null,
  sessionLive,
  isHubConnected,
}) {
  if (isRoomLoading) {
    return {
      label: "Đang tải phòng…",
      pulse: false,
      tone: "neutral",
    };
  }

  const phase = sessionPhase ?? (sessionLive === false ? "ended" : "live");

  if (phase === "ended") {
    return {
      label: "Phiên đã kết thúc",
      pulse: false,
      tone: "neutral",
    };
  }

  if (phase === "upcoming") {
    return {
      label: isHubConnected ? "Chờ mở đề" : "Đang kết nối realtime…",
      pulse: isHubConnected,
      tone: "connecting",
    };
  }

  if (isHubConnected) {
    return {
      label: "Realtime đã kết nối",
      pulse: true,
      tone: "success",
    };
  }

  return {
    label: "Đang kết nối realtime…",
    pulse: false,
    tone: "connecting",
  };
}
