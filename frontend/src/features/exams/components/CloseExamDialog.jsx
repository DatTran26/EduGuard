import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { cn } from "../../../utils/cn";

export default function CloseExamDialog({
  isOpen,
  isSubmitting = false,
  onConfirm,
  onCancel,
  variant = "default",
}) {
  if (!isOpen) {
    return null;
  }

  const isRoom = variant === "room";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card
        className={cn(
          "w-full max-w-md space-y-4 p-5",
          isRoom && "border-white/10 bg-[#0b1220] text-slate-100",
        )}
      >
        <div>
          <h3 className={cn("text-lg font-semibold", isRoom ? "text-white" : "text-primary")}>
            Đóng bài thi
          </h3>
          <p className={cn("mt-1 text-sm", isRoom ? "text-slate-400" : "text-secondary")}>
            Sinh viên đang làm bài sẽ không thể tiếp tục sau khi xác nhận. Thời gian đóng đề được
            cập nhật về thời điểm hiện tại.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            className={isRoom ? "text-slate-300 hover:text-white" : undefined}
            disabled={isSubmitting}
            onClick={onCancel}
            variant="ghost"
          >
            Hủy
          </Button>
          <Button disabled={isSubmitting} onClick={onConfirm} variant="danger">
            {isSubmitting ? "Đang xử lý…" : "Đóng bài thi"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
