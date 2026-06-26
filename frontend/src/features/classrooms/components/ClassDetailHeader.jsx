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
            aria-label="Sao chép mã lớp"
            className="inline-flex items-center gap-2 rounded-xl border border-info/25 bg-info-muted px-3 py-1.5 transition-all duration-150 hover:border-info/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2"
            title="Sao chép mã lớp"
          >
            <span className="text-[0.82rem] font-semibold text-info">Mã lớp</span>
            <span className="font-mono text-sm font-bold tracking-widest text-primary">
              {classroom.joinCode}
            </span>
            {copied ? (
              <FiCheck className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <FiCopy className="h-4 w-4 shrink-0 text-info" />
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
