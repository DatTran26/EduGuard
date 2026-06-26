import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { areUserIdsEqual } from "../../../api/apiHelpers";
import { classroomApi } from "../../../api/classroomApi";
import { assignmentApi } from "../../../api/assignmentApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import { antiCheatApi } from "../../../api/antiCheatApi";
import { notificationApi } from "../../../api/notificationApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getClassroomListPathByRole, routeConfig } from "../../../routes/routeConfig";
import { formatShortDate, formatShortDateTime } from "../../../utils/formatDate";
import { buildTeacherExamMonitoringPath, isTeacherProctoringPath, openTeacherProctoringRoom } from "../../proctoring/utils/proctoringRouting";
import AssignmentSection from "../../assignments/components/AssignmentSection";
import CreateClassroomForm from "../components/CreateClassroomForm";
import Skeleton from "../../../components/common/Skeleton";
import TeacherClassroomWorkspace from "../components/TeacherClassroomWorkspace";
import ClassDetailHeader from "../components/ClassDetailHeader";
import TeacherClassroomTabBar from "../components/TeacherClassroomTabBar";
import ClassQuickStatsPanel from "../components/ClassQuickStats";
import ClassOverviewPanel from "../components/ClassOverviewPanel";
import { normalizeTeacherClassroomTab } from "../components/teacher-classroom-tabs";

function buildQuickInfoItems(classroom) {
  return [
    { label: "Mã lớp", value: classroom.joinCode },
    { label: "Giảng viên", value: classroom.teacherName },
    {
      label: "Thành viên",
      value:
        typeof classroom.memberCount === "number" ? `${classroom.memberCount} người` : "Chưa có số liệu",
    },
    { label: "Ngày tạo", value: formatShortDate(classroom.createdAt) },
  ];
}

function getAccessBadgeLabel(classroom, role) {
  if (classroom.canEdit) {
    return "Bạn đang quản lý lớp này";
  }

  if (role === "Admin") {
    return "Bạn đang theo dõi lớp này";
  }

  return "Bạn đang tham gia lớp này";
}

function getMemberBadgeVariant(member) {
  if (member.role === "Giảng viên" || member.status === "Owner") {
    return "info";
  }

  if (member.status === "Active") {
    return "success";
  }

  return "neutral";
}

function buildVisibleMembers(classroom, members, currentUser) {
  const normalizedMembers = Array.isArray(members)
    ? members.map((member) => ({
        ...member,
        isCurrentUser:
          currentUser?.role === "Student" &&
          (areUserIdsEqual(member.studentId, currentUser.id) ||
            (currentUser.email &&
              member.email &&
              currentUser.email.toLowerCase() === member.email.toLowerCase())),
      }))
    : [];

  const hasTeacherEntry = normalizedMembers.some((member) =>
    areUserIdsEqual(member.studentId, classroom.teacherId),
  );
  const hasCurrentStudentEntry = normalizedMembers.some((member) => member.isCurrentUser);

  const teacherEntry = hasTeacherEntry
    ? null
    : {
        id: `teacher-${classroom.teacherId || classroom.id}`,
        studentId: classroom.teacherId,
        fullName: classroom.teacherName || "Giảng viên chưa xác định",
        email: "",
        joinedAt: classroom.createdAt ?? null,
        role: "Giảng viên",
        status: "Owner",
        statusLabel: "Quản lý lớp",
        isCurrentUser:
          currentUser?.role === "Teacher" && areUserIdsEqual(currentUser.id, classroom.teacherId),
      };

  const currentStudentEntry =
    currentUser?.role === "Student" && !hasCurrentStudentEntry
      ? {
          id: `self-${currentUser.id}`,
          studentId: currentUser.id,
          fullName: currentUser.fullName || "Bạn",
          email: currentUser.email || "",
          joinedAt: classroom.joinedAt ?? null,
          role: "Sinh viên",
          status: "Active",
          statusLabel: "Đang tham gia",
          isCurrentUser: true,
        }
      : null;

  return [teacherEntry, currentStudentEntry, ...normalizedMembers].filter(Boolean);
}

export default function ClassroomDetailPage() {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Base states
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditClassroomFormVisible, setIsEditClassroomFormVisible] = useState(false);

  // Lifted statistics states
  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [warningCountByExamId, setWarningCountByExamId] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  const visibleMembers = classroom ? buildVisibleMembers(classroom, members, user) : [];
  const shouldShowTeacherWorkspace = user?.role === "Teacher" && Boolean(classroom?.canEdit);
  const activeTeacherTab = normalizeTeacherClassroomTab(searchParams.get("tab"));
  const highlightedStudentId = searchParams.get("studentId") || "";

  // Data reloads on callbacks
  async function reloadNotifications() {
    try {
      const response = await notificationApi.getClassroomNotifications(classroomId);
      setNotifications(response.data || []);
    } catch (e) {
      console.error("Failed to reload notifications", e);
    }
  }

  async function reloadAssignments() {
    try {
      const response = await assignmentApi.getByClassroom(classroomId);
      const nextAssignments = Array.isArray(response.data) ? response.data : [];
      setAssignments(nextAssignments);

      // fetch submissions in parallel
      const submissionEntries = await Promise.all(
        nextAssignments.map(async (assignment) => {
          try {
            const response = await assignmentApi.getSubmissions(assignment.id);
            return [assignment.id, Array.isArray(response.data) ? response.data : []];
          } catch {
            return [assignment.id, []];
          }
        })
      );
      setSubmissionsByAssignmentId(Object.fromEntries(submissionEntries));
    } catch (e) {
      console.error("Failed to reload assignments", e);
    }
  }

  async function loadClassroomDetail() {
    setIsLoading(true);
    try {
      const [classroomResponse, memberResponse] = await Promise.all([
        classroomApi.getById(classroomId),
        classroomApi.getMembers(classroomId),
      ]);

      const classroomData = classroomResponse.data;
      setClassroom(classroomData);
      setMembers(memberResponse?.data ?? []);
      setLoadErrorMessage("");

      const isTeacher = user?.role === "Teacher" && classroomData.canEdit;
      if (isTeacher) {
        setIsLoadingWorkspace(true);
        try {
          const [assignmentResponse, examResponse, notificationResponse] = await Promise.all([
            assignmentApi.getByClassroom(classroomId),
            examApi.getAll({ classroomId }),
            notificationApi.getClassroomNotifications(classroomId),
          ]);

          const nextAssignments = Array.isArray(assignmentResponse.data) ? assignmentResponse.data : [];
          const nextExams = Array.isArray(examResponse.data) ? examResponse.data : [];
          
          setAssignments(nextAssignments);
          setExams(nextExams);
          setNotifications(notificationResponse.data || []);

          const [submissionEntries, attemptEntries, antiCheatEntries] = await Promise.all([
            Promise.all(
              nextAssignments.map(async (assignment) => {
                try {
                  const response = await assignmentApi.getSubmissions(assignment.id);
                  return [assignment.id, Array.isArray(response.data) ? response.data : []];
                } catch {
                  return [assignment.id, []];
                }
              })
            ),
            Promise.all(
              nextExams.map(async (exam) => {
                try {
                  const response = await examAttemptApi.getByExam(exam.id);
                  return [exam.id, Array.isArray(response.data) ? response.data : []];
                } catch {
                  return [exam.id, []];
                }
              })
            ),
            Promise.all(
              nextExams.map(async (exam) => {
                if (!exam.enableAntiCheat) return [exam.id, 0];
                try {
                  const response = await antiCheatApi.getExamSummary(exam.id);
                  return [exam.id, Number(response.data?.totalLogs) || 0];
                } catch {
                  return [exam.id, 0];
                }
              })
            ),
          ]);

          setSubmissionsByAssignmentId(Object.fromEntries(submissionEntries));
          setAttempts(attemptEntries.flatMap(([, examAttempts]) => examAttempts));
          setWarningCountByExamId(Object.fromEntries(antiCheatEntries));
        } catch (workspaceError) {
          console.error("Workspace loading error:", workspaceError);
          showToast({
            tone: "danger",
            title: "Tải dữ liệu thống kê thất bại",
            message: workspaceError.message || "Không thể tải dữ liệu thống kê lớp học.",
          });
        } finally {
          setIsLoadingWorkspace(false);
        }
      }
    } catch (error) {
      setClassroom(null);
      setMembers([]);
      const nextMessage = error.message || "Không thể tải chi tiết lớp học.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải lớp học thất bại",
        message: nextMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialDetail() {
      setIsLoading(true);
      try {
        const [classroomResponse, memberResponse] = await Promise.all([
          classroomApi.getById(classroomId),
          classroomApi.getMembers(classroomId),
        ]);

        if (!isMounted) return;

        const classroomData = classroomResponse.data;
        setClassroom(classroomData);
        setMembers(memberResponse?.data ?? []);
        setLoadErrorMessage("");

        const isTeacher = user?.role === "Teacher" && classroomData.canEdit;
        if (isTeacher) {
          setIsLoadingWorkspace(true);
          try {
            const [assignmentResponse, examResponse, notificationResponse] = await Promise.all([
              assignmentApi.getByClassroom(classroomId),
              examApi.getAll({ classroomId }),
              notificationApi.getClassroomNotifications(classroomId),
            ]);

            if (!isMounted) return;

            const nextAssignments = Array.isArray(assignmentResponse.data) ? assignmentResponse.data : [];
            const nextExams = Array.isArray(examResponse.data) ? examResponse.data : [];

            setAssignments(nextAssignments);
            setExams(nextExams);
            setNotifications(notificationResponse.data || []);

            const [submissionEntries, attemptEntries, antiCheatEntries] = await Promise.all([
              Promise.all(
                nextAssignments.map(async (assignment) => {
                  try {
                    const response = await assignmentApi.getSubmissions(assignment.id);
                    return [assignment.id, Array.isArray(response.data) ? response.data : []];
                  } catch {
                    return [assignment.id, []];
                  }
                })
              ),
              Promise.all(
                nextExams.map(async (exam) => {
                  try {
                    const response = await examAttemptApi.getByExam(exam.id);
                    return [exam.id, Array.isArray(response.data) ? response.data : []];
                  } catch {
                    return [exam.id, []];
                  }
                })
              ),
              Promise.all(
                nextExams.map(async (exam) => {
                  if (!exam.enableAntiCheat) return [exam.id, 0];
                  try {
                    const response = await antiCheatApi.getExamSummary(exam.id);
                    return [exam.id, Number(response.data?.totalLogs) || 0];
                  } catch {
                    return [exam.id, 0];
                  }
                })
              ),
            ]);

            if (!isMounted) return;

            setSubmissionsByAssignmentId(Object.fromEntries(submissionEntries));
            setAttempts(attemptEntries.flatMap(([, examAttempts]) => examAttempts));
            setWarningCountByExamId(Object.fromEntries(antiCheatEntries));
          } catch (workspaceError) {
            console.error("Workspace loading error:", workspaceError);
          } finally {
            if (isMounted) setIsLoadingWorkspace(false);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setClassroom(null);
        setMembers([]);
        const nextMessage = error.message || "Không thể tải chi tiết lớp học.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải lớp học thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialDetail();

    return () => {
      isMounted = false;
    };
  }, [classroomId, showToast, user?.role]);

  useEffect(() => {
    if (!shouldShowTeacherWorkspace) return;

    const requestedTab = searchParams.get("tab");
    const normalizedTab = normalizeTeacherClassroomTab(requestedTab);

    if (!requestedTab || requestedTab === normalizedTab) return;

    const nextParams = new URLSearchParams(searchParams);
    if (normalizedTab === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", normalizedTab);
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shouldShowTeacherWorkspace]);

  async function handleUpdateClassroom(payload) {
    setIsSaving(true);
    try {
      const response = await classroomApi.update(classroomId, payload);
      await loadClassroomDetail();
      setIsEditClassroomFormVisible(false);
      showToast({
        tone: "success",
        title: "Đã cập nhật lớp học",
        message: response.message,
      });
      return false;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Cập nhật lớp học thất bại",
        message: error.message || "Không thể cập nhật lớp học.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClassroom() {
    const hasConfirmed = window.confirm("Bạn có chắc muốn xóa lớp học này không?");
    if (!hasConfirmed) return;

    setIsSaving(true);
    try {
      const response = await classroomApi.delete(classroomId);
      navigate(getClassroomListPathByRole(user?.role), {
        replace: true,
        state: { message: response.message },
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa lớp học thất bại",
        message: error.message || "Không thể xóa lớp học.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!classroom) return;
    try {
      await window.navigator.clipboard.writeText(classroom.joinCode);
      showToast({
        tone: "success",
        title: "Đã sao chép",
        message: `Đã sao chép mã lớp ${classroom.joinCode}.`,
      });
    } catch {
      showToast({
        tone: "danger",
        title: "Không sao chép được",
        message: "Không thể sao chép mã lớp.",
      });
    }
  }

  function handleTeacherTabChange(tabId) {
    const nextParams = new URLSearchParams(searchParams);
    if (tabId === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tabId);
    }
    if (tabId !== "members") {
      nextParams.delete("studentId");
    }
    // Clear sub actions
    nextParams.delete("create");
    nextParams.delete("assignmentId");
    setSearchParams(nextParams);
  }

  function handleHeaderAction(actionType, targetId = null) {
    if (actionType === "create-assignment") {
      setSearchParams({ tab: "assignments", create: "1" });
    } else if (actionType === "create-exam") {
      navigate(`${routeConfig.teacherExams}?create=1&classroomId=${classroom.id}`);
    } else if (actionType === "send-notification") {
      setSearchParams({ tab: "notifications", create: "1" });
    } else if (actionType === "view-notifications") {
      setSearchParams({ tab: "notifications" });
    } else if (actionType === "view-members") {
      setSearchParams({ tab: "members" });
    } else if (actionType === "view-assignments") {
      setSearchParams({ tab: "assignments" });
    } else if (actionType === "grade-assignment") {
      setSearchParams({ tab: "assignments", assignmentId: targetId });
    } else if (actionType === "view-exam") {
      setSearchParams({ tab: "exams" });
    } else if (actionType === "monitor-exam") {
      const targetExam = exams.find((exam) => Number(exam.id) === Number(targetId));
      const destination = targetExam
        ? buildTeacherExamMonitoringPath(targetExam)
        : `${routeConfig.teacherMonitoring}?examId=${targetId}`;
      if (isTeacherProctoringPath(destination)) {
        openTeacherProctoringRoom(targetId);
      } else {
        navigate(destination);
      }
    }
  }

  // Calculate statistics object
  const studentCount = members.filter((m) => m.role === "Sinh viên").length;
  const totalSubmissions = Object.values(submissionsByAssignmentId).flat().length;
  const submissionRate =
    assignments.length > 0 && studentCount > 0
      ? Math.round((totalSubmissions / (assignments.length * studentCount)) * 100)
      : 0;
  const warningsCount = Object.values(warningCountByExamId).reduce((a, b) => a + b, 0);

  const quickStats = {
    membersCount: studentCount,
    assignmentsCount: assignments.length,
    examsCount: exams.length,
    submissionRate,
    warningsCount,
  };

  function renderQuickInfoCard(item) {
    if (item.label === "Mã lớp") {
      return (
        <button
          key={item.label}
          type="button"
          onClick={handleCopyJoinCode}
          className="rounded-[16px] border border-border bg-surface p-4 text-left transition-colors duration-200 hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-tertiary/18"
          title="Sao chép mã lớp"
        >
          <p className="text-sm font-semibold text-primary">{item.label}</p>
          <p className="mt-2 font-mono text-sm leading-6 text-primary">{item.value}</p>
          <p className="mt-2 text-xs text-secondary">Nhấn để sao chép</p>
        </button>
      );
    }

    return (
      <div key={item.label} className="rounded-[16px] border border-border bg-surface-sunken p-4">
        <p className="text-sm font-semibold text-primary">{item.label}</p>
        <p className="mt-2 text-sm leading-6 text-secondary">{item.value}</p>
      </div>
    );
  }

  function renderMemberListCard({ condensed = false }) {
    const membersToRender = condensed ? visibleMembers.slice(0, 4) : visibleMembers;

    return (
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Thành viên lớp học</h3>
            {condensed ? (
              <p className="mt-1 text-sm text-secondary">
                Xem nhanh danh sách trước khi chuyển sang tab thành viên đầy đủ.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-secondary">{visibleMembers.length} thành viên</span>
            {condensed && shouldShowTeacherWorkspace ? (
              <Button variant="ghost" onClick={() => handleTeacherTabChange("members")}>
                Xem tất cả
              </Button>
            ) : null}
          </div>
        </div>

        {membersToRender.length > 0 ? (
          <div className="space-y-3">
            {membersToRender.map((member) => (
              <div
                key={member.id}
                className={`rounded-[16px] border border-border bg-surface-sunken p-4 ${
                  String(member.studentId || "") === highlightedStudentId ? "ring-2 ring-tertiary/30" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-primary">{member.fullName}</p>
                      {member.isCurrentUser ? <Badge variant="info">Bạn</Badge> : null}
                      {member.role === "Giảng viên" ? <Badge variant="caution">Giảng viên</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-secondary">
                      {member.email || (member.role === "Giảng viên" ? "Giảng viên phụ trách lớp" : "")}
                    </p>
                  </div>
                  <Badge variant={getMemberBadgeVariant(member)}>{member.statusLabel}</Badge>
                </div>
                <p className="mt-2 text-sm text-secondary">
                  {member.role === "Giảng viên" ? "Bắt đầu quản lý" : "Tham gia"}:{" "}
                  {formatShortDateTime(member.joinedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary">Lớp học này hiện chưa có thành viên nào.</p>
        )}

        {condensed && visibleMembers.length > membersToRender.length ? (
          <p className="text-sm text-secondary">
            + {visibleMembers.length - membersToRender.length} thành viên khác đang được ẩn bớt.
          </p>
        ) : null}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
          <div className="space-y-3 w-1/3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[20px] animate-pulse" />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-12 flex-1 rounded-full animate-pulse" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-full animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl animate-pulse" />
            <Skeleton className="h-44 w-full rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <EmptyState
        title="Không tìm thấy lớp học."
        description={loadErrorMessage}
        action={
          <Link className="eg-button eg-button-primary" to={getClassroomListPathByRole(user?.role)}>
            Quay lại danh sách lớp
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {shouldShowTeacherWorkspace ? (
        <ClassDetailHeader 
          classroom={classroom} 
          onAction={handleHeaderAction} 
        />
      ) : (
        <div className="eg-page-hero">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.4rem] lg:text-[2.8rem]">
              {classroom.name}
            </h1>
          </div>
        </div>
      )}

      {shouldShowTeacherWorkspace ? (
        <ClassQuickStatsPanel stats={quickStats} layout="grid" />
      ) : null}

      {shouldShowTeacherWorkspace ? (
        <TeacherClassroomTabBar
          activeTab={activeTeacherTab}
          onTabChange={handleTeacherTabChange}
          classroom={classroom}
          onEdit={() => setIsEditClassroomFormVisible(true)}
          onDelete={handleDeleteClassroom}
          isSaving={isSaving}
        />
      ) : null}

      {shouldShowTeacherWorkspace && activeTeacherTab === "overview" && (
        <div className="space-y-6">
          {isEditClassroomFormVisible ? (
            <CreateClassroomForm
              key={`${classroom.id}-${classroom.updatedAt || classroom.createdAt}`}
              classroom={classroom}
              isSubmitting={isSaving}
              onSubmitClassroom={handleUpdateClassroom}
              onCancel={() => setIsEditClassroomFormVisible(false)}
              submitLabel="Lưu thay đổi"
              title="Chỉnh sửa lớp học"
            />
          ) : (
            <ClassOverviewPanel
              members={members}
              assignments={assignments}
              submissionsByAssignmentId={submissionsByAssignmentId}
              exams={exams}
              attempts={attempts}
              warningCountByExamId={warningCountByExamId}
              notifications={notifications}
              onAction={handleHeaderAction}
            />
          )}
        </div>
      )}

      {shouldShowTeacherWorkspace && activeTeacherTab === "members" ? (
        <div className="space-y-6">{renderMemberListCard({ condensed: false })}</div>
      ) : null}

      {shouldShowTeacherWorkspace && activeTeacherTab !== "overview" && activeTeacherTab !== "members" ? (
        <TeacherClassroomWorkspace
          activeTab={activeTeacherTab}
          classroom={classroom}
          highlightedStudentId={highlightedStudentId}
          members={members}
          showToast={showToast}
          user={user}
          // Pre-fetched props
          assignments={assignments}
          submissionsByAssignmentId={submissionsByAssignmentId}
          exams={exams}
          attempts={attempts}
          warningCountByExamId={warningCountByExamId}
          notifications={notifications}
          isLoading={isLoadingWorkspace}
          onNotificationCreated={reloadNotifications}
          onAssignmentCreated={reloadAssignments}
        />
      ) : null}

      {!shouldShowTeacherWorkspace ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={classroom.canEdit ? "success" : "info"}>
                    {getAccessBadgeLabel(classroom, user?.role)}
                  </Badge>
                  <Badge variant="neutral">Mã lớp {classroom.joinCode}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {buildQuickInfoItems(classroom).map(renderQuickInfoCard)}
                </div>

                {classroom.description ? (
                  <div className="rounded-[18px] border border-border bg-surface-sunken px-4 py-4">
                    <p className="text-sm font-semibold text-primary">Mô tả lớp</p>
                    <p className="mt-2 text-sm leading-6 text-secondary">{classroom.description}</p>
                  </div>
                ) : null}
              </Card>
            </div>

            <div className="space-y-6">{renderMemberListCard({ condensed: false })}</div>
          </div>

          <AssignmentSection classroom={classroom} showToast={showToast} user={user} />
        </>
      ) : null}
    </div>
  );
}
