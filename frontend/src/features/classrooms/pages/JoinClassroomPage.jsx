import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { classroomApi } from "../../../api/classroomApi";
import Card from "../../../components/common/Card";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { buildClassroomDetailPathByRole } from "../../../routes/routeConfig";
import JoinClassroomForm from "../components/JoinClassroomForm";

// Trang này phụ trách flow student nhập mã lớp và join classroom bằng mock API.
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
        description="Nhập mã lớp để vào đúng lớp giảng viên đã tạo."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <JoinClassroomForm isSubmitting={isSubmitting} onJoinClassroom={handleJoinClassroom} />

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Lưu ý nhanh</h3>
          <div className="space-y-3 text-sm leading-6 text-secondary">
            <p>Mã lớp phải trùng với mã mà giảng viên cung cấp.</p>
            <p>Sau khi tham gia thành công, bạn sẽ xem được danh sách thành viên của lớp đó.</p>
            <p>Mock API hiện đang lưu dữ liệu bằng localStorage để mô phỏng database thật.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
