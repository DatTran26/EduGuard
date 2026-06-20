import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { assignmentApi } from "../../../api/assignmentApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { buildExamDetailPathByRole, routeConfig } from "../../../routes/routeConfig";
import { formatShortDateTime } from "../../../utils/formatDate";
import AssignmentSection from "../../assignments/components/AssignmentSection";

const TEACHER_CLASSROOM_TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "students", label: "Học sinh" },
  { id: "assignments", label: "Bài tập" },
  { id: "exams", label: "Bài thi" },
  { id: "results", label: "Kết quả" },
  { id: "activity", label: "Hoạt động" },
];

function buildStudentSummaryRows(members, submissionsByAssignmentId, attempts) {
  const attemptsByStudentId = attempts.reduce((accumulator, attempt) => {
    const studentId = String(attempt.studentId || "");
    const previousValue = accumulator.get(studentId) ?? [];

    previousValue.push(attempt);
    accumulator.set(studentId, previousValue);
    return accumulator;
  }, new Map());
  const submissionCountByStudentId = Object.values(submissionsByAssignmentId).flat().reduce((accumulator, submission) => {
    const studentId = String(submission.studentId || "");

    accumulator[studentId] = (accumulator[studentId] ?? 0) + 1;
    return accumulator;
  }, {});

  return members.map((member) => {
    const studentAttempts = attemptsByStudentId.get(String(member.studentId || "")) ?? [];
    const scoredAttempts = studentAttempts.filter((attempt) => typeof attempt.score === "number");

    return {
      ...member,
      submittedCount: submissionCountByStudentId[String(member.studentId || "")] ?? 0,
      averageScore:
        scoredAttempts.length > 0
          ? Math.round((scoredAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / scoredAttempts.length) * 10) / 10
          : null,
    };
  });
}

export default function TeacherClassroomWorkspace({ classroom, members, showToast, user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [warningCountByExamId, setWarningCountByExamId] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [nowTimestamp] = useState(() => Date.now());
  const activeTab = searchParams.get("tab") || "overview";
  const highlightedStudentId = searchParams.get("studentId") || "";

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceData() {
      setIsLoading(true);

      try {
        const [assignmentResponse, examResponse] = await Promise.all([
          assignmentApi.getByClassroom(classroom.id),
          examApi.getAll({ classroomId: classroom.id }),
        ]);
        const assignments = Array.isArray(assignmentResponse.data) ? assignmentResponse.data : [];
        const exams = Array.isArray(examResponse.data) ? examResponse.data : [];
        const [submissionEntries, attemptEntries, antiCheatEntries] = await Promise.all([
          Promise.all(
            assignments.map(async (assignment) => {
              try {
                const response = await assignmentApi.getSubmissions(assignment.id);
                return [assignment.id, Array.isArray(response.data) ? response.data : []];
              } catch {
                return [assignment.id, []];
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
          setAssignments(assignments);
          setSubmissionsByAssignmentId(Object.fromEntries(submissionEntries));
          setExams(exams);
          setAttempts(attemptEntries.flatMap(([, examAttempts]) => examAttempts));
          setWarningCountByExamId(Object.fromEntries(antiCheatEntries));
        }
      } catch (error) {
        showToast({
          tone: "danger",
          title: "Tải workspace lớp học thất bại",
          message: error.message || "Không thể tải dữ liệu bổ sung của lớp học.",
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
  }, [classroom.id, showToast]);

  const studentRows = useMemo(
    () => buildStudentSummaryRows(members, submissionsByAssignmentId, attempts),
    [attempts, members, submissionsByAssignmentId],
  );
  const upcomingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.deadline && new Date(assignment.deadline).getTime() > nowTimestamp).slice(0, 5),
    [assignments, nowTimestamp],
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
      .sort((firstItem, secondItem) => new Date(secondItem.date || 0) - new Date(firstItem.date || 0))
      .slice(0, 8);
  }, [assignments, exams, attempts]);
  const overviewCards = useMemo(() => {
    const scoredAttempts = attempts.filter((attempt) => typeof attempt.score === "number");
    const averageScore = scoredAttempts.length > 0
      ? Math.round((scoredAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / scoredAttempts.length) * 10) / 10
      : "--";
    const submissionRate = assignments.length > 0 && members.length > 0
      ? Math.round((assignments.reduce((sum, assignment) => sum + Number(assignment.submissionCount || 0), 0) / (assignments.length * members.length)) * 100)
      : 0;

    return [
      { label: "Học sinh", value: members.length },
      { label: "Bài tập đang mở", value: assignments.filter((assignment) => assignment.deadline && new Date(assignment.deadline).getTime() > nowTimestamp).length },
      { label: "Bài thi đang mở", value: exams.filter((exam) => exam.statusLabel === "Đang mở").length },
      { label: "Điểm trung bình", value: averageScore },
      { label: "Tỷ lệ nộp bài", value: `${submissionRate}%` },
    ];
  }, [assignments, attempts, exams, members.length, nowTimestamp]);

  function handleChangeTab(tabId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    setSearchParams(nextParams);
  }

  if (isLoading) {
    return <Card className="text-sm text-secondary">Đang tải workspace lớp học...</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-[24px] border border-border bg-surface p-3">
        {TEACHER_CLASSROOM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleChangeTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? "bg-primary text-white" : "text-secondary hover:bg-surface-sunken hover:text-primary"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {overviewCards.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
                <p className="text-sm font-medium text-secondary">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Bài gần deadline</h3>
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-secondary">Chưa có bài tập nào đang mở trong lớp này.</p>
              ) : (
                upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[16px] border border-border bg-neutral p-4">
                    <p className="text-sm font-semibold text-primary">{assignment.title}</p>
                    <p className="mt-1 text-sm text-secondary">Hạn nộp {formatShortDateTime(assignment.deadline)}</p>
                  </div>
                ))
              )}
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Cảnh báo gần đây</h3>
              {exams.filter((exam) => Number(warningCountByExamId[exam.id]) > 0).length === 0 ? (
                <p className="text-sm text-secondary">Chưa có log anti-cheat nào được ghi nhận cho lớp này.</p>
              ) : (
                exams
                  .filter((exam) => Number(warningCountByExamId[exam.id]) > 0)
                  .map((exam) => (
                    <div key={exam.id} className="rounded-[16px] border border-border bg-neutral p-4">
                      <p className="text-sm font-semibold text-primary">{exam.title}</p>
                      <p className="mt-1 text-sm text-secondary">{warningCountByExamId[exam.id]} cảnh báo đã ghi nhận</p>
                    </div>
                  ))
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "students" ? (
        studentRows.length === 0 ? (
          <EmptyState title="Lớp học này hiện chưa có học sinh nào." />
        ) : (
          <div className="space-y-4">
            {studentRows.map((member) => (
              <Card key={member.id} className={`space-y-3 ${String(member.studentId) === highlightedStudentId ? "ring-2 ring-tertiary/30" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{member.fullName}</h3>
                    <p className="mt-1 text-sm text-secondary">{member.email}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                    {member.statusLabel}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Tham gia: <span className="font-semibold text-primary">{formatShortDateTime(member.joinedAt)}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Bài đã nộp: <span className="font-semibold text-primary">{member.submittedCount}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Điểm TB: <span className="font-semibold text-primary">{typeof member.averageScore === "number" ? member.averageScore : "--"}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Trạng thái: <span className="font-semibold text-primary">{member.statusLabel}</span></div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {activeTab === "assignments" ? <AssignmentSection classroom={classroom} showToast={showToast} user={user} /> : null}

      {activeTab === "exams" ? (
        exams.length === 0 ? (
          <EmptyState title="Chưa có bài thi nào cho lớp học này." />
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{exam.title}</h3>
                    <p className="mt-1 text-sm text-secondary">{exam.statusLabel} • {exam.durationMinutes} phút</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link className="eg-button eg-button-secondary" to={buildExamDetailPathByRole(user?.role, exam.id)}>Xem chi tiết</Link>
                    <Link className="eg-button eg-button-ghost" to={`${routeConfig.teacherMonitoring}?examId=${exam.id}`}>Giám sát</Link>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Mở đề: <span className="font-semibold text-primary">{formatShortDateTime(exam.startTime)}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Đóng đề: <span className="font-semibold text-primary">{formatShortDateTime(exam.endTime)}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Lượt làm: <span className="font-semibold text-primary">{attempts.filter((attempt) => Number(attempt.examId) === Number(exam.id)).length}</span></div>
                  <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Cảnh báo: <span className="font-semibold text-primary">{warningCountByExamId[exam.id] || 0}</span></div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {activeTab === "results" ? (
        attempts.length === 0 ? (
          <EmptyState title="Chưa có lượt làm bài nào trong lớp này." />
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const exam = exams.find((item) => Number(item.id) === Number(attempt.examId));

              return (
                <Card key={attempt.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{attempt.studentName}</h3>
                      <p className="mt-1 text-sm text-secondary">{exam?.title || "Bài thi chưa xác định"}</p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                      {attempt.status === "Submitted" ? "Đã nộp" : "Đang làm"}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Điểm: <span className="font-semibold text-primary">{typeof attempt.score === "number" ? attempt.score : "--"}</span></div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Suspicion: <span className="font-semibold text-primary">{attempt.suspicionScore}</span></div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Bắt đầu: <span className="font-semibold text-primary">{formatShortDateTime(attempt.startedAt)}</span></div>
                    <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">Nộp bài: <span className="font-semibold text-primary">{attempt.submittedAt ? formatShortDateTime(attempt.submittedAt) : "Chưa nộp"}</span></div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {activeTab === "activity" ? (
        recentActivities.length === 0 ? (
          <EmptyState title="Chưa có hoạt động gần đây cho lớp học này." />
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <Card key={activity.id} className="space-y-2">
                <p className="text-sm font-semibold text-primary">{activity.title}</p>
                <p className="text-sm text-secondary">{formatShortDateTime(activity.date)}</p>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
