import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Input from "../../../components/common/Input";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { getRoleLabel } from "../../../routes/roleRoutes";
import { routeConfig } from "../../../routes/routeConfig";
import ClassroomCard from "../components/ClassroomCard";
import CreateClassroomForm from "../components/CreateClassroomForm";

const ADMIN_CLASSROOM_SORT_OPTIONS = [
  { label: "Tên lớp học (A-Z)", value: "name-asc" },
  { label: "Tên lớp học (Z-A)", value: "name-desc" },
  { label: "Số thành viên (nhiều đến ít)", value: "members-desc" },
  { label: "Số thành viên (ít đến nhiều)", value: "members-asc" },
];

// Hàm này dựng bộ số liệu nhỏ phía trên để trang classroom bớt trống và dễ quét hơn.
function buildSummaryItems(classrooms) {
  const teacherCount = new Set(classrooms.map((classroom) => classroom.teacherId)).size;
  const totalMembers = classrooms.reduce(
    (totalValue, classroom) => totalValue + classroom.memberCount,
    0,
  );

  return [
    { label: "Tổng lớp học", value: classrooms.length },
    { label: "Giảng viên", value: teacherCount },
    { label: "Thành viên", value: totalMembers },
  ];
}

// Hàm này trả tiêu đề, mô tả và CTA đầu trang theo role để cùng một page vẫn đúng ngữ cảnh.
function getPageCopyByRole(role) {
  if (role === "Admin") {
    return {
      title: "Quản lý lớp học",
      description: "Xem, tìm kiếm và sắp xếp toàn bộ lớp học trong hệ thống.",
      actionLabel: null,
    };
  }

  if (role === "Teacher") {
    return {
      title: "Lớp học của giảng viên",
      description: "Tạo, cập nhật và theo dõi các lớp học do bạn phụ trách.",
      actionLabel: null,
    };
  }

  return {
    title: "Lớp học của sinh viên",
    description: "Xem các lớp đã tham gia và mở nhanh lớp cần học.",
    actionLabel: "Tham gia lớp",
  };
}

// Hàm này lọc lớp học theo tên lớp hoặc tên giảng viên để admin tìm nhanh đúng dữ liệu cần xem.
function filterAndSortAdminClassrooms(classrooms, searchTerm, sortOption) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    const classroomName = classroom.name?.toLowerCase() ?? "";
    const teacherName = classroom.teacherName?.toLowerCase() ?? "";

    return classroomName.includes(normalizedSearchTerm) || teacherName.includes(normalizedSearchTerm);
  });

  return filteredClassrooms.slice().sort((firstClassroom, secondClassroom) => {
    if (sortOption === "name-desc") {
      return secondClassroom.name.localeCompare(firstClassroom.name, "vi");
    }

    if (sortOption === "members-desc") {
      return (
        secondClassroom.memberCount - firstClassroom.memberCount ||
        firstClassroom.name.localeCompare(secondClassroom.name, "vi")
      );
    }

    if (sortOption === "members-asc") {
      return (
        firstClassroom.memberCount - secondClassroom.memberCount ||
        firstClassroom.name.localeCompare(secondClassroom.name, "vi")
      );
    }

    return firstClassroom.name.localeCompare(secondClassroom.name, "vi");
  });
}

// Trang này hiển thị classroom list theo quyền hiện tại và cho teacher thao tác CRUD phần tạo lớp.
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

  // Hàm này gọi API lấy classroom list đúng theo role đang đăng nhập rồi đổ vào state hiện tại.
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

    // Hàm này tải dữ liệu ban đầu khi trang vừa mount mà không bị warning setState trong effect.
    async function loadInitialClassrooms() {
      try {
        const response = await classroomApi.getAll();

        if (!isMounted) {
          return;
        }

        setClassrooms(response.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error.message || "Không thể tải danh sách lớp học.";
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

    loadInitialClassrooms();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Hàm này xin server mock random mã lớp cho teacher dùng nhanh trong form tạo hoặc sửa classroom.
  async function handleGenerateJoinCode() {
    try {
      const response = await classroomApi.generateJoinCode();
      return response.data.joinCode;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không tạo được mã lớp",
        message: error.message || "Không thể tạo mã lớp ngẫu nhiên.",
      });
      return "";
    }
  }

  // Hàm này xử lý teacher tạo classroom mới rồi tải lại danh sách để card hiển thị đồng bộ.
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

  // Hàm này copy mã lớp để teacher hoặc admin xử lý nhanh khi cần chia sẻ cho sinh viên.
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

  // Hàm này đưa bộ lọc của admin về mặc định để tìm kiếm lại từ đầu cho nhanh.
  function handleResetAdminFilters() {
    setAdminSearchTerm("");
    setAdminSortOption("name-asc");
  }

  // Hàm này trả empty state phù hợp hơn với vai trò hiện tại thay vì dùng một thông điệp chung.
  function renderEmptyState() {
    if (loadErrorMessage) {
      return (
        <EmptyState
          title="Không thể tải lớp học."
          description={loadErrorMessage}
        />
      );
    }

    if (user?.role === "Teacher") {
      return (
        <EmptyState
          title="Bạn chưa tạo lớp học nào."
          description="Tạo lớp đầu tiên để bắt đầu quản lý sinh viên."
        />
      );
    }

    if (user?.role === "Student") {
      return (
        <EmptyState
          title="Bạn chưa tham gia lớp học nào."
          description="Khi có mã lớp từ giảng viên, bạn có thể tham gia ngay."
          action={
            <Link className="eg-button eg-button-primary" to={routeConfig.studentJoinClassroom}>
              Tham gia lớp
            </Link>
          }
        />
      );
    }

    return (
      <EmptyState
        title="Chưa có lớp học nào trong hệ thống."
        description="Danh sách lớp học sẽ xuất hiện tại đây khi giảng viên bắt đầu tạo lớp."
      />
    );
  }

  // Hàm này trả trạng thái rỗng riêng khi admin đã có dữ liệu nhưng bộ lọc hiện tại không khớp lớp nào.
  function renderAdminFilterEmptyState() {
    return (
      <EmptyState
        title="Không tìm thấy lớp học phù hợp."
        description="Hãy thử đổi từ khóa tìm kiếm hoặc cách sắp xếp để xem lại danh sách lớp học."
        action={
          <Button variant="secondary" onClick={handleResetAdminFilters}>
            Xóa bộ lọc
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getRoleLabel(user?.role)}
        title={pageCopy.title}
        description={pageCopy.description}
        actions={
          user?.role === "Teacher" ? (
            <Button
              onClick={() => setIsCreateFormVisible((previousValue) => !previousValue)}
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
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">Bộ lọc lớp học</h3>
              <p className="text-sm leading-6 text-secondary">
                Tìm theo tên lớp học hoặc tên giảng viên, đồng thời sắp xếp danh sách theo nhu cầu.
              </p>
            </div>
            <Button
              disabled={!adminSearchTerm && adminSortOption === "name-asc"}
              variant="ghost"
              onClick={handleResetAdminFilters}
            >
              Đặt lại
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <label className="eg-label" htmlFor="admin-classroom-search">
                Tìm kiếm lớp học
              </label>
              <Input
                id="admin-classroom-search"
                placeholder="Nhập tên lớp học hoặc tên giảng viên"
                type="search"
                value={adminSearchTerm}
                onChange={(event) => setAdminSearchTerm(event.target.value)}
              />
            </div>

            <div>
              <label className="eg-label" htmlFor="admin-classroom-sort">
                Sắp xếp danh sách
              </label>
              <select
                id="admin-classroom-sort"
                className="eg-input"
                value={adminSortOption}
                onChange={(event) => setAdminSortOption(event.target.value)}
              >
                {ADMIN_CLASSROOM_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
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
          onGenerateJoinCode={handleGenerateJoinCode}
          onSubmitClassroom={handleCreateClassroom}
          submitLabel="Tạo lớp học"
          title="Tạo lớp học mới"
        />
      ) : null}

      {isLoading ? (
        <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
          Đang tải danh sách lớp học...
        </div>
      ) : visibleClassrooms.length > 0 ? (
        <div className="grid gap-6">
          {visibleClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onCopyCode={handleCopyCode}
            />
          ))}
        </div>
      ) : isAdminView && classrooms.length > 0 ? (
        renderAdminFilterEmptyState()
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
