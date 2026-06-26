import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiAward, FiAlertTriangle } from "react-icons/fi";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton from "../../../components/common/Skeleton";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import StatCard from "../../../components/dashboard/StatCard";
import PageHeader from "../../../components/layout/PageHeader";
import { buildExamDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";

function getRiskMeta(score) {
  if (Number(score) > 80) {
    return { label: "Cần xem xét", tone: "danger" };
  }

  if (Number(score) >= 51) {
    return { label: "Nghi ngờ cao", tone: "caution" };
  }

  if (Number(score) >= 21) {
    return { label: "Nghi ngờ nhẹ", tone: "info" };
  }

  return { label: "Bình thường", tone: "success" };
}

function buildSummaryItems(rows) {
  const scoredRows = rows.filter((row) => typeof row.score === "number");
  const scores = scoredRows.map((row) => row.score);
  const highRiskCount = rows.filter((row) => getRiskMeta(row.suspicionScore).tone !== "success").length;
  const averageScore = scores.length > 0 ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : "--";

  return [
    { label: "Điểm trung bình", value: averageScore },
    { label: "Điểm cao nhất", value: scores.length > 0 ? Math.max(...scores) : "--" },
    { label: "Điểm thấp nhất", value: scores.length > 0 ? Math.min(...scores) : "--" },
    { label: "Rủi ro cao", value: highRiskCount },
  ];
}

function matchesRisk(row, riskFilter) {
  if (!riskFilter) {
    return true;
  }

  return getRiskMeta(row.suspicionScore).tone === riskFilter;
}

export default function TeacherResultsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResultData() {
      setIsLoading(true);

      try {
        const [classroomResponse, examResponse] = await Promise.all([
          classroomApi.getAll(),
          examApi.getAll(),
        ]);
        const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
        const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
        const [memberGroups, attemptGroups, antiCheatGroups] = await Promise.all([
          Promise.all(
            classrooms.map(async (classroom) => {
              try {
                const response = await classroomApi.getMembers(classroom.id);
                return [classroom.id, Array.isArray(response.data) ? response.data : []];
              } catch {
                return [classroom.id, []];
              }
            }),
          ),
          Promise.all(
            exams.map(async (exam) => {
              try {
                const response = await examAttemptApi.getByExam(exam.id);
                return [exam.id, Array.isArray(response.data) ? response.data : []];
              } catch {
                return [exam.id, []];
              }
            }),
          ),
          Promise.all(
            exams.map(async (exam) => {
              if (!exam.enableAntiCheat) {
                return [exam.id, null];
              }

              try {
                const response = await antiCheatApi.getExamSummary(exam.id);
                return [exam.id, response.data];
              } catch {
                return [exam.id, null];
              }
            }),
          ),
        ]);
        const memberMap = new Map();
        const warningCountByAttemptId = new Map();

        memberGroups.forEach(([, members]) => {
          members.forEach((member) => {
            memberMap.set(String(member.studentId || ""), member);
          });
        });
        antiCheatGroups.forEach(([, summary]) => {
          summary?.attempts?.forEach((attempt) => {
            warningCountByAttemptId.set(Number(attempt.attemptId), Number(attempt.logCount) || 0);
          });
        });

        const rows = exams.flatMap((exam) => {
          const attempts = attemptGroups.find(([examId]) => Number(examId) === Number(exam.id))?.[1] ?? [];

          return attempts.map((attempt) => {
            const member = memberMap.get(String(attempt.studentId || ""));

            return {
              id: attempt.id,
              classroomId: exam.classroomId,
              classroomName: exam.classroomName,
              examId: exam.id,
              examTitle: exam.title,
              studentId: attempt.studentId,
              studentName: attempt.studentName || member?.fullName || "Sinh viên chưa xác định",
              studentEmail: member?.email || "--",
              score: attempt.score,
              submittedAt: attempt.submittedAt,
              startedAt: attempt.startedAt,
              suspicionScore: Number(attempt.suspicionScore) || 0,
              warningCount: warningCountByAttemptId.get(Number(attempt.id)) ?? 0,
              status: attempt.status,
            };
          });
        });

        if (isMounted) {
          setClassrooms(classrooms);
          setExams(exams);
          setRows(rows);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResultData();

    return () => {
      isMounted = false;
    };
  }, []);

  const classroomOptions = useMemo(
    () => [{ label: "Tất cả lớp học", value: "" }, ...classrooms.map((classroom) => ({ label: classroom.name, value: String(classroom.id) }))],
    [classrooms],
  );
  const examOptions = useMemo(() => {
    const filteredExams = selectedClassroomId
      ? exams.filter((exam) => Number(exam.classroomId) === Number(selectedClassroomId))
      : exams;

    return [{ label: "Tất cả đề thi", value: "" }, ...filteredExams.map((exam) => ({ label: exam.title, value: String(exam.id) }))];
  }, [exams, selectedClassroomId]);
  const visibleRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      if (selectedClassroomId && Number(row.classroomId) !== Number(selectedClassroomId)) {
        return false;
      }

      if (selectedExamId && Number(row.examId) !== Number(selectedExamId)) {
        return false;
      }

      if (selectedStatus && row.status !== selectedStatus) {
        return false;
      }

      if (!matchesRisk(row, selectedRisk)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [row.studentName, row.studentEmail, row.examTitle, row.classroomName]
        .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    });
  }, [rows, searchTerm, selectedClassroomId, selectedExamId, selectedRisk, selectedStatus]);
  const summaryItems = useMemo(() => buildSummaryItems(visibleRows), [visibleRows]);

  return (
    <div className="space-y-6">
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(59 130 246 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
              Kết quả học tập
            </p>
            <PageHeader
              title="Kết quả & Rủi ro bài thi"
              description="Theo dõi điểm số, trạng thái nộp bài và tín hiệu anti-cheat theo từng lượt làm bài."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Điểm trung bình"
          tone="neutral"
          value={summaryItems[0].value}
          icon={<FiActivity size={18} />}
        />
        <StatCard
          label="Điểm cao nhất"
          tone="success"
          value={summaryItems[1].value}
          icon={<FiAward size={18} />}
        />
        <StatCard
          label="Điểm thấp nhất"
          tone="info"
          value={summaryItems[2].value}
          icon={<FiActivity size={18} />}
        />
        <StatCard
          label="Rủi ro cao"
          tone="danger"
          value={summaryItems[3].value}
          icon={<FiAlertTriangle size={18} />}
        />
      </div>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        <div className="grid gap-4 lg:grid-cols-5">
          <Select id="teacher-results-classroom" label="Lớp học" options={classroomOptions} value={selectedClassroomId} onChange={(event) => { setSelectedClassroomId(event.target.value); setSelectedExamId(""); }} />
          <Select id="teacher-results-exam" label="Đề thi" options={examOptions} value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)} />
          <Select id="teacher-results-risk" label="Mức rủi ro" options={[{ label: "Tất cả", value: "" }, { label: "Bình thường", value: "success" }, { label: "Nghi ngờ nhẹ", value: "info" }, { label: "Nghi ngờ cao", value: "caution" }, { label: "Cần xem xét", value: "danger" }]} value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value)} />
          <Select id="teacher-results-status" label="Trạng thái" options={[{ label: "Tất cả", value: "" }, { label: "Đang làm", value: "InProgress" }, { label: "Đã nộp", value: "Submitted" }]} value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} />
          <TextInput id="teacher-results-search" label="Tìm kiếm" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tên, email, đề thi..." />
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="space-y-4 animate-pulse">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2 w-1/3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : visibleRows.length === 0 ? (
        <EmptyState title="Không có lượt làm phù hợp với bộ lọc hiện tại." />
      ) : (
        <div className="space-y-4">
          {visibleRows.map((row) => {
            const riskMeta = getRiskMeta(row.suspicionScore);

            return (
              <Card key={row.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                        {row.status === "Submitted" ? "Đã nộp" : "Đang làm"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${riskMeta.tone === "danger" ? "bg-danger-muted text-danger" : riskMeta.tone === "caution" ? "bg-caution-muted text-caution" : riskMeta.tone === "info" ? "bg-info-muted text-info" : "bg-success-muted text-success"}`}>
                        {riskMeta.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-primary">{row.studentName}</h3>
                    <p className="text-sm text-secondary">{row.studentEmail}</p>
                  </div>

                  <Link className="eg-button eg-button-secondary" to={buildExamDetailPathByRole("Teacher", row.examId)}>
                    Xem đề thi
                  </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                    <p className="text-[0.82rem] font-medium text-secondary">Đề thi</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{row.examTitle}</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                    <p className="text-[0.82rem] font-medium text-secondary">Lớp</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{row.classroomName}</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                    <p className="text-[0.82rem] font-medium text-secondary">Điểm</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{typeof row.score === "number" ? row.score : "--"}</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                    <p className="text-[0.82rem] font-medium text-secondary">Cảnh báo</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{row.warningCount} log</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4 text-sm text-secondary">
                    Bắt đầu: <span className="font-semibold text-primary">{formatShortDateTime(row.startedAt)}</span>
                  </div>
                  <div className="rounded-[16px] border border-border bg-surface-sunken p-4 text-sm text-secondary">
                    Nộp bài: <span className="font-semibold text-primary">{row.submittedAt ? formatShortDateTime(row.submittedAt) : "Chưa nộp"}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
