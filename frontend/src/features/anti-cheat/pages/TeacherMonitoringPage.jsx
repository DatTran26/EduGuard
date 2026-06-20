import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import AttemptMonitorPanel from "../components/AttemptMonitorPanel";

function buildExamMonitorRows(exams, attemptsByExamId, summariesByExamId) {
  return exams.map((exam) => {
    const attempts = attemptsByExamId.get(Number(exam.id)) ?? [];
    const summary = summariesByExamId.get(Number(exam.id)) ?? null;
    const submittedCount = attempts.filter((attempt) => attempt.status === "Submitted").length;
    const inProgressCount = attempts.filter((attempt) => attempt.status === "InProgress").length;
    const highRiskCount = (summary?.attempts ?? []).filter((attempt) => Number(attempt.suspicionScore) >= 51).length;

    return {
      ...exam,
      attempts,
      antiCheatSummary: summary,
      submittedCount,
      inProgressCount,
      totalWarnings: summary?.totalLogs ?? 0,
      highRiskCount,
    };
  });
}

export default function TeacherMonitoringPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [examRows, setExamRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const selectedExamId = searchParams.get("examId") ?? "";

  useEffect(() => {
    let isMounted = true;

    async function loadMonitoringData() {
      setIsLoading(true);

      try {
        const [classroomResponse, examResponse] = await Promise.all([
          classroomApi.getAll(),
          examApi.getAll(),
        ]);
        const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
        const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
        const [attemptGroups, antiCheatGroups] = await Promise.all([
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
        const attemptsByExamId = new Map(attemptGroups.map(([examId, attempts]) => [Number(examId), attempts]));
        const summariesByExamId = new Map(antiCheatGroups.map(([examId, summary]) => [Number(examId), summary]));
        const examRows = buildExamMonitorRows(exams, attemptsByExamId, summariesByExamId);

        if (isMounted) {
          setClassrooms(classrooms);
          setExamRows(examRows);
        }
      } catch (error) {
        showToast({
          tone: "danger",
          title: "Tải giám sát thất bại",
          message: error.message || "Không thể tải dữ liệu giám sát bài thi.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMonitoringData();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const visibleExamRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return examRows.filter((exam) => {
      if (selectedClassroomId && Number(exam.classroomId) !== Number(selectedClassroomId)) {
        return false;
      }

      if (selectedStatus && exam.statusLabel !== selectedStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [exam.title, exam.classroomName].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    });
  }, [examRows, searchTerm, selectedClassroomId, selectedStatus]);
  const selectedExam = visibleExamRows.find((exam) => String(exam.id) === selectedExamId) ?? examRows.find((exam) => String(exam.id) === selectedExamId) ?? null;
  const summaryItems = useMemo(() => [
    { label: "Đề đang giám sát", value: visibleExamRows.length },
    { label: "Đang làm", value: visibleExamRows.reduce((sum, exam) => sum + exam.inProgressCount, 0) },
    { label: "Đã nộp", value: visibleExamRows.reduce((sum, exam) => sum + exam.submittedCount, 0) },
    { label: "Cảnh báo", value: visibleExamRows.reduce((sum, exam) => sum + exam.totalWarnings, 0) },
  ], [visibleExamRows]);

  function handleSelectExam(examId) {
    setSearchParams(examId ? { examId: String(examId) } : {});
  }

  return (
    <div className="space-y-6">
      {/* Page Hero */}
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(239 68 68 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative space-y-2">
          <p className="inline-flex rounded-full border border-caution/20 bg-caution-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-caution">
            Giám sát thi
          </p>
          <PageHeader
            title="Exam attempt monitor"
            description="Theo dõi số lượt đang làm, cảnh báo anti-cheat và mở panel giám sát chi tiết theo từng đề thi."
          />
        </div>
      </div>

      {/* Summary StatCards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="eg-summary-card">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="space-y-4">
        <h3 className="eg-section-title">Bộ lọc</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <Select
              id="teacher-monitor-classroom"
              label="Lớp học"
              options={[
                { label: "Tất cả lớp học", value: "" },
                ...classrooms.map((classroom) => ({
                  label: classroom.name,
                  value: String(classroom.id),
                })),
              ]}
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Select
              id="teacher-monitor-status"
              label="Trạng thái đề"
              options={[
                { label: "Tất cả trạng thái", value: "" },
                { label: "Sắp mở", value: "Sắp mở" },
                { label: "Đang mở", value: "Đang mở" },
                { label: "Đã đóng", value: "Đã đóng" },
                { label: "Bản nháp", value: "Bản nháp" },
              ]}
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <TextInput
              id="teacher-monitor-search"
              label="Tìm kiếm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tên đề hoặc lớp học"
            />
          </div>
        </div>
      </Card>

      {/* Exam list */}
      {isLoading ? (
        <Card className="text-sm text-secondary">Đang tải dữ liệu giám sát...</Card>
      ) : visibleExamRows.length === 0 ? (
        <EmptyState title="Chưa có đề thi phù hợp để giám sát." />
      ) : (
        <div className="space-y-4">
          {visibleExamRows.map((exam) => (
            <Card key={exam.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      {exam.statusLabel}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        exam.enableAntiCheat
                          ? "border border-caution/20 bg-caution-muted text-caution"
                          : "border border-border bg-neutral text-secondary"
                      }`}
                    >
                      {exam.enableAntiCheat ? "Anti-cheat bật" : "Anti-cheat tắt"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">{exam.title}</h3>
                  <p className="text-sm text-secondary">{exam.classroomName}</p>
                </div>

                <Button
                  onClick={() => handleSelectExam(exam.id)}
                  variant={String(exam.id) === selectedExamId ? "secondary" : "primary"}
                >
                  {String(exam.id) === selectedExamId ? "Đang mở giám sát" : "Mở giám sát"}
                </Button>
              </div>

              {/* Exam stats mini-grid */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Đang làm", value: exam.inProgressCount, tone: "info" },
                  { label: "Đã nộp", value: exam.submittedCount, tone: "success" },
                  { label: "Cảnh báo", value: exam.totalWarnings, tone: "caution" },
                  { label: "Rủi ro cao", value: exam.highRiskCount, tone: "danger" },
                ].map((stat) => {
                  const toneMap = {
                    info: "border-info/20 bg-info-muted",
                    success: "border-success/20 bg-success-muted",
                    caution: "border-caution/20 bg-caution-muted",
                    danger: "border-danger/20 bg-danger-muted",
                  };
                  const textMap = {
                    info: "text-info",
                    success: "text-success",
                    caution: "text-caution",
                    danger: "text-danger",
                  };
                  return (
                    <div
                      key={stat.label}
                      className={`rounded-[14px] border p-4 ${toneMap[stat.tone]}`}
                    >
                      <p className="text-[0.78rem] font-medium text-secondary">{stat.label}</p>
                      <p className={`mt-2 text-2xl font-bold ${textMap[stat.tone]}`}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedExam ? (
        <AttemptMonitorPanel
          exam={selectedExam}
          attempts={selectedExam.attempts}
          antiCheatSummary={selectedExam.antiCheatSummary}
          onAntiCheatWarning={() => {}}
          showToast={showToast}
        />
      ) : null}
    </div>
  );
}
