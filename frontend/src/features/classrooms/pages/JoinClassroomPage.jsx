import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import PageHeader from "../../../components/layout/PageHeader";
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
      <PageHeader
        eyebrow="Sinh viên"
        title="Tham gia lớp học"
      />

      <div className="max-w-xl">
        <JoinClassroomForm isSubmitting={isSubmitting} onJoinClassroom={handleJoinClassroom} />
      </div>
    </div>
  );
}
