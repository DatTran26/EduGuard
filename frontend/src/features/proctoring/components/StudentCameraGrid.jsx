import StudentLiveTile from "./StudentLiveTile";
import { cn } from "../../../utils/cn";

export default function StudentCameraGrid({
  students = [],
  activeAttemptId,
  isAudioEnabled = false,
  globalAiEnabled = true,
  disabledAiAttemptIds = null,
  remoteStream,
  remoteStatus,
  sfuEnabled = false,
  sfuConnectionStatus = null,
  getStreamForAttempt,
  getVideoTrackForAttempt,
  getStatusForAttempt,
  onSelectStudent,
  onRequestWatch,
  onToggleStudentAi,
  onViewViolationHistory,
  viewMode = "auto",
}) {
  if (!students.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-base font-medium text-slate-200">Chưa có học sinh trong phòng giám sát</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Học sinh sẽ xuất hiện khi bắt đầu làm bài và bật camera. Thử đổi bộ lọc hoặc làm mới trạng thái.
        </p>
        {sfuEnabled && sfuConnectionStatus === "connecting" ? (
          <p className="mt-3 text-xs text-sky-300">Đang kết nối SFU (LiveKit)…</p>
        ) : null}
      </div>
    );
  }

  const hasWatchableStudents = students.some((student) => {
    const status = String(student.attemptStatus ?? "");
    return status === "InProgress" || status === "PausedByProctor";
  });

  function resolveTileVideoTrack(student) {
    if (sfuEnabled && getVideoTrackForAttempt) {
      return getVideoTrackForAttempt(student.attemptId);
    }
    return null;
  }

  function resolveTileStream(student) {
    if (sfuEnabled && getStreamForAttempt) {
      return getStreamForAttempt(student.attemptId);
    }
    return activeAttemptId === student.attemptId ? remoteStream : null;
  }

  function resolveTileStatus(student) {
    if (sfuEnabled && getStatusForAttempt) {
      return getStatusForAttempt(student.attemptId);
    }
    return activeAttemptId === student.attemptId ? remoteStatus : "idle";
  }

  function resolveStudentAiEnabled(student) {
    if (!disabledAiAttemptIds) {
      return true;
    }

    return !disabledAiAttemptIds.has(student.attemptId);
  }

  function renderTileProps(student, extra = {}) {
    return {
      globalAiEnabled,
      isStudentAiEnabled: resolveStudentAiEnabled(student),
      isAudioEnabled,
      onRequestWatch,
      onSelect: onSelectStudent,
      onToggleStudentAi,
      onViewViolationHistory,
      remoteStatus: resolveTileStatus(student),
      remoteStream: resolveTileStream(student),
      remoteVideoTrack: resolveTileVideoTrack(student),
      sfuEnabled,
      student,
      ...extra,
    };
  }

  function renderP2pHint() {
    if (sfuEnabled || !hasWatchableStudents) {
      return null;
    }

    return (
      <div className="rounded-[14px] border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
        <span className="font-semibold">Chế độ xem trực tiếp (P2P):</span> mỗi lần chỉ xem được 1 học sinh.
        Bấm ô học sinh đang làm bài để yêu cầu camera live.
      </div>
    );
  }

  if (viewMode === "focused" && activeAttemptId) {
    const activeStudent = students.find((student) => student.attemptId === activeAttemptId);
    const otherStudents = students.filter((student) => student.attemptId !== activeAttemptId);

    return (
      <div className="space-y-4">
        {renderP2pHint()}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          {activeStudent ? (
            <StudentLiveTile {...renderTileProps(activeStudent, { isActive: true, isFocused: true })} />
          ) : null}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Danh sách học sinh</p>
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
              {otherStudents.map((student) => (
                <StudentLiveTile
                  key={student.attemptId}
                  {...renderTileProps(student, { compact: true, isActive: false })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderP2pHint()}
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4",
        )}
      >
        {students.map((student) => (
          <StudentLiveTile
            key={student.attemptId}
            {...renderTileProps(student, { isActive: activeAttemptId === student.attemptId })}
          />
        ))}
      </div>
    </div>
  );
}
