import { useState } from "react";
import { FiCopy, FiCheck, FiPlus, FiBell } from "react-icons/fi";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";

export default function ClassDetailHeader({ classroom, onAction }) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
      {/* Title & Badges */}
      <div className="space-y-2.5">
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
