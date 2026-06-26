import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { assignmentApi } from "../../../api/assignmentApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import {
  buildExamDetailPathByRole,
  routeConfig,
} from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import { buildTeacherExamMonitoringPath, isLiveProctoringRoomAvailable } from "../../proctoring/utils/proctoringRouting";
import ProctoringRoomLink from "../../proctoring/components/ProctoringRoomLink";
import AssignmentSection from "../../assignments/components/AssignmentSection";
import { getExamStatusVariant } from "../../exams/examHelpers";
import { normalizeTeacherClassroomTab } from "./teacher-classroom-tabs";
import TeacherNotificationTab from "./TeacherNotificationTab";

const OVERVIEW_BAR_COLORS = {
  assignments: "#1D4ED8",
  exams: "#0369A1",
};

const EXAM_STATUS_PIE_COLORS = {
  closed: "#047857",
  active: "#0369A1",
  upcoming: "#D97706",
};

function buildOverviewChartData(assignments, exams) {
  return [
    {
      id: "assignments",
      name: "Bài tập",
      value: assignments.length,
      color: OVERVIEW_BAR_COLORS.assignments,
    },
    {
      id: "exams",
      name: "Bài thi",
      value: exams.length,
      color: OVERVIEW_BAR_COLORS.exams,
    },
  ];
}

function ClassroomOverviewTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const chartPoint = payload[0]?.payload;

  return (
    <div className="rounded-[14px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
      <p className="mb-1 font-semibold text-primary">{label}</p>
      <p className="text-secondary">
        Tổng số{" "}
        <span className="font-semibold text-primary">
          {chartPoint?.value ?? 0}
        </span>
      </p>
    </div>
  );
}

function buildExamStatusChartData(exams) {
  const closedCount = exams.filter(
    (exam) => exam.statusLabel === "Đã đóng",
  ).length;
  const activeCount = exams.filter(
    (exam) => exam.statusLabel === "Đang mở",
  ).length;
  const upcomingCount = exams.length - closedCount - activeCount;

  return [
    {
      id: "closed",
      label: "Đã đóng",
      value: closedCount,
      color: EXAM_STATUS_PIE_COLORS.closed,
    },
    {
      id: "active",
      label: "Đang diễn ra",
      value: activeCount,
      color: EXAM_STATUS_PIE_COLORS.active,
    },
    {
      id: "upcoming",
      label: "Chưa diễn ra",
      value: upcomingCount,
      color: EXAM_STATUS_PIE_COLORS.upcoming,
    },
  ];
}

function ExamStatusTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const chartPoint = payload[0]?.payload;

  return (
    <div className="rounded-[14px] border border-border bg-surface p-3 text-xs text-primary shadow-none">
      <p className="mb-1 font-semibold text-primary">{chartPoint?.label}</p>
      <p className="text-secondary">
        Số lượng{" "}
        <span className="font-semibold text-primary">
          {chartPoint?.value ?? 0}
        </span>
      </p>
    </div>
  );
}

function getExamStateSummaryVariant(label) {
  if (label === "Đã đóng") {
    return "danger";
  }

  if (label === "Đang diễn ra") {
    return "success";
  }

  if (label === "Chưa diễn ra") {
    return "caution";
  }

  return "neutral";
}

function buildStudentSummaryRows(members, submissionsByAssignmentId, attempts) {
  const attemptsByStudentId = attempts.reduce((accumulator, attempt) => {
    const studentId = String(attempt.studentId || "");
    const previousValue = accumulator.get(studentId) ?? [];

    previousValue.push(attempt);
    accumulator.set(studentId, previousValue);
    return accumulator;
  }, new Map());

  const submissionCountByStudentId = Object.values(submissionsByAssignmentId)
    .flat()
    .reduce((accumulator, submission) => {
      const studentId = String(submission.studentId || "");

      accumulator[studentId] = (accumulator[studentId] ?? 0) + 1;
      return accumulator;
    }, {});

  return members.map((member) => {
    const studentAttempts =
      attemptsByStudentId.get(String(member.studentId || "")) ?? [];
    const scoredAttempts = studentAttempts.filter(
      (attempt) => typeof attempt.score === "number",
    );

    return {
      ...member,
      submittedCount:
        submissionCountByStudentId[String(member.studentId || "")] ?? 0,
      averageScore:
        scoredAttempts.length > 0
          ? Math.round(
              (scoredAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
                scoredAttempts.length) *
                10,
            ) / 10
          : null,
    };
  });
}

export default function TeacherClassroomWorkspace({
  activeTab = "overview",
  classroom,
  highlightedStudentId = "",
  members,
  showToast,
  user,
  // Lifted props
  assignments: propAssignments,
  submissionsByAssignmentId: propSubmissionsByAssignmentId,
  exams: propExams,
  attempts: propAttempts,
  warningCountByExamId: propWarningCountByExamId,
  notifications: propNotifications,
  isLoading: propIsLoading,
  onNotificationCreated,
  onAssignmentCreated,
}) {
  const [assignments, setAssignments] = useState(propAssignments || []);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState(
    propSubmissionsByAssignmentId || {},
  );
  const [exams, setExams] = useState(propExams || []);
  const [attempts, setAttempts] = useState(propAttempts || []);
  const [warningCountByExamId, setWarningCountByExamId] = useState(
    propWarningCountByExamId || {},
  );
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : true,
  );
  const resolvedActiveTab = normalizeTeacherClassroomTab(activeTab);

  useEffect(() => {
    if (propAssignments !== undefined) {
      setAssignments(propAssignments);
      setSubmissionsByAssignmentId(propSubmissionsByAssignmentId || {});
      setExams(propExams || []);
      setAttempts(propAttempts || []);
      setWarningCountByExamId(propWarningCountByExamId || {});
      setIsLoading(propIsLoading !== undefined ? propIsLoading : false);
      return;
    }

    let isMounted = true;

    async function loadWorkspaceData() {
      setIsLoading(true);

      try {
        const [assignmentResponse, examResponse] = await Promise.all([
          assignmentApi.getByClassroom(classroom.id),
          examApi.getAll({ classroomId: classroom.id }),
        ]);
        const nextAssignments = Array.isArray(assignmentResponse.data)
          ? assignmentResponse.data
          : [];
        const nextExams = Array.isArray(examResponse.data)
          ? examResponse.data
          : [];
        const [submissionEntries, attemptEntries, antiCheatEntries] =
          await Promise.all([
            Promise.all(
              nextAssignments.map(async (assignment) => {
                try {
                  const response = await assignmentApi.getSubmissions(
                    assignment.id,
                  );
                  return [
                    assignment.id,
                    Array.isArray(response.data) ? response.data : [],
                  ];
                } catch {
                  return [assignment.id, []];
                }
              }),
            ),
            Promise.all(
              nextExams.map(async (exam) => {
                try {
                  const response = await examAttemptApi.getByExam(exam.id);
                  return [
                    exam.id,
                    Array.isArray(response.data) ? response.data : [],
                  ];
                } catch {
                  return [exam.id, []];
                }
              }),
            ),
            Promise.all(
              nextExams.map(async (exam) => {
                if (!exam.enableAntiCheat) {
                  return [exam.id, 0];
                }

                try {
                  const response = await antiCheatApi.getExamSummary(exam.id);
                  return [exam.id, Number(response.data?.totalLogs) || 0];
                } catch {
                  return [exam.id, 0];
                }
              }),
            ),
          ]);

        if (isMounted) {
          setAssignments(nextAssignments);
          setSubmissionsByAssignmentId(Object.fromEntries(submissionEntries));
          setExams(nextExams);
          setAttempts(
            attemptEntries.flatMap(([, examAttempts]) => examAttempts),
          );
          setWarningCountByExamId(Object.fromEntries(antiCheatEntries));
        }
      } catch (error) {
        showToast({
          tone: "danger",
          title: "Tải workspace lớp học thất bại",
          message:
            error.message || "Không thể tải dữ liệu bổ sung của lớp học.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, [classroom.id, showToast, propAssignments, propSubmissionsByAssignmentId, propExams, propAttempts, propWarningCountByExamId, propIsLoading]);

  const studentRows = useMemo(
    () => buildStudentSummaryRows(members, submissionsByAssignmentId, attempts),
    [attempts, members, submissionsByAssignmentId],
  );

  const overviewChartData = useMemo(
    () => buildOverviewChartData(assignments, exams),
    [assignments, exams],
  );

  const examStatusChartData = useMemo(
    () => buildExamStatusChartData(exams),
    [exams],
  );

  const visibleExamStatusChartData = useMemo(
    () => examStatusChartData.filter((item) => item.value > 0),
    [examStatusChartData],
  );

  const recentActivities = useMemo(() => {
    const assignmentActivities = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: `Đã tạo bài tập ${assignment.title}`,
      date: assignment.createdAt,
    }));
    const examActivities = exams.map((exam) => ({
      id: `exam-${exam.id}`,
      title: `${exam.isPublished ? "Đã publish" : "Đã tạo"} đề thi ${exam.title}`,
      date: exam.updatedAt || exam.createdAt,
    }));
    const attemptActivities = attempts.map((attempt) => ({
      id: `attempt-${attempt.id}`,
      title: `${attempt.studentName} ${attempt.status === "Submitted" ? "đã nộp bài thi" : "đang làm bài thi"}`,
      date: attempt.submittedAt || attempt.startedAt,
    }));

    return [...assignmentActivities, ...examActivities, ...attemptActivities]
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem.date || 0) - new Date(firstItem.date || 0),
      )
      .slice(0, 8);
  }, [assignments, exams, attempts]);

  if (isLoading) {
    return (
      <Card className="text-sm text-secondary">
        Đang tải workspace lớp học...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {resolvedActiveTab === "overview" ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                Thống kê bài tập và bài thi
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Biểu đồ cột thể hiện tổng số bài tập và bài thi hiện có trong
                lớp.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {overviewChartData.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-neutral px-3 py-1.5 text-sm font-medium text-secondary"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}:{" "}
                  <span className="font-semibold text-primary">
                    {item.value}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overviewChartData}
                margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<ClassroomOverviewTooltip />}
                  cursor={{ fill: "rgba(241, 245, 249, 0.9)" }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={78}>
                  {overviewChartData.map((item) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      {resolvedActiveTab === "members" ? (
        studentRows.length === 0 ? (
          <EmptyState title="Lớp học này hiện chưa có sinh viên nào." />
        ) : (
          <div className="space-y-4">
            {studentRows.map((member) => (
              <Card
                key={member.id}
                className={`space-y-3 ${
                  String(member.studentId) === highlightedStudentId
                    ? "ring-2 ring-tertiary/30"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">
                      {member.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-secondary">
                      {member.email}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                    {member.statusLabel}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    Tham gia:{" "}
                    <span className="font-semibold text-primary">
                      {formatShortDateTime(member.joinedAt)}
                    </span>
                  </div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    Bài đã nộp:{" "}
                    <span className="font-semibold text-primary">
                      {member.submittedCount}
                    </span>
                  </div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    Điểm TB:{" "}
                    <span className="font-semibold text-primary">
                      {typeof member.averageScore === "number"
                        ? member.averageScore
                        : "--"}
                    </span>
                  </div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                    Trạng thái:{" "}
                    <span className="font-semibold text-primary">
                      {member.statusLabel}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {resolvedActiveTab === "assignments" ? (
        <AssignmentSection
          classroom={classroom}
          showToast={showToast}
          user={user}
          onAssignmentCreated={onAssignmentCreated}
        />
      ) : null}

      {resolvedActiveTab === "notifications" ? (
        <TeacherNotificationTab
          classroom={classroom}
          members={members}
          onNotificationCreated={onNotificationCreated}
        />
      ) : null}

      {resolvedActiveTab === "exams" ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                Bài thi của lớp
              </h3>
            </div>

            <Link
              className="eg-button eg-button-primary"
              to={`${routeConfig.teacherExams}?create=1&classroomId=${classroom.id}`}
            >
              Tạo bài thi
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              {exams.length === 0 ? (
                <EmptyState 
                  title="Lớp chưa có bài thi nào"
                  action={
                    <Link
                      className="eg-button eg-button-primary"
                      to={`${routeConfig.teacherExams}?create=1&classroomId=${classroom.id}`}
                    >
                      Tạo bài thi
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {exams.map((exam) => (
                    <Card key={exam.id} className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            {exam.title}
                          </h3>
                          <p className="mt-1 text-sm text-secondary">
                            {exam.durationMinutes} phút
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge
                            variant={getExamStatusVariant(exam.statusLabel)}
                          >
                            {exam.statusLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                          Mở đề:{" "}
                          <span className="font-semibold text-primary">
                            {formatShortDateTime(exam.startTime)}
                          </span>
                        </div>
                        <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                          Đóng đề:{" "}
                          <span className="font-semibold text-primary">
                            {formatShortDateTime(exam.endTime)}
                          </span>
                        </div>
                        <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                          Lượt làm:{" "}
                          <span className="font-semibold text-primary">
                            {
                              attempts.filter(
                                (attempt) =>
                                  Number(attempt.examId) === Number(exam.id),
                              ).length
                            }
                          </span>
                        </div>
                        <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                          Cảnh báo:{" "}
                          <span className="font-semibold text-primary">
                            {warningCountByExamId[exam.id] || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          className="eg-button eg-button-secondary"
                          to={buildExamDetailPathByRole(user?.role, exam.id)}
                        >
                          Xem chi tiết
                        </Link>
                        {isLiveProctoringRoomAvailable(exam) ? (
                          <ProctoringRoomLink
                            className="eg-button eg-button-ghost"
                            examId={exam.id}
                          >
                            Giám sát
                          </ProctoringRoomLink>
                        ) : (
                          <Link
                            className="eg-button eg-button-ghost"
                            to={buildTeacherExamMonitoringPath(exam)}
                          >
                            Giám sát
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Card className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Tỉ lệ trạng thái bài thi
                </h3>
              </div>

              {exams.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-secondary">
                  Chưa có dữ liệu bài thi để hiển thị biểu đồ.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="relative h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={visibleExamStatusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {visibleExamStatusChartData.map((item) => (
                            <Cell key={item.id} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ExamStatusTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold tracking-tight text-primary">
                        {exams.length}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                        Tổng bài thi
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {examStatusChartData.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[14px] border border-border bg-neutral px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 rounded-[4px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <Badge
                            variant={getExamStateSummaryVariant(item.label)}
                          >
                            {item.label}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {resolvedActiveTab === "results" ? (
        attempts.length === 0 ? (
          <EmptyState title="Chưa có lượt làm bài nào trong lớp này." />
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const exam = exams.find(
                (item) => Number(item.id) === Number(attempt.examId),
              );

              return (
                <Card key={attempt.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {attempt.studentName}
                      </h3>
                      <p className="mt-1 text-sm text-secondary">
                        {exam?.title || "Bài thi chưa xác định"}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      {attempt.status === "Submitted" ? "Đã nộp" : "Đang làm"}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                      Điểm:{" "}
                      <span className="font-semibold text-primary">
                        {typeof attempt.score === "number"
                          ? attempt.score
                          : "--"}
                      </span>
                    </div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                      Suspicion:{" "}
                      <span className="font-semibold text-primary">
                        {attempt.suspicionScore}
                      </span>
                    </div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                      Bắt đầu:{" "}
                      <span className="font-semibold text-primary">
                        {formatShortDateTime(attempt.startedAt)}
                      </span>
                    </div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
                      Nộp bài:{" "}
                      <span className="font-semibold text-primary">
                        {attempt.submittedAt
                          ? formatShortDateTime(attempt.submittedAt)
                          : "Chưa nộp"}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {resolvedActiveTab === "activity" ? (
        recentActivities.length === 0 ? (
          <EmptyState title="Chưa có hoạt động gần đây cho lớp học này." />
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <Card key={activity.id} className="space-y-2">
                <p className="text-sm font-semibold text-primary">
                  {activity.title}
                </p>
                <p className="text-sm text-secondary">
                  {formatShortDateTime(activity.date)}
                </p>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
