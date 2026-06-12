import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import { examApi } from "../../../api/examApi";
import EmptyState from "../../../components/common/EmptyState";
import Card from "../../../components/common/Card";
import Select from "../../../components/forms/Select";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { getClassroomListPathByRole } from "../../../routes/routeConfig";
import ExamCard from "../components/ExamCard";
import ExamForm from "../components/ExamForm";

// Hàm này tính vài con số nhanh cho đầu trang danh sách đề thi để màn hình bớt khô hơn.
function buildSummaryItems(exams) {
  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const openCount = exams.filter((exam) => exam.statusLabel === "Đang mở").length;
  const antiCheatCount = exams.filter((exam) => exam.enableAntiCheat).length;

  return [
    { label: "Tổng đề", value: exams.length },
    { label: "Đã publish", value: publishedCount },
    { label: "Đang mở", value: openCount },
    { label: "Anti-cheat bật", value: antiCheatCount },
  ];
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
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedClassroomId = searchParams.get("classroomId") ?? "";
  const summaryItems = buildSummaryItems(exams);
  const pageCopy = getPageCopyByRole(user?.role);

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
      setLoadErrorMessage("");
    } catch (error) {
      const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
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
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải danh sách bài kiểm tra.";
        setLoadErrorMessage(nextMessage);
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
  function handleClassroomFilterChange(nextClassroomId) {
    setIsLoading(true);

    if (!nextClassroomId) {
      setSearchParams({});
      return;
    }

    setSearchParams({ classroomId: nextClassroomId });
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

      showToast({
        tone: "success",
        title: "Đã tạo bài kiểm tra",
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

  const filterOptions = [
    { label: "Tất cả lớp học", value: "" },
    ...classrooms.map((classroom) => ({
      label: classroom.name,
      value: String(classroom.id),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getRoleLabel(user?.role)}
        title={pageCopy.title}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>
        <div className="max-w-md">
          <Select
            id="exam-list-classroom-filter"
            label="Lớp học"
            onChange={(event) => handleClassroomFilterChange(event.target.value)}
            options={filterOptions}
            value={selectedClassroomId}
          />
        </div>
      </Card>

      {user?.role === "Teacher" ? (
        classrooms.length > 0 ? (
          <ExamForm
            classroomOptions={classrooms}
            defaultClassroomId={selectedClassroomId || classrooms[0]?.id || ""}
            isSubmitting={isSubmitting}
            key={`create-${selectedClassroomId || "all"}-${classrooms.length}`}
            onSubmitExam={handleCreateExam}
            submitLabel="Tạo bài kiểm tra"
            title="Tạo bài kiểm tra mới"
          />
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
        <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
          Đang tải danh sách bài kiểm tra...
        </div>
      ) : exams.length > 0 ? (
        <div className="grid gap-6">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có bài kiểm tra nào."
          description={loadErrorMessage}
        />
      )}
    </div>
  );
}
