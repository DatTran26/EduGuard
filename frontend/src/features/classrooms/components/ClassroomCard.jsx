import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import { useAuth } from "../../../hooks/useAuth";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDate } from "../../../utils/formatDate";

// Hàm này trả nhãn phụ cho classroom card để nhìn nhanh là biết lớp thuộc mình hay đang tham gia.
function getCardBadgeLabel(classroom, role) {
  if (role === "Teacher" && classroom.canEdit) {
    return "Lớp bạn quản lý";
  }

  if (role === "Student" && classroom.isJoined) {
    return "Đã tham gia";
  }

  return "Có thể xem";
}

// Component này là card tóm tắt classroom; người dùng đi vào chi tiết bằng cách bấm trực tiếp tên lớp.
export default function ClassroomCard({ classroom }) {
  const { user } = useAuth();
  const detailPath = buildClassroomDetailPathByRole(user?.role, classroom.id);
  const memberCountLabel =
    typeof classroom.memberCount === "number" ? `${classroom.memberCount} người` : "Chưa có số liệu";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={classroom.canEdit ? "success" : "info"}>
            {getCardBadgeLabel(classroom, user?.role)}
          </Badge>
        </div>
        <p className="text-sm text-secondary">Tạo ngày {formatShortDate(classroom.createdAt)}</p>
      </div>

      <h3>
        <Link
          className="inline-flex max-w-fit cursor-pointer text-xl font-semibold text-primary decoration-2 underline-offset-4 transition-colors duration-200 hover:text-link hover:underline focus-visible:text-link focus-visible:underline"
          to={detailPath}
        >
          {classroom.name}
        </Link>
      </h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Giảng viên</p>
          <p className="mt-2 text-sm font-semibold text-primary">{classroom.teacherName}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Thành viên</p>
          <p className="mt-2 text-sm font-semibold text-primary">{memberCountLabel}</p>
        </div>
        <div className="rounded-[16px] border border-border bg-neutral p-4">
          <p className="text-[0.82rem] font-medium text-secondary">Mã lớp</p>
          <p className="mt-2 font-mono text-sm font-semibold text-primary">{classroom.joinCode}</p>
        </div>
      </div>
    </Card>
  );
}
