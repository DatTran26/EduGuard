import { useEffect, useState } from "react";
import { classroomApi } from "../../../api/classroomApi";
import { userApi } from "../../../api/userApi";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useToast } from "../../../hooks/useToast";
import { formatShortDateTime } from "../../../utils/formatDate";

// Hàm này tính nhanh vài chỉ số cho admin nhìn tổng quan user và classroom trên cùng một màn.
function buildAdminSummary(users, classrooms) {
  return [
    { label: "Người dùng", value: users.length },
    { label: "Giảng viên", value: users.filter((user) => user.role === "Teacher").length },
    { label: "Sinh viên", value: users.filter((user) => user.role === "Student").length },
    { label: "Lớp học", value: classrooms.length },
  ];
}

// Hàm này đổi role kỹ thuật sang màu badge để card danh sách user nhìn đỡ đơn điệu hơn.
function getBadgeVariantByRole(role) {
  if (role === "Admin") {
    return "caution";
  }

  if (role === "Teacher") {
    return "info";
  }

  return "neutral";
}

// Trang này dành cho admin xem nhanh người dùng mock hiện tại và classroom mà backend đang trả về.
export default function UserManagementPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const summaryItems = buildAdminSummary(users, classrooms);

  useEffect(() => {
    let isMounted = true;

    // Hàm này tải dữ liệu đầu trang cho admin mà không bị warning setState trong effect.
    async function loadInitialAdminData() {
      try {
        const [usersResponse, classroomsResponse] = await Promise.all([
          userApi.getAll(),
          classroomApi.getAll(),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(usersResponse.data);
        setClassrooms(classroomsResponse.data);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị viên"
        title="Người dùng hệ thống"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-[20px] border border-border bg-surface p-5">
            <p className="text-[0.82rem] font-medium text-secondary">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-[20px] border border-border bg-surface p-6 text-sm text-secondary">
          Đang tải dữ liệu quản trị...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Danh sách người dùng</h3>

            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-[16px] border border-border bg-neutral p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{user.fullName}</p>
                      <p className="mt-1 text-sm text-secondary">{user.email}</p>
                    </div>
                    <Badge variant={getBadgeVariantByRole(user.role)}>{user.role}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-secondary">
                    Tạo lúc: {formatShortDateTime(user.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Lớp học hiện có</h3>

            {classrooms.length > 0 ? (
              <div className="space-y-3">
                {classrooms.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="rounded-[16px] border border-border bg-neutral p-4"
                  >
                    <p className="text-sm font-semibold text-primary">{classroom.name}</p>
                    <p className="mt-1 text-sm text-secondary">{classroom.teacherName}</p>
                    <p className="mt-2 font-mono text-sm text-secondary">{classroom.joinCode}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-secondary">
                Backend hiện chưa trả danh sách classroom tổng hợp cho tài khoản admin qua endpoint
                `/api/classrooms`.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
