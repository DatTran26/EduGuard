import {
  buildExamMonitoringPathByRole,
  buildProctoringPathByRole,
  routeConfig,
} from "../../../routes/routeConfig";
import { parseDateValue } from "../../../utils/formatDate";

export function isExamLobbyRequired(exam) {
  const startTime = parseDateValue(exam?.startTime);
  if (!startTime) {
    return false;
  }

  return startTime.getTime() > Date.now();
}

const LATE_JOIN_GRACE_MS = 60_000;

export function isLateExamJoin(exam, now = Date.now()) {
  const startTime = parseDateValue(exam?.startTime);
  if (!startTime) {
    return false;
  }

  return now > startTime.getTime() + LATE_JOIN_GRACE_MS;
}

export function shouldRequireDeviceCheckBeforeAttempt(exam) {
  return isProctoringRequired(exam) || (isLateExamJoin(exam) && requiresProctoringCamera(exam));
}

export function buildExamDeviceCheckStorageKey(examId, attemptId) {
  return `exam-device-check:${examId}:${attemptId}`;
}

export function hasPassedExamDeviceCheck(examId, attemptId) {
  if (!examId || !attemptId) {
    return false;
  }

  try {
    return sessionStorage.getItem(buildExamDeviceCheckStorageKey(examId, attemptId)) === "1";
  } catch {
    return false;
  }
}

export function markExamDeviceCheckPassed(examId, attemptId) {
  if (!examId || !attemptId) {
    return;
  }

  try {
    sessionStorage.setItem(buildExamDeviceCheckStorageKey(examId, attemptId), "1");
  } catch {
    // Ignore storage failures.
  }
}

export function isProctoringRequired(exam) {
  return isLiveProctoringRoomAvailable(exam);
}

export function requiresProctoringMicrophone(exam) {
  return Boolean(exam?.settings?.requireMicrophone);
}

export function requiresProctoringCamera(exam) {
  return Boolean(
    exam?.settings?.requireCamera ||
      exam?.settings?.enableLiveProctoring ||
      exam?.settings?.enableCameraProctoring,
  );
}

export function isStudentRealtimeControlEnabled(exam) {
  return Boolean(
    isProctoringRequired(exam) || isLiveProctoringRoomAvailable(exam) || exam?.enableAntiCheat,
  );
}

export function isLiveProctoringRoomAvailable(exam) {
  return Boolean(
    exam?.settings?.enableLiveProctoring ||
      exam?.settings?.requireCamera ||
      exam?.settings?.enableCameraProctoring,
  );
}

export function getProctoringHeartbeatIntervalMs(exam) {
  const seconds = Number(exam?.settings?.cameraHeartbeatIntervalSeconds) || 10;
  return Math.max(seconds, 5) * 1000;
}

export function buildTeacherExamMonitoringPath(exam, role = "Teacher") {
  const examId = Number(exam?.id);
  if (!examId) {
    return role === "Admin" ? routeConfig.adminExamMonitoring : routeConfig.teacherMonitoring;
  }

  if (isLiveProctoringRoomAvailable(exam)) {
    return buildProctoringPathByRole(role, examId);
  }

  return buildExamMonitoringPathByRole(role, examId);
}

export function isTeacherProctoringPath(path) {
  return Boolean(path && String(path).includes("/proctoring"));
}

export function openTeacherProctoringRoom(examId, role = "Teacher") {
  const path = buildProctoringPathByRole(role, examId);
  window.open(path, "_blank", "noopener,noreferrer");
}
