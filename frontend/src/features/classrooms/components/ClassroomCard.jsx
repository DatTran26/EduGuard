import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
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

// Component này là card tóm tắt một classroom với hành động chính là xem chi tiết hoặc copy mã lớp.
export default function ClassroomCard({ classroom, onCopyCode }) {
  const { user } = useAuth();
  const detailPath = buildClassroomDetailPathByRole(user?.role, classroom.id);
  const memberCountLabel =
    typeof classroom.memberCount === "number" ? `${classroom.memberCount} người` : "Chưa có số liệu";

  // Hàm này bắn callback lên page cha khi người dùng muốn sao chép mã lớp hiện tại.
  function handleCopyCodeClick() {
    onCopyCode(classroom.joinCode);
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={classroom.canEdit ? "success" : "info"}>
            {getCardBadgeLabel(classroom, user?.role)}
          </Badge>
          <span className="rounded-full border border-border px-3 py-1 font-mono text-xs text-secondary">
            {classroom.joinCode}
          </span>
        </div>
        <p className="text-sm text-secondary">Tạo ngày {formatShortDate(classroom.createdAt)}</p>
      </div>

      <h3 className="text-xl font-semibold text-primary">{classroom.name}</h3>

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
          <p className="text-[0.82rem] font-medium text-secondary">Cập nhật</p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {formatShortDate(classroom.updatedAt || classroom.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {user?.role !== "Student" ? (
          <Button variant="secondary" onClick={handleCopyCodeClick}>
            Sao chép mã lớp
          </Button>
        ) : null}
        <Link className="eg-button eg-button-primary" to={detailPath}>
          Xem chi tiết
        </Link>
      </div>
    </Card>
  );
}
