import { useState } from "react";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TextInput from "../../../components/forms/TextInput";

// Form này phụ trách nhập mã lớp để sinh viên tham gia lớp theo đúng flow tài liệu yêu cầu.
export default function JoinClassroomForm({ isSubmitting = false, onJoinClassroom }) {
  const [joinCode, setJoinCode] = useState("");

  // Hàm này chuẩn hóa mã lớp ngay khi gõ để dữ liệu gửi đi luôn ở dạng in hoa, không có khoảng trắng.
  function handleJoinCodeChange(value) {
    setJoinCode(value.toUpperCase().replace(/\s+/g, ""));
  }

  // Hàm này gửi mã lớp về page cha và chỉ reset input khi thao tác join thành công.
  async function handleSubmit(event) {
    event.preventDefault();
    const shouldReset = await onJoinClassroom(joinCode.trim());

    if (shouldReset) {
      setJoinCode("");
    }
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-primary">Tham gia lớp học</h3>
        <p className="text-sm text-secondary">Nhập mã lớp do giảng viên cung cấp.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          id="join-classroom-code"
          label="Mã lớp"
          onChange={(event) => handleJoinCodeChange(event.target.value)}
          placeholder="Nhập mã lớp"
          required
          value={joinCode}
        />
        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang tham gia..." : "Tham gia lớp"}
        </Button>
      </form>
    </Card>
  );
}
