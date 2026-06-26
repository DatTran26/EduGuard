import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { /*FiActivity, */FiClock, FiFileText, FiGrid } from "react-icons/fi";
import { assignmentApi } from "../../../api/assignmentApi";
import { classroomApi } from "../../../api/classroomApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import StatCard from "../../../components/dashboard/StatCard";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import AssignmentForm from "../components/AssignmentForm";
import Skeleton, { SkeletonStatCard } from "../../../components/common/Skeleton";

function getAssignmentListStatus(assignment, currentTimestamp) {
  if (assignment.ungradedCount > 0) {
    return { label: "Cần chấm", value: "need-grading", tone: "caution" };
  }

  if (assignment.deadline && new Date(assignment.deadline).getTime() < currentTimestamp) {
    return { label: "Đã đóng", value: "closed", tone: "danger" };
  }

  return { label: "Đang mở", value: "open", tone: "success" };
}

function sortAssignments(assignments, sortOption) {
  return assignments.slice().sort((firstItem, secondItem) => {
    const firstTime = new Date(firstItem.deadline || firstItem.createdAt || 0).getTime();
    const secondTime = new Date(secondItem.deadline || secondItem.createdAt || 0).getTime();

    if (sortOption === "deadline-desc") {
      return secondTime - firstTime;
    }

    return firstTime - secondTime;
  });
}

export default function TeacherAssignmentListPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortOption, setSortOption] = useState("deadline-asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingAssignmentId, setEditingAssignmentId] = useState("");
  const [armedDeleteAssignmentId, setArmedDeleteAssignmentId] = useState("");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isSavingSubmissionId, setIsSavingSubmissionId] = useState("");
  const [gradeDraftsBySubmissionId, setGradeDraftsBySubmissionId] = useState({});
  const [nowTimestamp] = useState(() => Date.now());
  const selectedAssignmentId = searchParams.get("assignmentId") ?? "";
  const selectedClassroomId = searchParams.get("classroomId") ?? "";
  const isCreateFormVisible = searchParams.get("create") === "1";
  const classroomOptions = useMemo(
    () => [{ label: "Chọn lớp học", value: "" }, ...classrooms.map((classroom) => ({ label: classroom.name, value: String(classroom.id) }))],
    [classrooms],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAssignmentData() {
      setIsLoading(true);

      try {
        const classroomResponse = await classroomApi.getAll();
        const classrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
        const assignmentGroups = await Promise.all(
          classrooms.map(async (classroom) => {
            try {
              const response = await assignmentApi.getByClassroom(classroom.id);
              return (Array.isArray(response.data) ? response.data : []).map((assignment) => ({
                ...assignment,
                classroomName: classroom.name,
                classroomMemberCount: Number(classroom.memberCount) || 0,
              }));
            } catch {
              return [];
            }
          }),
        );
        const assignments = assignmentGroups.flat();
        const submissionsEntries = await Promise.all(
          assignments.map(async (assignment) => {
            try {
              const response = await assignmentApi.getSubmissions(assignment.id);
              return [assignment.id, Array.isArray(response.data) ? response.data : []];
            } catch {
              return [assignment.id, []];
            }
          }),
        );
        const submissionsByAssignmentId = Object.fromEntries(submissionsEntries);
        const nextAssignments = assignments.map((assignment) => {
          const submissions = submissionsByAssignmentId[assignment.id] ?? [];
          const scoredSubmissions = submissions.filter((submission) => typeof submission.score === "number");

          return {
            ...assignment,
            ungradedCount: submissions.filter((submission) => typeof submission.score !== "number").length,
            averageScore:
              scoredSubmissions.length > 0
                ? Math.round((scoredSubmissions.reduce((sum, submission) => sum + submission.score, 0) / scoredSubmissions.length) * 10) / 10
                : null,
          };
        });

        if (isMounted) {
          setClassrooms(classrooms);
          setAssignments(nextAssignments);
          setSubmissionsByAssignmentId(submissionsByAssignmentId);
          setGradeDraftsBySubmissionId(
            Object.fromEntries(
              submissionsEntries.flatMap(([, submissions]) =>
                submissions.map((submission) => [submission.id, { score: submission.score ?? "", feedback: submission.feedback ?? "" }]),
              ),
            ),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssignmentData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortAssignments(
      assignments.filter((assignment) => {
        const status = getAssignmentListStatus(assignment, nowTimestamp);

        if (selectedClassroomId && Number(assignment.classroomId) !== Number(selectedClassroomId)) {
          return false;
        }

        if (selectedStatus && status.value !== selectedStatus) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [assignment.title, assignment.classroomName].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
      }),
      sortOption,
    );
  }, [assignments, nowTimestamp, searchTerm, selectedClassroomId, selectedStatus, sortOption]);
  const selectedAssignment = visibleAssignments.find((assignment) => String(assignment.id) === String(selectedAssignmentId)) ?? assignments.find((assignment) => String(assignment.id) === String(selectedAssignmentId)) ?? visibleAssignments[0] ?? null;
  const selectedSubmissions = selectedAssignment ? submissionsByAssignmentId[selectedAssignment.id] ?? [] : [];
  const selectedSubmission = selectedSubmissions.find((submission) => String(submission.id) === String(selectedSubmissionId)) ?? selectedSubmissions[0] ?? null;
  const summaryItems = useMemo(() => [
    { label: "Tổng bài tập", value: visibleAssignments.length },
    { label: "Cần chấm", value: visibleAssignments.filter((assignment) => assignment.ungradedCount > 0).length },
    { label: "Sắp đến hạn", value: visibleAssignments.filter((assignment) => assignment.deadline && new Date(assignment.deadline).getTime() - nowTimestamp <= 48 * 60 * 60 * 1000 && new Date(assignment.deadline).getTime() > nowTimestamp).length },
    { label: "Lớp có bài tập", value: new Set(visibleAssignments.map((assignment) => assignment.classroomId)).size },
  ], [nowTimestamp, visibleAssignments]);

  function toggleCreateForm() {
    const nextParams = new URLSearchParams(searchParams);

    if (isCreateFormVisible) {
      nextParams.delete("create");
    } else {
      nextParams.set("create", "1");
    }

    setSearchParams(nextParams);
  }

  function handleSelectAssignment(assignmentId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("assignmentId", String(assignmentId));

    if (selectedClassroomId) {
      nextParams.set("classroomId", selectedClassroomId);
    }

    setSearchParams(nextParams);
  }

  function handleGradeDraftChange(submissionId, fieldName, value) {
    setGradeDraftsBySubmissionId((previousValue) => ({
      ...previousValue,
      [submissionId]: {
        ...(previousValue[submissionId] ?? { score: "", feedback: "" }),
        [fieldName]: value,
      },
    }));
  }

  async function handleCreateAssignment(payload) {
    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.create(payload.classroomId, payload);
      showToast({ tone: "success", title: "Đã tạo bài tập", message: response.message });
      window.location.reload();
      return true;
    } catch (error) {
      showToast({ tone: "danger", title: "Tạo bài tập thất bại", message: error.message || "Không thể tạo bài tập." });
      return false;
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleUpdateAssignment(assignmentId, payload) {
    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.update(assignmentId, payload);
      showToast({ tone: "success", title: "Đã cập nhật bài tập", message: response.message });
      window.location.reload();
      return false;
    } catch (error) {
      showToast({ tone: "danger", title: "Cập nhật thất bại", message: error.message || "Không thể cập nhật bài tập." });
      return false;
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleDeleteAssignment(assignmentId) {
    if (String(armedDeleteAssignmentId) !== String(assignmentId)) {
      setArmedDeleteAssignmentId(String(assignmentId));
      return;
    }

    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.delete(assignmentId);
      showToast({ tone: "success", title: "Đã xóa bài tập", message: response.message });
      window.location.reload();
    } catch (error) {
      showToast({ tone: "danger", title: "Xóa thất bại", message: error.message || "Không thể xóa bài tập." });
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleGradeSubmission() {
    if (!selectedAssignment || !selectedSubmission) {
      return;
    }

    const draft = gradeDraftsBySubmissionId[selectedSubmission.id] ?? { score: "", feedback: "" };
    setIsSavingSubmissionId(String(selectedSubmission.id));

    try {
      const response = await assignmentApi.grade(selectedSubmission.id, draft);
      showToast({ tone: "success", title: "Đã lưu điểm", message: response.message });
      window.location.reload();
    } catch (error) {
      showToast({ tone: "danger", title: "Chấm điểm thất bại", message: error.message || "Không thể lưu điểm bài nộp." });
    } finally {
      setIsSavingSubmissionId("");
    }
  }

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
              Bài tập về nhà
            </p>
            <PageHeader
              title="Quản lý Bài tập"
              description="Tạo mới bài tập, theo dõi thời hạn và tiến hành chấm điểm bài làm của sinh viên."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={toggleCreateForm} variant={isCreateFormVisible ? "secondary" : "primary"}>
              {isCreateFormVisible ? "Ẩn form tạo bài tập" : "Tạo bài tập"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng bài tập"
          tone="neutral"
          value={summaryItems[0].value}
          icon={<FiFileText size={18} />}
        />
        <StatCard
          label="Cần chấm"
          tone="caution"
          value={summaryItems[1].value}
          icon={<FiClock size={18} />}
        />
        <StatCard
          label="Sắp đến hạn"
          tone="danger"
          value={summaryItems[2].value}
          icon={<FiClock size={18} />}
        />
        <StatCard
          label="Lớp có bài tập"
          tone="info"
          value={summaryItems[3].value}
          icon={<FiGrid size={18} />}
        />
      </div>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        <div className="grid gap-4 lg:grid-cols-4">
          <Select id="teacher-assignment-classroom" label="Lớp học" options={[{ label: "Tất cả lớp học", value: "" }, ...classrooms.map((classroom) => ({ label: classroom.name, value: String(classroom.id) }))]} value={selectedClassroomId} onChange={(event) => {
            const nextParams = new URLSearchParams(searchParams);
            if (event.target.value) {
              nextParams.set("classroomId", event.target.value);
            } else {
              nextParams.delete("classroomId");
            }
            setSearchParams(nextParams);
          }} />
          <Select id="teacher-assignment-status" label="Trạng thái" options={[{ label: "Tất cả", value: "" }, { label: "Đang mở", value: "open" }, { label: "Đã đóng", value: "closed" }, { label: "Cần chấm", value: "need-grading" }]} value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} />
          <Select id="teacher-assignment-sort" label="Sắp xếp" options={[{ label: "Deadline gần nhất", value: "deadline-asc" }, { label: "Deadline xa nhất", value: "deadline-desc" }]} value={sortOption} onChange={(event) => setSortOption(event.target.value)} />
          <TextInput id="teacher-assignment-search" label="Tìm kiếm" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tên bài tập hoặc lớp học" />
        </div>
      </Card>

      {isCreateFormVisible ? (
        <AssignmentForm
          classroomOptions={classroomOptions}
          defaultClassroomId={selectedClassroomId || classrooms[0]?.id || ""}
          isSubmitting={isSavingAssignment}
          onSubmitAssignment={handleCreateAssignment}
          submitLabel="Tạo bài tập"
          title="Tạo bài tập mới"
        />
      ) : null}

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-2 w-1/2">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-xl" />
                  </div>
                  <div className="grid gap-3 grid-cols-2">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                  </div>
                </Card>
              ))}
            </div>
            <Card className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </Card>
          </div>
        </div>
      ) : visibleAssignments.length === 0 ? (
        <EmptyState title="Không có bài tập phù hợp với bộ lọc hiện tại." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-4">
            {visibleAssignments.map((assignment) => {
              const status = getAssignmentListStatus(assignment, nowTimestamp);

              return (
                <Card key={assignment.id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${status.tone === "danger" ? "bg-danger-muted text-danger" : status.tone === "caution" ? "bg-caution-muted text-caution" : "bg-success-muted text-success"}`}>
                          {status.label}
                        </span>
                        <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                          {assignment.classroomName}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary">{assignment.title}</h3>
                    </div>

                    <Button onClick={() => handleSelectAssignment(assignment.id)} variant={String(selectedAssignmentId) === String(assignment.id) ? "secondary" : "primary"}>
                      {String(selectedAssignmentId) === String(assignment.id) ? "Đang xem" : "Mở chấm bài"}
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                      <p className="text-[0.82rem] font-medium text-secondary">Deadline</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{formatShortDateTime(assignment.deadline)}</p>
                    </div>
                    <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                      <p className="text-[0.82rem] font-medium text-secondary">Đã nộp / tổng học sinh</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{assignment.submissionCount} / {assignment.classroomMemberCount}</p>
                    </div>
                    <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                      <p className="text-[0.82rem] font-medium text-secondary">Chưa chấm</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{assignment.ungradedCount}</p>
                    </div>
                    <div className="rounded-[16px] border border-border bg-surface-sunken p-4">
                      <p className="text-[0.82rem] font-medium text-secondary">Điểm trung bình</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{typeof assignment.averageScore === "number" ? assignment.averageScore : "--"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setEditingAssignmentId((previousValue) => previousValue === String(assignment.id) ? "" : String(assignment.id))} variant="secondary">
                      {editingAssignmentId === String(assignment.id) ? "Đang chỉnh sửa" : "Sửa bài tập"}
                    </Button>
                    <Button onClick={() => handleDeleteAssignment(assignment.id)} variant="ghost" disabled={isSavingAssignment}>
                      {armedDeleteAssignmentId === String(assignment.id) ? "Xác nhận xóa" : "Xóa bài tập"}
                    </Button>
                  </div>

                  {editingAssignmentId === String(assignment.id) ? (
                    <AssignmentForm assignment={assignment} isSubmitting={isSavingAssignment} onCancel={() => setEditingAssignmentId("")} onSubmitAssignment={(payload) => handleUpdateAssignment(assignment.id, payload)} submitLabel="Lưu thay đổi" title="Chỉnh sửa bài tập" />
                  ) : null}
                </Card>
              );
            })}
          </div>

          <Card className="space-y-4">
            {!selectedAssignment ? (
              <EmptyState title="Chọn một bài tập để xem khu vực chấm điểm." />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-secondary">Workspace chấm bài</p>
                    <h3 className="text-xl font-semibold text-primary">{selectedAssignment.title}</h3>
                    <p className="mt-1 text-sm text-secondary">{selectedAssignment.classroomName} • Hạn nộp {formatShortDateTime(selectedAssignment.deadline)}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                    {selectedSubmissions.length} bài nộp
                  </span>
                </div>

                {selectedSubmissions.length === 0 ? (
                  <EmptyState title="Bài tập này chưa có bài nộp nào." />
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
                    <div className="space-y-3">
                      {selectedSubmissions.map((submission) => (
                        <button
                          key={submission.id}
                          type="button"
                          onClick={() => setSelectedSubmissionId(String(submission.id))}
                          className={`w-full rounded-[18px] border px-4 py-4 text-left transition-all duration-200 ${String(selectedSubmission?.id) === String(submission.id) ? "border-tertiary bg-info-muted" : "border-border bg-surface hover:bg-surface-sunken"}`}
                        >
                          <p className="text-sm font-semibold text-primary">{submission.studentName || submission.studentEmail}</p>
                          <p className="mt-1 text-xs text-secondary">{submission.studentEmail}</p>
                          <p className="mt-2 text-xs text-secondary">{formatShortDateTime(submission.submittedAt)}</p>
                        </button>
                      ))}
                    </div>

                    {selectedSubmission ? (
                      <div className="space-y-4">
                        <div className="rounded-[18px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-primary">
                          {selectedSubmission.content}
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                          <TextInput id={`teacher-assignment-grade-score-${selectedSubmission.id}`} label="Điểm" type="number" min="0" max={String(selectedAssignment.maxScore)} step="0.5" value={String(gradeDraftsBySubmissionId[selectedSubmission.id]?.score ?? "")} onChange={(event) => handleGradeDraftChange(selectedSubmission.id, "score", event.target.value)} />
                          <TextInput id={`teacher-assignment-grade-feedback-${selectedSubmission.id}`} as="textarea" label="Nhận xét" value={gradeDraftsBySubmissionId[selectedSubmission.id]?.feedback ?? ""} onChange={(event) => handleGradeDraftChange(selectedSubmission.id, "feedback", event.target.value)} />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-secondary">{selectedSubmission.gradedAt ? `Đã chấm lúc ${formatShortDateTime(selectedSubmission.gradedAt)}` : "Chưa chấm"}</p>
                          <Button onClick={handleGradeSubmission} disabled={String(isSavingSubmissionId) === String(selectedSubmission.id)}>
                            {String(isSavingSubmissionId) === String(selectedSubmission.id) ? "Đang lưu..." : "Lưu điểm"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
