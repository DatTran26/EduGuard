import Button from "../../../components/common/Button";
import { formatShortDate } from "../../../utils/formatDate";

export default function ClassroomInfoPanel({
  classroom,
  onEdit,
  onDelete,
  isSaving,
}) {
  return (
    <div className="space-y-3.5 text-xs text-primary">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-secondary">Giảng viên</p>
          <p className="mt-1 truncate font-bold text-primary">{classroom.teacherName}</p>
        </div>
        <div>
          <p className="font-semibold text-secondary">Ngày tạo lớp</p>
          <p className="mt-1 font-bold text-primary">{formatShortDate(classroom.createdAt)}</p>
        </div>
      </div>

      {classroom.description ? (
        <div className="border-t border-border/40 pt-3">
          <p className="font-semibold text-secondary">Mô tả chi tiết</p>
          <p className="mt-1.5 italic leading-relaxed text-secondary">{classroom.description}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3">
        <Button
          variant="secondary"
          onClick={onEdit}
          className="w-full px-3 py-1 text-xs font-bold"
        >
          Chỉnh sửa lớp
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          disabled={isSaving}
          className="w-full px-3 py-1 text-xs font-bold"
        >
          {isSaving ? "Đang xóa..." : "Xoá lớp học"}
        </Button>
      </div>
    </div>
  );
}
