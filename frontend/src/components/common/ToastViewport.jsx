import { cn } from "../../utils/cn";

const TOAST_TONE_CLASS_NAMES = {
  info: "eg-toast-info",
  success: "eg-toast-success",
  danger: "eg-toast-danger",
};

// Component này hiển thị toàn bộ toast đang hoạt động ở góc trên bên phải màn hình.
export default function ToastViewport({ toasts = [], onDismiss }) {
  return (
    <div aria-live="polite" className="eg-toast-viewport">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn("eg-toast", TOAST_TONE_CLASS_NAMES[toast.tone] ?? TOAST_TONE_CLASS_NAMES.info)}
          role="status"
        >
          <div className="space-y-1">
            {toast.title ? <p className="text-sm font-semibold text-primary">{toast.title}</p> : null}
            <p className="text-sm leading-6 text-secondary">{toast.message}</p>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="eg-toast-close"
            onClick={() => onDismiss(toast.id)}
            type="button"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
