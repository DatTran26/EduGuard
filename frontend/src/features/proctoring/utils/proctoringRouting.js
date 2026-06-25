export function isExamLobbyRequired(exam) {
  if (!exam?.startTime) {
    return false;
  }

  return new Date(exam.startTime).getTime() > Date.now();
}

export function isProctoringRequired(exam) {
  return Boolean(exam?.settings?.requireCamera || exam?.settings?.enableLiveProctoring);
}

export function getProctoringHeartbeatIntervalMs(exam) {
  const seconds = Number(exam?.settings?.cameraHeartbeatIntervalSeconds) || 10;
  return Math.max(seconds, 5) * 1000;
}
