import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton from "../../../components/common/Skeleton";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { cn } from "../../../utils/cn";
import { isLiveProctoringRoomAvailable } from "../../proctoring/utils/proctoringRouting";
import TeacherMonitoringWorkspace, {
  WORKSPACE_VIEWS,
} from "../components/TeacherMonitoringWorkspace";

function buildExamMonitorRows(exams, attemptsByExamId, summariesByExamId) {
  return exams.map((exam) => {
    const attempts = attemptsByExamId.get(Number(exam.id)) ?? [];
    const summary = summariesByExamId.get(Number(exam.id)) ?? null;
    const submittedCount = attempts.filter((attempt) => attempt.status === "Submitted").length;
    const inProgressCount = attempts.filter((attempt) => attempt.status === "InProgress").length;
    const highRiskCount = (summary?.attempts ?? []).filter(
      (attempt) => Number(attempt.suspicionScore) >= 51,
    ).length;

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

function resolveWorkspaceView(viewMode, exam = null) {
  if (viewMode === WORKSPACE_VIEWS.logs) {
    return WORKSPACE_VIEWS.logs;
  }

  if (viewMode === WORKSPACE_VIEWS.live) {
    return WORKSPACE_VIEWS.live;
  }

  if (exam && !isLiveProctoringRoomAvailable(exam)) {
    return WORKSPACE_VIEWS.logs;
  }

  return WORKSPACE_VIEWS.live;
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
        const attemptsByExamId = new Map(
          attemptGroups.map(([examId, attempts]) => [Number(examId), attempts]),
        );
        const summariesByExamId = new Map(
          antiCheatGroups.map(([examId, summary]) => [Number(examId), summary]),
        );
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

      return [exam.title, exam.classroomName].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [examRows, searchTerm, selectedClassroomId, selectedStatus]);

  const selectedExam =
    visibleExamRows.find((exam) => String(exam.id) === selectedExamId) ??
    examRows.find((exam) => String(exam.id) === selectedExamId) ??
    null;
  const workspaceView = resolveWorkspaceView(searchParams.get("view"), selectedExam);

  const summaryItems = useMemo(
    () => [
      { label: "Đề đang giám sát", value: visibleExamRows.length },
      { label: "Đang làm", value: visibleExamRows.reduce((sum, exam) => sum + exam.inProgressCount, 0) },
      { label: "Đã nộp", value: visibleExamRows.reduce((sum, exam) => sum + exam.submittedCount, 0) },
      { label: "Cảnh báo", value: visibleExamRows.reduce((sum, exam) => sum + exam.totalWarnings, 0) },
    ],
    [visibleExamRows],
  );

  function handleSelectExam(examId, view) {
    if (!examId) {
      setSearchParams({});
      return;
    }

    const exam =
      visibleExamRows.find((item) => String(item.id) === String(examId)) ??
      examRows.find((item) => String(item.id) === String(examId)) ??
      null;

    setSearchParams({
      examId: String(examId),
      view: resolveWorkspaceView(view, exam),
    });
  }

  function handleWorkspaceViewChange(view) {
    if (!selectedExamId) {
      return;
    }

    setSearchParams({
      examId: selectedExamId,
      view: resolveWorkspaceView(view, selectedExam),
    });
  }

  return (
    <div className="space-y-6">
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
            title="Giám sát thi"
            description="Chọn đề thi bên trái, sau đó chuyển giữa camera trực tiếp và log anti-cheat ở khu vực làm việc bên phải."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="eg-summary-card">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-4">
        <h3 className="eg-section-title">Bộ lọc</h3>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[180px] flex-1">
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
          <div className="min-w-[180px] flex-1">
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
          <div className="min-w-[200px] flex-[2]">
            <TextInput
              id="teacher-monitor-search"
              label="Tìm kiếm"
              placeholder="Tên đề hoặc lớp học"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
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
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : visibleExamRows.length === 0 ? (
        <EmptyState title="Chưa có đề thi phù hợp để giám sát." />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-4">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-primary">
                  Danh sách đề thi
                  <span className="ml-2 font-normal text-secondary">({visibleExamRows.length})</span>
                </h3>
              </div>
              <div className="max-h-[min(70vh,640px)] divide-y divide-border overflow-y-auto">
                {visibleExamRows.map((exam) => {
                  const isSelected = String(exam.id) === selectedExamId;
                  const hasLive = isLiveProctoringRoomAvailable(exam);

                  return (
                    <button
                      key={exam.id}
                      className={cn(
                        "w-full px-4 py-4 text-left transition-colors",
                        isSelected
                          ? "bg-info-muted/70"
                          : "bg-surface hover:bg-surface-sunken",
                      )}
                      type="button"
                      onClick={() => handleSelectExam(exam.id, workspaceView)}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
                            {exam.statusLabel}
                          </span>
                          {exam.enableAntiCheat ? (
                            <span className="rounded-full border border-caution/20 bg-caution-muted px-2 py-0.5 text-[10px] font-semibold text-caution">
                              AC
                            </span>
                          ) : null}
                          {hasLive ? (
                            <span className="rounded-full border border-info/20 bg-info-muted px-2 py-0.5 text-[10px] font-semibold text-info">
                              Live
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold leading-snug text-primary">{exam.title}</p>
                        <p className="text-xs text-secondary">{exam.classroomName}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary">
                          <span>
                            <span className="font-semibold text-primary">{exam.inProgressCount}</span> đang làm
                          </span>
                          <span>
                            <span className="font-semibold text-primary">{exam.totalWarnings}</span> cảnh báo
                          </span>
                          {exam.highRiskCount > 0 ? (
                            <span className="text-danger">
                              <span className="font-semibold">{exam.highRiskCount}</span> rủi ro cao
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </aside>

          <section>
            {selectedExam ? (
              <TeacherMonitoringWorkspace
                exam={selectedExam}
                showToast={showToast}
                view={workspaceView}
                onViewChange={handleWorkspaceViewChange}
              />
            ) : (
              <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="text-lg font-semibold text-primary">Chọn đề thi để bắt đầu giám sát</p>
                <p className="max-w-md text-sm leading-6 text-secondary">
                  Bấm một đề ở danh sách bên trái. Bạn có thể vào phòng camera trực tiếp hoặc xem log
                  anti-cheat mà không cần rời trang này.
                </p>
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
