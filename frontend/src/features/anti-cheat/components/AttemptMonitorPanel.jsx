import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { antiCheatApi } from "../../../api/antiCheatApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import {
  createExamMonitoringConnection,
  EXAM_MONITORING_EVENTS,
  EXAM_MONITORING_METHODS,
} from "../../../signalr/examMonitoringConnection";
import { formatShortDateTime } from "../../../utils/formatDate";
import {
  getAntiCheatEventMeta,
  getSuspicionScoreMeta,
  normalizeAntiCheatEventType,
} from "../antiCheatHelpers";
import ProctoringRoomLink from "../../proctoring/components/ProctoringRoomLink";
import {
  buildTeacherExamMonitoringPath,
  isLiveProctoringRoomAvailable,
} from "../../proctoring/utils/proctoringRouting";

function buildAttemptSummaryItems(attempts = [], antiCheatSummary = null) {
  const submittedCount = attempts.filter((attempt) => attempt.status === "Submitted").length;
  const inProgressCount = attempts.filter((attempt) => attempt.status === "InProgress").length;
  const flaggedCount = antiCheatSummary?.flaggedAttempts ?? 0;

  return [
    { label: "Tổng lượt làm", value: attempts.length },
    { label: "Đã nộp", value: submittedCount },
    { label: "Đang làm", value: inProgressCount },
    { label: "Bị gắn cờ", value: flaggedCount },
  ];
}

function buildAttemptMonitorItems(attempts = [], antiCheatSummary = null) {
  const summaryMap = new Map(
    (antiCheatSummary?.attempts ?? []).map((attempt) => [attempt.attemptId, attempt]),
  );

  return attempts
    .map((attempt) => {
      const matchedSummary = summaryMap.get(attempt.id);

      return {
        ...attempt,
        logCount: matchedSummary?.logCount ?? 0,
        suspicionScore: matchedSummary?.suspicionScore ?? attempt.suspicionScore ?? 0,
      };
    })
    .sort((firstAttempt, secondAttempt) => {
      if ((secondAttempt.suspicionScore ?? 0) !== (firstAttempt.suspicionScore ?? 0)) {
        return (secondAttempt.suspicionScore ?? 0) - (firstAttempt.suspicionScore ?? 0);
      }

      return new Date(secondAttempt.startedAt || 0) - new Date(firstAttempt.startedAt || 0);
    });
}

function getAttemptStatusMeta(status) {
  if (status === "Submitted") {
    return {
      label: "Đã nộp",
      variant: "success",
    };
  }

  return {
    label: "Đang làm",
    variant: "caution",
  };
}

function getRealtimeStatusMeta(status) {
  if (status === "connected") {
    return { label: "Đang trực tiếp", variant: "success" };
  }

  if (status === "connecting" || status === "reconnecting") {
    return { label: "Đang kết nối", variant: "info" };
  }

  if (status === "disconnected") {
    return { label: "Tạm ngắt", variant: "caution" };
  }

  return { label: "Chưa kết nối", variant: "neutral" };
}

function hasActiveAttempts(attempts = []) {
  return attempts.some((attempt) => attempt.status === "InProgress");
}

function isExamMonitoringSessionLive(exam, attempts = []) {
  if (!exam) {
    return false;
  }

  if (hasActiveAttempts(attempts)) {
    return true;
  }

  if (exam.statusLabel === "Đã đóng") {
    return false;
  }

  return exam.statusLabel === "Đang mở";
}

function resolveMonitoringStatusMeta(realtimeStatus, isSessionLive) {
  if (!isSessionLive) {
    return { label: "Đã kết thúc", variant: "neutral" };
  }

  return getRealtimeStatusMeta(realtimeStatus);
}

function normalizeRealtimeAntiCheatWarning(warning) {
  return {
    id: Number(warning?.logId) || Number(warning?.id) || 0,
    logId: Number(warning?.logId) || Number(warning?.id) || 0,
    examId: Number(warning?.examId) || 0,
    examAttemptId: Number(warning?.examAttemptId) || 0,
    studentId: warning?.studentId ?? "",
    studentName: warning?.studentName ?? "",
    type: normalizeAntiCheatEventType(warning?.type),
    description: warning?.description ?? "",
    suspicionPoint: Number(warning?.suspicionPoint) || 0,
    suspicionScore: Number(warning?.suspicionScore) || 0,
    logCount: Number(warning?.logCount) || 0,
    metadata: warning?.metadata ?? "",
    occurredAt: warning?.occurredAt ?? new Date().toISOString(),
  };
}

export default function AttemptMonitorPanel({
  antiCheatSummary = null,
  embedded = false,
  exam,
  onAntiCheatWarning,
  showToast,
  attempts = [],
}) {
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [selectedAttemptLogs, setSelectedAttemptLogs] = useState([]);
  const [selectedAttemptScore, setSelectedAttemptScore] = useState(null);
  const [isLoadingAttemptDetail, setIsLoadingAttemptDetail] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("idle");
  const selectedAttemptIdRef = useRef(selectedAttemptId);

  const summaryItems = useMemo(
    () => buildAttemptSummaryItems(attempts, antiCheatSummary),
    [antiCheatSummary, attempts],
  );
  const monitorItems = useMemo(
    () => buildAttemptMonitorItems(attempts, antiCheatSummary),
    [antiCheatSummary, attempts],
  );
  const selectedAttempt = monitorItems.find((attempt) => attempt.id === selectedAttemptId) ?? null;
  const selectedScoreMeta = getSuspicionScoreMeta(selectedAttemptScore?.suspicionScore ?? 0);
  const isSessionLive = useMemo(
    () => isExamMonitoringSessionLive(exam, attempts),
    [attempts, exam],
  );
  const realtimeStatusMeta = resolveMonitoringStatusMeta(realtimeStatus, isSessionLive);

  useEffect(() => {
    selectedAttemptIdRef.current = selectedAttemptId;
  }, [selectedAttemptId]);

  useEffect(() => {
    if (!exam?.enableAntiCheat || !exam?.id || !isSessionLive) {
      setRealtimeStatus("idle");
      return undefined;
    }

    let isMounted = true;
    const connection = createExamMonitoringConnection();

    function handleWarning(rawWarning) {
      const warning = normalizeRealtimeAntiCheatWarning(rawWarning);

      onAntiCheatWarning?.(warning);

      if (selectedAttemptIdRef.current === warning.examAttemptId) {
        setSelectedAttemptScore({
          examAttemptId: warning.examAttemptId,
          suspicionScore: warning.suspicionScore,
          logCount: warning.logCount,
        });
        setSelectedAttemptLogs((previousLogs) => [
          warning,
          ...previousLogs.filter((logItem) => logItem.id !== warning.id),
        ]);
      }
    }

    async function startConnection() {
      try {
        setRealtimeStatus("connecting");
        connection.on(EXAM_MONITORING_EVENTS.receiveAntiCheatWarning, handleWarning);
        connection.onreconnecting(() => {
          if (isMounted) {
            setRealtimeStatus("reconnecting");
          }
        });
        connection.onreconnected(async () => {
          try {
            await connection.invoke(EXAM_MONITORING_METHODS.joinExam, Number(exam.id));
            if (isMounted) {
              setRealtimeStatus("connected");
            }
          } catch {
            if (isMounted) {
              setRealtimeStatus("disconnected");
            }
          }
        });
        connection.onclose(() => {
          if (isMounted) {
            setRealtimeStatus("disconnected");
          }
        });

        await connection.start();
        await connection.invoke(EXAM_MONITORING_METHODS.joinExam, Number(exam.id));

        if (isMounted) {
          setRealtimeStatus("connected");
        }
      } catch {
        if (isMounted) {
          setRealtimeStatus("disconnected");
        }
      }
    }

    startConnection();

    return () => {
      isMounted = false;
      connection.off(EXAM_MONITORING_EVENTS.receiveAntiCheatWarning, handleWarning);
      connection
        .invoke(EXAM_MONITORING_METHODS.leaveExam, Number(exam.id))
        .catch(() => {})
        .finally(() => {
          connection.stop().catch(() => {});
        });
    };
  }, [exam?.enableAntiCheat, exam?.id, isSessionLive, onAntiCheatWarning]);

  async function handleInspectAttempt(attemptId) {
    if (!exam.enableAntiCheat) {
      setSelectedAttemptId((previousValue) => (previousValue === attemptId ? null : attemptId));
      return;
    }

    if (selectedAttemptId === attemptId) {
      setSelectedAttemptId(null);
      setSelectedAttemptLogs([]);
      setSelectedAttemptScore(null);
      return;
    }

    setIsLoadingAttemptDetail(true);

    try {
      const [scoreResponse, logsResponse] = await Promise.all([
        antiCheatApi.getScoreByAttempt(attemptId),
        antiCheatApi.getLogsByAttempt(attemptId),
      ]);

      setSelectedAttemptId(attemptId);
      setSelectedAttemptScore(scoreResponse.data);
      setSelectedAttemptLogs(logsResponse.data);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tải anti-cheat thất bại",
        message: error.message || "Không thể tải chi tiết anti-cheat.",
      });
    } finally {
      setIsLoadingAttemptDetail(false);
    }
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-primary">Lượt làm bài</h3>
            <div className="flex flex-wrap items-center gap-2">
              {exam.enableAntiCheat ? (
                <Badge variant="caution">Anti-cheat bật</Badge>
              ) : (
                <Badge variant="neutral">Anti-cheat tắt</Badge>
              )}
              {exam.enableAntiCheat ? (
                <Badge variant={realtimeStatusMeta.variant}>{realtimeStatusMeta.label}</Badge>
              ) : null}
              {exam.isPublished ? (
                isLiveProctoringRoomAvailable(exam) ? (
                  <Button as={ProctoringRoomLink} examId={exam.id}>
                    Vào phòng giám sát
                  </Button>
                ) : (
                  <Button as={Link} to={buildTeacherExamMonitoringPath(exam)} variant="secondary">
                    Xem log anti-cheat
                  </Button>
                )
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
                <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-neutral px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-primary">Lượt làm bài</p>
            {exam.enableAntiCheat ? (
              <Badge variant={realtimeStatusMeta.variant}>{realtimeStatusMeta.label}</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-secondary">
            {summaryItems.map((item) => (
              <span key={item.label}>
                <span className="font-medium text-primary">{item.value}</span> {item.label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {monitorItems.length === 0 ? (
        <EmptyState title="Chưa có lượt làm nào." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-primary">Danh sách lượt làm</h4>
              <span className="text-sm text-secondary">{monitorItems.length} lượt</span>
            </div>

            <div className="space-y-3">
              {monitorItems.map((attempt) => {
                const statusMeta = getAttemptStatusMeta(attempt.status);
                const suspicionMeta = getSuspicionScoreMeta(attempt.suspicionScore);

                return (
                  <button
                    key={attempt.id}
                    className={`w-full rounded-[20px] border px-4 py-4 text-left transition-colors duration-200 ${
                      selectedAttemptId === attempt.id
                        ? "border-tertiary bg-info-muted"
                        : "border-border bg-neutral hover:bg-surface-sunken"
                    }`}
                    type="button"
                    onClick={() => handleInspectAttempt(attempt.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                          <Badge variant={suspicionMeta.variant}>{suspicionMeta.label}</Badge>
                          {exam.enableAntiCheat ? (
                            <Badge variant="neutral">{attempt.logCount} log</Badge>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{attempt.studentName}</p>
                          <p className="mt-1 text-sm text-secondary">
                            Bắt đầu {formatShortDateTime(attempt.startedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-sm text-secondary">
                        <p>Điểm: {typeof attempt.score === "number" ? attempt.score : "--"}</p>
                        <p className="mt-1">Nghi ngờ: {attempt.suspicionScore}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-primary">
                {exam.enableAntiCheat ? "Chi tiết anti-cheat" : "Chi tiết lượt làm"}
              </h4>
              {selectedAttempt ? (
                <Button onClick={() => handleInspectAttempt(selectedAttempt.id)} variant="ghost">
                  Đóng
                </Button>
              ) : null}
            </div>

            {!selectedAttempt ? (
              <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                Chọn một lượt làm để xem chi tiết.
              </div>
            ) : isLoadingAttemptDetail ? (
              <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                Đang tải chi tiết lượt làm...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 rounded-[20px] border border-border bg-neutral p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getAttemptStatusMeta(selectedAttempt.status).variant}>
                      {getAttemptStatusMeta(selectedAttempt.status).label}
                    </Badge>
                    {exam.enableAntiCheat ? (
                      <Badge variant={selectedScoreMeta.variant}>{selectedScoreMeta.label}</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm text-secondary">
                    <p>
                      <span className="font-semibold text-primary">Học sinh:</span>{" "}
                      {selectedAttempt.studentName}
                    </p>
                    <p>
                      <span className="font-semibold text-primary">Bắt đầu:</span>{" "}
                      {formatShortDateTime(selectedAttempt.startedAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-primary">Nộp bài:</span>{" "}
                      {selectedAttempt.submittedAt
                        ? formatShortDateTime(selectedAttempt.submittedAt)
                        : "Chưa nộp"}
                    </p>
                    <p>
                      <span className="font-semibold text-primary">Điểm:</span>{" "}
                      {typeof selectedAttempt.score === "number" ? selectedAttempt.score : "--"}
                    </p>
                    {exam.enableAntiCheat ? (
                      <>
                        <p>
                          <span className="font-semibold text-primary">Điểm nghi ngờ:</span>{" "}
                          {selectedAttemptScore?.suspicionScore ?? selectedAttempt.suspicionScore}
                        </p>
                        <p>
                          <span className="font-semibold text-primary">Tổng log:</span>{" "}
                          {selectedAttemptScore?.logCount ?? selectedAttempt.logCount}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                {exam.enableAntiCheat ? (
                  selectedAttemptLogs.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAttemptLogs.map((logItem) => {
                        const eventMeta = getAntiCheatEventMeta(logItem.type);

                        return (
                          <div
                            key={logItem.id}
                            className="rounded-[16px] border border-border bg-neutral p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={eventMeta.variant}>{eventMeta.label}</Badge>
                                <Badge variant="neutral">{logItem.suspicionPoint} điểm</Badge>
                              </div>
                              <p className="text-sm text-secondary">
                                {formatShortDateTime(logItem.occurredAt)}
                              </p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-primary">
                              {logItem.description}
                            </p>
                            {logItem.metadata ? (
                              <p className="mt-2 font-mono text-xs leading-5 text-secondary">
                                {logItem.metadata}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                      Chưa có log anti-cheat nào.
                    </div>
                  )
                ) : (
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    Đề thi này không bật anti-cheat.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
