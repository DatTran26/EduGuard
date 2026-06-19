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
      <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-info/20 bg-info-muted px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-info">
            Sinh viên
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-[2.2rem]">
            Tham gia lớp học
          </h1>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-border bg-neutral px-5 py-3 text-sm font-medium text-secondary">
          <FiUsers className="h-4 w-4 text-info" />
          <span>Nhập mã lớp</span>
        </div>
      </div>

      <div className="max-w-3xl">
        <JoinClassroomForm isSubmitting={isSubmitting} onJoinClassroom={handleJoinClassroom} />
      </div>
    </div>
  );
}
