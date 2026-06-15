import { useEffect, useMemo, useState } from "react";
import { assignmentApi } from "../../../api/assignmentApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import TextInput from "../../../components/forms/TextInput";
import { formatShortDateTime } from "../../../utils/formatDate";
import AssignmentForm from "./AssignmentForm";
import {
  buildAssignmentSummaryItems,
  cacheSubmission,
  getAssignmentDeadlineMeta,
  getAssignmentStatusMeta,
  getCachedSubmission,
  sortAssignmentsByDeadline,
} from "../assignmentHelpers";

function buildStudentSubmissionDraft() {
  return {
    content: "",
  };
}

function buildGradeDraft(submission) {
  return {
    score: typeof submission?.score === "number" ? String(submission.score) : "",
    feedback: submission?.feedback ?? "",
  };
}

function buildSubmissionStatusMeta(submission) {
  if (typeof submission?.score === "number") {
    return {
      label: "Đã chấm",
      variant: "success",
    };
  }

  return {
    label: "Chờ chấm",
    variant: "neutral",
  };
}

function buildAssignmentStatItems(assignment, localSubmission, isTeacherOwner) {
  return [
    {
      label: "Hạn nộp",
      value: formatShortDateTime(assignment.deadline),
    },
    {
      label: "Điểm tối đa",
      value: `${assignment.maxScore} điểm`,
    },
    {
      label: isTeacherOwner ? "Lượt nộp" : "Trạng thái",
      value: isTeacherOwner
        ? `${assignment.submissionCount} bài`
        : getAssignmentStatusMeta(assignment, localSubmission).label,
    },
    {
      label: "Tạo lúc",
      value: formatShortDateTime(assignment.createdAt),
    },
  ];
}

export default function AssignmentSection({ classroom, user, showToast }) {
  const isTeacherOwner = Boolean(classroom?.canEdit && user?.role === "Teacher");
  const isStudentView = user?.role === "Student";
  const isAdminView = user?.role === "Admin";
  const [assignments, setAssignments] = useState([]);
  const [studentSubmissionsByAssignmentId, setStudentSubmissionsByAssignmentId] = useState({});
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [gradeDraftsBySubmissionId, setGradeDraftsBySubmissionId] = useState({});
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [armedDeleteAssignmentId, setArmedDeleteAssignmentId] = useState(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
  const [savingSubmissionId, setSavingSubmissionId] = useState(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  const sortedAssignments = useMemo(
    () => sortAssignmentsByDeadline(assignments),
    [assignments],
  );
  const summaryItems = useMemo(
    () => buildAssignmentSummaryItems(assignments),
    [assignments],
  );

  async function loadAssignments() {
    setIsLoading(true);

    try {
      const response = await assignmentApi.getByClassroom(classroom.id);
      const nextAssignments = response.data;

      setAssignments(nextAssignments);
      setLoadErrorMessage("");

      if (isStudentView) {
        const nextCachedSubmissions = nextAssignments.reduce((accumulator, assignment) => {
          const cachedSubmission = getCachedSubmission(user?.id, assignment.id);

          if (!cachedSubmission) {
            return accumulator;
          }

          return {
            ...accumulator,
            [assignment.id]: cachedSubmission,
          };
        }, {});

        setStudentSubmissionsByAssignmentId(nextCachedSubmissions);
      }
    } catch (error) {
      setAssignments([]);
      setLoadErrorMessage(error.message || "Không thể tải danh sách bài tập.");
      showToast({
        tone: "danger",
        title: "Tải bài tập thất bại",
        message: error.message || "Không thể tải danh sách bài tập.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialAssignments() {
      try {
        const response = await assignmentApi.getByClassroom(classroom.id);

        if (!isMounted) {
          return;
        }

        setAssignments(response.data);
        setLoadErrorMessage("");

        if (isStudentView) {
          const nextCachedSubmissions = response.data.reduce((accumulator, assignment) => {
            const cachedSubmission = getCachedSubmission(user?.id, assignment.id);

            if (!cachedSubmission) {
              return accumulator;
            }

            return {
              ...accumulator,
              [assignment.id]: cachedSubmission,
            };
          }, {});

          setStudentSubmissionsByAssignmentId(nextCachedSubmissions);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAssignments([]);
        setLoadErrorMessage(error.message || "Không thể tải danh sách bài tập.");
        showToast({
          tone: "danger",
          title: "Tải bài tập thất bại",
          message: error.message || "Không thể tải danh sách bài tập.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAssignments();

    return () => {
      isMounted = false;
    };
  }, [classroom.id, isStudentView, showToast, user?.id]);

  async function loadAssignmentSubmissions(assignmentId) {
    setIsLoadingSubmissions(true);

    try {
      const response = await assignmentApi.getSubmissions(assignmentId);
      const nextSubmissions = response.data;

      setSubmissionsByAssignmentId((previousValue) => ({
        ...previousValue,
        [assignmentId]: nextSubmissions,
      }));
      setGradeDraftsBySubmissionId((previousValue) => {
        const nextValue = { ...previousValue };

        nextSubmissions.forEach((submission) => {
          nextValue[submission.id] = buildGradeDraft(submission);
        });

        return nextValue;
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tải bài nộp thất bại",
        message: error.message || "Không thể tải danh sách bài nộp.",
      });
    } finally {
      setIsLoadingSubmissions(false);
    }
  }

  async function handleCreateAssignment(payload) {
    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.create(classroom.id, payload);
      await loadAssignments();
      setIsCreateFormVisible(false);
      showToast({
        tone: "success",
        title: "Đã tạo bài tập",
        message: response.message,
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo bài tập thất bại",
        message: error.message || "Không thể tạo bài tập.",
      });
      return false;
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleUpdateAssignment(assignmentId, payload) {
    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.update(assignmentId, payload);
      await loadAssignments();
      setEditingAssignmentId(null);
      setArmedDeleteAssignmentId(null);
      showToast({
        tone: "success",
        title: "Đã cập nhật bài tập",
        message: response.message,
      });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật bài tập thất bại",
        message: error.message || "Không thể cập nhật bài tập.",
      });
      return false;
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleDeleteAssignment(assignmentId) {
    if (armedDeleteAssignmentId !== assignmentId) {
      setArmedDeleteAssignmentId(assignmentId);
      setEditingAssignmentId(null);
      return;
    }

    setIsSavingAssignment(true);

    try {
      const response = await assignmentApi.delete(assignmentId);
      await loadAssignments();
      setArmedDeleteAssignmentId(null);
      setExpandedAssignmentId((previousValue) =>
        previousValue === assignmentId ? null : previousValue,
      );
      showToast({
        tone: "success",
        title: "Đã xóa bài tập",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa bài tập thất bại",
        message: error.message || "Không thể xóa bài tập.",
      });
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function handleToggleAssignmentDetails(assignmentId) {
    const shouldClose = expandedAssignmentId === assignmentId;
    setExpandedAssignmentId(shouldClose ? null : assignmentId);

    if (!shouldClose && isTeacherOwner && !submissionsByAssignmentId[assignmentId]) {
      await loadAssignmentSubmissions(assignmentId);
    }
  }

  function handleSubmissionDraftChange(assignmentId, value) {
    setSubmissionDrafts((previousValue) => ({
      ...previousValue,
      [assignmentId]: {
        ...(previousValue[assignmentId] ?? buildStudentSubmissionDraft()),
        content: value,
      },
    }));
  }

  async function handleSubmitAssignment(assignment) {
    const draft = submissionDrafts[assignment.id] ?? buildStudentSubmissionDraft();
    setSubmittingAssignmentId(assignment.id);

    try {
      const response = await assignmentApi.submit(assignment.id, draft);
      const nextSubmission = response.data;

      cacheSubmission(user?.id, nextSubmission);
      setStudentSubmissionsByAssignmentId((previousValue) => ({
        ...previousValue,
        [assignment.id]: nextSubmission,
      }));
      setSubmissionDrafts((previousValue) => ({
        ...previousValue,
        [assignment.id]: buildStudentSubmissionDraft(),
      }));
      showToast({
        tone: "success",
        title: "Đã nộp bài",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Nộp bài thất bại",
        message: error.message || "Không thể nộp bài tập.",
      });
    } finally {
      setSubmittingAssignmentId(null);
    }
  }

  function handleGradeDraftChange(submissionId, fieldName, value) {
    setGradeDraftsBySubmissionId((previousValue) => ({
      ...previousValue,
      [submissionId]: {
        ...(previousValue[submissionId] ?? buildGradeDraft()),
        [fieldName]: value,
      },
    }));
  }

  async function handleGradeSubmission(assignment, submissionId) {
    const draft = gradeDraftsBySubmissionId[submissionId];
    setSavingSubmissionId(submissionId);

    try {
      const response = await assignmentApi.grade(submissionId, {
        score: Number(draft?.score),
        feedback: draft?.feedback ?? "",
      });

      await loadAssignmentSubmissions(assignment.id);
      showToast({
        tone: "success",
        title: "Đã chấm điểm",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Chấm điểm thất bại",
        message: error.message || "Không thể chấm điểm bài nộp.",
      });
    } finally {
      setSavingSubmissionId(null);
    }
  }

  if (isLoading) {
    return (
      <Card className="text-sm text-secondary">
        Đang tải bài tập...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-primary">Bài tập</h2>
          {isTeacherOwner ? (
            <Button
              onClick={() => setIsCreateFormVisible((previousValue) => !previousValue)}
              variant={isCreateFormVisible ? "secondary" : "primary"}
            >
              {isCreateFormVisible ? "Ẩn form tạo bài tập" : "Tạo bài tập"}
            </Button>
          ) : null}
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

      {isTeacherOwner && isCreateFormVisible ? (
        <AssignmentForm
          isSubmitting={isSavingAssignment}
          onSubmitAssignment={handleCreateAssignment}
          submitLabel="Tạo bài tập"
          title="Tạo bài tập mới"
        />
      ) : null}

      {sortedAssignments.length === 0 ? (
        <EmptyState
          title={loadErrorMessage ? "Không thể tải bài tập." : "Chưa có bài tập nào."}
          description={loadErrorMessage || ""}
          action={
            isTeacherOwner ? (
              <Button onClick={() => setIsCreateFormVisible(true)}>Tạo bài tập</Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => {
            const localSubmission = studentSubmissionsByAssignmentId[assignment.id] ?? null;
            const statusMeta = getAssignmentStatusMeta(assignment, localSubmission);
            const deadlineMeta = getAssignmentDeadlineMeta(assignment);
            const submissionDraft =
              submissionDrafts[assignment.id] ?? buildStudentSubmissionDraft();
            const assignmentSubmissions = submissionsByAssignmentId[assignment.id] ?? [];

            return (
              <Card key={assignment.id} className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      <Badge variant={deadlineMeta.variant}>{deadlineMeta.label}</Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-primary">{assignment.title}</h3>
                      {assignment.description ? (
                        <p className="max-w-3xl text-sm leading-6 text-secondary">
                          {assignment.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isTeacherOwner ? (
                      <>
                        <Button
                          onClick={() =>
                            setEditingAssignmentId((previousValue) =>
                              previousValue === assignment.id ? null : assignment.id,
                            )
                          }
                          variant={editingAssignmentId === assignment.id ? "primary" : "secondary"}
                        >
                          {editingAssignmentId === assignment.id ? "Đang chỉnh sửa" : "Sửa bài tập"}
                        </Button>
                        <Button
                          onClick={() => handleToggleAssignmentDetails(assignment.id)}
                          variant="ghost"
                        >
                          {expandedAssignmentId === assignment.id ? "Ẩn bài nộp" : "Xem bài nộp"}
                        </Button>
                        <Button
                          disabled={isSavingAssignment}
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          variant="ghost"
                        >
                          {armedDeleteAssignmentId === assignment.id ? "Xác nhận xóa" : "Xóa bài tập"}
                        </Button>
                      </>
                    ) : isStudentView ? (
                      <Button
                        onClick={() => handleToggleAssignmentDetails(assignment.id)}
                        variant={localSubmission ? "secondary" : "primary"}
                      >
                        {expandedAssignmentId === assignment.id
                          ? "Ẩn bài nộp"
                          : localSubmission
                            ? "Xem bài nộp"
                            : "Nộp bài"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {buildAssignmentStatItems(assignment, localSubmission, isTeacherOwner).map((item) => (
                    <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
                      <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>

                {armedDeleteAssignmentId === assignment.id ? (
                  <p className="rounded-[16px] border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                    Bam lai nut xoa de xac nhan thao tac.
                  </p>
                ) : null}

                {editingAssignmentId === assignment.id && isTeacherOwner ? (
                  <AssignmentForm
                    assignment={assignment}
                    isSubmitting={isSavingAssignment}
                    onCancel={() => setEditingAssignmentId(null)}
                    onSubmitAssignment={(payload) => handleUpdateAssignment(assignment.id, payload)}
                    submitLabel="Lưu thay đổi"
                    title="Chỉnh sửa bài tập"
                  />
                ) : null}

                {expandedAssignmentId === assignment.id && isTeacherOwner ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-primary">Bài nộp</h4>
                      <span className="text-sm text-secondary">
                        {assignmentSubmissions.length} bài
                      </span>
                    </div>

                    {isLoadingSubmissions ? (
                      <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                        Đang tải bài nộp...
                      </div>
                    ) : assignmentSubmissions.length > 0 ? (
                      <div className="space-y-4">
                        {assignmentSubmissions.map((submission) => {
                          const status = buildSubmissionStatusMeta(submission);
                          const gradeDraft =
                            gradeDraftsBySubmissionId[submission.id] ?? buildGradeDraft(submission);

                          return (
                            <div
                              key={submission.id}
                              className="space-y-4 rounded-[20px] border border-border bg-neutral p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={status.variant}>{status.label}</Badge>
                                      {typeof submission.score === "number" ? (
                                        <Badge variant="success">{submission.score} điểm</Badge>
                                      ) : null}
                                    </div>
                                  <div>
                                    <p className="text-sm font-semibold text-primary">
                                      {submission.studentName || submission.studentEmail}
                                    </p>
                                    <p className="mt-1 text-sm text-secondary">
                                      {submission.studentEmail}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-secondary">
                                  {formatShortDateTime(submission.submittedAt)}
                                </p>
                              </div>

                              <div className="rounded-[16px] border border-border bg-surface px-4 py-4 text-sm leading-6 text-primary">
                                {submission.content}
                              </div>

                              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                                <TextInput
                                  id={`submission-score-${submission.id}`}
                                  label="Điểm"
                                  max={assignment.maxScore}
                                  min="0"
                                  onChange={(event) =>
                                    handleGradeDraftChange(submission.id, "score", event.target.value)
                                  }
                                  step="0.5"
                                  type="number"
                                  value={gradeDraft.score}
                                />
                                <TextInput
                                  as="textarea"
                                  id={`submission-feedback-${submission.id}`}
                                  label="Nhận xét"
                                  onChange={(event) =>
                                    handleGradeDraftChange(
                                      submission.id,
                                      "feedback",
                                      event.target.value,
                                    )
                                  }
                                  value={gradeDraft.feedback}
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-secondary">
                                  {submission.gradedAt
                                    ? `Chấm lúc ${formatShortDateTime(submission.gradedAt)}`
                                    : "Chưa chấm"}
                                </p>
                                <Button
                                  disabled={savingSubmissionId === submission.id}
                                  onClick={() => handleGradeSubmission(assignment, submission.id)}
                                >
                                  {savingSubmissionId === submission.id ? "Đang lưu..." : "Lưu điểm"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                        Chưa có bài nộp nào.
                      </div>
                    )}
                  </div>
                ) : null}

                {expandedAssignmentId === assignment.id && isStudentView ? (
                  localSubmission ? (
                    <div className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge variant="info">Đã nộp bài</Badge>
                        <p className="text-sm text-secondary">
                          {localSubmission.submittedAt
                            ? formatShortDateTime(localSubmission.submittedAt)
                            : "Đã ghi nhận trong phiên này"}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border bg-surface px-4 py-4 text-sm leading-6 text-primary">
                        {localSubmission.content || "Nội dung bài nộp đã được lưu."}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-[20px] border border-border bg-neutral p-5">
                      {deadlineMeta.variant === "danger" ? (
                        <p className="rounded-[16px] border border-danger/20 bg-danger-muted px-4 py-3 text-sm text-danger">
                          Bài tập đã quá hạn nộp.
                        </p>
                      ) : null}
                      <TextInput
                        as="textarea"
                        id={`assignment-submit-${assignment.id}`}
                        label="Nội dung bài nộp"
                        onChange={(event) =>
                          handleSubmissionDraftChange(assignment.id, event.target.value)
                        }
                        placeholder="Nhập nội dung bài làm của bạn"
                        required
                        value={submissionDraft.content}
                      />
                      <div className="flex flex-wrap justify-end gap-3">
                        <Button
                          disabled={
                            deadlineMeta.variant === "danger" ||
                            submittingAssignmentId === assignment.id ||
                            !submissionDraft.content.trim()
                          }
                          onClick={() => handleSubmitAssignment(assignment)}
                        >
                          {submittingAssignmentId === assignment.id ? "Đang nộp..." : "Nộp bài"}
                        </Button>
                      </div>
                    </div>
                  )
                ) : null}

                {isAdminView ? (
                  <p className="text-sm text-secondary">
                    Khu vực này đang ở chế độ theo dõi.
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
