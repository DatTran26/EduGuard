import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import { assignmentApi } from "../../../api/assignmentApi";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Skeleton from "../../../components/common/Skeleton";
import { useToast } from "../../../hooks/useToast";
import {
  buildExamDetailPathByRole,
  buildExamMonitoringPathByRole,
  routeConfig,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import AssignmentForm from "../../assignments/components/AssignmentForm";
import ExamForm from "../../exams/components/ExamForm";
import LearningTaskList from "../components/LearningTaskList";
import LearningTaskStats from "../components/LearningTaskStats";
import LearningTaskTypeTabs from "../components/LearningTaskTypeTabs";
import ExamGrid from "../components/ExamGrid";
import {
  buildLearningTaskStats,
  filterLearningTasks,
  filterLearningTasksByQuickFilter,
  getDefaultSortOption,
  getLearningTaskPageCopy,
  getLearningTaskSortOptions,
  LEARNING_TASK_TYPES,
  LEARNING_TASK_TYPE_OPTIONS,
  mapAssignmentToLearningTask,
  mapExamToLearningTask,
  resolveLearningTaskQuickFilter,
  resolveLearningTaskType,
  sortLearningTasks,
} from "../learningTaskMapper";

function getTypeLabel(type) {
  return type === LEARNING_TASK_TYPES.exam ? "Bài thi" : "Bài tập";
}

function getSelectedTaskQueryKey(type) {
  return type === LEARNING_TASK_TYPES.exam ? "examId" : "assignmentId";
}

function getPreviewToneClassName(tone) {
  if (tone === "success") return "border-success/20 bg-success-muted text-success";
  if (tone === "caution") return "border-caution/20 bg-caution-muted text-caution";
  if (tone === "danger") return "border-danger/20 bg-danger-muted text-danger";
  if (tone === "info") return "border-info/20 bg-info-muted text-info";
  return "border-border bg-surface-sunken text-secondary";
}

function buildAssignmentGradeDrafts(submissionEntries) {
  return Object.fromEntries(
    submissionEntries.flatMap(([, submissions]) =>
      submissions.map((submission) => [
        submission.id,
        {
          score: submission.score ?? "",
          feedback: submission.feedback ?? "",
        },
      ]),
    ),
  );
}

function buildExamSummaryCards(task) {
  return [
    { label: "Mở đề", value: formatShortDateTime(task.startTime || task.createdAt) },
    { label: "Đóng đề", value: formatShortDateTime(task.endTime || task.deadline || task.createdAt) },
    { label: "Số câu hỏi", value: task.questionCount },
    { label: "Lượt làm", value: task.attemptCount },
    { label: "Điểm trung bình", value: typeof task.averageScore === "number" ? task.averageScore : "--" },
    { label: "Anti-cheat", value: task.enableAntiCheat ? "Đang bật" : "Đang tắt" },
  ];
}

function DetailPanelSkeleton() {
  return (
    <Card className="space-y-5 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3 rounded-md" />
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-[16px]" />
        ))}
      </div>

      <Skeleton className="h-36 rounded-[18px]" />
    </Card>
  );
}

export default function TeacherLearningTasksPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [gradeDraftsBySubmissionId, setGradeDraftsBySubmissionId] = useState({});
  const [editingTaskId, setEditingTaskId] = useState("");
  const [armedDeleteTaskId, setArmedDeleteTaskId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSavingSubmissionId, setIsSavingSubmissionId] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [taskActionId, setTaskActionId] = useState("");
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const workspacePanelRef = useRef(null);

  const selectedType = resolveLearningTaskType(searchParams.get("type"));
  const selectedClassroomId = searchParams.get("classroomId") ?? "";
  const selectedQuickFilter = resolveLearningTaskQuickFilter(
    selectedType,
    searchParams.get("view"),
  );
  const requestedSort = searchParams.get("sort") ?? "";
  const selectedTaskQueryKey = getSelectedTaskQueryKey(selectedType);
  const selectedTaskId = searchParams.get("taskId") ?? searchParams.get(selectedTaskQueryKey) ?? "";
  const isCreateFormVisible = searchParams.get("create") === "1";

  const sortOptions = useMemo(() => getLearningTaskSortOptions(selectedType), [selectedType]);
  const resolvedSortOption =
    sortOptions.find((option) => option.value === requestedSort)?.value ??
    getDefaultSortOption(selectedType);
  const pageCopy = getLearningTaskPageCopy(selectedType);
  const classroomFormOptions = useMemo(
    () => [
      { label: "Chọn lớp học", value: "" },
      ...classrooms.map((classroom) => ({ label: classroom.name, value: String(classroom.id) })),
    ],
    [classrooms],
  );

  const scopedTasks = useMemo(
    () =>
      filterLearningTasks(tasks, {
        classroomId: selectedClassroomId,
      }),
    [selectedClassroomId, tasks],
  );

  const visibleTasks = useMemo(
    () =>
      sortLearningTasks(
        filterLearningTasksByQuickFilter(
          scopedTasks,
          selectedType,
          selectedQuickFilter,
        ),
        selectedType,
        resolvedSortOption,
      ),
    [resolvedSortOption, scopedTasks, selectedQuickFilter, selectedType],
  );
  const stats = useMemo(
    () => buildLearningTaskStats(scopedTasks, selectedType),
    [scopedTasks, selectedType],
  );
  const selectedTask =
    visibleTasks.find((task) => String(task.id) === String(selectedTaskId)) ??
    tasks.find((task) => String(task.id) === String(selectedTaskId)) ??
    visibleTasks[0] ??
    null;
  const selectedAssignmentSubmissions =
    selectedTask?.type === LEARNING_TASK_TYPES.assignment
      ? submissionsByAssignmentId[selectedTask.id] ?? []
      : [];
  const selectedSubmission =
    selectedAssignmentSubmissions.find((submission) => String(submission.id) === String(selectedSubmissionId)) ??
    selectedAssignmentSubmissions[0] ??
    null;
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let shouldReplace = false;

    if (searchParams.get("type") !== selectedType) {
      nextParams.set("type", selectedType);
      shouldReplace = true;
    }

    if (!requestedSort || requestedSort !== resolvedSortOption) {
      nextParams.set("sort", resolvedSortOption);
      shouldReplace = true;
    }

    if (searchParams.has("status")) {
      nextParams.delete("status");
      shouldReplace = true;
    }

    if (searchParams.has("q")) {
      nextParams.delete("q");
      shouldReplace = true;
    }

    if ((searchParams.get("view") ?? "") !== selectedQuickFilter) {
      if (selectedQuickFilter) {
        nextParams.set("view", selectedQuickFilter);
      } else {
        nextParams.delete("view");
      }
      shouldReplace = true;
    }

    const otherTaskQueryKey = selectedType === LEARNING_TASK_TYPES.exam ? "assignmentId" : "examId";

    if (nextParams.has(otherTaskQueryKey)) {
      nextParams.delete(otherTaskQueryKey);
      shouldReplace = true;
    }

    if (shouldReplace) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [requestedSort, resolvedSortOption, searchParams, selectedQuickFilter, selectedType, setSearchParams]);

  useEffect(() => {
    setEditingTaskId("");
    setArmedDeleteTaskId("");
    setSelectedSubmissionId("");
    setTaskActionId("");
  }, [selectedType]);

  useEffect(() => {
    let isMounted = true;

    async function loadTaskData() {
      setIsLoading(true);
      setLoadErrorMessage("");

      try {
        const classroomResponse = await classroomApi.getAll();
        const nextClassrooms = Array.isArray(classroomResponse.data) ? classroomResponse.data : [];
        const targetClassrooms = selectedClassroomId
          ? nextClassrooms.filter((classroom) => Number(classroom.id) === Number(selectedClassroomId))
          : nextClassrooms;

        if (selectedType === LEARNING_TASK_TYPES.assignment) {
          const assignmentGroups = await Promise.all(
            targetClassrooms.map(async (classroom) => {
              try {
                const response = await assignmentApi.getByClassroom(classroom.id);

                return (Array.isArray(response.data) ? response.data : []).map((assignment) => ({
                  ...assignment,
                  classroomMemberCount: Number(classroom.memberCount) || 0,
                  classroomName: classroom.name,
                }));
              } catch {
                return [];
              }
            }),
          );
          const nextAssignments = assignmentGroups.flat();
          const submissionEntries = await Promise.all(
            nextAssignments.map(async (assignment) => {
              try {
                const response = await assignmentApi.getSubmissions(assignment.id);
                return [assignment.id, Array.isArray(response.data) ? response.data : []];
              } catch {
                return [assignment.id, []];
              }
            }),
          );
          const nextSubmissionsByAssignmentId = Object.fromEntries(submissionEntries);
          const nextTasks = nextAssignments.map((assignment) =>
            mapAssignmentToLearningTask(
              assignment,
              nextClassrooms,
              nextSubmissionsByAssignmentId[assignment.id] ?? [],
            ),
          );

          if (!isMounted) {
            return;
          }

          setClassrooms(nextClassrooms);
          setTasks(nextTasks);
          setSubmissionsByAssignmentId(nextSubmissionsByAssignmentId);
          setGradeDraftsBySubmissionId(buildAssignmentGradeDrafts(submissionEntries));
          return;
        }

        const examResponse = await examApi.getAll(selectedClassroomId ? { classroomId: selectedClassroomId } : {});
        const nextExams = (Array.isArray(examResponse.data) ? examResponse.data : []).filter((exam) => exam.canEdit);
        const nextTasks = nextExams.map((exam) => mapExamToLearningTask(exam));

        if (!isMounted) {
          return;
        }

        setClassrooms(nextClassrooms);
        setTasks(nextTasks);
        setSubmissionsByAssignmentId({});
        setGradeDraftsBySubmissionId({});
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setTasks([]);
        setSubmissionsByAssignmentId({});
        setGradeDraftsBySubmissionId({});
        setLoadErrorMessage(
          error.message ||
            (selectedType === LEARNING_TASK_TYPES.assignment
              ? "Không thể tải danh sách bài tập."
              : "Không thể tải danh sách bài kiểm tra."),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTaskData();

    return () => {
      isMounted = false;
    };
  }, [reloadVersion, selectedClassroomId, selectedType]);

  function updateSearchParams(mutator, options = {}) {
    const nextParams = new URLSearchParams(searchParams);
    mutator(nextParams);
    setSearchParams(nextParams, options);
  }

  function scrollToWorkspace() {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      workspacePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleRetry() {
    setReloadVersion((previousValue) => previousValue + 1);
  }

  function handleTypeChange(nextType) {
    const resolvedType = resolveLearningTaskType(nextType);

    updateSearchParams((nextParams) => {
      nextParams.set("type", resolvedType);
      nextParams.set("sort", getDefaultSortOption(resolvedType));
      nextParams.delete("status");
      nextParams.delete("taskId");
      nextParams.delete("assignmentId");
      nextParams.delete("examId");
      nextParams.delete("create");
    });
  }

  function handleQuickFilterChange(nextFilterValue) {
    updateSearchParams((nextParams) => {
      if (selectedQuickFilter === nextFilterValue) {
        nextParams.delete("view");
      } else if (nextFilterValue) {
        nextParams.set("view", nextFilterValue);
      } else {
        nextParams.delete("view");
      }

      nextParams.delete("taskId");
      nextParams.delete("assignmentId");
      nextParams.delete("examId");
    });
  }

  function handleSelectTask(taskId) {
    updateSearchParams((nextParams) => {
      nextParams.set("taskId", String(taskId));
      nextParams.delete("assignmentId");
      nextParams.delete("examId");
    });
  }

  function toggleCreateForm() {
    if (editingTaskId) {
      setEditingTaskId("");
    }

    updateSearchParams((nextParams) => {
      if (nextParams.get("create") === "1") {
        nextParams.delete("create");
      } else {
        nextParams.set("create", "1");
      }
    });
  }

  function clearSelectedTaskFromQuery(taskId) {
    if (String(selectedTaskId) !== String(taskId)) {
      return;
    }

    updateSearchParams((nextParams) => {
      nextParams.delete("taskId");
      nextParams.delete("assignmentId");
      nextParams.delete("examId");
    });
  }

  function handleGradeDraftChange(submissionId, fieldName, value) {
    setGradeDraftsBySubmissionId((previousValue) => ({
      ...previousValue,
      [submissionId]: {
        ...(previousValue[submissionId] ?? { feedback: "", score: "" }),
        [fieldName]: value,
      },
    }));
  }

  async function handleCreateAssignment(payload) {
    setIsSavingTask(true);

    try {
      const response = await assignmentApi.create(payload.classroomId, payload);

      updateSearchParams((nextParams) => {
        nextParams.delete("create");
        nextParams.set("classroomId", String(payload.classroomId));
        nextParams.set("taskId", String(response.data.id));
      });
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã tạo bài tập", message: response.message });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo bài tập thất bại",
        message: error.message || "Không thể tạo bài tập mới.",
      });
      return false;
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleUpdateAssignment(taskId, payload) {
    setIsSavingTask(true);

    try {
      const response = await assignmentApi.update(taskId, payload);
      setEditingTaskId("");
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã cập nhật bài tập", message: response.message });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật bài tập thất bại",
        message: error.message || "Không thể lưu thay đổi bài tập.",
      });
      return false;
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteAssignment(task) {
    if (String(armedDeleteTaskId) !== String(task.id)) {
      setArmedDeleteTaskId(String(task.id));
      return;
    }

    setIsSavingTask(true);

    try {
      const response = await assignmentApi.delete(task.id);
      setArmedDeleteTaskId("");
      setEditingTaskId("");
      clearSelectedTaskFromQuery(task.id);
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã xóa bài tập", message: response.message });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa bài tập thất bại",
        message: error.message || "Không thể xóa bài tập.",
      });
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleGradeSubmission() {
    if (!selectedTask || !selectedSubmission) {
      return;
    }

    setIsSavingSubmissionId(String(selectedSubmission.id));

    try {
      const draft = gradeDraftsBySubmissionId[selectedSubmission.id] ?? { feedback: "", score: "" };
      const response = await assignmentApi.grade(selectedSubmission.id, draft);
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã lưu điểm bài nộp", message: response.message });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Chấm bài thất bại",
        message: error.message || "Không thể lưu điểm cho bài nộp này.",
      });
    } finally {
      setIsSavingSubmissionId("");
    }
  }

  async function handleCreateExam(payload) {
    setIsSavingTask(true);

    try {
      const response = await examApi.create(payload);

      updateSearchParams((nextParams) => {
        nextParams.delete("create");
        nextParams.set("classroomId", String(response.data.classroomId));
        nextParams.set("taskId", String(response.data.id));
      });
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({
        tone: "success",
        title: "Đã tạo bài kiểm tra",
        message:
          response.message ||
          "Đề đã được tạo. Mở trang chi tiết để bổ sung câu hỏi và publish khi sẵn sàng.",
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo bài kiểm tra thất bại",
        message: error.message || "Không thể tạo bài kiểm tra mới.",
      });
      return false;
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleUpdateExam(taskId, payload) {
    setIsSavingTask(true);

    try {
      const response = await examApi.update(taskId, payload);
      setEditingTaskId("");
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã cập nhật bài kiểm tra", message: response.message });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật bài kiểm tra thất bại",
        message: error.message || "Không thể cập nhật bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSavingTask(false);
    }
  }

  async function handleDeleteExam(task) {
    if (String(armedDeleteTaskId) !== String(task.id)) {
      setArmedDeleteTaskId(String(task.id));
      return;
    }

    setTaskActionId(`delete-${task.id}`);

    try {
      const response = await examApi.delete(task.id);
      setArmedDeleteTaskId("");
      setEditingTaskId("");
      clearSelectedTaskFromQuery(task.id);
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã xóa bài kiểm tra", message: response.message });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa bài kiểm tra thất bại",
        message: error.message || "Không thể xóa bài kiểm tra.",
      });
    } finally {
      setTaskActionId("");
    }
  }

  async function handlePublishExam(task) {
    setTaskActionId(`publish-${task.id}`);

    try {
      const response = await examApi.publish(task.id);
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã publish bài kiểm tra", message: response.message });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Publish bài kiểm tra thất bại",
        message: error.message || "Không thể publish bài kiểm tra này.",
      });
    } finally {
      setTaskActionId("");
    }
  }

  async function handleCloseExam(task) {
    const hasConfirmed = window.confirm(`Bạn có chắc muốn đóng sớm bài kiểm tra "${task.title}" không?`);

    if (!hasConfirmed) {
      return;
    }

    setTaskActionId(`close-${task.id}`);

    try {
      const response = await examApi.closeEarly(task.id);
      setReloadVersion((previousValue) => previousValue + 1);
      showToast({ tone: "success", title: "Đã đóng sớm bài kiểm tra", message: response.message });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Đóng sớm bài kiểm tra thất bại",
        message: error.message || "Không thể đóng bài kiểm tra này ngay lúc này.",
      });
    } finally {
      setTaskActionId("");
    }
  }

  function buildTaskActions(task) {
    const isDeleteArmed = String(armedDeleteTaskId) === String(task.id);

    if (task.type === LEARNING_TASK_TYPES.exam) {
      return [
        {
          key: "edit",
          label: String(editingTaskId) === String(task.id) ? "Đang chỉnh sửa" : "Chỉnh sửa",
          onClick: () => {
            handleSelectTask(task.id);
            setEditingTaskId((previousValue) =>
              previousValue === String(task.id) ? "" : String(task.id),
            );
            updateSearchParams((nextParams) => nextParams.delete("create"));
          },
          variant: "secondary",
        },
        task.canPublish
          ? {
              key: "publish",
              label: taskActionId === `publish-${task.id}` ? "Đang publish..." : "Publish",
              onClick: () => handlePublishExam(task),
              variant: "primary",
              disabled: taskActionId === `publish-${task.id}` || task.publishIssueCount > 0,
            }
          : task.canCloseEarly
            ? {
                key: "close",
                label: taskActionId === `close-${task.id}` ? "Đang đóng..." : "Đóng sớm",
                onClick: () => handleCloseExam(task),
                variant: "danger",
                disabled: taskActionId === `close-${task.id}`,
              }
            : null,
        {
          key: "delete",
          label:
            taskActionId === `delete-${task.id}`
              ? "Đang xóa..."
              : isDeleteArmed
                ? "Xác nhận xóa"
                : "Xóa",
          onClick: () => handleDeleteExam(task),
          variant: "ghost",
          disabled: taskActionId === `delete-${task.id}`,
        },
      ].filter(Boolean);
    }

    return [
      {
        key: "grade",
        label: String(selectedTaskId) === String(task.id) ? "Đang xem" : "Mở chấm bài",
        onClick: () => {
          handleSelectTask(task.id);
          scrollToWorkspace();
        },
        variant: String(selectedTaskId) === String(task.id) ? "secondary" : "primary",
      },
      {
        key: "edit",
        label: String(editingTaskId) === String(task.id) ? "Đang chỉnh sửa" : "Chỉnh sửa",
        onClick: () => {
          handleSelectTask(task.id);
          setEditingTaskId((previousValue) =>
            previousValue === String(task.id) ? "" : String(task.id),
          );
          updateSearchParams((nextParams) => nextParams.delete("create"));
        },
        variant: "secondary",
      },
      {
        key: "delete",
        label: isDeleteArmed ? "Xác nhận xóa" : "Xóa",
        onClick: () => handleDeleteAssignment(task),
        variant: "ghost",
        disabled: isSavingTask,
      },
    ];
  }

  function renderCreateForm() {
    if (!isCreateFormVisible) {
      return null;
    }

    if (classrooms.length === 0) {
      return (
        <EmptyState
          title="Bạn cần có ít nhất một lớp học để tạo hoạt động mới."
          description="Hãy tạo lớp học trước rồi quay lại tạo bài tập hoặc bài kiểm tra cho lớp đó."
        />
      );
    }

    if (selectedType === LEARNING_TASK_TYPES.exam) {
      return (
        <ExamForm
          classroomOptions={classrooms}
          defaultClassroomId={selectedClassroomId || classrooms[0]?.id || ""}
          isSubmitting={isSavingTask}
          onSubmitExam={handleCreateExam}
          showDescriptions={false}
          submitLabel={pageCopy.createLabel}
          title="Tạo bài kiểm tra mới"
        />
      );
    }

    return (
      <AssignmentForm
        classroomOptions={classroomFormOptions}
        defaultClassroomId={selectedClassroomId || classrooms[0]?.id || ""}
        isSubmitting={isSavingTask}
        onSubmitAssignment={handleCreateAssignment}
        submitLabel={pageCopy.createLabel}
        title="Tạo bài tập mới"
      />
    );
  }

  function renderAssignmentDetailPanel(task) {
    return (
      <Card className="space-y-5">
        {String(editingTaskId) === String(task.id) ? (
          <AssignmentForm
            assignment={task.rawData}
            isSubmitting={isSavingTask}
            onCancel={() => setEditingTaskId("")}
            onSubmitAssignment={(payload) => handleUpdateAssignment(task.id, payload)}
            submitLabel="Lưu thay đổi"
            title="Chỉnh sửa bài tập"
          />
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-primary">Workspace chấm bài</h4>
              <p className="mt-1 text-sm text-secondary">
                Theo dõi danh sách bài nộp, nhập điểm và phản hồi ngay trên cùng màn hình.
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
              {selectedAssignmentSubmissions.length} bài nộp
            </span>
          </div>

          {selectedAssignmentSubmissions.length === 0 ? (
            <EmptyState title="Bài tập này chưa có bài nộp nào." />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                {selectedAssignmentSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => setSelectedSubmissionId(String(submission.id))}
                    className={`w-full rounded-[18px] border px-4 py-4 text-left transition-all duration-200 ${
                      String(selectedSubmission?.id) === String(submission.id)
                        ? "border-sky-200 bg-sky-50"
                        : "border-border bg-surface hover:bg-surface-sunken"
                    }`}
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary" htmlFor={`assignment-score-${selectedSubmission.id}`}>
                        Điểm
                      </label>
                      <input
                        id={`assignment-score-${selectedSubmission.id}`}
                        className="eg-input"
                        max={String(task.rawData?.maxScore || 10)}
                        min="0"
                        onChange={(event) => handleGradeDraftChange(selectedSubmission.id, "score", event.target.value)}
                        step="0.5"
                        type="number"
                        value={String(gradeDraftsBySubmissionId[selectedSubmission.id]?.score ?? "")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary" htmlFor={`assignment-feedback-${selectedSubmission.id}`}>
                        Nhận xét
                      </label>
                      <textarea
                        id={`assignment-feedback-${selectedSubmission.id}`}
                        className="eg-input min-h-[120px]"
                        onChange={(event) => handleGradeDraftChange(selectedSubmission.id, "feedback", event.target.value)}
                        value={gradeDraftsBySubmissionId[selectedSubmission.id]?.feedback ?? ""}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-secondary">
                      {selectedSubmission.gradedAt
                        ? `Đã chấm lúc ${formatShortDateTime(selectedSubmission.gradedAt)}`
                        : "Chưa chấm"}
                    </p>
                    <Button disabled={String(isSavingSubmissionId) === String(selectedSubmission.id)} onClick={handleGradeSubmission}>
                      {String(isSavingSubmissionId) === String(selectedSubmission.id) ? "Đang lưu..." : "Lưu điểm"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    );
  }

  function renderExamDetailPanel(task) {
    const summaryItems = buildExamSummaryCards(task);
    const previewToneClassName = getPreviewToneClassName(
      task.isPublished ? "success" : task.publishIssueCount > 0 ? "caution" : "info",
    );

    return (
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{getTypeLabel(task.type)}</Badge>
              <Badge variant="neutral">{task.className}</Badge>
              <Badge variant={task.isPublished ? "info" : "neutral"}>
                {task.isPublished ? "Đã publish" : "Bản nháp"}
              </Badge>
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-primary">{task.title}</h3>
            <p className="mt-2 text-sm text-secondary">
              Tạo lúc {formatShortDateTime(task.createdAt)} • Cập nhật {formatShortDateTime(task.rawData?.updatedAt || task.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                setEditingTaskId((previousValue) =>
                  previousValue === String(task.id) ? "" : String(task.id),
                )
              }
              variant="secondary"
            >
              {String(editingTaskId) === String(task.id) ? "Ẩn chỉnh sửa" : "Chỉnh sửa"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-4">
              <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-primary">{item.value}</p>
            </div>
          ))}
        </div>

        {String(editingTaskId) === String(task.id) ? (
          <div className="space-y-4">
            <ExamForm
              classroomOptions={classrooms}
              exam={task.rawData}
              isSubmitting={isSavingTask}
              onSubmitExam={(payload) => handleUpdateExam(task.id, payload)}
              showDescriptions={false}
              submitLabel="Lưu thay đổi"
              title="Chỉnh sửa bài kiểm tra"
            />

            <div className="rounded-[18px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-secondary">
              Thao tác quản lý câu hỏi, checklist publish chi tiết và khu vực anti-cheat vẫn được giữ ở trang chi tiết của bài kiểm tra để tránh dồn toàn bộ workflow nặng vào một màn hình danh sách.
            </div>
          </div>
        ) : null}

        <div className={`rounded-[18px] border p-4 text-sm leading-6 ${previewToneClassName}`}>
          {task.isPublished
            ? "Bài kiểm tra đã được publish. Sinh viên sẽ thấy bài theo lịch mở đề hiện tại."
            : task.publishIssueCount > 0
              ? "Đề hiện chưa đủ điều kiện publish nhanh từ màn hình này. Hãy thêm ít nhất một câu hỏi trong trang chi tiết trước khi phát hành."
              : "Đề đang ở trạng thái nháp nhưng đã có thể publish nhanh nếu cấu hình đã sẵn sàng."}
        </div>

        {task.rawData?.description ? (
          <div className="rounded-[18px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-primary">
            {task.rawData.description}
          </div>
        ) : (
          <div className="rounded-[18px] border border-border bg-surface-sunken p-4 text-sm leading-6 text-secondary">
            Bài kiểm tra này hiện chưa có mô tả bổ sung.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate(buildExamDetailPathByRole("Teacher", task.id))} variant="secondary">
            Soạn câu hỏi
          </Button>
          <Button onClick={() => navigate(buildExamMonitoringPathByRole("Teacher", task.id))} variant="ghost">
            <FiShield className="mr-2 h-4 w-4" />
            Giám sát
          </Button>
          <Button onClick={() => navigate(`${routeConfig.teacherResults}?examId=${task.id}`)} variant="ghost">
            Xem kết quả
          </Button>
          <Button
            onClick={() => handlePublishExam(task)}
            disabled={taskActionId === `publish-${task.id}` || task.publishIssueCount > 0 || task.isPublished}
            variant="primary"
          >
            {taskActionId === `publish-${task.id}` ? "Đang publish..." : "Publish đề"}
          </Button>
          {task.canCloseEarly ? (
            <Button onClick={() => handleCloseExam(task)} disabled={taskActionId === `close-${task.id}`} variant="danger">
              {taskActionId === `close-${task.id}` ? "Đang đóng..." : "Đóng sớm"}
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  function renderDetailPanel() {
    if (isLoading) {
      return <DetailPanelSkeleton />;
    }

    if (!selectedTask) {
      return (
        <Card>
          <EmptyState title="Chọn một hoạt động để xem chi tiết quản lý." />
        </Card>
      );
    }

    if (selectedTask.type === LEARNING_TASK_TYPES.exam) {
      return renderExamDetailPanel(selectedTask);
    }

    return renderAssignmentDetailPanel(selectedTask);
  }

  const emptyTitle =
    tasks.length > 0
      ? "Không có hoạt động nào khớp với bộ lọc hiện tại."
      : pageCopy.emptyTitle;
  const emptyDescription =
    tasks.length > 0
      ? "Thử đổi khối trạng thái đang chọn hoặc mở lại toàn bộ danh sách để xem thêm hoạt động."
      : pageCopy.emptyDescription;
  const workspaceSectionTitle =
    selectedType === LEARNING_TASK_TYPES.exam ? "Khu điều hành bài kiểm tra" : "Khu chấm bài và phản hồi";

  return (
    <div className="space-y-3.5">
      <div
        className="eg-page-hero"
        style={{ padding: "12px 20px" }}
      >
        <div
          className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl"
          style={{ background: "rgb(14 165 233 / 10%)" }}
          aria-hidden="true"
        />
        <div className="relative space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-0.5">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-primary">
                {pageCopy.title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 lg:shrink-0">
              <Button
                disabled={classrooms.length === 0 && !isLoading}
                onClick={toggleCreateForm}
                variant={isCreateFormVisible ? "secondary" : "primary"}
                className="text-xs py-1.5 px-3"
              >
                {isCreateFormVisible ? "Ẩn form tạo" : pageCopy.createLabel}
              </Button>
            </div>
          </div>

          <LearningTaskTypeTabs
            onChange={handleTypeChange}
            options={LEARNING_TASK_TYPE_OPTIONS}
            selectedType={selectedType}
          />
        </div>
      </div>

      <LearningTaskStats
        activeFilter={selectedQuickFilter}
        items={stats}
        onSelectFilter={handleQuickFilterChange}
        compact={true}
      />

      {renderCreateForm()}

      {selectedType === LEARNING_TASK_TYPES.exam ? (
        <ExamGrid
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          errorMessage={loadErrorMessage}
          isLoading={isLoading}
          onRetry={handleRetry}
          tasks={visibleTasks}
          onEdit={(task) => {
            handleSelectTask(task.id);
            setEditingTaskId(String(task.id));
          }}
          onDelete={(task) => handleDeleteExam(task)}
          onPublish={(task) => handlePublishExam(task)}
          onCloseEarly={(task) => handleCloseExam(task)}
          onComposeQuestions={(task) => navigate(buildExamDetailPathByRole("Teacher", task.id))}
          onMonitor={(task) => navigate(buildExamMonitoringPathByRole("Teacher", task.id))}
          onViewResults={(task) => navigate(`${routeConfig.teacherResults}?examId=${task.id}`)}
          taskActionId={taskActionId}
          armedDeleteTaskId={armedDeleteTaskId}
          setArmedDeleteTaskId={setArmedDeleteTaskId}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <div className="space-y-4">
            <LearningTaskList
              emptyDescription={emptyDescription}
              emptyTitle={emptyTitle}
              errorMessage={loadErrorMessage}
              getTaskActions={buildTaskActions}
              isLoading={isLoading}
              onRetry={handleRetry}
              onSelect={handleSelectTask}
              selectedTaskId={selectedTask?.id ?? ""}
              tasks={visibleTasks}
            />
          </div>

          <div
            ref={workspacePanelRef}
            className="space-y-4 rounded-[28px] border border-sky-200/80 p-4 sm:p-5"
            style={{ background: "linear-gradient(180deg, rgb(14 165 233 / 8%), rgb(255 255 255 / 96%))" }}
          >
            <h2 className="text-lg font-semibold text-primary">{workspaceSectionTitle}</h2>

            {renderDetailPanel()}
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingTaskId && selectedType === LEARNING_TASK_TYPES.exam && (() => {
        const editingTask = tasks.find((t) => String(t.id) === String(editingTaskId));
        if (!editingTask) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setEditingTaskId("")}
            />

            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin bài kiểm tra</h3>
                <button
                  onClick={() => setEditingTaskId("")}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="py-4 flex-1 overflow-y-auto min-h-[400px]">
                <ExamForm
                  classroomOptions={classrooms}
                  exam={editingTask.rawData}
                  isSubmitting={isSavingTask}
                  onSubmitExam={(payload) => handleUpdateExam(editingTask.id, payload)}
                  showDescriptions={false}
                  submitLabel="Lưu thay đổi"
                  title=""
                  hideSubmitButton={true}
                  formId="edit-exam-form"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <Button onClick={() => setEditingTaskId("")} variant="secondary">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  form="edit-exam-form"
                  disabled={isSavingTask}
                  variant="primary"
                >
                  {isSavingTask ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
