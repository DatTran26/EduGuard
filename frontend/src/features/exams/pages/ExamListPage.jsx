import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import { SkeletonExamCard } from "../../../components/common/Skeleton";
import Select from "../../../components/forms/Select";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { getClassroomListPathByRole } from "../../../routes/routeConfig";
import ExamCard from "../components/ExamCard";
import ExamForm from "../components/ExamForm";

// Hàm này tính vài con số nhanh cho đầu trang danh sách đề thi để màn hình bớt khô hơn.
function buildSummaryItems(exams, role) {
  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const openCount = exams.filter((exam) => exam.statusLabel === "Đang mở").length;
  const antiCheatCount = exams.filter((exam) => exam.enableAntiCheat).length;

  const baseItems = [
    { label: "Tổng đề", value: exams.length, tone: "info" },
    { label: "Đã publish", value: publishedCount, tone: "success" },
    { label: "Đang mở", value: openCount, tone: "caution" },
  ];

  if (role === "Teacher") {
    return baseItems;
  }

  return [...baseItems, { label: "Anti-cheat bật", value: antiCheatCount, tone: "neutral" }];
}

function filterExamsByScheduleStatus(exams, scheduleStatus) {
  if (!scheduleStatus) {
    return exams;
  }

  return exams.filter((exam) => {
    if (scheduleStatus === "upcoming") {
      return exam.statusLabel === "Sắp mở";
    }

    if (scheduleStatus === "open") {
      return exam.statusLabel === "Đang mở";
    }

    if (scheduleStatus === "closed") {
      return exam.statusLabel === "Đã đóng";
    }

    return true;
  });
}

// Hàm này trả tiêu đề đầu trang tùy theo role đang truy cập.
function getPageCopyByRole(role) {
  if (role === "Admin") {
    return {
      title: "Bài kiểm tra toàn hệ thống",
    };
  }

  if (role === "Teacher") {
    return {
      title: "Quản lý bài kiểm tra",
    };
  }

  return {
    title: "Bài kiểm tra của bạn",
  };
}

// Trang này là trung tâm CRUD đề thi cho Teacher và là trang xem danh sách cho Admin/Student.
export default function ExamListPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classrooms, setClassrooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState(null);
  const selectedClassroomId = searchParams.get("classroomId") ?? "";
  const selectedScheduleStatus = searchParams.get("scheduleStatus") ?? "";
  const summaryItems = buildSummaryItems(exams, user?.role);
  const pageCopy = getPageCopyByRole(user?.role);
  const isTeacherView = user?.role === "Teacher";
  const isStudentView = user?.role === "Student";
  const canCreateExam = isTeacherView && classrooms.length > 0;
  const visibleExams = isStudentView
    ? filterExamsByScheduleStatus(exams, selectedScheduleStatus)
    : exams;

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

  // Hàm này tải song song lớp học và đề thi theo quyền hiện tại để page có đủ dữ liệu hiển thị.
  async function loadExamPageData(filters = {}) {
    setIsLoading(true);

    try {
      const [classroomResponse, examResponse] = await Promise.all([
        classroomApi.getAll(),
        examApi.getAll(filters),
      ]);

      setClassrooms(classroomResponse.data);
      setExams(examResponse.data);
    } catch (error) {
      const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
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
    const nextFilters = selectedClassroomId ? { classroomId: selectedClassroomId } : {};

    // Hàm này lấy dữ liệu ban đầu hoặc khi filter lớp đổi mà không bị warning effect.
    async function loadInitialExamData() {
      try {
        const [classroomResponse, examResponse] = await Promise.all([
          classroomApi.getAll(),
          examApi.getAll(nextFilters),
        ]);

        if (!isMounted) {
          return;
        }

        setClassrooms(classroomResponse.data);
        setExams(examResponse.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
        showToast({
          tone: "danger",
          title: "Tải dữ liệu thất bại",
          message: nextMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialExamData();

    return () => {
      isMounted = false;
    };
  }, [selectedClassroomId, showToast]);

  // Hàm này đổi filter lớp học trên URL để user refresh trang vẫn giữ được ngữ cảnh hiện tại.
  function updateExamListSearchParams(nextClassroomId, nextScheduleStatus) {
    const nextParams = {};

    if (nextClassroomId) {
      nextParams.classroomId = nextClassroomId;
    }

    if (nextScheduleStatus) {
      nextParams.scheduleStatus = nextScheduleStatus;
    }

    setSearchParams(nextParams);
  }

  function handleClassroomFilterChange(nextClassroomId) {
    setIsLoading(true);
    updateExamListSearchParams(nextClassroomId, selectedScheduleStatus);
  }

  function handleScheduleStatusFilterChange(nextScheduleStatus) {
    updateExamListSearchParams(selectedClassroomId, nextScheduleStatus);
  }

  function handleResetStudentFilters() {
    if (selectedClassroomId) {
      setIsLoading(true);
    }

    updateExamListSearchParams("", "");
  }

  // Hàm này tạo bài kiểm tra mới bằng examApi rồi tải lại list để dữ liệu nhìn đồng bộ ngay.
  async function handleCreateExam(payload) {
    setIsSubmitting(true);

    try {
      const response = await examApi.create(payload);
      const shouldSwitchFilter =
        selectedClassroomId && Number(selectedClassroomId) !== Number(payload.classroomId);

      if (shouldSwitchFilter) {
        setIsLoading(true);
        setSearchParams({ classroomId: String(payload.classroomId) });
      } else {
        await loadExamPageData(selectedClassroomId ? { classroomId: selectedClassroomId } : {});
      }

      setIsCreateFormVisible(false);

      showToast({
        tone: "success",
        title: "Đã tạo đề thi",
        message: response.message,
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Tạo đề thi thất bại",
        message: error.message || "Không thể tạo bài kiểm tra.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteExam(examId, examTitle) {
    const hasConfirmed = window.confirm(`Bạn có chắc muốn xóa bài kiểm tra "${examTitle}" không?`);

    if (!hasConfirmed) {
      return;
    }

    setDeletingExamId(examId);

    try {
      const response = await examApi.delete(examId);
      await loadExamPageData(selectedClassroomId ? { classroomId: selectedClassroomId } : {});
      showToast({
        tone: "success",
        title: "Đã xóa bài kiểm tra",
        message: response.message || `Đã xóa bài kiểm tra ${examTitle}.`,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa bài kiểm tra thất bại",
        message: error.message || "Không thể xóa bài kiểm tra.",
      });
    } finally {
      setDeletingExamId(null);
    }
  }

  const filterOptions = [
    { label: "Tất cả lớp học", value: "" },
    ...classrooms.map((classroom) => ({
      label: classroom.name,
      value: String(classroom.id),
    })),
  ];
  const scheduleFilterOptions = [
    { label: "Tất cả trạng thái", value: "" },
    { label: "Sắp diễn ra", value: "upcoming" },
    { label: "Đang diễn ra", value: "open" },
    { label: "Đã đóng", value: "closed" },
  ];

  return (
    <div className="space-y-6">
      {isTeacherView ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
              {getRoleLabel(user?.role)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.2rem]">
              {pageCopy.title}
            </h1>
          </div>

          {canCreateExam ? (
            <Button
              onClick={() => setIsCreateFormVisible((previousValue) => !previousValue)}
              variant={isCreateFormVisible ? "secondary" : "primary"}
            >
              {isCreateFormVisible ? "Ẩn form tạo bài kiểm tra" : "Tạo bài kiểm tra"}
            </Button>
          ) : null}
        </div>
      ) : isStudentView ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
              {getRoleLabel(user?.role)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.2rem]">
              {pageCopy.title}
            </h1>
          </div>
        </div>
      ) : (
        <PageHeader
          actions={
            canCreateExam ? (
              <Button
                onClick={() => setIsCreateFormVisible((previousValue) => !previousValue)}
                variant={isCreateFormVisible ? "secondary" : "primary"}
              >
                {isCreateFormVisible ? "Ẩn form tạo bài kiểm tra" : "Tạo bài kiểm tra"}
              </Button>
            ) : null
          }
          title={pageCopy.title}
        />
      )}

      {!isStudentView ? (
        <div
          className={`grid gap-4 md:grid-cols-2 ${summaryItems.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
        >
          {summaryItems.map((item) => (
            <div key={item.label} className={`eg-exam-summary-card eg-exam-summary-card-${item.tone}`}>
              <span aria-hidden="true" className="eg-exam-summary-card-bar" />
              <div className="space-y-1">
                <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
                <p className="text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        <div className={`grid gap-4 ${isStudentView ? "lg:grid-cols-2" : "max-w-md"}`}>
          <Select
            id="exam-list-classroom-filter"
            label="Lớp học"
            onChange={(event) => handleClassroomFilterChange(event.target.value)}
            options={filterOptions}
            value={selectedClassroomId}
          />
          {isStudentView ? (
            <Select
              id="exam-list-schedule-status-filter"
              label="Trạng thái lịch thi"
              onChange={(event) => handleScheduleStatusFilterChange(event.target.value)}
              options={scheduleFilterOptions}
              value={selectedScheduleStatus}
            />
          ) : null}
        </div>
      </Card>

      {isTeacherView ? (
        classrooms.length > 0 ? (
          isCreateFormVisible ? (
            <ExamForm
              classroomOptions={classrooms}
              defaultClassroomId={selectedClassroomId || classrooms[0]?.id || ""}
              isSubmitting={isSubmitting}
              key={`create-${selectedClassroomId || "all"}-${classrooms.length}`}
              onSubmitExam={handleCreateExam}
              showDescriptions={false}
              submitLabel="Tạo đề nháp"
              title="Tạo bài kiểm tra mới"
            />
          ) : null
        ) : (
          <EmptyState
            title="Bạn chưa có lớp học để tạo đề thi."
            action={
              <Link className="eg-button eg-button-primary" to={getClassroomListPathByRole(user?.role)}>
                Đi tới lớp học
              </Link>
            }
          />
        )
      ) : null}

      {isLoading ? (
        <div className="grid gap-6">
          <SkeletonExamCard />
          <SkeletonExamCard />
          <SkeletonExamCard />
        </div>
      ) : visibleExams.length > 0 ? (
        <div className="grid gap-6">
          {visibleExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              isDeleting={deletingExamId === exam.id}
              onDeleteExam={handleDeleteExam}
            />
          ))}
        </div>
      ) : isStudentView && exams.length > 0 ? (
        <EmptyState
          title="Không có bài kiểm tra phù hợp với bộ lọc."
          action={
            <Button variant="secondary" onClick={handleResetStudentFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState title="Chưa có bài kiểm tra nào." />
      )}
    </div>
  );
}
