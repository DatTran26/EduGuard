import { proctoringApi } from "../../../api/proctoringApi";
import { captureVideoFrame } from "./captureVideoFrame";

const lastSnapshotAtByAttempt = new Map();

function canCaptureWithinCooldown(attemptId, cooldownMs) {
  const lastCapturedAt = lastSnapshotAtByAttempt.get(attemptId) ?? 0;
  return Date.now() - lastCapturedAt >= cooldownMs;
}

export async function captureViolationSnapshot({
  attemptId,
  videoRef,
  triggerEventType,
  cooldownMs = 30_000,
}) {
  if (!attemptId || !triggerEventType || !canCaptureWithinCooldown(attemptId, cooldownMs)) {
    return false;
  }

  const video = videoRef?.current;
  if (!video) {
    return false;
  }

  const file = await captureVideoFrame(video);
  if (!file) {
    return false;
  }

  try {
    await proctoringApi.uploadEvidence(attemptId, file, {
      evidenceType: "AutoSnapshot",
      captureSource: "AutoPolicy",
      triggerEventType,
    });
    lastSnapshotAtByAttempt.set(attemptId, Date.now());
    return true;
  } catch {
    return false;
  }
}

export function resetViolationSnapshotCooldown(attemptId) {
  if (attemptId) {
    lastSnapshotAtByAttempt.delete(attemptId);
  }
}
