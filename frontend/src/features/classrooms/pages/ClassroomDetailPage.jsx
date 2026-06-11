import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import {
  getExamListPathByRole,
  getClassroomListPathByRole,
  getProfilePathByRole,
} from "../../../routes/routeConfig";
import { formatShortDate, formatShortDateTime } from "../../../utils/formatDate";
import CreateClassroomForm from "../components/CreateClassroomForm";

// Hàm này tạo nhóm thông tin ngắn để card overview của classroom detail gọn hơn.
function buildQuickInfoItems(classroom) {
  return [
    { label: "Mã lớp", value: classroom.joinCode },
    { label: "Giảng viên", value: classroom.teacherName },
    { label: "Thành viên", value: `${classroom.memberCount} người` },
    { label: "Ngày tạo", value: formatShortDate(classroom.createdAt) },
  ];
}

// Hàm này trả nhãn badge đầu trang tùy theo cách user hiện tại truy cập vào classroom này.
function getAccessBadgeLabel(classroom, role) {
  if (classroom.canEdit) {
    return "Bạn đang quản lý lớp này";
  }

  if (role === "Admin") {
    return "Bạn đang theo dõi lớp này";
  }

  return "Bạn đang tham gia lớp này";
}

// Trang này hiển thị đầy đủ thông tin classroom, thành viên và khu vực teacher chỉnh sửa lớp học.
export default function ClassroomDetailPage() {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Hàm này tải classroom detail và member list từ hai endpoint mock riêng để bám sát tài liệu API.
  async function loadClassroomDetail() {
    setIsLoading(true);

    try {
      const [classroomResponse, memberResponse] = await Promise.all([
        classroomApi.getById(classroomId),
        classroomApi.getMembers(classroomId),
      ]);

      setClassroom(classroomResponse.data);
      setMembers(memberResponse.data);
      setLoadErrorMessage("");
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

    // Hàm này tải dữ liệu lần đầu hoặc khi đổi classroom id, giữ cho detail page đúng nội dung.
    async function loadInitialDetail() {
      try {
        const [classroomResponse, memberResponse] = await Promise.all([
          classroomApi.getById(classroomId),
          classroomApi.getMembers(classroomId),
        ]);

        if (!isMounted) {
          return;
        }

        setClassroom(classroomResponse.data);
        setMembers(memberResponse.data);
        setLoadErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialDetail();

    return () => {
      isMounted = false;
    };
  }, [classroomId, showToast]);

  // Hàm này xin mã lớp mới cho form chỉnh sửa nếu giảng viên muốn random lại join code.
  async function handleGenerateJoinCode() {
    try {
      const response = await classroomApi.generateJoinCode();
      return response.data.joinCode;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không tạo được mã lớp",
        message: error.message || "Không thể tạo mã lớp mới.",
      });
      return "";
    }
  }

  // Hàm này lưu chỉnh sửa classroom dành cho giảng viên rồi tải lại detail để đồng bộ dữ liệu.
  async function handleUpdateClassroom(payload) {
    setIsSaving(true);

    try {
      const response = await classroomApi.update(classroomId, payload);
      await loadClassroomDetail();
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

  // Hàm này xóa classroom hiện tại sau khi teacher xác nhận, rồi đưa người dùng về classroom list.
  async function handleDeleteClassroom() {
    const hasConfirmed = window.confirm("Bạn có chắc muốn xóa lớp học này không?");

    if (!hasConfirmed) {
      return;
    }

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

  // Hàm này copy mã lớp ở màn hình detail để teacher khỏi phải quay về list page.
  async function handleCopyJoinCode() {
    if (!classroom) {
      return;
    }

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

  if (isLoading) {
    return (
      <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
        Đang tải chi tiết lớp học...
      </div>
    );
  }

  if (!classroom) {
    return (
      <EmptyState
        title="Không tìm thấy lớp học."
        description={loadErrorMessage || "Lớp học này hiện không tồn tại hoặc bạn không có quyền xem."}
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
      <PageHeader
        eyebrow="Chi tiết lớp học"
        title={classroom.name}
        description={classroom.description || "Chưa có mô tả cho lớp học này."}
        actions={
          user?.role !== "Student" ? (
            <Button onClick={handleCopyJoinCode} variant="secondary">
              Sao chép mã lớp
            </Button>
          ) : null
        }
      />

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
              {buildQuickInfoItems(classroom).map((item) => (
                <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
                  <p className="text-sm font-semibold text-primary">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-secondary">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[16px] border border-border bg-neutral p-4 text-sm text-secondary">
              Cập nhật gần nhất: {formatShortDateTime(classroom.updatedAt || classroom.createdAt)}
            </div>
          </Card>

          {classroom.canEdit ? (
            <div className="space-y-4">
              <CreateClassroomForm
                key={`${classroom.id}-${classroom.updatedAt || classroom.createdAt}`}
                classroom={classroom}
                isSubmitting={isSaving}
                onGenerateJoinCode={handleGenerateJoinCode}
                onSubmitClassroom={handleUpdateClassroom}
                submitLabel="Lưu thay đổi"
                title="Chỉnh sửa lớp học"
              />
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Nguy hiểm</h3>
                <p className="text-sm leading-6 text-secondary">
                  Xóa lớp học sẽ làm mất luôn danh sách thành viên của lớp này trong mock database.
                </p>
                <Button disabled={isSaving} onClick={handleDeleteClassroom} variant="danger">
                  {isSaving ? "Đang xử lý..." : "Xóa lớp học"}
                </Button>
              </Card>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-primary">Thành viên lớp học</h3>
              <span className="text-sm text-secondary">{members.length} người</span>
            </div>

            {members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="rounded-[16px] border border-border bg-neutral p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{member.fullName}</p>
                        <p className="mt-1 text-sm text-secondary">{member.email}</p>
                      </div>
                      <Badge variant={member.role === "Giáo viên" ? "info" : "neutral"}>
                        {member.role}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-secondary">
                      Tham gia: {formatShortDateTime(member.joinedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary">Lớp học này hiện chưa có thành viên nào.</p>
            )}
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Liên kết nhanh</h3>
            <div className="flex flex-wrap gap-3">
              <Link className="eg-button eg-button-secondary" to={getClassroomListPathByRole(user?.role)}>
                Danh sách lớp
              </Link>
              <Link
                className="eg-button eg-button-ghost"
                to={`${getExamListPathByRole(user?.role)}?classroomId=${classroom.id}`}
              >
                Bài kiểm tra của lớp
              </Link>
              <Link className="eg-button eg-button-ghost" to={getProfilePathByRole(user?.role)}>
                Hồ sơ cá nhân
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
