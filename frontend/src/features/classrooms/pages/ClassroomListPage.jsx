import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";
import ClassroomCard from "../components/ClassroomCard";
import CreateClassroomForm from "../components/CreateClassroomForm";
import { SkeletonClassroomCard } from "../../../components/common/Skeleton";
import ClassroomListAdminFilters from "./classroom-list-admin-filters";
import {
  buildSummaryItems,
  getPageCopyByRole,
  filterAndSortAdminClassrooms,
} from "./classroom-list-helpers";

export default function ClassroomListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  const [adminSortOption, setAdminSortOption] = useState("name-asc");
  const pageCopy = getPageCopyByRole(user?.role);
  const summaryItems = buildSummaryItems(classrooms);
  const isAdminView = user?.role === "Admin";
  const visibleClassrooms = isAdminView
    ? filterAndSortAdminClassrooms(classrooms, adminSearchTerm, adminSortOption)
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

  async function loadClassrooms() {
    setIsLoading(true);
    try {
      const response = await classroomApi.getAll();
      setClassrooms(response.data);
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
        setClassrooms(response.data);
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
  }, [showToast]);

  async function handleCreateClassroom(payload) {
    setIsSubmitting(true);
    try {
      const response = await classroomApi.create(payload);
      await loadClassrooms();
      setIsCreateFormVisible(false);
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
        message: error.message || "Không thể tạo lớp học.",
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
      return <EmptyState title="Không thể tải lớp học." description={loadErrorMessage} />;
    }
    if (user?.role === "Teacher") {
      return <EmptyState title="Bạn chưa tạo lớp học nào." />;
    }
    if (user?.role === "Student") {
      return (
        <EmptyState
          title="Bạn chưa tham gia lớp học nào."
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getRoleLabel(user?.role)}
        title={pageCopy.title}
        actions={
          user?.role === "Teacher" ? (
            <Button
              onClick={() => setIsCreateFormVisible((prev) => !prev)}
              variant={isCreateFormVisible ? "secondary" : "primary"}
            >
              {isCreateFormVisible ? "Ẩn form tạo lớp" : "Tạo lớp học"}
            </Button>
          ) : pageCopy.actionLabel ? (
            <Link className="eg-button eg-button-primary" to={routeConfig.studentJoinClassroom}>
              {pageCopy.actionLabel}
            </Link>
          ) : null
        }
      />

      {isAdminView ? (
        <ClassroomListAdminFilters
          searchTerm={adminSearchTerm}
          onSearchTermChange={setAdminSearchTerm}
          sortOption={adminSortOption}
          onSortOptionChange={setAdminSortOption}
          onResetFilters={handleResetAdminFilters}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
              <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {user?.role === "Teacher" && isCreateFormVisible ? (
        <CreateClassroomForm
          isSubmitting={isSubmitting}
          onSubmitClassroom={handleCreateClassroom}
          submitLabel="Tạo lớp học"
          title="Tạo lớp học mới"
        />
      ) : null}

      {isLoading ? (
        <div className="grid gap-6">
          <SkeletonClassroomCard />
          <SkeletonClassroomCard />
          <SkeletonClassroomCard />
        </div>
      ) : visibleClassrooms.length > 0 ? (
        <div className="grid gap-6">
          {visibleClassrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} onCopyCode={handleCopyCode} />
          ))}
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
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
