import { useEffect, useMemo, useState } from "react";
import { classroomApi } from "../../../api/classroomApi";
import { userApi } from "../../../api/userApi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";
import AdminUserForm from "../components/AdminUserForm";

const ROLE_FILTER_OPTIONS = [
  { label: "Tất cả vai trò", value: "" },
  { label: "Admin", value: "Admin" },
  { label: "Teacher", value: "Teacher" },
  { label: "Student", value: "Student" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Đã khóa", value: "inactive" },
];

function buildAdminSummary(users, filteredUsers) {
  return [
    { label: "Người dùng", value: users.length },
    { label: "Giảng viên", value: users.filter((user) => user.role === "Teacher").length },
    { label: "Sinh viên", value: users.filter((user) => user.role === "Student").length },
    { label: "Hiển thị", value: filteredUsers.length },
  ];
}

function getBadgeVariantByRole(role) {
  if (role === "Admin") {
    return "caution";
  }

  if (role === "Teacher") {
    return "info";
  }

  return "neutral";
}

function getStatusBadgeVariant(isActive) {
  return isActive ? "success" : "danger";
}

function getManagedClassrooms(classrooms, selectedUser) {
  if (!selectedUser || selectedUser.role !== "Teacher") {
    return [];
  }

  return classrooms.filter((classroom) => String(classroom.teacherId) === String(selectedUser.id));
}

function resolveSelectedUserId(users, currentSelectedUserId, preferredSelectedUserId = "") {
  if (preferredSelectedUserId && users.some((user) => String(user.id) === String(preferredSelectedUserId))) {
    return String(preferredSelectedUserId);
  }

  if (users.some((user) => String(user.id) === String(currentSelectedUserId))) {
    return String(currentSelectedUserId);
  }

  return String(users[0]?.id ?? "");
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeFormMode, setActiveFormMode] = useState(null);

  async function fetchAdminData() {
    const [usersResponse, classroomsResponse] = await Promise.all([userApi.getAll(), classroomApi.getAll()]);

    return {
      users: usersResponse.data,
      classrooms: classroomsResponse.data,
    };
  }

  function applyAdminState(nextUsers, nextClassrooms, preferredSelectedUserId = "") {
    setUsers(nextUsers);
    setClassrooms(nextClassrooms);
    setSelectedUserId((previousSelectedUserId) =>
      resolveSelectedUserId(nextUsers, previousSelectedUserId, preferredSelectedUserId),
    );
  }

  async function refreshAdminData(preferredSelectedUserId = "") {
    const nextData = await fetchAdminData();
    applyAdminState(nextData.users, nextData.classrooms, preferredSelectedUserId);
    return nextData;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialAdminData() {
      try {
        const nextData = await fetchAdminData();

        if (!isMounted) {
          return;
        }

        applyAdminState(nextData.users, nextData.classrooms);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "danger",
          title: "Tải dữ liệu thất bại",
          message: error.message || "Không thể tải dữ liệu quản trị.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAdminData();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter === "active" && !user.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && user.isActive) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return [user.fullName, user.email, user.role]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalizedSearchTerm));
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const effectiveSelectedUserId = filteredUsers.some((user) => String(user.id) === String(selectedUserId))
    ? String(selectedUserId)
    : String(filteredUsers[0]?.id ?? "");
  const selectedUser = filteredUsers.find((user) => String(user.id) === effectiveSelectedUserId) ?? null;
  const summaryItems = buildAdminSummary(users, filteredUsers);
  const managedClassrooms = getManagedClassrooms(classrooms, selectedUser);
  const isSelfSelected = selectedUser ? String(selectedUser.id) === String(currentUser?.id ?? "") : false;
  const isFormVisible = activeFormMode === "create" || activeFormMode === "edit";

  function handleResetFilters() {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  }

  function handleToggleCreateForm() {
    setActiveFormMode((previousMode) => (previousMode === "create" ? null : "create"));
  }

  function handleStartEditing() {
    if (!selectedUser) {
      return;
    }

    setActiveFormMode("edit");
  }

  function handleCloseForm() {
    setActiveFormMode(null);
  }

  async function handleSubmitUser(payload) {
    const isEditing = activeFormMode === "edit";

    if (isEditing && !selectedUser) {
      showToast({
        tone: "danger",
        title: "Cập nhật thất bại",
        message: "Không tìm thấy người dùng cần cập nhật.",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = isEditing
        ? await userApi.update(selectedUser?.id, payload)
        : await userApi.create(payload);

      await refreshAdminData(response.data?.id);
      setActiveFormMode(null);
      showToast({
        tone: "success",
        title: isEditing ? "Đã cập nhật người dùng" : "Đã thêm người dùng",
        message: response.message,
      });
      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: isEditing ? "Cập nhật thất bại" : "Thêm người dùng thất bại",
        message: error.message || "Không thể lưu người dùng.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) {
      return;
    }

    const hasConfirmed = window.confirm(`Bạn có chắc muốn xóa người dùng "${selectedUser.fullName}" không?`);
    if (!hasConfirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await userApi.delete(selectedUser.id);
      await refreshAdminData();
      setActiveFormMode(null);
      showToast({
        tone: "success",
        title: "Đã xóa người dùng",
        message: response.message,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Xóa thất bại",
        message: error.message || "Không thể xóa người dùng.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        actions={
          <Button disabled={isSubmitting} onClick={handleToggleCreateForm} variant={activeFormMode === "create" ? "secondary" : "primary"}>
            {activeFormMode === "create" ? "Đóng" : "Thêm người dùng"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="eg-summary-card">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Bộ lọc</h3>

        <div className="grid gap-4 lg:grid-cols-4">
          <TextInput
            id="admin-user-search"
            label="Tìm kiếm"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tên, email, vai trò"
            value={searchTerm}
          />
          <Select
            id="admin-user-role-filter"
            label="Vai trò"
            onChange={(event) => setRoleFilter(event.target.value)}
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
          />
          <Select
            id="admin-user-status-filter"
            label="Trạng thái"
            onChange={(event) => setStatusFilter(event.target.value)}
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
          />
          <div className="flex items-end">
            <Button className="w-full" onClick={handleResetFilters} variant="secondary">
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="eg-feedback-panel">Đang tải dữ liệu quản trị...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Danh sách</h3>

            {filteredUsers.length > 0 ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const isSelected = String(user.id) === effectiveSelectedUserId;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`w-full rounded-[18px] border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-info bg-info-muted shadow-[0_18px_40px_rgb(14_165_233/10%)]"
                          : "border-border bg-neutral hover:border-info/40"
                      }`}
                      onClick={() => setSelectedUserId(String(user.id))}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{user.fullName}</p>
                          <p className="mt-1 truncate text-sm text-secondary">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge variant={getBadgeVariantByRole(user.role)}>{user.role}</Badge>
                          <Badge variant={getStatusBadgeVariant(user.isActive)}>
                            {user.isActive ? "Hoạt động" : "Đã khóa"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Không có người dùng phù hợp." />
            )}
          </Card>

          <div className="space-y-6">
            {isFormVisible ? (
              activeFormMode === "edit" && !selectedUser ? (
                <Card className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-primary">Sửa người dùng</h3>
                    <Button disabled={isSubmitting} onClick={handleCloseForm} variant="secondary">
                      Đóng
                    </Button>
                  </div>
                  <EmptyState title="Chưa có người dùng được chọn." />
                </Card>
              ) : (
                <AdminUserForm
                  key={activeFormMode === "edit" ? `edit-${selectedUser?.id ?? "none"}` : "create"}
                  isEditing={activeFormMode === "edit"}
                  isSelfEditing={activeFormMode === "edit" && isSelfSelected}
                  isSubmitting={isSubmitting}
                  onCancel={handleCloseForm}
                  onSubmitUser={handleSubmitUser}
                  title={activeFormMode === "create" ? "Thêm người dùng" : "Sửa người dùng"}
                  user={activeFormMode === "edit" ? selectedUser : null}
                />
              )
            ) : (
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-primary">Chi tiết</h3>

                  {selectedUser ? (
                    <div className="flex flex-wrap gap-3">
                      <Button disabled={isSubmitting} onClick={handleStartEditing} variant="secondary">
                        Sửa
                      </Button>
                      <Button disabled={isSubmitting || isSelfSelected} onClick={handleDeleteUser} variant="danger">
                        Xóa
                      </Button>
                    </div>
                  ) : null}
                </div>

                {selectedUser ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Họ tên</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{selectedUser.fullName}</p>
                    </div>
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Email</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{selectedUser.email}</p>
                    </div>
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Vai trò</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{selectedUser.role}</p>
                    </div>
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Trạng thái</p>
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {selectedUser.isActive ? "Đang hoạt động" : "Đã khóa"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Tạo lúc</p>
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {formatShortDateTime(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-border bg-neutral p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Cập nhật</p>
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {formatShortDateTime(selectedUser.updatedAt || selectedUser.createdAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Chưa có người dùng được chọn." />
                )}
              </Card>
            )}

            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Lớp học</h3>

              {selectedUser ? (
                selectedUser.role === "Teacher" ? (
                  managedClassrooms.length > 0 ? (
                    <div className="space-y-3">
                      {managedClassrooms.map((classroom) => (
                        <div key={classroom.id} className="rounded-[18px] border border-border bg-neutral p-4">
                          <p className="text-sm font-semibold text-primary">{classroom.name}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
                            <span className="rounded-full border border-border bg-surface px-3 py-1">
                              {classroom.joinCode}
                            </span>
                            <span className="rounded-full border border-border bg-surface px-3 py-1">
                              {typeof classroom.memberCount === "number" ? `${classroom.memberCount} người` : "--"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Giảng viên này chưa có lớp học." />
                  )
                ) : (
                  <EmptyState title="Vai trò này không có lớp học quản lý." />
                )
              ) : (
                <EmptyState title="Chưa có người dùng được chọn." />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
