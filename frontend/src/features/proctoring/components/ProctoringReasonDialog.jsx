import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";

export default function ProctoringReasonDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-primary">Lý do</span>
          <Input
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Nhập lý do để lưu vào timeline…"
            value={reason}
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
            Hủy
          </Button>
          <Button
            disabled={isSubmitting || !reason?.trim()}
            onClick={onConfirm}
            variant={confirmVariant}
          >
            {isSubmitting ? "Đang xử lý…" : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
