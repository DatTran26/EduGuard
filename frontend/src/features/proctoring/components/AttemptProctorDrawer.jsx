import { useEffect, useMemo, useRef, useState } from "react";
import { antiCheatApi } from "../../../api/antiCheatApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getAntiCheatEventMeta } from "../../anti-cheat/antiCheatHelpers";
import AiConfidenceBadge from "./AiConfidenceBadge";
import {
  sanitizeAiViolationDescription,
  getAiDetectionMeta,
  isAiViolationLog,
  parseAiDetectionMetadata,
} from "../utils/proctoringAiHelpers";
import { formatTimelineActionDisplay } from "../utils/proctoringActionHelpers";
import {
  getAttemptStatusMeta,
  getCameraStatusMeta,
  getConnectionStatusMeta,
  getLiveStatusMeta,
  resolveTileVideoPlaceholder,
} from "../utils/proctoringStudentStatus";
import AuthenticatedEvidenceMedia from "./AuthenticatedEvidenceMedia";
import RiskBadge from "./RiskBadge";

const DETAIL_TABS = [
  { id: "evidence", label: "Hình ảnh" },
  { id: "violations", label: "Lịch sử vi phạm" },
  { id: "timeline", label: "Timeline" },
];

const VIOLATION_SUB_TABS = [
  { id: "ai", label: "AI" },
  { id: "behavior", label: "Hành vi" },
];

function areViolationLogsEqual(previousLogs, nextLogs) {
  if (previousLogs === nextLogs) {
    return true;
  }

  if (previousLogs.length !== nextLogs.length) {
    return false;
  }

  for (let index = 0; index < previousLogs.length; index += 1) {
    const previousLog = previousLogs[index];
    const nextLog = nextLogs[index];

    if (
      previousLog.id !== nextLog.id ||
      previousLog.type !== nextLog.type ||
      previousLog.description !== nextLog.description ||
      previousLog.occurredAt !== nextLog.occurredAt ||
      previousLog.metadata !== nextLog.metadata
    ) {
      return false;
    }
  }

  return true;
}

function DetailTabBar({ activeTab, onTabChange, counts, isRoom }) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-x-auto rounded-[12px] border p-1",
        isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-surface-sunken",
      )}
      role="tablist"
    >
      <div className="flex min-w-max gap-1">
        {DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? isRoom
                    ? "bg-white/10 text-white"
                    : "bg-surface text-primary shadow-sm"
                  : isRoom
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-secondary hover:text-primary",
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <span>{tab.label}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    isActive
                      ? isRoom
                        ? "bg-white/15 text-slate-200"
                        : "bg-primary/10 text-primary"
                      : isRoom
                        ? "bg-white/5 text-slate-500"
                        : "bg-neutral text-secondary",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EvidenceTabContent({ evidence, attemptId, isRoom }) {
  if (!evidence.length) {
    return (
      <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
        Chưa có bằng chứng hình ảnh.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2">
      {evidence.map((item) => (
        <li
          key={item.id}
          className={cn(
            "overflow-hidden rounded-[12px] border",
            isRoom ? "border-white/10" : "border-border",
          )}
        >
          <AuthenticatedEvidenceMedia
            attemptId={attemptId}
            className="aspect-video w-full object-cover"
            evidenceId={item.id}
            evidenceType={item.evidenceType}
            fileUrl={item.fileUrl}
          />
          <p className={cn("px-2 py-1 text-[11px]", isRoom ? "text-slate-500" : "text-secondary")}>
            {item.evidenceType}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ViolationSubTabBar({ activeSubTab, counts, isRoom, onSubTabChange }) {
  return (
    <div
      className={cn(
        "mb-3 flex gap-1 rounded-[10px] border p-1",
        isRoom ? "border-white/10 bg-white/[0.02]" : "border-border bg-surface-sunken",
      )}
      role="tablist"
      aria-label="Loại vi phạm"
    >
      {VIOLATION_SUB_TABS.map((tab) => {
        const isActive = activeSubTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? isRoom
                  ? "bg-white/10 text-white"
                  : "bg-surface text-primary shadow-sm"
                : isRoom
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-secondary hover:text-primary",
            )}
            onClick={() => onSubTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  isActive
                    ? isRoom
                      ? "bg-white/15 text-slate-200"
                      : "bg-primary/10 text-primary"
                    : isRoom
                      ? "bg-white/5 text-slate-500"
                      : "bg-neutral text-secondary",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ViolationsTabContent({ violationLogs, isLoadingLogs, isRoom, attemptId, initialSubTab = "behavior" }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const aiLogs = useMemo(
    () => violationLogs.filter((log) => isAiViolationLog(log)),
    [violationLogs],
  );
  const behaviorLogs = useMemo(
    () => violationLogs.filter((log) => !isAiViolationLog(log)),
    [violationLogs],
  );
  const subTabCounts = useMemo(
    () => ({
      ai: aiLogs.length,
      behavior: behaviorLogs.length,
    }),
    [aiLogs.length, behaviorLogs.length],
  );
  const displayedLogs = activeSubTab === "ai" ? aiLogs : behaviorLogs;

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [attemptId, initialSubTab]);

  if (isLoadingLogs) {
    return <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>Đang tải log…</p>;
  }

  if (!violationLogs.length) {
    return (
      <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
        Chưa có vi phạm ghi nhận.
      </p>
    );
  }

  return (
    <>
      <ViolationSubTabBar
        activeSubTab={activeSubTab}
        counts={subTabCounts}
        isRoom={isRoom}
        onSubTabChange={setActiveSubTab}
      />

      {!displayedLogs.length ? (
        <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
          {activeSubTab === "ai" ? "Chưa có vi phạm AI." : "Chưa có vi phạm hành vi."}
        </p>
      ) : (
        <ul className={cn("space-y-2 text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
          {displayedLogs.map((log) => {
            const meta = getAntiCheatEventMeta(log.type);
            const aiMeta = parseAiDetectionMetadata(log.metadata);
            const aiDetectionMeta = aiMeta?.detectionType ? getAiDetectionMeta(aiMeta.detectionType) : null;
            const badgeLabel = aiDetectionMeta ? `AI: ${aiDetectionMeta.label}` : meta.label;
            const badgeVariant = aiDetectionMeta?.variant ?? meta.variant;
            const violationDescription = sanitizeAiViolationDescription(log.description);

            return (
              <li
                key={log.id}
                className={cn(
                  "rounded-[12px] border px-3 py-2",
                  isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-neutral",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                  {isAiViolationLog(log) && aiMeta?.detectionType ? (
                    <AiConfidenceBadge confidence={aiMeta.confidence} size="lg" />
                  ) : null}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">{formatShortDateTime(log.occurredAt)}</p>
                {violationDescription ? (
                  <p className={cn("mt-1", isRoom ? "text-slate-300" : "text-primary")}>
                    {violationDescription}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function TimelineTabContent({ recentActions, isRoom }) {
  if (!recentActions.length) {
    return (
      <p className={cn("text-sm", isRoom ? "text-slate-500" : "text-secondary")}>
        Chưa có thao tác giáo viên.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2 text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
      {recentActions.map((action) => {
        const { label, reason } = formatTimelineActionDisplay(action);

        return (
          <li
            key={action.id}
            className={cn(
              "rounded-[12px] border px-3 py-2",
              isRoom ? "border-white/10 bg-white/[0.03]" : "border-border bg-neutral",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("font-medium", isRoom ? "text-slate-200" : "text-primary")}>{label}</p>
              {action.createdAt ? (
                <span className="text-[11px] text-slate-500">{formatShortDateTime(action.createdAt)}</span>
              ) : null}
            </div>
            {reason ? <p className="mt-1">{reason}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function FocusCameraPanel({
  student,
  liveVideoRef,
  remoteStatus,
  videoPlaceholder,
  attemptMeta,
  isAudioEnabled,
  isRoom,
}) {
  return (
    <div
      className={cn(
        "relative h-full min-h-[220px] min-w-0 overflow-hidden",
        isRoom ? "bg-[#060b14]" : "bg-surface-sunken",
      )}
    >
      <video
        ref={liveVideoRef}
        autoPlay
        className="absolute inset-0 h-full w-full object-contain md:object-cover"
        muted={!isAudioEnabled}
        playsInline
      />

      {remoteStatus !== "connected" ? (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm",
            isRoom ? "bg-[#060b14]/90 text-slate-400" : "bg-surface/80 text-secondary",
          )}
        >
          <p className={cn("max-w-md font-semibold", isRoom ? "text-slate-300" : "text-primary")}>
            {remoteStatus === "connecting"
              ? "Đang kết nối live…"
              : videoPlaceholder?.title ?? "Chưa có live stream"}
          </p>
          {videoPlaceholder?.detail ? (
            <p className="max-w-md text-xs leading-relaxed opacity-80">{videoPlaceholder.detail}</p>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-5 py-4 md:px-6">
        <p className={cn("truncate text-lg font-semibold", isRoom ? "text-white" : "text-primary")}>
          {student.studentName}
        </p>
        <p className={cn("truncate text-sm", isRoom ? "text-slate-300" : "text-secondary")}>
          {attemptMeta.label} · #{student.attemptId}
        </p>
      </div>
    </div>
  );
}

export default function AttemptProctorDrawer({
  student,
  detail,
  liveVideoRef,
  remoteStatus,
  isAudioEnabled,
  isClipRecording,
  clipElapsedSeconds,
  onClose,
  onPause,
  onResume,
  onWarn,
  onTerminate,
  onSnapshot,
  onStartClip,
  onStopClip,
  onToggleAudio,
  variant = "default",
  violationRefreshToken = 0,
  initialTab = "evidence",
  initialViolationSubTab = "behavior",
}) {
  const [violationLogs, setViolationLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("evidence");
  const loadedAttemptIdRef = useRef(null);

  useEffect(() => {
    if (!student?.attemptId) {
      setViolationLogs([]);
      loadedAttemptIdRef.current = null;
      return undefined;
    }

    const attemptId = student.attemptId;
    const isInitialLoad = loadedAttemptIdRef.current !== attemptId;
    let isMounted = true;

    if (isInitialLoad) {
      setIsLoadingLogs(true);
    }

    async function loadViolationLogs() {
      try {
        const response = await antiCheatApi.getLogsByAttempt(attemptId);
        if (!isMounted) {
          return;
        }

        const nextLogs = response.data ?? [];
        setViolationLogs((previousLogs) =>
          areViolationLogsEqual(previousLogs, nextLogs) ? previousLogs : nextLogs,
        );
        loadedAttemptIdRef.current = attemptId;
      } catch {
        if (!isMounted) {
          return;
        }

        if (isInitialLoad) {
          setViolationLogs([]);
        }
      } finally {
        if (isMounted && isInitialLoad) {
          setIsLoadingLogs(false);
        }
      }
    }

    const refreshDelayMs = isInitialLoad ? 0 : 500;
    const timeoutId = window.setTimeout(() => {
      loadViolationLogs();
    }, refreshDelayMs);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [student?.attemptId, violationRefreshToken]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, student?.attemptId]);

  if (!student) {
    return null;
  }

  const isRoom = variant === "room";
  const isPaused = student.attemptStatus === "PausedByProctor";
  const attemptMeta = getAttemptStatusMeta(student.attemptStatus);
  const cameraMeta = getCameraStatusMeta(student.cameraStatus);
  const connectionMeta = getConnectionStatusMeta(student.connectionStatus);
  const liveMeta = getLiveStatusMeta(student.liveStatus);
  const latestDetectionType = detail?.state?.latestDetectionType ?? student.latestDetectionType;
  const latestDetectionMeta = latestDetectionType ? getAiDetectionMeta(latestDetectionType) : null;
  const videoPlaceholder = resolveTileVideoPlaceholder({
    student,
    remoteStatus,
    showLiveVideo: remoteStatus === "connected",
    sfuEnabled: false,
    isActive: true,
  });
  const evidence = detail?.evidence ?? [];
  const recentActions = detail?.recentActions ?? [];
  const tabCounts = {
    evidence: evidence.length,
    violations: violationLogs.length,
    timeline: recentActions.length,
  };

  return (
    <>
      <button
        type="button"
        aria-label="Đóng xem chi tiết"
        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 z-40 grid h-[100dvh] w-full grid-cols-1 grid-rows-[minmax(220px,1fr)_min(52dvh,480px)] md:grid-cols-[minmax(0,1fr)_min(480px,38vw)] md:grid-rows-1"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <FocusCameraPanel
          attemptMeta={attemptMeta}
          isAudioEnabled={isAudioEnabled}
          isRoom={isRoom}
          liveVideoRef={liveVideoRef}
          remoteStatus={remoteStatus}
          student={student}
          videoPlaceholder={videoPlaceholder}
        />

        <aside
          className={cn(
            "flex min-h-0 min-w-0 flex-col overflow-hidden border-t shadow-2xl md:border-l md:border-t-0",
            isRoom ? "border-white/10 bg-[#0b1220]" : "border-border bg-surface",
          )}
        >
          <div
            className={cn(
              "grid shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b px-5 py-3",
              isRoom ? "border-white/10" : "border-border",
            )}
          >
            <p className={cn("truncate text-sm font-semibold", isRoom ? "text-slate-200" : "text-primary")}>
              Chi tiết giám sát
            </p>
            <Button
              className={cn(
                "shrink-0",
                isRoom &&
                  "!border !border-white/15 !bg-white !text-slate-900 hover:!bg-slate-100 hover:!text-slate-900",
              )}
              onClick={onClose}
              variant="ghost"
            >
              Đóng
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge riskLevel={student.riskLevel} score={student.suspicionScore} />
              <Badge title={cameraMeta.hint} variant={cameraMeta.variant}>
                Camera: {cameraMeta.label}
              </Badge>
              <Badge title={connectionMeta.hint} variant={connectionMeta.variant}>
                Mạng: {connectionMeta.label}
              </Badge>
              <Badge title={liveMeta.hint} variant={liveMeta.variant}>
                Live: {liveMeta.label}
              </Badge>
              {latestDetectionMeta ? (
                <Badge variant={latestDetectionMeta.variant}>AI: {latestDetectionMeta.label}</Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                className="!px-2 !py-2 text-xs sm:text-sm"
                disabled={remoteStatus !== "connected"}
                onClick={onSnapshot}
                variant="secondary"
              >
                Chụp ảnh
              </Button>
              {isClipRecording ? (
                <Button className="!px-2 !py-2 text-xs sm:text-sm" onClick={onStopClip} variant="danger">
                  Dừng Record ({clipElapsedSeconds}s)
                </Button>
              ) : (
                <Button
                  className="!px-2 !py-2 text-xs sm:text-sm"
                  disabled={remoteStatus !== "connected"}
                  onClick={onStartClip}
                  variant="secondary"
                >
                  Record
                </Button>
              )}
              <Button className="!px-2 !py-2 text-xs sm:text-sm" onClick={onToggleAudio} variant="secondary">
                {isAudioEnabled ? "Tắt mic" : "Bật mic"}
              </Button>
              <Button
                className="!px-2 !py-2 text-xs sm:text-sm"
                onClick={() => onWarn?.(student)}
                variant="secondary"
              >
                Nhắc nhở
              </Button>
              {isPaused ? (
                <Button className="!px-2 !py-2 text-xs sm:text-sm" onClick={() => onResume?.(student)}>
                  Cho tiếp tục
                </Button>
              ) : (
                <Button
                  className="!px-2 !py-2 text-xs sm:text-sm"
                  onClick={() => onPause?.(student)}
                  variant="danger"
                >
                  Tạm dừng thi
                </Button>
              )}
              <Button
                className="!px-2 !py-2 text-xs sm:text-sm"
                onClick={() => onTerminate?.(student)}
                variant="danger"
              >
                Kết thúc bài
              </Button>
            </div>

            <DetailTabBar
              activeTab={activeTab}
              counts={tabCounts}
              isRoom={isRoom}
              onTabChange={setActiveTab}
            />

            <div className="min-h-0 w-full flex-1 overflow-y-auto pb-1">
              {activeTab === "evidence" ? (
                <EvidenceTabContent attemptId={student.attemptId} evidence={evidence} isRoom={isRoom} />
              ) : null}
              {activeTab === "violations" ? (
                <ViolationsTabContent
                  attemptId={student.attemptId}
                  initialSubTab={initialViolationSubTab}
                  isLoadingLogs={isLoadingLogs}
                  isRoom={isRoom}
                  violationLogs={violationLogs}
                />
              ) : null}
              {activeTab === "timeline" ? (
                <TimelineTabContent isRoom={isRoom} recentActions={recentActions} />
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
