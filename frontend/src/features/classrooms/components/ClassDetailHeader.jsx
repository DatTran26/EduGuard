import { useState, useRef } from "react";
import { FiCopy, FiCheck, FiPlus, FiBell, FiMenu } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { formatShortDate } from "../../../utils/formatDate";

export default function ClassDetailHeader({ classroom, onAction }) {
  const [copied, setCopied] = useState(false);
  const [isCopiedJoinCode, setIsCopiedJoinCode] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const timeoutRef = useRef(null);

  const isOpen = classroom.status !== "closed";
  const statusLabel = isOpen ? "Đang mở" : "Đã đóng";
  const statusVariant = isOpen ? "success" : "neutral";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(classroom.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  }

  async function handleCopyJoinCodeFromPopover() {
    try {
      await navigator.clipboard.writeText(classroom.joinCode);
      setIsCopiedJoinCode(true);
      setTimeout(() => setIsCopiedJoinCode(false), 2000);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 300);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
      {/* Title & Badges with Hamburger Menu */}
      <div className="flex items-center gap-3.5">
        {/* Hamburger Info Button on Hover */}
        <div
          className="relative inline-block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-surface transition-all duration-200 hover:bg-surface-sunken hover:border-brand shadow-sm ${
              isPopoverOpen ? "border-brand text-brand ring-2 ring-brand/10" : "border-border text-secondary"
            }`}
            aria-label="Classroom Information"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          {/* Floating Classroom Info Popover */}
          {isPopoverOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 p-5 bg-surface border border-border rounded-[25px] shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-xs text-primary">
              <h3 className="text-sm font-bold text-primary mb-3 pb-2 border-b border-border">
                Thông tin lớp học
              </h3>

              <div className="space-y-3.5">
                <div>
                  <p className="font-semibold text-secondary">Mã lớp tham gia</p>
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-border/80 bg-surface-sunken p-2.5">
                    <span className="font-mono font-bold tracking-wider text-primary">{classroom.joinCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyJoinCodeFromPopover}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-sunken text-secondary transition-colors duration-150"
                      title="Copy mã lớp"
                    >
                      {isCopiedJoinCode ? (
                        <FiCheck className="text-success h-3.5 w-3.5" />
                      ) : (
                        <FiCopy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                  <div>
                    <p className="font-semibold text-secondary">Giảng viên</p>
                    <p className="mt-1 font-bold text-primary truncate">{classroom.teacherName}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-secondary">Ngày tạo lớp</p>
                    <p className="mt-1 font-bold text-primary">{formatShortDate(classroom.createdAt)}</p>
                  </div>
                </div>

                {classroom.description && (
                  <div className="border-t border-border/40 pt-3">
                    <p className="font-semibold text-secondary">Mô tả chi tiết</p>
                    <p className="mt-1.5 leading-relaxed text-secondary italic">
                      {classroom.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3">
                  <Button
                    variant="secondary"
                    onClick={() => onAction("edit-classroom")}
                    className="py-1 px-3 text-xs w-full font-bold animate-transition"
                  >
                    Chỉnh sửa lớp
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onAction("delete-classroom")}
                    className="py-1 px-3 text-xs w-full font-bold animate-transition"
                  >
                    Xoá lớp học
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {classroom.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-mono text-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-primary focus:outline-none focus:ring-2 focus:ring-brand/20"
              title="Sao chép mã lớp"
            >
              <span>Mã lớp: {classroom.joinCode}</span>
              {copied ? (
                <FiCheck className="text-success h-3.5 w-3.5" />
              ) : (
                <FiCopy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="secondary"
          onClick={() => onAction("create-assignment")}
          className="inline-flex items-center gap-1.5"
        >
          <FiPlus className="h-4 w-4" />
          <span>Tạo bài tập</span>
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => onAction("create-exam")}
          className="inline-flex items-center gap-1.5"
        >
          <FiPlus className="h-4 w-4" />
          <span>Tạo bài thi</span>
        </Button>

        <Button
          variant="primary"
          onClick={() => onAction("send-notification")}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white border-none"
        >
          <FiBell className="h-4 w-4" />
          <span>Gửi thông báo</span>
        </Button>
      </div>
    </div>
  );
}
