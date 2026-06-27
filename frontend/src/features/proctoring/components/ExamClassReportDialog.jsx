import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";
import { formatShortDateTime } from "../../../utils/formatDate";
import { getSuspicionScoreMeta } from "../../anti-cheat/antiCheatHelpers";
import { getAttemptStatusMeta } from "../utils/proctoringStudentStatus";

function buildReportRows(attempts = [], antiCheatSummary = null) {
  const summaryMap = new Map(
    (antiCheatSummary?.attempts ?? []).map((item) => [item.attemptId, item]),
  );

  return attempts
    .map((attempt) => {
      const summary = summaryMap.get(attempt.id);
      return {
        attemptId: attempt.id,
        studentName: attempt.studentName,
        status: attempt.status,
        score: attempt.score,
        suspicionScore: summary?.suspicionScore ?? attempt.suspicionScore ?? 0,
        logCount: summary?.logCount ?? 0,
        submittedAt: attempt.submittedAt,
        startedAt: attempt.startedAt,
      };
    })
    .sort((first, second) => {
      if ((second.suspicionScore ?? 0) !== (first.suspicionScore ?? 0)) {
        return (second.suspicionScore ?? 0) - (first.suspicionScore ?? 0);
      }

      return (first.studentName ?? "").localeCompare(second.studentName ?? "", "vi");
    });
}

function areReportRowsEqual(previousRows, nextRows) {
  if (previousRows.length !== nextRows.length) {
    return false;
  }

  return previousRows.every((row, index) => {
    const nextRow = nextRows[index];
    return (
      row.attemptId === nextRow.attemptId &&
      row.studentName === nextRow.studentName &&
      row.status === nextRow.status &&
      row.score === nextRow.score &&
      row.suspicionScore === nextRow.suspicionScore &&
      row.logCount === nextRow.logCount &&
      row.submittedAt === nextRow.submittedAt &&
      row.startedAt === nextRow.startedAt
    );
  });
}

function resolveScoreOrStatus(row) {
  if (row.status === "Submitted") {
    return typeof row.score === "number" ? `${row.score} đ` : "Đã nộp";
  }

  if (row.status === "PausedByProctor") {
    return { label: "Tạm dừng", variant: "caution" };
  }

  if (row.status === "InProgress") {
    return { label: "Đang làm", variant: "info" };
  }

  if (row.status === "Terminated") {
    return { label: "Đã kết thúc", variant: "danger" };
  }

  return { label: getAttemptStatusMeta(row.status).label, variant: "neutral" };
}

const MAX_VISIBLE_ROWS = 10;
const ROW_HEIGHT_REM = 2.75;

export default function ExamClassReportDialog({ examId, examTitle, isOpen, onClose, refreshToken = 0 }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTokenRef = useRef(refreshToken);

  const loadReport = useCallback(async ({ silent = false, showRefreshIndicator = false } = {}) => {
    if (!examId) {
      return;
    }

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else if (!silent) {
      setIsLoading(true);
    }

    try {
      const [attemptResponse, summaryResponse] = await Promise.all([
        examAttemptApi.getByExam(examId),
        antiCheatApi.getExamSummary(examId).catch(() => ({ data: null })),
      ]);
      const nextRows = buildReportRows(attemptResponse.data ?? [], summaryResponse.data);
      const nextSummary = summaryResponse.data;

      setRows((previousRows) => (areReportRowsEqual(previousRows, nextRows) ? previousRows : nextRows));
      setSummary((previousSummary) => (previousSummary === nextSummary ? previousSummary : nextSummary));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      refreshTokenRef.current = refreshToken;
      return undefined;
    }

    loadReport();
    const intervalId = window.setInterval(() => {
      loadReport({ silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [isOpen, loadReport]);

  useEffect(() => {
    if (!isOpen || refreshToken === refreshTokenRef.current) {
      refreshTokenRef.current = refreshToken;
      return;
    }

    refreshTokenRef.current = refreshToken;
    loadReport({ silent: true });
  }, [isOpen, loadReport, refreshToken]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const stats = useMemo(() => {
    const submitted = rows.filter((row) => row.status === "Submitted");
    const inProgress = rows.filter((row) => row.status === "InProgress" || row.status === "PausedByProctor");
    const scores = submitted
      .map((row) => row.score)
      .filter((score) => typeof score === "number");
    const average =
      scores.length > 0
        ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
        : null;

    return {
      total: rows.length,
      submitted: submitted.length,
      inProgress: inProgress.length,
      flagged: summary?.flaggedAttempts ?? rows.filter((row) => row.suspicionScore >= 10).length,
      average,
    };
  }, [rows, summary]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) =>
      (row.studentName ?? "").toLocaleLowerCase("vi").includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Đóng báo cáo lớp"
        className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby="exam-class-report-title"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[min(90dvh,820px)] w-full max-w-4xl flex-col overflow-hidden",
          "rounded-[20px] border border-white/10 bg-[#0b1220] shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
        )}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-300/90">
              Báo cáo lớp
            </p>
            <h2 className="text-lg font-semibold text-white" id="exam-class-report-title">
              {examTitle ?? "Điểm & tình trạng thi"}
            </h2>
            <p className="text-sm text-slate-400">
              Cập nhật theo thời gian thực — học sinh đang làm hiển thị trạng thái thay vì điểm.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
              disabled={isRefreshing}
              onClick={() => loadReport({ silent: true, showRefreshIndicator: true })}
              variant="secondary"
            >
              <FiRefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Làm mới
            </Button>
            <Button className="text-slate-300" onClick={onClose} variant="ghost">
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-white/10 px-5 py-4 sm:grid-cols-4 sm:px-6">
          {[
            { label: "Tổng SV", value: stats.total },
            { label: "Đang làm", value: stats.inProgress },
            { label: "Đã nộp", value: stats.submitted },
            { label: "ĐTB điểm", value: stats.average ?? "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="border-b border-white/10 px-5 py-3 sm:px-6">
          <label className="sr-only" htmlFor="exam-class-report-search">
            Tìm theo tên học sinh
          </label>
          <div className="relative">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
              className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              id="exam-class-report-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên học sinh..."
              type="search"
              value={searchQuery}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 py-4 sm:px-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-slate-400">Đang tải báo cáo…</p>
          ) : rows.length ? (
            filteredRows.length ? (
              <div
                className="overflow-y-auto rounded-[12px] border border-white/10"
                style={{ maxHeight: `calc(${MAX_VISIBLE_ROWS} * ${ROW_HEIGHT_REM}rem + 2.5rem)` }}
              >
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#0b1220]">
                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <th className="px-3 py-2.5 font-semibold">Học sinh</th>
                      <th className="px-3 py-2.5 font-semibold">Điểm / Trạng thái</th>
                      <th className="px-3 py-2.5 font-semibold">Nghi ngờ</th>
                      <th className="px-3 py-2.5 font-semibold">Vi phạm</th>
                      <th className="px-3 py-2.5 font-semibold">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const scoreOrStatus = resolveScoreOrStatus(row);
                      const suspicionMeta = getSuspicionScoreMeta(row.suspicionScore);

                      return (
                        <tr key={row.attemptId} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-3 py-3 font-medium text-slate-100">{row.studentName}</td>
                          <td className="px-3 py-3">
                            {typeof scoreOrStatus === "string" ? (
                              <span className="font-semibold text-emerald-300">{scoreOrStatus}</span>
                            ) : (
                              <Badge variant={scoreOrStatus.variant}>{scoreOrStatus.label}</Badge>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={suspicionMeta.variant}>
                              {row.suspicionScore} · {suspicionMeta.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-slate-300">{row.logCount}</td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {formatShortDateTime(row.submittedAt ?? row.startedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">
                Không tìm thấy học sinh phù hợp với &ldquo;{searchQuery.trim()}&rdquo;.
              </p>
            )
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Chưa có học sinh nào làm bài.</p>
          )}
        </div>
      </div>
    </div>
  );
}
