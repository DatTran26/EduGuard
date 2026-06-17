import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { areUserIdsEqual } from "../../../api/apiHelpers";
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
import AssignmentSection from "../../assignments/components/AssignmentSection";
import CreateClassroomForm from "../components/CreateClassroomForm";
import Skeleton, { SkeletonText } from "../../../components/common/Skeleton";

// Hàm này tạo nhóm thông tin ngắn để card overview của classroom detail gọn hơn.
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
  const visibleMembers =
    classroom && user?.role !== "Admin" ? buildVisibleMembers(classroom, members, user) : [];

  // Hàm này tải classroom detail và member list theo đúng quyền backend hiện đang mở cho role hiện tại.
  async function loadClassroomDetail() {
    setIsLoading(true);

    try {
      const requestList = [classroomApi.getById(classroomId)];

      if (user?.role !== "Admin") {
        requestList.push(classroomApi.getMembers(classroomId));
      }

      const [classroomResponse, memberResponse] = await Promise.all(requestList);

      setClassroom(classroomResponse.data);
      setMembers(memberResponse?.data ?? []);
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
        const requestList = [classroomApi.getById(classroomId)];

        if (user?.role !== "Admin") {
          requestList.push(classroomApi.getMembers(classroomId));
        }

        const [classroomResponse, memberResponse] = await Promise.all(requestList);

        if (!isMounted) {
          return;
        }

        setClassroom(classroomResponse.data);
        setMembers(memberResponse?.data ?? []);
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
  }, [classroomId, showToast, user?.role]);

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
      <div className="space-y-6">
        <PageHeader eyebrow="Lớp học" title="Đang tải thông tin..." />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="eg-card space-y-5">
              <Skeleton className="h-6 w-1/4 rounded-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="eg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <SkeletonText lines={4} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="eg-card space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <div className="eg-card space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
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
      <PageHeader
        eyebrow="Chi tiết lớp học"
        title={classroom.name}
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
          </Card>

          {classroom.canEdit ? (
            <div className="space-y-4">
              <CreateClassroomForm
                key={`${classroom.id}-${classroom.updatedAt || classroom.createdAt}`}
                classroom={classroom}
                isSubmitting={isSaving}
                onSubmitClassroom={handleUpdateClassroom}
                submitLabel="Lưu thay đổi"
                title="Chỉnh sửa lớp học"
              />
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Nguy hiểm</h3>
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
              <span className="text-sm text-secondary">
                {user?.role === "Admin" ? "Theo quyền hiện tại" : `${visibleMembers.length} thành viên`}
              </span>
            </div>

            {user?.role === "Admin" ? (
              <p className="text-sm leading-6 text-secondary">
                Backend hiện chỉ cho giáo viên chủ lớp hoặc sinh viên đã tham gia xem danh sách thành
                viên chi tiết.
              </p>
            ) : visibleMembers.length > 0 ? (
              <div className="space-y-3">
                {visibleMembers.map((member) => (
                  <div key={member.id} className="rounded-[16px] border border-border bg-neutral p-4">
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
                      <Badge variant={getMemberBadgeVariant(member)}>
                        {member.statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-secondary">
                      {member.role === "Giảng viên" ? "Bắt đầu quản lý" : "Tham gia"}: {formatShortDateTime(member.joinedAt)}
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

      <AssignmentSection classroom={classroom} showToast={showToast} user={user} />
    </div>
  );
}
