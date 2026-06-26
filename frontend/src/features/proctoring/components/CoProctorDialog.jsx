import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import Button from "../../../components/common/Button";
import { cn } from "../../../utils/cn";
import CoProctorPanel from "./CoProctorPanel";

export default function CoProctorDialog({ examId, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Đóng hộp thoại co-proctor"
        className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby="co-proctor-dialog-title"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[min(88dvh,760px)] w-full max-w-lg flex-col overflow-hidden",
          "rounded-[20px] border border-white/10 bg-[#0b1220] shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
        )}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-300/90">
              Phòng giám sát
            </p>
            <h2 className="text-lg font-semibold text-white" id="co-proctor-dialog-title">
              Quản lý co-proctor
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              Mời giáo viên khác cùng giám sát. Mỗi học sinh chỉ một giáo viên xem live tại một thời điểm.
            </p>
          </div>
          <Button
            aria-label="Đóng"
            className="shrink-0 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            variant="ghost"
          >
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <CoProctorPanel examId={examId} isOpen={isOpen} variant="room" />
        </div>
      </div>
    </div>
  );
}
