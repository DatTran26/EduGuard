import { Link, useNavigate } from "react-router-dom";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import { formatShortDate } from "../../../utils/formatDate";
import { useAuth } from "../../../hooks/useAuth";
import { FiUsers, FiFileText, FiBookOpen, FiAlertTriangle, FiCopy } from "react-icons/fi";

export default function TeacherClassroomCard({ classroom, onCopyCode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const detailPath = buildClassroomDetailPathByRole(user?.role, classroom.id);

  // Status mapping
  const isOpen = classroom.status !== "closed"; // default to open
  const statusLabel = isOpen ? "Đang mở" : "Đã đóng";
  const statusVariant = isOpen ? "success" : "neutral";

  function handleCopyClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onCopyCode === "function" && classroom.joinCode) {
      onCopyCode(classroom.joinCode);
    }
  }

  function handleSendNotificationClick(e) {
    e.preventDefault();
    e.stopPropagation();
    navigate(`${detailPath}?tab=notifications`);
  }

  return (
    <Card className="flex flex-col justify-between p-5 bg-surface border border-border rounded-[20px] shadow-sm hover:border-tertiary hover:shadow-md hover:translate-y-[-2px] transition-all duration-200">
      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <span className="text-[11px] font-medium text-secondary">
            Tạo: {formatShortDate(classroom.createdAt)}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primary leading-snug truncate">
            <Link to={detailPath} className="hover:text-tertiary transition-colors duration-150">
              {classroom.name}
            </Link>
          </h3>
          <p className="text-xs text-secondary truncate">
            {classroom.description || "Không có mô tả cho lớp học này."}
          </p>
        </div>

        {/* Join Code Badge with Copy Icon */}
        <div className="inline-flex items-center gap-2">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
            Mã lớp:
          </span>
          <button
            onClick={handleCopyClick}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-tertiary bg-info-muted hover:bg-tertiary/10 border border-link/10 rounded-[8px] transition-colors duration-150"
            title="Nhấp để sao chép"
          >
            <span>{classroom.joinCode || "--"}</span>
            <FiCopy className="h-3 w-3" />
          </button>
        </div>

        {/* KPI indicators inside card (inline non-wrapping flex) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-sunken border border-border-subtle rounded-[12px] min-w-0">
            <FiUsers className="h-4 w-4 text-secondary shrink-0" />
            <span className="text-xs font-semibold text-primary truncate">
              {classroom.memberCount ?? 0} học sinh
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-sunken border border-border-subtle rounded-[12px] min-w-0">
            <FiFileText className="h-4 w-4 text-secondary shrink-0" />
            <span className="text-xs font-semibold text-primary truncate">
              {classroom.assignmentCount ?? 0} bài tập
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-sunken border border-border-subtle rounded-[12px] min-w-0">
            <FiBookOpen className="h-4 w-4 text-secondary shrink-0" />
            <span className="text-xs font-semibold text-primary truncate">
              {classroom.examCount ?? 0} đề thi
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 border rounded-[12px] min-w-0 ${classroom.alertCount > 0 ? "bg-danger-muted border-danger/10 text-danger" : "bg-surface-sunken border-border-subtle text-primary"}`}>
            <FiAlertTriangle className={`h-4 w-4 shrink-0 ${classroom.alertCount > 0 ? "text-danger" : "text-secondary"}`} />
            <span className={`text-xs font-semibold truncate ${classroom.alertCount > 0 ? "text-danger" : "text-primary"}`}>
              {classroom.alertCount ?? 0} cảnh báo
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons footer */}
      <div className="flex items-center gap-3 border-t border-border mt-4 pt-4">
        <Button
          onClick={() => navigate(detailPath)}
          variant="primary"
          className="flex-1 text-xs py-2 h-9 rounded-[12px]"
        >
          Xem lớp
        </Button>
        <Button
          onClick={handleSendNotificationClick}
          variant="secondary"
          className="flex-1 text-xs py-2 h-9 rounded-[12px]"
        >
          Gửi thông báo
        </Button>
      </div>
    </Card>
  );
}
