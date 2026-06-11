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
      description: "Theo dõi toàn bộ lớp học và kiểm tra nhanh trạng thái dữ liệu trong hệ thống.",
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
  const pageCopy = getPageCopyByRole(user?.role);
  const summaryItems = buildSummaryItems(classrooms);

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

      <div className="grid gap-4 md:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

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
      ) : classrooms.length > 0 ? (
        <div className="grid gap-6">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onCopyCode={handleCopyCode}
            />
          ))}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
