import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { resolveApiErrorMessage } from "../../../utils/apiErrorMessage";
import { routeConfig } from "../../../routes/routeConfig";
import ClassroomCard from "../components/ClassroomCard";
import CreateClassroomForm from "../components/CreateClassroomForm";
import { SkeletonClassroomCard } from "../../../components/common/Skeleton";
import ClassroomListAdminFilters from "./classroom-list-admin-filters";
import {
  getPageCopyByRole,
  filterAndSortAdminClassrooms,
} from "./classroom-list-helpers";
import { assignmentApi } from "../../../api/assignmentApi";
import { examApi } from "../../../api/examApi";
import { examAttemptApi } from "../../../api/examAttemptApi";
import TeacherClassroomListView from "../components/TeacherClassroomListPreview";
import StudentClassroomCard from "../components/StudentClassroomCard";
import StudentClassroomSummary from "../components/StudentClassroomSummary";
import StudentClassroomToolbar from "../components/StudentClassroomToolbar";

async function enrichClassroomsForTeacher(classroomsList) {
  if (!classroomsList || classroomsList.length === 0) {
    return [];
  }

  try {
    const examsRes = await examApi.getAll();
    const allExams = examsRes.data || [];

    const examsByClassroom = new Map();
    allExams.forEach((exam) => {
      const cid = Number(exam.classroomId);
      if (!examsByClassroom.has(cid)) {
        examsByClassroom.set(cid, []);
      }
      examsByClassroom.get(cid).push(exam);
    });

    const assignmentEntries = await Promise.all(
      classroomsList.map(async (cls) => {
        try {
          const res = await assignmentApi.getByClassroom(cls.id);
          return [cls.id, res.data || []];
        } catch {
          return [cls.id, []];
        }
      })
    );
    const assignmentsByClassroom = new Map(assignmentEntries);

    const attemptEntries = await Promise.all(
      allExams.map(async (exam) => {
        try {
          const res = await examAttemptApi.getByExam(exam.id);
          return [exam.id, res.data || []];
        } catch {
          return [exam.id, []];
        }
      })
    );
    const attemptsByExam = new Map(attemptEntries);

    return classroomsList.map((cls) => {
      const clsExams = examsByClassroom.get(cls.id) || [];
      const clsAssignments = assignmentsByClassroom.get(cls.id) || [];

      let alertCount = 0;
      clsExams.forEach((exam) => {
        const attempts = attemptsByExam.get(exam.id) || [];
        alertCount += attempts.filter((att) => Number(att.suspicionScore) > 0).length;
      });

      return {
        ...cls,
        status: "open",
        assignmentCount: clsAssignments.length,
        examCount: clsExams.length,
        alertCount,
      };
    });
  } catch (error) {
    console.error("Lỗi khi gom dữ liệu thống kê lớp học:", error);
    return classroomsList.map((cls) => ({
      ...cls,
      status: "open",
      assignmentCount: 0,
      examCount: 0,
      alertCount: 0,
    }));
  }
}

async function fetchStudentPendingTasksCount(classroomsList) {
  if (!classroomsList || classroomsList.length === 0) {
    return 0;
  }
  try {
    const assignmentPromises = classroomsList.map(async (cls) => {
      try {
        const res = await assignmentApi.getByClassroom(cls.id);
        return res.data || [];
      } catch {
        return [];
      }
    });

    const examPromise = (async () => {
      try {
        const res = await examApi.getAll();
        return res.data || [];
      } catch {
        return [];
      }
    })();

    const [assignmentLists, exams] = await Promise.all([
      Promise.all(assignmentPromises),
      examPromise,
    ]);

    const allAssignments = assignmentLists.flat();
    const now = new Date();

    const pendingAssignments = allAssignments.filter((assignment) => {
      const hasSubmitted = Boolean(assignment.mySubmission);
      const isOverdue = assignment.deadline ? new Date(assignment.deadline) < now : false;
      return !hasSubmitted && !isOverdue;
    });

    const pendingExams = exams.filter((exam) => {
      const hasAttempted = (exam.attemptCount || 0) > 0;
      const isPublished = exam.isPublished;
      const isClosed = exam.endTime ? new Date(exam.endTime) < now : false;
      return !hasAttempted && isPublished && !isClosed;
    });

    return pendingAssignments.length + pendingExams.length;
  } catch (error) {
    console.error("Lỗi khi tính số lượng bài cần làm:", error);
    return 0;
  }
}

export default function ClassroomListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  const [adminSortOption, setAdminSortOption] = useState("name-asc");
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");
  const isCreateFormVisible = searchParams.get("create") === "1";
  const pageCopy = getPageCopyByRole(user?.role);
  const isAdminView = user?.role === "Admin";
  const isTeacherView = user?.role === "Teacher";
  const isStudentView = user?.role === "Student";
  const isCompactGridView = isStudentView;
  const classroomGridClassName = isStudentView
    ? "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid gap-6";
  const classroomCardLayout = isCompactGridView ? "tile" : "default";

  const getVisibleStudentClassrooms = () => {
    let result = [...classrooms];
    if (studentSearchTerm.trim()) {
      const term = studentSearchTerm.toLowerCase().trim();
      result = result.filter(
        (cls) =>
          cls.name.toLowerCase().includes(term) ||
          (cls.joinCode && cls.joinCode.toLowerCase().includes(term))
      );
    }
    if (studentStatusFilter !== "all") {
      result = result.filter((cls) => {
        const status = cls.status ?? "active";
        return status === studentStatusFilter;
      });
    }
    return result;
  };

  const visibleClassrooms = isAdminView
    ? filterAndSortAdminClassrooms(classrooms, adminSearchTerm, adminSortOption)
    : isStudentView
    ? getVisibleStudentClassrooms()
    : classrooms;

  useEffect(() => {
    if (!location.state?.message) {
      return;
    }

    showToast({
      tone: "success",
      title: "Thao tác thành công",
      message: location.state.message,
    });
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      { replace: true, state: null },
    );
  }, [location.pathname, location.search, location.state, navigate, showToast]);

  useEffect(() => {
    if (!isTeacherView || !searchParams.has("ui")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("ui");
    setSearchParams(nextParams, { replace: true });
  }, [isTeacherView, searchParams, setSearchParams]);

  function toggleCreateForm() {
    const nextParams = new URLSearchParams(searchParams);

    if (isCreateFormVisible) {
      nextParams.delete("create");
    } else {
      nextParams.set("create", "1");
    }

    setSearchParams(nextParams);
  }

  async function loadClassrooms() {
    setIsLoading(true);
    try {
      const response = await classroomApi.getAll();
      let enrichedData = response.data || [];
      if (user?.role === "Teacher") {
        enrichedData = await enrichClassroomsForTeacher(enrichedData);
      } else if (user?.role === "Student") {
        const count = await fetchStudentPendingTasksCount(enrichedData);
        setPendingTasksCount(count);
      }
      setClassrooms(enrichedData);
      setLoadErrorMessage("");
    } catch (error) {
      const nextMessage = error.message || "Không thể tải danh sách lớp học.";
      setLoadErrorMessage(nextMessage);
      showToast({
        tone: "danger",
        title: "Tải dữ liệu thất bại",
        message: nextMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadInitialClassrooms() {
      try {
        const response = await classroomApi.getAll();
        if (!isMounted) return;
        let enrichedData = response.data || [];
        if (user?.role === "Teacher") {
          enrichedData = await enrichClassroomsForTeacher(enrichedData);
        } else if (user?.role === "Student") {
          const count = await fetchStudentPendingTasksCount(enrichedData);
          if (isMounted) setPendingTasksCount(count);
        }
        setClassrooms(enrichedData);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) return;
        const nextMessage = error.message || "Không thể tải danh sách lớp học.";
        setLoadErrorMessage(nextMessage);
        showToast({
          tone: "danger",
          title: "Tải dữ liệu thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadInitialClassrooms();
    return () => {
      isMounted = false;
    };
  }, [showToast, user]);

  async function handleCreateClassroom(payload) {
    setIsSubmitting(true);
    try {
      const response = await classroomApi.create(payload);
      await loadClassrooms();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      setSearchParams(nextParams);
      showToast({
        tone: "success",
        title: "Đã tạo lớp học",
        message: response.message,
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo lớp học thất bại",
        message: resolveApiErrorMessage(error, "Không thể tạo lớp học."),
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCode(joinCode) {
    try {
      await window.navigator.clipboard.writeText(joinCode);
      showToast({
        tone: "success",
        title: "Đã sao chép",
        message: `Đã sao chép mã lớp ${joinCode}.`,
      });
    } catch {
      showToast({
        tone: "danger",
        title: "Không sao chép được",
        message: "Không thể sao chép mã lớp trên trình duyệt này.",
      });
    }
  }

  function handleResetAdminFilters() {
    setAdminSearchTerm("");
    setAdminSortOption("name-asc");
  }

  function renderEmptyState() {
    if (loadErrorMessage) {
      return <EmptyState title="Không thể tải lớp học." />;
    }
    if (user?.role === "Teacher") {
      return <EmptyState title="Bạn chưa tạo lớp học nào." />;
    }
    if (user?.role === "Student") {
      return (
        <EmptyState
          title="Bạn chưa tham gia lớp học nào"
          action={
            <Link className="eg-button eg-button-primary" to={routeConfig.studentJoinClassroom}>
              Tham gia lớp
            </Link>
          }
        />
      );
    }
    return <EmptyState title="Chưa có lớp học nào được trả về." />;
  }

  if (isTeacherView) {
    return (
      <div className="space-y-6">
        <TeacherClassroomListView
          classrooms={classrooms}
          createForm={
            isCreateFormVisible ? (
              <CreateClassroomForm
                isSubmitting={isSubmitting}
                onSubmitClassroom={handleCreateClassroom}
                submitLabel="Tạo lớp học"
                title="Tạo lớp học mới"
              />
            ) : null
          }
          emptyState={renderEmptyState()}
          isCreateFormVisible={isCreateFormVisible}
          isLoading={isLoading}
          onCopyCode={handleCopyCode}
          onToggleCreateForm={toggleCreateForm}
          role={user?.role}
          visibleClassrooms={classrooms}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isStudentView ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Lớp của tôi
          </h1>
          <Link className="eg-button eg-button-primary" to={routeConfig.studentJoinClassroom}>
            Tham gia lớp
          </Link>
        </div>
      ) : (
        <PageHeader
          title={pageCopy.title}
          actions={
            pageCopy.actionLabel ? (
              <Link className="eg-button eg-button-primary" to={routeConfig.studentJoinClassroom}>
                {pageCopy.actionLabel}
              </Link>
            ) : null
          }
        />
      )}

      {isStudentView ? (
        <>
          <StudentClassroomSummary
            joinedClassroomsCount={classrooms.length}
            pendingTasksCount={pendingTasksCount}
            isLoading={isLoading}
          />
          <StudentClassroomToolbar
            searchTerm={studentSearchTerm}
            onSearchChange={setStudentSearchTerm}
            statusFilter={studentStatusFilter}
            onStatusFilterChange={setStudentStatusFilter}
          />
        </>
      ) : null}

      {isAdminView ? (
        <ClassroomListAdminFilters
          searchTerm={adminSearchTerm}
          onSearchTermChange={setAdminSearchTerm}
          sortOption={adminSortOption}
          onSortOptionChange={setAdminSortOption}
          onResetFilters={handleResetAdminFilters}
        />
      ) : null}

      {isLoading ? (
        <div className={classroomGridClassName}>
          {Array.from({ length: isCompactGridView ? 8 : 3 }).map((_, index) => (
            <SkeletonClassroomCard key={`classroom-skeleton-${index}`} layout={classroomCardLayout} />
          ))}
        </div>
      ) : visibleClassrooms.length > 0 ? (
        <div className={classroomGridClassName}>
          {visibleClassrooms.map((classroom) => {
            if (isStudentView) {
              return (
                <StudentClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                />
              );
            }
            return (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                layout={classroomCardLayout}
                onCopyCode={handleCopyCode}
              />
            );
          })}
        </div>
      ) : isAdminView && classrooms.length > 0 ? (
        <EmptyState
          title="Không tìm thấy lớp học phù hợp."
          action={
            <Button variant="secondary" onClick={handleResetAdminFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      ) : isStudentView && classrooms.length > 0 ? (
        <EmptyState
          title="Không tìm thấy lớp học phù hợp."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setStudentSearchTerm("");
                setStudentStatusFilter("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
