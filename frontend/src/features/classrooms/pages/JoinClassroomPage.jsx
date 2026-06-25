import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";
import { classroomApi } from "../../../api/classroomApi";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import JoinClassroomForm from "../components/JoinClassroomForm";

// Trang này phụ trách flow student nhập mã lớp và gọi backend thật để tham gia classroom.
export default function JoinClassroomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm này gọi API join classroom, nếu thành công thì đưa sinh viên sang trang detail của lớp đó.
  async function handleJoinClassroom(joinCode) {
    setIsSubmitting(true);

    try {
      const response = await classroomApi.join(joinCode);

      showToast({
        tone: "success",
        title: "Tham gia thành công",
        message: response.message,
      });
      navigate(buildClassroomDetailPathByRole(user?.role, response.data.id), {
        replace: true,
      });

      return true;
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không tham gia được lớp",
        message: error.message || "Không thể tham gia lớp học.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="eg-page-hero">
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgb(59 130 246 / 8%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-info">
              Tham gia lớp học
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Tham gia lớp học mới
            </h1>
            <p className="text-sm text-secondary max-w-2xl">
              Nhập mã lớp được giảng viên cung cấp để tham gia vào lớp học và truy cập các bài thi, tài liệu học tập.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-secondary">
            <FiUsers className="h-4 w-4 text-info" />
            <span>Sinh viên</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <JoinClassroomForm isSubmitting={isSubmitting} onJoinClassroom={handleJoinClassroom} />
      </div>
    </div>
  );
}
