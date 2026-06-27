import { useEffect } from "react";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { formatShortDateTime } from "../../../utils/formatDate";
import AuthenticatedEvidenceMedia from "./AuthenticatedEvidenceMedia";
import { getCaptureSourceLabel, getEvidenceTypeMeta, isVideoEvidence } from "../utils/evidenceHelpers";

export default function EvidenceLightbox({ item, items, onClose, onNavigate }) {
  const currentIndex = items.findIndex((entry) => entry.id === item.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;
  const typeMeta = getEvidenceTypeMeta(item.evidenceType);
  const showVideo = isVideoEvidence(item.evidenceType, item.fileUrl);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft" && hasPrevious) {
        onNavigate(items[currentIndex - 1]);
      }
      if (event.key === "ArrowRight" && hasNext) {
        onNavigate(items[currentIndex + 1]);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [currentIndex, hasNext, hasPrevious, items, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/92 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0f172a] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Xem bằng chứng giám sát"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={typeMeta.tone}>{typeMeta.label}</Badge>
              <span className="text-xs text-slate-400">{formatShortDateTime(item.capturedAt)}</span>
            </div>
            <h2 className="truncate text-lg font-semibold text-white">{item.studentName}</h2>
            <p className="truncate text-sm text-slate-400">
              {item.examTitle} · Lượt #{item.attemptId}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost">
            Đóng
          </Button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#060b14] p-4">
          {hasPrevious ? (
            <button
              type="button"
              aria-label="Bằng chứng trước"
              className="absolute left-3 z-10 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-sm text-white transition hover:bg-black/70"
              onClick={() => onNavigate(items[currentIndex - 1])}
            >
              ←
            </button>
          ) : null}

          {showVideo ? (
            <AuthenticatedEvidenceMedia
              attemptId={item.attemptId}
              className="max-h-[62vh] w-full rounded-[16px] object-contain"
              evidenceId={item.id}
              evidenceType={item.evidenceType}
              fileUrl={item.fileUrl}
            />
          ) : (
            <AuthenticatedEvidenceMedia
              attemptId={item.attemptId}
              className="max-h-[62vh] max-w-full rounded-[16px] object-contain"
              evidenceId={item.id}
              evidenceType={item.evidenceType}
              fileUrl={item.fileUrl}
            />
          )}

          {hasNext ? (
            <button
              type="button"
              aria-label="Bằng chứng tiếp theo"
              className="absolute right-3 z-10 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-sm text-white transition hover:bg-black/70"
              onClick={() => onNavigate(items[currentIndex + 1])}
            >
              →
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 border-t border-white/10 px-5 py-4 text-sm text-slate-300 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Nguồn</p>
            <p className="mt-1 font-medium text-white">{getCaptureSourceLabel(item.captureSource)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Sự kiện</p>
            <p className="mt-1 font-medium text-white">{item.triggerEventType || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Độ tin cậy AI</p>
            <p className="mt-1 font-medium text-white">
              {typeof item.confidence === "number" ? `${Math.round(item.confidence * 100)}%` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
